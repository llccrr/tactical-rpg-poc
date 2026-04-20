import type { GameState, RageState, Spell } from "./gameState";
import type { CombatEventBus } from "./events";

const PLAYER_ID = "player";

export class FightController {
  private eventBus: CombatEventBus;
  private state: GameState;

  constructor(state: GameState, eventBus: CombatEventBus) {
    this.state = state;
    this.eventBus = eventBus;
  }

  /** Whether it's the player's turn */
  isPlayerTurn(): boolean {
    return this.state.currentTurn === "player";
  }

  /** Whether the player still has PM to move */
  canPlayerMove(): boolean {
    return this.isPlayerTurn() && this.state.remainingPM > 0;
  }

  /** Whether the player has enough PA for a given cost */
  canPlayerAfford(paCost: number): boolean {
    return this.isPlayerTurn() && this.state.remainingPA >= paCost;
  }

  /** Whether the player has enough PF for a given cost */
  canPlayerAffordPF(pfCost: number): boolean {
    return this.isPlayerTurn() && this.state.remainingPF >= pfCost;
  }

  /** Whether the player has enough PS for a given cost */
  canPlayerAffordPS(psCost: number): boolean {
    return this.isPlayerTurn() && this.state.remainingPS >= psCost;
  }

  /** Whether the player has enough PP for a given cost */
  canPlayerAffordPP(ppCost: number): boolean {
    return this.isPlayerTurn() && this.state.remainingPM >= ppCost;
  }

  /** Full cost-check : PA + PF + PS + PP + cooldown + usesPerTurn. */
  canCastSpell(spell: Spell): boolean {
    if (!this.isPlayerTurn()) return false;
    if (this.state.remainingPA < spell.cost) return false;
    if ((spell.pfCost ?? 0) > this.state.remainingPF) return false;
    if ((spell.psCost ?? 0) > this.state.remainingPS) return false;
    if ((spell.ppCost ?? 0) > this.state.remainingPM) return false;
    if (spell.id) {
      if ((this.state.character.cooldowns[spell.id] ?? 0) > 0) return false;
      if (spell.usesPerTurn != null) {
        const uses = this.state.character.spellUsesRemaining[spell.id] ?? 0;
        if (uses <= 0) return false;
      }
    }
    return true;
  }

  /** Add PA (e.g. from combo reward or finisher kill) */
  addPA(amount: number): void {
    this.state.remainingPA += amount;
  }

  /** Add PM (spec Sacrifice de Chair +2 PP). */
  addPM(amount: number): void {
    this.state.remainingPM += amount;
  }

  /** Get current remaining PA */
  getRemainingPA(): number {
    return this.state.remainingPA;
  }

  /** Deduct PM after a move. Returns false if not enough PM. */
  spendPM(cost: number): boolean {
    if (cost > this.state.remainingPM) return false;
    this.state.remainingPM -= cost;
    return true;
  }

  /** Deduct PA after an action. Returns false if not enough PA. */
  spendPA(cost: number): boolean {
    if (cost > this.state.remainingPA) return false;
    this.state.remainingPA -= cost;
    return true;
  }

  /** Deduct PF after an action. Returns false if not enough PF. */
  spendPF(cost: number): boolean {
    if (cost > this.state.remainingPF) return false;
    this.state.remainingPF -= cost;
    return true;
  }

  /** Deduct PS after an action. Returns false if not enough PS. */
  spendPS(cost: number): boolean {
    if (cost > this.state.remainingPS) return false;
    this.state.remainingPS -= cost;
    return true;
  }

  /** Paie tous les coûts d'un sort d'un coup (PA + PF + PS + PP). */
  paySpellCosts(spell: Spell): void {
    if (spell.cost > 0) this.spendPA(spell.cost);
    if (spell.pfCost) this.spendPF(spell.pfCost);
    if (spell.psCost) this.spendPS(spell.psCost);
    if (spell.ppCost) this.spendPM(spell.ppCost);
  }

