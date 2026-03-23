import type {
  CharacterCombatState,
  CastSpellResult,
  CostHistoryEntry,
  IopLikeState,
  SpellDefinition,
} from "./types";
import type { ComboDefinition } from "./types";
import { IOPLIKE } from "./constants";
import { getSpellDef } from "./spells";
import { IOPLIKE_COMBOS } from "./combos";

// ── Helpers ────────────────────────────────────────────────────

function emptyResult(spellDef: SpellDefinition): CastSpellResult {
  return {
    success: false,
    spellId: spellDef.id,
    spellName: spellDef.name,
    damage: 0,
    rawDamage: 0,
    damageMultiplier: 1,
    concentrationGained: 0,
    concentrationOverflow: false,
    bloodPointGained: 0,
    comboTriggered: null,
    comboReward: null,
    preparationConsumed: false,
    wrathStacksConsumed: 0,
    killed: false,
    isMobilitySpell: spellDef.effect.isMobilitySpell ?? false,
    pullDistance: 0,
    effects: [],
  };
}

// ── Engine ─────────────────────────────────────────────────────

export class IopLikeCombatEngine {
  private combat: CharacterCombatState;

  constructor() {
    this.combat = {
      resources: {
        concentration: 0,
        concentrationMax: IOPLIKE.CONCENTRATION_MAX,
        bloodPoints: IOPLIKE.BLOOD_POINTS_MAX,
        bloodPointsMax: IOPLIKE.BLOOD_POINTS_MAX,
      },
      preparation: 0,
      courroux: 0,
      courrouxMax: IOPLIKE.COURROUX_MAX_STACKS,
      costHistory: [],
      comboPATriggered: false,
    };
  }

  // ── Public API ───────────────────────────────────────────────

  /** Get current state snapshot for HUD / React */
  getState(): IopLikeState {
    return {
      concentration: this.combat.resources.concentration,
      concentrationMax: this.combat.resources.concentrationMax,
      bloodPoints: this.combat.resources.bloodPoints,
      bloodPointsMax: this.combat.resources.bloodPointsMax,
      preparation: this.combat.preparation,
      courroux: this.combat.courroux,
      courrouxMax: this.combat.courrouxMax,
      comboPATriggered: this.combat.comboPATriggered,
      preparationDamageBonus: IOPLIKE.PREPARATION_DAMAGE_BONUS,
      courrouxDamageBonusPerStack: IOPLIKE.COURROUX_DAMAGE_BONUS_PER_STACK,
    };
  }

  /** Check if the player can afford a spell */
  canAffordSpell(
    spellDefId: string,
    remainingPA: number,
    remainingPM: number,
  ): boolean {
    const def = getSpellDef(spellDefId);
    if (!def) return false;

    if (def.apCost > 0 && remainingPA < def.apCost) return false;
    if (def.mpCost > 0 && remainingPM < def.mpCost) return false;
    if (def.bloodPointCost > 0 && this.combat.resources.bloodPoints < def.bloodPointCost)
      return false;

    return true;
  }

