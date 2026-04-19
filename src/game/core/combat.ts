import type { Spell } from "./gameState";
import { WEAPON_BASE_DAMAGE, clampResistance, type Resistances } from "../data/elements";

/** Attacker side inputs for damage computation. */
export interface AttackerStats {
  attack: number;
}

/** Defender side inputs for damage computation. */
export interface DefenderStats {
  resistances: Resistances;
}

export interface DamageResult {
  damage: number;
  killed: boolean;
}

/**
 * Pipeline de calcul officiel (spec "Mod\u00e8le de d\u00e9g\u00e2ts") :
 *   1. Budget (PA/PF/PP/PS)      \u2192 g\u00e9r\u00e9 en amont (spendPA/PF/PS)
 *   2. Port\u00e9e                    \u2192 valid\u00e9e c\u00f4t\u00e9 UI (range-check)
 *   3. Modificateurs (zone/\u00e9tat) \u2192 pas encore branch\u00e9 (placeholder)
 *   4. Buffs (rage\u2026)             \u2192 attack de l'attaquant (bonus plat)
 *   5. R\u00e9sistances                \u2192 multiplicateur (1 \u2212 res), cap\u00e9 \u00e0 70%
 *   6. Minimum 1                  \u2192 les d\u00e9g\u00e2ts finaux ne descendent jamais sous 1
 *
 * D\u00e9g\u00e2ts directs (attaques) g\u00e9n\u00e8rent PS et d\u00e9clenchent Rage ailleurs ;
 * d\u00e9g\u00e2ts indirects (stacks/DoT) ne g\u00e9n\u00e8rent rien \u2014 mais la formule ici
 * est identique, c'est aux appelants de respecter la r\u00e8gle.
 */
export function computeDamage(
  attacker: AttackerStats,
  defender: DefenderStats,
  spell: Spell,
  defenderHp: number,
): DamageResult {
  // \u00c9tape : dommage de base (% de l'arme)
  const weapon = (WEAPON_BASE_DAMAGE * spell.damagePercent) / 100;

  // \u00c9tape 4 : buffs de l'attaquant (attack = puissance plate pour le moment)
  const buffed = weapon + attacker.attack;

  // \u00c9tape 5 : r\u00e9sistance \u00e9l\u00e9mentaire de la cible, cap\u00e9e \u00e0 70%
  const resist = clampResistance(defender.resistances[spell.element] ?? 0);
  const afterResist = buffed * (1 - resist);

  // \u00c9tape 6 : minimum 1
  const damage = Math.max(1, Math.floor(afterResist));

  return { damage, killed: defenderHp - damage <= 0 };
}
