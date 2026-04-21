/**
 * Slot Tête — effets offensifs (buff dégâts, pénétration, lifesteal bonus, sort feu).
 * Spec INFO EDOUARD JEU / markdown ITEMS.
 */

import type { Spell } from "../core/gameState";
import type { StatBonuses } from "./items";
import type { ResourceType } from "./resources";
import {
  RESOURCE_TYPE_LABELS,
  getPrimaryResource,
} from "./resources";
import { WEAPON_TIERS, type WeaponTier, WEAPON_RECIPE_BY_TIER } from "./weapons";

export const HELMET_ICON_BY_TYPE: Record<ResourceType, string> = {
  minerai: "⛑️",
  bois: "🎩",
  cuir: "🪖",
  gemme: "👑",
};

// ── MINERAI — buff % dégâts + pénétration résistances ────────────
const MINERAI_HELMET_DMG_PCT: Record<WeaponTier, number> = { 1: 10, 2: 15, 3: 15, 4: 20, 5: 20 };
const MINERAI_HELMET_PENETRATION: Record<WeaponTier, number> = { 1: 0, 2: 0, 3: 10, 4: 10, 5: 15 };

// ── BOIS — conditional damage si bord/obstacle + stacks Sang ─────
const BOIS_HELMET_DMG_PCT: Record<WeaponTier, number> = { 1: 15, 2: 20, 3: 20, 4: 25, 5: 25 };
const BOIS_HELMET_SANG_STACKS: Record<WeaponTier, number> = { 1: 0, 2: 0, 3: 1, 4: 1, 5: 2 };

// ── CUIR — lifesteal bonus + PM drain cible ─────────────────────
const CUIR_HELMET_LIFESTEAL_PCT: Record<WeaponTier, number> = { 1: 30, 2: 35, 3: 35, 4: 40, 5: 40 };
const CUIR_HELMET_PM_DRAIN: Record<WeaponTier, number> = { 1: 0, 2: 0, 3: 1, 4: 1, 5: 2 };

// ── GEMME — sort CAC Feu 45% + Burn ─────────────────────────────
const GEMME_HELMET_BURN_STACKS: Record<WeaponTier, number> = { 1: 2, 2: 3, 3: 3, 4: 4, 5: 4 };

function makeMineraiHelmetSpell(tier: WeaponTier): Spell {
  const pct = MINERAI_HELMET_DMG_PCT[tier];
  const pen = MINERAI_HELMET_PENETRATION[tier];
  const penText = pen > 0 ? ` + ignore ${pen}% résistances` : "";
  return {
    id: `helmet_spell_minerai_t${tier}`,
    name: `Frappe Précise T${tier}`,
    range: 0,
    cost: 0,
    pfCost: 1,
    damagePercent: 0,
    element: "neutre",
    damageType: "indirect",
    cooldown: 2,
    targetMode: "self",
    nextAttackPercent: pct,
    nextAttackPenetrationPct: pen,
    description: `Prochaine attaque : +${pct}% dégâts finaux${penText}.`,
  };
}

function makeBoisHelmetSpell(tier: WeaponTier): Spell {
  const pct = BOIS_HELMET_DMG_PCT[tier];
  const sang = BOIS_HELMET_SANG_STACKS[tier];
  const sangText = sang > 0 ? ` + ${sang} stack${sang > 1 ? "s" : ""} Sang` : "";
  const spell: Spell = {
    id: `helmet_spell_bois_t${tier}`,
    name: `Tir Accablé T${tier}`,
    range: 0,
    cost: 0,
    pfCost: 1,
    damagePercent: 0,
    element: "neutre",
    damageType: "indirect",
    cooldown: 2,
    targetMode: "self",
    nextAttackPercent: pct,
    requiresTargetNearEdgeOrObstacle: true,
    description: `Prochaine attaque : +${pct}% dégâts d'arme si cible adjacente à un bord/obstacle (⚠ condition non appliquée)${sangText}.`,
  };
  if (sang > 0) {
    spell.grantsNextAttackApplyStacks = { element: "neutre", count: sang };
  }
  return spell;
}

function makeCuirHelmetSpell(tier: WeaponTier): Spell {
  const lifesteal = CUIR_HELMET_LIFESTEAL_PCT[tier];
  const pmDrain = CUIR_HELMET_PM_DRAIN[tier];
  const pmText = pmDrain > 0 ? ` + cible perd ${pmDrain} PM` : "";
  return {
    id: `helmet_spell_cuir_t${tier}`,
    name: `Soif de Sang T${tier}`,
    range: 0,
    cost: 0,
    pfCost: 1,
    damagePercent: 0,
    element: "neutre",
    damageType: "indirect",
    cooldown: 2,
    targetMode: "self",
    nextAttackLifestealBonusPct: lifesteal,
    targetPmDrain: pmDrain,
    description: `Prochaine attaque : +${lifesteal}% lifesteal bonus${pmText}.`,
  };
}