  /**
   * Add Blood Points to the player, capped at psMax.
   * Returns the amount actually gained (0 if already at cap).
   * Emits a combat log entry when reason is provided.
   */
  addPS(amount: number, reason?: "inflict" | "take"): number {
    const before = this.state.remainingPS;
    const after = Math.min(this.state.character.psMax, before + amount);
    const gained = after - before;
    this.state.remainingPS = after;
    if (gained > 0 && reason) {
      const msg =
        reason === "inflict"
          ? `+${gained} PS (d\u00e9g\u00e2ts inflig\u00e9s)`
          : `+${gained} PS (d\u00e9g\u00e2ts subis)`;
      this.eventBus.emit({ type: "info", message: msg });
    }
    return gained;
  }

  // ── Rage passif ──────────────────────────────────────────

  /** Retourne le modificateur en % dû à l'état Rage pour cette attaque. */
  getRagePercent(): number {
    if (!this.state.character.hasRagePassive) return 0;
    if (this.state.character.rageState === "enraged") return 20;
    if (this.state.character.rageState === "punished") return -20;
    return 0;
  }

  /** Marque qu'un dégât direct a été infligé ce tour (déclencheur Rage). */
  notifyDirectDamageDealt(): void {
    this.state.character.didDamageThisTurn = true;
  }

  /** Force l'état Rage à "enraged" (utilisé par Frénésie). */
  forceEnraged(): void {
    this.state.character.rageState = "enraged";
  }

  // ── Cooldowns & uses ─────────────────────────────────────

  /** Enclenche le CD d'un sort (tours restants = cooldown). */
  startCooldown(spell: Spell): void {
    if (!spell.id || !spell.cooldown) return;
    this.state.character.cooldowns[spell.id] = spell.cooldown;
  }

  /** Consomme 1 utilisation par-tour si applicable. */
  consumeUse(spell: Spell): void {
    if (!spell.id || spell.usesPerTurn == null) return;
    const remaining = this.state.character.spellUsesRemaining[spell.id] ?? spell.usesPerTurn;
    this.state.character.spellUsesRemaining[spell.id] = Math.max(0, remaining - 1);
  }

  /** Renvoie les tours de CD restants d'un sort (0 = utilisable). */
  getCooldown(spellId: string): number {
    return this.state.character.cooldowns[spellId] ?? 0;
  }

  /** Renvoie les utilisations restantes sur ce tour (null = illimité). */
  getUsesRemaining(spellId: string): number | null {
    const val = this.state.character.spellUsesRemaining[spellId];
    return val == null ? null : val;
  }

  // ── Buffs temporaires ─────────────────────────────────────

  /** Ajoute un bonus plat sur la prochaine attaque (Surmenage +20). */
  addNextAttackFlat(flat: number): void {
    this.state.character.nextAttackFlat += flat;
  }

  /** Ajoute un bonus en % sur la prochaine attaque (Frénésie +20%). */
  addNextAttackPercent(pct: number): void {
    this.state.character.nextAttackPercent += pct;
  }

  /** Consomme les buffs temporaires et retourne leurs valeurs. */
  consumeNextAttackBuffs(): { flat: number; percent: number } {
    const flat = this.state.character.nextAttackFlat;
    const percent = this.state.character.nextAttackPercent;
    this.state.character.nextAttackFlat = 0;
    this.state.character.nextAttackPercent = 0;
    return { flat, percent };
  }

  /** Active le buff de résistance tous éléments pendant X tours. */
  applyResistBuff(percent: number, turns: number): void {
    this.state.character.resistBuffPercent = percent;
    this.state.character.resistBuffTurns = turns;
  }

  // ── Stacks élémentaires sur cibles ────────────────────────

  /** Ajoute des stacks (capés à 10) sur la cible. */
  addStacks(targetId: string, element: import("../data/elements").Element, count: number): void {
    const prev = this.state.targetStacks[targetId] ?? {};
    const current = prev[element] ?? 0;
    const next = Math.min(10, current + count);
    this.state.targetStacks[targetId] = { ...prev, [element]: next };
  }

