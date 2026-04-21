/**
 * Slot Torse — effets défensifs (HP, résistances, survie).
 * Spec INFO EDOUARD JEU / markdown ITEMS.
 */

import type { Spell } from "../core/gameState";
import type { StatBonuses } from "./items";
import type { ResourceType } from "./resources";
import { RESOURCE_TYPE_LABELS, getPrimaryResource } from "./resources";
import { WEAPON_RECIPE_BY_TIER, type WeaponTier } from "./weapons";

export const CHEST_ICON_BY_TYPE: Record<ResourceType, string> = {
  minerai: "🛡️",
  bois: "🥋",
  cuir: "🦺",
  gemme: "🧥",
};

// ── MINERAI — flat DR + resist buff spell ───────────────────────
const MINERAI_CHEST_DR: Record<WeaponTier, number> = { 1: 1, 2: 2, 3: 2, 4: 3, 5: 3 };
const MINERAI_CHEST_RESIST_PCT: Record<WeaponTier, number> = { 1: 0, 2: 0, 3: 10, 4: 10, 5: 15 };

// ── BOIS — HP max % + self heal spell ───────────────────────────
const BOIS_CHEST_HP_PCT: Record<WeaponTier, number> = { 1: 10, 2: 15, 3: 15, 4: 20, 5: 20 };
const BOIS_CHEST_HEAL_PCT: Record<WeaponTier, number> = { 1: 0, 2: 0, 3: 8, 4: 8, 5: 12 };

// ── CUIR — all-element resist + resist buff spell ──────────────
const CUIR_CHEST_RESIST_PCT: Record<WeaponTier, number> = { 1: 5, 2: 5, 3: 5, 4: 8, 5: 8 };
const CUIR_CHEST_RESIST_BUFF_PCT: Record<WeaponTier, number> = { 1: 0, 2: 0, 3: 15, 4: 15, 5: 20 };

// ── GEMME — PS max + conversion discount spell ─────────────────
const GEMME_CHEST_PS_MAX: Record<WeaponTier, number> = { 1: 1, 2: 2, 3: 2, 4: 3, 5: 3 };
// T3+ sort donne conversion PS→PF à 4 au lieu de 5 ce tour. T5 permanent.
// Représenté par un sort qui set `psToPfCostOverride` en buff temporaire.

function makeMineraiChestSpell(tier: WeaponTier): Spell | null {
  if (tier < 3) return null;
  const pct = MINERAI_CHEST_RESIST_PCT[tier];
  return {
    id: `chest_spell_minerai_t${tier}`,
    name: `Carapace T${tier}`,
    range: 0,
    cost: 0,
    pfCost: 1,
    damagePercent: 0,
    element: "neutre",
    damageType: "indirect",
    cooldown: 2,
    targetMode: "self",
    resistBuffPercent: pct,
    resistBuffTurns: 1,
    description: `+${pct}% résistances tous éléments pour 1 tour.`,
  };
}

function makeBoisChestSpell(tier: WeaponTier): Spell | null {
  if (tier < 3) return null;
  const heal = BOIS_CHEST_HEAL_PCT[tier];
  return {
    id: `chest_spell_bois_t${tier}`,
    name: `Régénération T${tier}`,
    range: 0,
    cost: 0,
    pfCost: 1,
    damagePercent: 0,
    element: "neutre",
    damageType: "indirect",
    cooldown: 3,
    targetMode: "self",
    healSelfPercent: heal,
    description: `Soigne ${heal}% des HP max.`,
  };
}

function makeCuirChestSpell(tier: WeaponTier): Spell | null {
  if (tier < 3) return null;
  const pct = CUIR_CHEST_RESIST_BUFF_PCT[tier];
  return {
    id: `chest_spell_cuir_t${tier}`,
    name: `Peau Durcie T${tier}`,
    range: 0,
    cost: 0,
    pfCost: 1,
    damagePercent: 0,
    element: "neutre",
    damageType: "indirect",
    cooldown: 2,
    targetMode: "self",
    resistBuffPercent: pct,
    resistBuffTurns: 1,
    description: `+${pct}% résistances tous éléments pour 1 tour.`,
  };
}

