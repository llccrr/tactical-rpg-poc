/**
 * Configuration des armes (slot Arme) — spec INFO EDOUARD JEU +
 * "ITEMS — EFFETS PAR SLOT & TYPE".
 *
 * Une arme est entièrement décrite par (resourceType, tier) :
 *   - resourceType ∈ {minerai, bois, cuir, gemme}
 *   - tier ∈ {1..5}
 *
 * Règles globales (slot Arme) :
 *   - 1 effet max par arme (passif, stats ou sort)
 *   - Les sorts d'arme coûtent 1 PF
 *   - Les dégâts des sorts d'arme sont en % des dégâts d'arme
 *   - Armes brutes (Minerai) > Armes avec effet en dégâts pour compenser
 */

import type { Spell } from "../core/gameState";
import type { ResourceType } from "./resources";
import { RESOURCE_TYPE_LABELS, RESOURCE_TYPES } from "./resources";

export type WeaponTier = 1 | 2 | 3 | 4 | 5;

export const WEAPON_TIERS: readonly WeaponTier[] = [1, 2, 3, 4, 5];

/** Tous les types de ressource sont éligibles au craft d'arme. */
export const RESOURCE_TYPES_FOR_WEAPONS = RESOURCE_TYPES;

/** Dégâts d'une arme AVEC effet (Bois, Cuir, Gemme). */
export const WEAPON_DAMAGE_WITH_EFFECT: Record<WeaponTier, number> = {
  1: 10,
  2: 15,
  3: 20,
  4: 25,
  5: 30,
};

/** Dégâts d'une arme BRUTE (Minerai, pas d'effet). */
export const WEAPON_DAMAGE_BRUTE: Record<WeaponTier, number> = {
  1: 12,
  2: 18,
  3: 24,
  4: 30,
  5: 36,
};

/** Retourne les dégâts d'arme pour (type, tier). */
export function getWeaponDamage(resourceType: ResourceType, tier: WeaponTier): number {
  if (resourceType === "minerai") return WEAPON_DAMAGE_BRUTE[tier];
  return WEAPON_DAMAGE_WITH_EFFECT[tier];
}

// ── Effets par type ─────────────────────────────────────────────

/** Cuir : lifesteal en % des dégâts directs infligés. */
export const CUIR_LIFESTEAL_BY_TIER: Record<WeaponTier, number> = {
  1: 10,
  2: 10,
  3: 15,
  4: 15,
  5: 20,
};

/** Gemme : stacks Burn appliqués sur chaque attaque directe. */
export const GEMME_BURN_STACKS_BY_TIER: Record<WeaponTier, number> = {
  1: 1,
  2: 1,
  3: 2,
  4: 2,
  5: 3,
};

/** Bois : paramètres du sort Push par tier. */
export interface BoisPushConfig {
  /** Distance de push en cases. */
  pushDistance: number;
  /** Dégâts additionnels (% d'arme, Neutre). 0 = pas de dégâts. */
  damagePercent: number;
}
export const BOIS_PUSH_BY_TIER: Record<WeaponTier, BoisPushConfig> = {
  1: { pushDistance: 1, damagePercent: 0 },
  2: { pushDistance: 2, damagePercent: 0 },
  3: { pushDistance: 2, damagePercent: 35 },
  4: { pushDistance: 2, damagePercent: 35 },
  5: { pushDistance: 3, damagePercent: 35 },
};

/**
 * Construit le Spell d'arme pour (type, tier). Retourne null si l'arme n'a pas
 * de sort (Minerai, Cuir, Gemme).
 *
 * Les sorts d'arme ont des IDs stables du type `weapon_spell_<type>_t<tier>`
 * pour fonctionner avec les cooldowns et uses-per-turn.
 */