  /** Consomme les stacks d'un élément donné (ceil(stacks/2)). Retourne le nombre consommé. */
  consumeStacks(targetId: string, element: import("../data/elements").Element): number {
    const prev = this.state.targetStacks[targetId] ?? {};
    const current = prev[element] ?? 0;
    if (current <= 0) return 0;
    const consumed = Math.ceil(current / 2);
    const remaining = current - consumed;
    this.state.targetStacks[targetId] = { ...prev, [element]: remaining };
    return consumed;
  }

  /** Retire toutes les entrées de stacks pour une cible (appel à la mort). */
  clearStacksFor(targetId: string): void {
    delete this.state.targetStacks[targetId];
  }

  // ── Turn transitions ──────────────────────────────────────

  /** End the player's turn, switch to enemy phase */
  endPlayerTurn(): void {
    // Résolution de la Rage : transition d'état pour le prochain tour du Barbare.
    if (this.state.character.hasRagePassive) {
      const didDamage = this.state.character.didDamageThisTurn;
      const prev: RageState = this.state.character.rageState;
      let next: RageState = prev;
      if (prev === "neutral") {
        next = didDamage ? "enraged" : "neutral";
      } else if (prev === "enraged") {
        next = didDamage ? "enraged" : "punished";
      } else if (prev === "punished") {
        next = didDamage ? "enraged" : "neutral";
      }
      this.state.character.rageState = next;
      this.state.character.didDamageThisTurn = false;
      if (next !== prev) {
        const label =
          next === "enraged" ? "Enragé (+20% prochain tour)"
          : next === "punished" ? "Punition Rage (-20% prochain tour)"
          : "Rage neutre";
        this.eventBus.emit({ type: "info", message: `Rage → ${label}` });
      }
    }

    this.eventBus.emit({ type: "turnEnd", entityId: PLAYER_ID });
    this.state.currentTurn = "enemy";
  }

  /** End the enemy phase and start a new player turn.
   *  Spec Edouard : PA, PF et PP cappent à leur base chaque tour (pas de stack).
   *  PS ne régénère pas (cap psMax, ne monte que via dégâts infligés/subis). */
  endEnemyPhase(): void {
    this.state.currentTurn = "player";
    this.state.turnNumber += 1;
    this.state.remainingPM = this.state.character.moveRange;
    this.state.remainingPA = this.state.character.ap;
    this.state.remainingPF = this.state.character.pf;

    // Décrément des cooldowns
    for (const id of Object.keys(this.state.character.cooldowns)) {
      const cur = this.state.character.cooldowns[id];
      if (cur > 0) this.state.character.cooldowns[id] = cur - 1;
      if (this.state.character.cooldowns[id] === 0) delete this.state.character.cooldowns[id];
    }

    // Reset des utilisations par tour
    for (const spell of this.state.character.spells) {
      if (spell.id && spell.usesPerTurn != null) {
        this.state.character.spellUsesRemaining[spell.id] = spell.usesPerTurn;
      }
    }

    // Décrément du buff de résistance
    if (this.state.character.resistBuffTurns > 0) {
      this.state.character.resistBuffTurns -= 1;
      if (this.state.character.resistBuffTurns === 0) {
        this.state.character.resistBuffPercent = 0;
      }
    }

    this.eventBus.emit({
      type: "turnStart",
      entityId: PLAYER_ID,
      turnNumber: this.state.turnNumber,
    });
  }

  /** Get the ordered list of living enemy IDs for the current enemy phase */
  getLivingEnemyIds(): string[] {
    return this.state.enemies.map((e) => e.id);
  }

  /** Sync the combat log from event bus into game state (for React) */
  syncLog(): void {
    this.state.combatLog = this.eventBus.getLog();
  }
}
