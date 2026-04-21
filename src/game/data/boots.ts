/**
 * Slot Bottes — effets de mobilité (PM, push, pull, déplacement).
 * Spec INFO EDOUARD JEU / markdown ITEMS.
 *
 * Notes d'approximation :
 * - Cuir Bottes : "se déplace sans déclencher effets au sol" — le jeu n'a pas
 *   d'effets au sol. Le sort est représenté comme un sort de déplacement libre
 *   de +2/+3 cases (équivalent utilitaire).
 * - Gemme Bottes : "laisse Burn au sol" + zone sort — le passif "Burn trail"
 *   n'a pas de support ground-effects ; seul le sort zone (T3+) est opérant.
 */

import type { Spell } from "../core/gameState";
import type { StatBonuses } from "./items";
import type { ResourceType } from "./resources";
import { RESOURCE_TYPE_LABELS, getPrimaryResource } from "./resources";
import { WEAPON_RECIPE_BY_TIER, type WeaponTier } from "./weapons";

export const BOOTS_ICON_BY_TYPE: Record<ResourceType, string> = {
  minerai: "🥾",
  bois: "👢",
  cuir: "👠",
  gemme: "🧦",
};

// ── MINERAI — +PM passif + burst PM spell ───────────────────────
const MINERAI_BOOTS_PM_BONUS: Record<WeaponTier, number> = { 1: 1, 2: 1, 3: 1, 4: 1, 5: 2 };
const MINERAI_BOOTS_PM_SPELL_BONUS: Record<WeaponTier, number> = { 1: 0, 2: 0, 3: 2, 4: 3, 5: 3 };

// ── BOIS — pull spell ────────────────────────────────────────────
interface BoisPullConfig {
  pullDistance: number;
  range: number;
  damagePercent: number;
}
const BOIS_PULL_BY_TIER: Record<WeaponTier, BoisPullConfig> = {
  1: { pullDistance: 1, range: 3, damagePercent: 0 },
  2: { pullDistance: 2, range: 3, damagePercent: 0 },
  3: { pullDistance: 2, range: 4, damagePercent: 0 },
  4: { pullDistance: 2, range: 4, damagePercent: 20 },
  5: { pullDistance: 2, range: 4, damagePercent: 25 },
};

// ── CUIR — dash discount passif + teleport spell ────────────────
const CUIR_BOOTS_DASH_DISCOUNT: Record<WeaponTier, number> = { 1: 1, 2: 1, 3: 1, 4: 2, 5: 2 };
const CUIR_BOOTS_TELEPORT_RANGE: Record<WeaponTier, number> = { 1: 0, 2: 0, 3: 2, 4: 2, 5: 3 };

// ── GEMME — zone spell avec Sang ────────────────────────────────
const GEMME_BOOTS_ZONE_DMG: Record<WeaponTier, number> = { 1: 0, 2: 0, 3: 30, 4: 30, 5: 35 };
const GEMME_BOOTS_ZONE_SANG: Record<WeaponTier, number> = { 1: 0, 2: 0, 3: 1, 4: 2, 5: 2 };

function makeMineraiBootsSpell(tier: WeaponTier): Spell | null {
  if (tier < 3) return null;
  const gain = MINERAI_BOOTS_PM_SPELL_BONUS[tier];
  return {
    id: `boots_spell_minerai_t${tier}`,
    name: `Élan T${tier}`,
    range: 0,
    cost: 0,
    pfCost: 1,
    damagePercent: 0,
    element: "neutre",
    damageType: "indirect",
    cooldown: 2,
    targetMode: "self",
    gainsPm: gain,
    description: `+${gain} PM ce tour.`,
  };
}

function makeBoisBootsSpell(tier: WeaponTier): Spell {
  const cfg = BOIS_PULL_BY_TIER[tier];
  const parts = [`Rapproche la cible de ${cfg.pullDistance} case${cfg.pullDistance > 1 ? "s" : ""}`];
  if (cfg.damagePercent > 0) parts.push(`${cfg.damagePercent}% dégâts d'arme Vent`);
  return {
    id: `boots_spell_bois_t${tier}`,
    name: `Rappel T${tier}`,
    range: cfg.range,
    rangeMin: 2,
    cost: 0,
    pfCost: 1,
    damagePercent: cfg.damagePercent,
    element: "vent",
    damageType: "direct",
    cooldown: 2,
    targetMode: "enemy",
    pullDistance: cfg.pullDistance,
    description: `${parts.join(". ")}. Portée ${cfg.range}.`,
  };
}