export function getWeaponBonusSpell(resourceType: ResourceType, tier: WeaponTier): Spell | null {
  if (resourceType === "bois") {
    const cfg = BOIS_PUSH_BY_TIER[tier];
    const parts = [
      `Pousse la cible de ${cfg.pushDistance} case${cfg.pushDistance > 1 ? "s" : ""}`,
    ];
    if (cfg.damagePercent > 0) parts.push(`${cfg.damagePercent}% dégâts arme (Neutre)`);
    return {
      id: `weapon_spell_bois_t${tier}`,
      name: `Coup de Recul T${tier}`,
      range: 1,
      cost: 0,
      pfCost: 1,
      damagePercent: cfg.damagePercent,
      element: "neutre",
      damageType: "direct",
      cooldown: 1,
      targetMode: "enemy",
      pushDistance: cfg.pushDistance,
      description: `Sort d'arme (Bois T${tier}) — 1 PF, CD 1.\n${parts.join(". ")}.`,
    };
  }
  return null;
}

// ── Descriptions pour la tooltip / UI ──────────────────────────

/** Description humaine courte de l'effet (passif ou sort). */
export function getWeaponEffectDescription(resourceType: ResourceType, tier: WeaponTier): string {
  switch (resourceType) {
    case "minerai":
      return "Arme brute : dégâts majorés, aucun effet.";
    case "bois": {
      const cfg = BOIS_PUSH_BY_TIER[tier];
      const dmgPart = cfg.damagePercent > 0 ? ` + ${cfg.damagePercent}% arme (Neutre)` : "";
      return `Sort (1 PF, CD 1) : pousse de ${cfg.pushDistance} case${cfg.pushDistance > 1 ? "s" : ""}${dmgPart}.`;
    }
    case "cuir":
      return `Passif : les attaques soignent ${CUIR_LIFESTEAL_BY_TIER[tier]}% des dégâts infligés.`;
    case "gemme": {
      const stacks = GEMME_BURN_STACKS_BY_TIER[tier];
      return `Passif : les attaques appliquent ${stacks} stack${stacks > 1 ? "s" : ""} de Burn (Feu).`;
    }
  }
}

// ── Recettes de craft (approximation INFO EDOUARD JEU, même type) ───

export interface WeaponRecipeEntry {
  /** Tier de ressource requis (toujours dans le même type de ressource que l'arme). */
  resourceTier: 1 | 2 | 3;
  qty: number;
}

/**
 * Recettes par tier (extrait de INFO EDOUARD JEU / CRAFTING).
 * Simplification : on reste dans le même type de ressource pour rendre
 * l'outil testable (le détail multi-type viendra avec le ticket craft dédié).
 */
export const WEAPON_RECIPE_BY_TIER: Record<WeaponTier, WeaponRecipeEntry[]> = {
  1: [{ resourceTier: 1, qty: 1 }],
  2: [
    { resourceTier: 2, qty: 1 },
    { resourceTier: 1, qty: 1 },
  ],
  3: [
    { resourceTier: 3, qty: 1 },
    { resourceTier: 2, qty: 2 },
  ],
  4: [{ resourceTier: 3, qty: 3 }],
  5: [
    { resourceTier: 1, qty: 3 },
    { resourceTier: 2, qty: 3 },
    { resourceTier: 3, qty: 3 },
  ],
};

// ── Noms & icônes d'armes ──────────────────────────────────────

export const WEAPON_ICON_BY_TYPE: Record<ResourceType, string> = {
  minerai: "⚔️",
  bois: "🏹",
  cuir: "🗡️",
  gemme: "🔮",
};

/** Libellé de l'arme : "Épée de Minerai T3", etc. */
export function getWeaponName(resourceType: ResourceType, tier: WeaponTier): string {
  return `Arme de ${RESOURCE_TYPE_LABELS[resourceType]} T${tier}`;
}

/** ID stable d'un item d'arme. */
export function getWeaponItemId(resourceType: ResourceType, tier: WeaponTier): string {
  return `weapon_${resourceType}_t${tier}`;
}

/** Parse un item id d'arme → (type, tier) ou null si pas une arme. */
export function parseWeaponItemId(id: string): { resourceType: ResourceType; tier: WeaponTier } | null {
  const match = id.match(/^weapon_(minerai|bois|cuir|gemme)_t([1-5])$/);
  if (!match) return null;
  return {
    resourceType: match[1] as ResourceType,
    tier: Number(match[2]) as WeaponTier,
  };
}