// Pas de sort Gemme simple : le T5 permanent est géré via `psToPfCostOverride`
// directement sur le passif. T3/T4 ont un sort qui override pour 1 tour, représenté
// ici par un buff simplifié "conversion PS→PF -1 coût ce tour" (non implémenté
// comme spell temporaire faute de buff ciblé dans l'état).
function makeGemmeChestSpell(_tier: WeaponTier): Spell | null {
  return null;
}

export function buildChestStatBonuses(resourceType: ResourceType, tier: WeaponTier): StatBonuses {
  switch (resourceType) {
    case "minerai": {
      const bonuses: StatBonuses = { flatDamageReduction: MINERAI_CHEST_DR[tier] };
      const spell = makeMineraiChestSpell(tier);
      if (spell) bonuses.bonusSpells = [spell];
      return bonuses;
    }
    case "bois": {
      const bonuses: StatBonuses = { hpMaxPercentBonus: BOIS_CHEST_HP_PCT[tier] };
      const spell = makeBoisChestSpell(tier);
      if (spell) bonuses.bonusSpells = [spell];
      return bonuses;
    }
    case "cuir": {
      const pct = CUIR_CHEST_RESIST_PCT[tier] / 100;
      const bonuses: StatBonuses = { flatResistancePct: pct };
      const spell = makeCuirChestSpell(tier);
      if (spell) bonuses.bonusSpells = [spell];
      return bonuses;
    }
    case "gemme": {
      const bonuses: StatBonuses = { psMaxBonus: GEMME_CHEST_PS_MAX[tier] };
      if (tier >= 5) bonuses.psToPfCostOverride = 4;
      return bonuses;
    }
  }
}

export function getChestEffectDescription(resourceType: ResourceType, tier: WeaponTier): string {
  switch (resourceType) {
    case "minerai": {
      const dr = MINERAI_CHEST_DR[tier];
      const res = MINERAI_CHEST_RESIST_PCT[tier];
      return `Passif : -${dr} dégât direct subi${res > 0 ? `. Sort (1 PF, CD 2) : +${res}% résistances 1 tour.` : ""}`;
    }
    case "bois": {
      const hp = BOIS_CHEST_HP_PCT[tier];
      const heal = BOIS_CHEST_HEAL_PCT[tier];
      return `Passif : +${hp}% HP max${heal > 0 ? `. Sort (1 PF, CD 3) : soigne ${heal}% HP max.` : ""}`;
    }
    case "cuir": {
      const res = CUIR_CHEST_RESIST_PCT[tier];
      const buff = CUIR_CHEST_RESIST_BUFF_PCT[tier];
      return `Passif : +${res}% résistances tous éléments${buff > 0 ? `. Sort (1 PF, CD 2) : +${buff}% résistances 1 tour.` : ""}`;
    }
    case "gemme": {
      const ps = GEMME_CHEST_PS_MAX[tier];
      const override = tier >= 5 ? ". Conversion PS→PF coûte 4 (permanent)." : "";
      const sortText = tier >= 3 && tier < 5 ? " Sort (1 PF, CD 2) : conversion PS→PF coûte 4 ce tour (⚠ approximé)." : "";
      return `Passif : +${ps} PS max${override}${sortText}`;
    }
  }
}

export function buildChestRecipe(resourceType: ResourceType, tier: WeaponTier) {
  const entries = WEAPON_RECIPE_BY_TIER[tier];
  const recipe: { resourceId: string; qty: number }[] = [];
  for (const e of entries) {
    const resource = getPrimaryResource(resourceType, e.resourceTier);
    if (!resource) continue;
    recipe.push({ resourceId: resource.id, qty: e.qty });
  }
  return recipe;
}

export function getChestItemId(resourceType: ResourceType, tier: WeaponTier): string {
  return `chest_${resourceType}_t${tier}`;
}

export function getChestName(resourceType: ResourceType, tier: WeaponTier): string {
  return `Torse de ${RESOURCE_TYPE_LABELS[resourceType]} T${tier}`;
}
