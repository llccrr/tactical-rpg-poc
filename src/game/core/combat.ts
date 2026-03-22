import type { Spell } from "./gameState";

export interface CombatStats {
  attack: number;
  defense: number;
}

export interface DamageResult {
  damage: number;
  killed: boolean;
}

/** Pure damage computation: max(1, baseDamage + attack - defense) */
export function computeDamage(
  attacker: CombatStats,
  defender: CombatStats,
  spell: Spell,
  defenderHp: number,
): DamageResult {
  const damage = Math.max(1, spell.baseDamage + attacker.attack - defender.defense);
  return { damage, killed: defenderHp - damage <= 0 };
}