function makeGemmeHelmetSpell(tier: WeaponTier): Spell {
  const stacks = GEMME_HELMET_BURN_STACKS[tier];
  // Spec T3+ ajoute choix Terre (Poison), T5 ajoute Vent. Simplifié : Feu par défaut.
  const choices: string[] = ["Feu"];
  if (tier >= 3) choices.push("Terre");
  if (tier >= 5) choices.push("Vent");
  const choicesText = choices.length > 1 ? ` (choix ${choices.join(" / ")} — simplifié : Feu)` : "";
  return {
    id: `helmet_spell_gemme_t${tier}`,
    name: `Incantation T${tier}`,
    range: 1,
    cost: 0,
    pfCost: 1,
    damagePercent: 45,
    element: "feu",
    damageType: "direct",
    cooldown: 2,
    targetMode: "enemy",
    applyStacks: { element: "feu", count: stacks },
    elementChoices: tier >= 3 ? (tier >= 5 ? ["feu", "terre", "vent"] : ["feu", "terre"]) : undefined,
    description: `45% dégâts d'arme Feu + ${stacks} stacks Burn${choicesText}. CAC.`,
  };
}

export function buildHelmetStatBonuses(resourceType: ResourceType, tier: WeaponTier): StatBonuses {
  switch (resourceType) {
    case "minerai":
      return { bonusSpells: [makeMineraiHelmetSpell(tier)] };
    case "bois":
      return { bonusSpells: [makeBoisHelmetSpell(tier)] };
    case "cuir":
      return { bonusSpells: [makeCuirHelmetSpell(tier)] };
    case "gemme":
      return { bonusSpells: [makeGemmeHelmetSpell(tier)] };
  }
}

export function getHelmetEffectDescription(resourceType: ResourceType, tier: WeaponTier): string {
  switch (resourceType) {
    case "minerai": {
      const pct = MINERAI_HELMET_DMG_PCT[tier];
      const pen = MINERAI_HELMET_PENETRATION[tier];
      return `Sort (1 PF, CD 2) : +${pct}% dégâts finaux prochaine attaque${pen > 0 ? ` + ignore ${pen}% résistances` : ""}.`;
    }
    case "bois": {
      const pct = BOIS_HELMET_DMG_PCT[tier];
      const sang = BOIS_HELMET_SANG_STACKS[tier];
      return `Sort (1 PF, CD 2) : +${pct}% dégâts si cible adjacente à un bord/obstacle${sang > 0 ? ` + ${sang} Sang` : ""}.`;
    }
    case "cuir": {
      const lifesteal = CUIR_HELMET_LIFESTEAL_PCT[tier];
      const pmDrain = CUIR_HELMET_PM_DRAIN[tier];
      return `Sort (1 PF, CD 2) : prochaine attaque soigne +${lifesteal}%${pmDrain > 0 ? ` + cible perd ${pmDrain} PM` : ""}.`;
    }
    case "gemme": {
      const stacks = GEMME_HELMET_BURN_STACKS[tier];
      const choices = tier >= 5 ? " (Feu/Terre/Vent)" : tier >= 3 ? " (Feu/Terre)" : "";
      return `Sort (1 PF, CD 2) : 45% dégâts Feu CAC + ${stacks} stacks Burn${choices}.`;
    }
  }
}

export function buildHelmetRecipe(resourceType: ResourceType, tier: WeaponTier) {
  const entries = WEAPON_RECIPE_BY_TIER[tier];
  const recipe: { resourceId: string; qty: number }[] = [];
  for (const e of entries) {
    const resource = getPrimaryResource(resourceType, e.resourceTier);
    if (!resource) continue;
    recipe.push({ resourceId: resource.id, qty: e.qty });
  }
  return recipe;
}

export function getHelmetItemId(resourceType: ResourceType, tier: WeaponTier): string {
  return `helmet_${resourceType}_t${tier}`;
}

export function getHelmetName(resourceType: ResourceType, tier: WeaponTier): string {
  return `Tête de ${RESOURCE_TYPE_LABELS[resourceType]} T${tier}`;
}

export { WEAPON_TIERS };