  /**
   * Cast a spell. Returns the full result including damage, effects, combos, etc.
   * The caller (BoardScene) is responsible for:
   * - Actually applying HP loss to the target
   * - Spending PA/PM from FightController
   * - Moving characters (pull, mobility)
   * - Visual effects
   */
  castSpell(
    spellDefId: string,
    attackerAttack: number,
    defenderDefense: number,
    defenderHp: number,
    _targetId: string,
    remainingPA: number,
  ): CastSpellResult {
    const def = getSpellDef(spellDefId);
    if (!def) {
      return emptyResult({ id: spellDefId, name: "?", effect: { baseDamage: 0, concentrationGain: 0 } } as SpellDefinition);
    }

    const result = emptyResult(def);

    // ── 1. Spend blood points ────────────────────────────────
    if (def.bloodPointCost > 0) {
      this.combat.resources.bloodPoints -= def.bloodPointCost;
    }

    // ── 2. Record cost in history ────────────────────────────
    const costEntry: CostHistoryEntry = {
      type: def.bloodPointCost > 0 ? "blood" : def.mpCost > 0 ? "mp" : "ap",
      amount: def.bloodPointCost > 0
        ? def.bloodPointCost
        : def.mpCost > 0
          ? def.mpCost
          : def.apCost,
      spellId: def.id,
    };
    this.combat.costHistory.push(costEntry);

    // ── 3. Handle mobility spell (no damage) ─────────────────
    if (def.effect.isMobilitySpell) {
      result.success = true;
      result.isMobilitySpell = true;
      this.checkAndApplyCombo(result);
      return result;
    }

    // ── 4. Calculate damage ──────────────────────────────────
    const baseDamage = def.effect.baseDamage;
    let multiplier = 1;

    // Préparation: +40% on next offensive spell
    if (this.combat.preparation > 0 && baseDamage > 0) {
      multiplier += IOPLIKE.PREPARATION_DAMAGE_BONUS;
      this.combat.preparation -= 1;
      result.preparationConsumed = true;
      result.effects.push("Préparation consommée (+40% dégâts)");
    }

    // Courroux: +50% per stack on exactly 4 PA spells
    if (
      def.apCost === IOPLIKE.COURROUX_TARGET_AP_COST &&
      def.tags.includes("wrathConsumer") &&
      this.combat.courroux > 0
    ) {
      const stacksUsed = this.combat.courroux;
      multiplier += stacksUsed * IOPLIKE.COURROUX_DAMAGE_BONUS_PER_STACK;
      this.combat.courroux = 0;
      result.wrathStacksConsumed = stacksUsed;
      result.effects.push(
        `Courroux x${stacksUsed} consommé (+${stacksUsed * 50}% dégâts)`,
      );
    }

    const rawDamage = Math.max(1, baseDamage + attackerAttack - defenderDefense);
    const finalDamage = Math.max(1, Math.round(rawDamage * multiplier));

    result.rawDamage = rawDamage;
    result.damage = finalDamage;
    result.damageMultiplier = multiplier;
    result.killed = defenderHp - finalDamage <= 0;

    // ── 5. Pull distance ─────────────────────────────────────
    if (def.effect.pullDistance) {
      result.pullDistance = def.effect.pullDistance;
    }

    // ── 6. Concentration gain ────────────────────────────────
    if (def.effect.concentrationGain > 0) {
      result.concentrationGained = def.effect.concentrationGain;
      this.addConcentration(def.effect.concentrationGain, result);
    }

    // ── 7. Finisher reward (Super Iop Punch kill) ────────────
    if (result.killed && def.effect.isFinisher) {
      const apReward = def.effect.finisherApReward ?? 0;
      const concReward = def.effect.finisherConcentrationReward ?? 0;
      if (apReward > 0) {
        result.effects.push(`Kill! +${apReward} PA`);
      }
      if (concReward > 0) {
        this.addConcentration(concReward, result);
        result.concentrationGained += concReward;
        result.effects.push(`Kill! +${concReward} Concentration`);
      }
    }

    // ── 8. Check combo ───────────────────────────────────────
    this.checkAndApplyCombo(result);

    result.success = true;
    return result;
  }

  /** Called at the start of the player's turn */
  onTurnStart(): void {
    this.combat.comboPATriggered = false;
    this.combat.costHistory = [];
  }

  /** Get blood points (for external checks) */
  getBloodPoints(): number {
    return this.combat.resources.bloodPoints;
  }

  // ── Private ──────────────────────────────────────────────────

  private addConcentration(amount: number, result: CastSpellResult): void {
    this.combat.resources.concentration += amount;

    if (this.combat.resources.concentration >= this.combat.resources.concentrationMax) {
      // ── Concentration overflow! ────────────────────────────
      this.combat.resources.concentration = 0;
      result.concentrationOverflow = true;

      // +1 Point de sang
      this.combat.resources.bloodPoints = Math.min(
        this.combat.resources.bloodPoints + 1,
        this.combat.resources.bloodPointsMax,
      );
      result.bloodPointGained += 1;
      result.effects.push("Concentration MAX → +1 Point de sang");

      // +1 Préparation
      this.combat.preparation = Math.min(this.combat.preparation + 1, 1);
      result.effects.push("+1 Préparation");

      // +1 Courroux (up to max)
      if (this.combat.courroux < this.combat.courrouxMax) {
        this.combat.courroux += 1;
        result.effects.push(`+1 Courroux (${this.combat.courroux}/${this.combat.courrouxMax})`);
      }
    }
  }

  private checkAndApplyCombo(result: CastSpellResult): void {
    if (this.combat.comboPATriggered) return;

    for (const combo of IOPLIKE_COMBOS) {
      if (combo.oncePerTurn && combo.id === "combo_pa" && this.combat.comboPATriggered) continue;

      if (this.matchesComboPattern(combo)) {
        result.comboTriggered = combo.name;
        result.comboReward = {
          ap: combo.reward.ap ?? 0,
          concentration: combo.reward.concentration ?? 0,
        };
        result.effects.push(`★ ${combo.name} ! +${combo.reward.ap ?? 0} PA, +${combo.reward.concentration ?? 0} Concentration`);

        if (combo.id === "combo_pa") {
          this.combat.comboPATriggered = true;
        }

        if (combo.reward.concentration && combo.reward.concentration > 0) {
          result.concentrationGained += combo.reward.concentration;
          this.addConcentration(combo.reward.concentration, result);
        }
      }
    }
  }

  private matchesComboPattern(combo: ComboDefinition): boolean {
    const pattern = combo.pattern;
    const history = this.combat.costHistory;

    if (history.length < pattern.length) return false;

    const startIdx = history.length - pattern.length;
    for (let i = 0; i < pattern.length; i++) {
      const entry = history[startIdx + i];
      const expected = pattern[i];
      if (entry.type !== expected.type || entry.amount !== expected.amount) {
        return false;
      }
    }

    return true;
  }
}
