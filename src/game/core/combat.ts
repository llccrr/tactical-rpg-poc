import type { Spell } from "./gameState";
import { WEAPON_BASE_DAMAGE, clampResistance, RESISTANCE_CAP, type Resistances } from "../data/elements";

/** Attacker side inputs for damage computation. */
export interface AttackerStats {
  attack: number;
}

/** Defender side inputs for damage computation. */
export interface DefenderStats {
  resistances: Resistances;
  /** Bonus temporaire (ex : Résistance Brutale du Barbare). */
  resistBuffPercent?: number;
}

/** Buffs / modifiers temporaires de l'attaquant, utilisés sur une attaque précise. */
export interface AttackModifiers {
  /** État courant de la Rage (applique ±20% final). */
  ragePercent?: number;
  /** Bonus plat additionnel sur les dégâts finaux (Surmenage +20). */
  flatBonus?: number;
  /** Bonus en % additionnel (Frénésie +20). */
  extraPercentBonus?: number;
  /** Bonus de distance pour la Charge (20% × cases traversées). */
  distanceBonusPercent?: number;
  /** Exécution : +1% par 1% de HP manquant sur la cible. */
  executionBonus?: boolean;
}

export interface DamageResult {
  damage: number;
  killed: boolean;
}

/**
 * Pipeline de calcul officiel (spec "Modèle de dégâts") :
 *   1. Budget (PA/PF/PM/PS)      → géré en amont
 *   2. Portée                    → validée côté UI
 *   3. Modificateurs (zone/état) → pas encore branché
 *   4. Buffs (rage, frénésie, surmenage, distance, exécution)
 *   5. Résistances                → multiplicateur (1 − res), capé à 70%
 *   6. Minimum 1
 */
export function computeDamage(
  attacker: AttackerStats,
  defender: DefenderStats,
  spell: Spell,
  defenderHp: number,
  defenderMaxHp: number = defenderHp,
  modifiers: AttackModifiers = {},
): DamageResult {
  // Dégât de base (% de l'arme)
  const weapon = (WEAPON_BASE_DAMAGE * spell.damagePercent) / 100;

  // Étape 4 : buffs additifs en % (rage + frénésie + distance + exécution)
  let percentMultiplier = 1;

  if (modifiers.ragePercent) {
    percentMultiplier += modifiers.ragePercent / 100;
  }
  if (modifiers.extraPercentBonus) {
    percentMultiplier += modifiers.extraPercentBonus / 100;
  }
  if (modifiers.distanceBonusPercent) {
    percentMultiplier += modifiers.distanceBonusPercent / 100;
  }
  if (modifiers.executionBonus) {
    const missingPct = defenderMaxHp > 0 ? (1 - defenderHp / defenderMaxHp) : 0;
    percentMultiplier += missingPct;
  }

  // attack = puissance plate (stuff, etc.) ; flatBonus = Surmenage
  const afterFlat = weapon + attacker.attack + (modifiers.flatBonus ?? 0);
  const buffed = afterFlat * percentMultiplier;

  // Étape 5 : résistance élémentaire de la cible, capée à 70%
  const baseResist = defender.resistances[spell.element] ?? 0;
  const buffResist = defender.resistBuffPercent ? defender.resistBuffPercent / 100 : 0;
  const totalResist = Math.min(RESISTANCE_CAP, clampResistance(baseResist) + buffResist);
  const afterResist = buffed * (1 - totalResist);

  // Étape 6 : minimum 1
  const damage = Math.max(1, Math.floor(afterResist));

  return { damage, killed: defenderHp - damage <= 0 };
}
