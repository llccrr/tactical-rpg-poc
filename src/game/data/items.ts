import type { Resistances } from "./elements";
import type { Spell } from "../core/gameState";
import type { ResourceType } from "./resources";
import { RESOURCE_TYPES } from "./resources";
import {
  WEAPON_TIERS,
  getWeaponDamage,
  getWeaponName,
  getWeaponItemId,
  getWeaponEffectDescription,
  getWeaponBonusSpell,
  WEAPON_ICON_BY_TYPE,
  WEAPON_RECIPE_BY_TIER,
  CUIR_LIFESTEAL_BY_TIER,
  GEMME_BURN_STACKS_BY_TIER,
  type WeaponTier,
} from "./weapons";
import {
  HELMET_ICON_BY_TYPE,
  buildHelmetStatBonuses,
  buildHelmetRecipe,
  getHelmetItemId,
  getHelmetName,
  getHelmetEffectDescription,
} from "./helmets";
import {
  CHEST_ICON_BY_TYPE,
  buildChestStatBonuses,
  buildChestRecipe,
  getChestItemId,
  getChestName,
  getChestEffectDescription,
} from "./chests";
import {
  BOOTS_ICON_BY_TYPE,
  buildBootsStatBonuses,
  buildBootsRecipe,
  getBootsItemId,
  getBootsName,
  getBootsEffectDescription,
} from "./boots";
import { getPrimaryResource } from "./resources";

export type ItemSlot = "arme" | "tete" | "torse" | "bottes";

export const ITEM_SLOTS: readonly ItemSlot[] = ["arme", "tete", "torse", "bottes"];

export const ITEM_SLOT_LABELS: Record<ItemSlot, string> = {
  arme: "Arme",
  tete: "Tête",
  torse: "Torse",
  bottes: "Bottes",
};

export const ITEM_SLOT_EMPTY_ICONS: Record<ItemSlot, string> = {
  arme: "⚔️",
  tete: "⛑️",
  torse: "🛡️",
  bottes: "🥾",
};

export interface StatBonuses {
  attack?: number;
  hp?: number;
  resistances?: Partial<Resistances>;
  weaponDamage?: number;
  bonusSpells?: Spell[];
  lifestealPct?: number;
  burnOnHitStacks?: number;
  flatDamageReduction?: number;
  flatResistancePct?: number;
  hpMaxPercentBonus?: number;
  bonusMoveRange?: number;
  psMaxBonus?: number;
  psToPfCostOverride?: number;
  firstDashesDiscount?: number;
}

export interface RecipeEntry {
  resourceId: string;
  qty: number;
}

export interface WeaponSpec {
  resourceType: ResourceType;
  tier: WeaponTier;
}

export interface ItemDef {
  id: string;
  name: string;
  icon: string;
  slot: ItemSlot;
  tier: number;
  bonuses: StatBonuses;
  recipe: RecipeEntry[];
  description: string;
  /** Uniquement pour le slot arme : caractérise l'arme. */
  weaponSpec?: WeaponSpec;
}

// ── Génération des 80 items ────────────────────────────────────

function buildWeaponRecipe(resourceType: ResourceType, tier: WeaponTier): RecipeEntry[] {
  const entries = WEAPON_RECIPE_BY_TIER[tier];
  const recipe: RecipeEntry[] = [];
  for (const e of entries) {
    const resource = getPrimaryResource(resourceType, e.resourceTier);
    if (!resource) continue;
    recipe.push({ resourceId: resource.id, qty: e.qty });
  }
  return recipe;
}

function buildWeaponItem(resourceType: ResourceType, tier: WeaponTier): ItemDef {
  const damage = getWeaponDamage(resourceType, tier);
  const bonusSpell = getWeaponBonusSpell(resourceType, tier);
  const bonuses: StatBonuses = { weaponDamage: damage };
  if (bonusSpell) bonuses.bonusSpells = [bonusSpell];
  if (resourceType === "cuir") bonuses.lifestealPct = CUIR_LIFESTEAL_BY_TIER[tier];
  if (resourceType === "gemme") bonuses.burnOnHitStacks = GEMME_BURN_STACKS_BY_TIER[tier];

  const effectLine = getWeaponEffectDescription(resourceType, tier);
  return {
    id: getWeaponItemId(resourceType, tier),
    name: getWeaponName(resourceType, tier),
    icon: WEAPON_ICON_BY_TYPE[resourceType],
    slot: "arme",
    tier,
    bonuses,
    recipe: buildWeaponRecipe(resourceType, tier),
    description: `${damage} dégâts. ${effectLine}`,
    weaponSpec: { resourceType, tier },
  };
}

function buildHelmetItem(resourceType: ResourceType, tier: WeaponTier): ItemDef {
  return {
    id: getHelmetItemId(resourceType, tier),
    name: getHelmetName(resourceType, tier),
    icon: HELMET_ICON_BY_TYPE[resourceType],
    slot: "tete",
    tier,
    bonuses: buildHelmetStatBonuses(resourceType, tier),
    recipe: buildHelmetRecipe(resourceType, tier),
    description: getHelmetEffectDescription(resourceType, tier),
  };
}

function buildChestItem(resourceType: ResourceType, tier: WeaponTier): ItemDef {
  return {
    id: getChestItemId(resourceType, tier),
    name: getChestName(resourceType, tier),
    icon: CHEST_ICON_BY_TYPE[resourceType],
    slot: "torse",
    tier,
    bonuses: buildChestStatBonuses(resourceType, tier),
    recipe: buildChestRecipe(resourceType, tier),
    description: getChestEffectDescription(resourceType, tier),
  };
}

function buildBootsItem(resourceType: ResourceType, tier: WeaponTier): ItemDef {
  return {
    id: getBootsItemId(resourceType, tier),
    name: getBootsName(resourceType, tier),
    icon: BOOTS_ICON_BY_TYPE[resourceType],
    slot: "bottes",
    tier,
    bonuses: buildBootsStatBonuses(resourceType, tier),
    recipe: buildBootsRecipe(resourceType, tier),
    description: getBootsEffectDescription(resourceType, tier),
  };
}

const WEAPON_ITEMS: ItemDef[] = RESOURCE_TYPES.flatMap((type) =>
  WEAPON_TIERS.map((tier) => buildWeaponItem(type, tier)),
);
const HELMET_ITEMS: ItemDef[] = RESOURCE_TYPES.flatMap((type) =>
  WEAPON_TIERS.map((tier) => buildHelmetItem(type, tier)),
);
const CHEST_ITEMS: ItemDef[] = RESOURCE_TYPES.flatMap((type) =>
  WEAPON_TIERS.map((tier) => buildChestItem(type, tier)),
);
const BOOTS_ITEMS: ItemDef[] = RESOURCE_TYPES.flatMap((type) =>
  WEAPON_TIERS.map((tier) => buildBootsItem(type, tier)),
);

export const ITEMS: ItemDef[] = [
  ...WEAPON_ITEMS,
  ...HELMET_ITEMS,
  ...CHEST_ITEMS,
  ...BOOTS_ITEMS,
];

export function getItemById(id: string): ItemDef | undefined {
  return ITEMS.find((i) => i.id === id);
}

export function getItemsBySlot(slot: ItemSlot): ItemDef[] {
  switch (slot) {
    case "arme": return WEAPON_ITEMS;
    case "tete": return HELMET_ITEMS;
    case "torse": return CHEST_ITEMS;
    case "bottes": return BOOTS_ITEMS;
  }
}

export function getWeaponItems(): ItemDef[] {
  return WEAPON_ITEMS;
}
