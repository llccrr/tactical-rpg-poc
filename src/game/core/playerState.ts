import { getItemById, type StatBonuses } from "../data/items";
import { ELEMENTS, clampResistance, type Element } from "../data/elements";

export interface PlayerState {
  classId: string;
  /** resourceId → quantity owned */
  resources: Record<string, number>;
  /** slot → itemId currently equipped */
  equipment: Record<string, string>;
  /** item IDs the player has crafted (owned) */
  ownedItems: string[];
}

export function createPlayerState(classId: string): PlayerState {
  return { classId, resources: {}, equipment: {}, ownedItems: [] };
}

export function addResource(state: PlayerState, resourceId: string, qty = 1): PlayerState {
  return {
    ...state,
    resources: {
      ...state.resources,
      [resourceId]: (state.resources[resourceId] ?? 0) + qty,
    },
  };
}

export function canCraft(state: PlayerState, itemId: string): boolean {
  const item = getItemById(itemId);
  if (!item) return false;
  if (state.ownedItems.includes(itemId)) return false;
  return item.recipe.every(({ resourceId, qty }) => (state.resources[resourceId] ?? 0) >= qty);
}

/** Consume resources, add item to owned, and equip it. */
export function craftItem(state: PlayerState, itemId: string): PlayerState {
  const item = getItemById(itemId);
  if (!item || !canCraft(state, itemId)) return state;

  const newResources = { ...state.resources };
  for (const { resourceId, qty } of item.recipe) {
    newResources[resourceId] = (newResources[resourceId] ?? 0) - qty;
  }

  return {
    ...state,
    resources: newResources,
    ownedItems: [...state.ownedItems, itemId],
    equipment: { ...state.equipment, [item.slot]: itemId },
  };
}

/** Equip an owned item. Replaces the current item in that slot (which stays owned). */
export function equipItem(state: PlayerState, itemId: string): PlayerState {
  const item = getItemById(itemId);
  if (!item) return state;
  if (!state.ownedItems.includes(itemId)) return state;
  return { ...state, equipment: { ...state.equipment, [item.slot]: itemId } };
}

/** Remove the item in the given slot. The item stays in ownedItems. */
export function unequipSlot(state: PlayerState, slot: string): PlayerState {
  if (!state.equipment[slot]) return state;
  const newEquipment = { ...state.equipment };
  delete newEquipment[slot];
  return { ...state, equipment: newEquipment };
}

/** Sum all stat bonuses from equipped items. */
export function getEquipmentBonuses(state: PlayerState): StatBonuses {
  const bonuses: StatBonuses = {};
  const resistances: Partial<Record<Element, number>> = {};

  for (const itemId of Object.values(state.equipment)) {
    const item = getItemById(itemId);
    if (!item) continue;
    if (item.bonuses.attack) bonuses.attack = (bonuses.attack ?? 0) + item.bonuses.attack;
    if (item.bonuses.hp) bonuses.hp = (bonuses.hp ?? 0) + item.bonuses.hp;
    if (item.bonuses.resistances) {
      for (const el of ELEMENTS) {
        const add = item.bonuses.resistances[el];
        if (add != null) resistances[el] = (resistances[el] ?? 0) + add;
      }
    }
    // L'arme équipée fixe les dégâts d'arme ; on garde le max si plusieurs (un seul slot
    // arme existe de toute façon).
    if (item.bonuses.weaponDamage != null) {
      bonuses.weaponDamage = Math.max(bonuses.weaponDamage ?? 0, item.bonuses.weaponDamage);
    }
    if (item.bonuses.bonusSpells) {
      bonuses.bonusSpells = [...(bonuses.bonusSpells ?? []), ...item.bonuses.bonusSpells];
    }
    if (item.bonuses.lifestealPct != null) {
      bonuses.lifestealPct = (bonuses.lifestealPct ?? 0) + item.bonuses.lifestealPct;
    }
    if (item.bonuses.burnOnHitStacks != null) {
      bonuses.burnOnHitStacks = (bonuses.burnOnHitStacks ?? 0) + item.bonuses.burnOnHitStacks;
    }
    if (item.bonuses.flatDamageReduction != null) {
      bonuses.flatDamageReduction = (bonuses.flatDamageReduction ?? 0) + item.bonuses.flatDamageReduction;
    }
    if (item.bonuses.flatResistancePct != null) {
      bonuses.flatResistancePct = (bonuses.flatResistancePct ?? 0) + item.bonuses.flatResistancePct;
    }
    if (item.bonuses.hpMaxPercentBonus != null) {
      bonuses.hpMaxPercentBonus = (bonuses.hpMaxPercentBonus ?? 0) + item.bonuses.hpMaxPercentBonus;
    }
    if (item.bonuses.bonusMoveRange != null) {
      bonuses.bonusMoveRange = (bonuses.bonusMoveRange ?? 0) + item.bonuses.bonusMoveRange;
    }
    if (item.bonuses.psMaxBonus != null) {
      bonuses.psMaxBonus = (bonuses.psMaxBonus ?? 0) + item.bonuses.psMaxBonus;
    }
    if (item.bonuses.psToPfCostOverride != null) {
      bonuses.psToPfCostOverride = item.bonuses.psToPfCostOverride;
    }
    if (item.bonuses.firstDashesDiscount != null) {
      bonuses.firstDashesDiscount = (bonuses.firstDashesDiscount ?? 0) + item.bonuses.firstDashesDiscount;
    }
  }

  let hasResistance = false;
  for (const el of ELEMENTS) {
    if (resistances[el] != null) {
      resistances[el] = clampResistance(resistances[el]!);
      hasResistance = true;
    }
  }
  if (hasResistance) bonuses.resistances = resistances;

  return bonuses;
}
