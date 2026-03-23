// ── IopLike class system types ──────────────────────────────────

export type SpellElement = "air" | "earth" | "fire" | "neutral";
export type CostType = "ap" | "mp" | "blood";

// ── Spell Definitions ──────────────────────────────────────────

export interface SpellEffectDefinition {
  baseDamage: number;
  concentrationGain: number;
  pullDistance?: number;
  armorGrantPercent?: number;
  damageBuffDuration?: number;
  applyEbranle?: boolean;
  ignoreArmor?: boolean;
  isFinisher?: boolean;
  finisherApReward?: number;
  finisherConcentrationReward?: number;
  fireDamageBuffNext?: boolean;
  aoeShape?: "cross" | "circle" | "around-caster";
  aoeRadius?: number;
  dashToTarget?: boolean;
  variableCost?: boolean;
  summonBanner?: boolean;
  isMobilitySpell?: boolean;
  defenseBuffAlly?: number;
}

export interface SpellDefinition {
  id: string;
  name: string;
  apCost: number;
  mpCost: number;
  bloodPointCost: number;
  rangeMin: number;
  rangeMax: number;
  element: SpellElement;
  tags: string[];
  description: string;
  effect: SpellEffectDefinition;
  implemented: boolean;
}

// ── Status Effects ─────────────────────────────────────────────

export interface StatusEffectDefinition {
  id: string;
  name: string;
  duration: number;
  stackable: boolean;
  maxStacks: number;
  rules: string;
}

// ── Combos ─────────────────────────────────────────────────────

export interface ComboPatternEntry {
  type: CostType;
  amount: number;
}

export interface ComboDefinition {
  id: string;
  name: string;
  patternType: "cost-sequence";
  pattern: ComboPatternEntry[];
  oncePerTurn: boolean;
  reward: {
    ap?: number;
    concentration?: number;
  };
}

// ── Combat State ───────────────────────────────────────────────

export interface CostHistoryEntry {
  type: CostType;
  amount: number;
  spellId: string;
}

export interface CharacterResourceState {
  concentration: number;
  concentrationMax: number;
  bloodPoints: number;
  bloodPointsMax: number;
}

export interface CharacterCombatState {
  resources: CharacterResourceState;
  preparation: number;
  courroux: number;
  courrouxMax: number;
  costHistory: CostHistoryEntry[];
  comboPATriggered: boolean;
}

/** Exposed to GameState for HUD and React */
export interface IopLikeState {
  concentration: number;
  concentrationMax: number;
  bloodPoints: number;
  bloodPointsMax: number;
  preparation: number;
  courroux: number;
  courrouxMax: number;
  comboPATriggered: boolean;
  preparationDamageBonus: number;
  courrouxDamageBonusPerStack: number;
}

// ── Cast Result ────────────────────────────────────────────────

export interface CastSpellResult {
  success: boolean;
  spellId: string;
  spellName: string;
  damage: number;
  rawDamage: number;
  damageMultiplier: number;
  concentrationGained: number;
  concentrationOverflow: boolean;
  bloodPointGained: number;
  comboTriggered: string | null;
  comboReward: { ap: number; concentration: number } | null;
  preparationConsumed: boolean;
  wrathStacksConsumed: number;
  killed: boolean;
  isMobilitySpell: boolean;
  pullDistance: number;
  effects: string[];
}