function makeCuirBootsSpell(tier: WeaponTier): Spell | null {
  if (tier < 3) return null;
  const dist = CUIR_BOOTS_TELEPORT_RANGE[tier];
  return {
    id: `boots_spell_cuir_t${tier}`,
    name: `Esquive T${tier}`,
    range: 0,
    cost: 0,
    pfCost: 1,
    damagePercent: 0,
    element: "neutre",
    damageType: "indirect",
    cooldown: 2,
    targetMode: "self",
    gainsPm: dist,
    description: `+${dist} PM ce tour (approximation du déplacement "sans effets au sol").`,
  };
}

function makeGemmeBootsSpell(tier: WeaponTier): Spell | null {
  if (tier < 3) return null;
  const dmg = GEMME_BOOTS_ZONE_DMG[tier];
  const sang = GEMME_BOOTS_ZONE_SANG[tier];
  return {
    id: `boots_spell_gemme_t${tier}`,
    name: `Onde de Sang T${tier}`,
    range: 0,
    cost: 0,
    pfCost: 1,
    damagePercent: dmg,
    element: "neutre",
    damageType: "direct",
    cooldown: 2,
    targetMode: "self",
    zoneRadius: 2,
    zoneApplyStacks: { element: "neutre", count: sang },
    description: `Onde autour du joueur (rayon 2) : ${dmg}% dégâts d'arme Neutre + ${sang} stack${sang > 1 ? "s" : ""} Sang à tous les ennemis.`,
  };
}

export function buildBootsStatBonuses(resourceType: ResourceType, tier: WeaponTier): StatBonuses {
  switch (resourceType) {
    case "minerai": {
      const bonuses: StatBonuses = { bonusMoveRange: MINERAI_BOOTS_PM_BONUS[tier] };
      const spell = makeMineraiBootsSpell(tier);
      if (spell) bonuses.bonusSpells = [spell];
      return bonuses;
    }
    case "bois": {
      return { bonusSpells: [makeBoisBootsSpell(tier)] };
    }
    case "cuir": {
      const bonuses: StatBonuses = { firstDashesDiscount: CUIR_BOOTS_DASH_DISCOUNT[tier] };
      const spell = makeCuirBootsSpell(tier);
      if (spell) bonuses.bonusSpells = [spell];
      return bonuses;
    }
    case "gemme": {
      const bonuses: StatBonuses = {};
      const spell = makeGemmeBootsSpell(tier);
      if (spell) bonuses.bonusSpells = [spell];
      return bonuses;
    }
  }
}

export function getBootsEffectDescription(resourceType: ResourceType, tier: WeaponTier): string {
  switch (resourceType) {
    case "minerai": {
      const pm = MINERAI_BOOTS_PM_BONUS[tier];
      const gain = MINERAI_BOOTS_PM_SPELL_BONUS[tier];
      return `Passif : +${pm} PM/tour${gain > 0 ? `. Sort (1 PF, CD 2) : +${gain} PM ce tour.` : ""}`;
    }
    case "bois": {
      const cfg = BOIS_PULL_BY_TIER[tier];
      const dmgPart = cfg.damagePercent > 0 ? ` + ${cfg.damagePercent}% dégâts Vent` : "";
      return `Sort (1 PF, CD 2) : pull ${cfg.pullDistance} case${cfg.pullDistance > 1 ? "s" : ""}, portée ${cfg.range}${dmgPart}.`;
    }
    case "cuir": {
      const n = CUIR_BOOTS_DASH_DISCOUNT[tier];
      const tp = CUIR_BOOTS_TELEPORT_RANGE[tier];
      return `Passif : ${n} premier${n > 1 ? "s" : ""} dash${n > 1 ? "s" : ""} -1 PM${tp > 0 ? `. Sort (1 PF, CD 2) : +${tp} PM ce tour.` : ""} ⚠ approximation`;
    }
    case "gemme": {
      const dmg = GEMME_BOOTS_ZONE_DMG[tier];
      const sang = GEMME_BOOTS_ZONE_SANG[tier];
      if (tier < 3) return `Passif : laisse 1 stack Burn au sol par tour (⚠ non implémenté).`;
      return `Sort (1 PF, CD 2) : onde rayon 2 — ${dmg}% Neutre + ${sang} Sang.`;
    }
  }
}

export function buildBootsRecipe(resourceType: ResourceType, tier: WeaponTier) {
  const entries = WEAPON_RECIPE_BY_TIER[tier];
  const recipe: { resourceId: string; qty: number }[] = [];
  for (const e of entries) {
    const resource = getPrimaryResource(resourceType, e.resourceTier);
    if (!resource) continue;
    recipe.push({ resourceId: resource.id, qty: e.qty });
  }
  return recipe;
}

export function getBootsItemId(resourceType: ResourceType, tier: WeaponTier): string {
  return `boots_${resourceType}_t${tier}`;
}

export function getBootsName(resourceType: ResourceType, tier: WeaponTier): string {
  return `Bottes de ${RESOURCE_TYPE_LABELS[resourceType]} T${tier}`;
}
