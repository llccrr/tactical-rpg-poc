import { Fragment, useState } from "react";
import {
  ITEMS,
  ITEM_SLOTS,
  ITEM_SLOT_LABELS,
  getItemById,
  getItemsBySlot,
  type ItemSlot,
} from "../game/data/items";
import {
  getResourceById,
  RESOURCES,
  RESOURCE_TYPES,
  RESOURCE_TYPE_LABELS,
  RESOURCE_TYPE_ICONS,
  RESOURCE_TYPE_COLORS,
  type ResourceType,
} from "../game/data/resources";
import { getClassById } from "../game/data/classes";
import {
  WEAPON_TIERS,
  WEAPON_ICON_BY_TYPE,
  getWeaponDamage,
  getWeaponEffectDescription,
  getWeaponItemId,
  type WeaponTier,
} from "../game/data/weapons";
import { HELMET_ICON_BY_TYPE, getHelmetItemId, getHelmetEffectDescription } from "../game/data/helmets";
import { CHEST_ICON_BY_TYPE, getChestItemId, getChestEffectDescription } from "../game/data/chests";
import { BOOTS_ICON_BY_TYPE, getBootsItemId, getBootsEffectDescription } from "../game/data/boots";
import {
  canCraft,
  craftItem,
  equipItem,
  getEquipmentBonuses,
  type PlayerState,
} from "../game/core/playerState";

interface Props {
  player: PlayerState;
  onPlayerChange: (player: PlayerState) => void;
  onBack: () => void;
}

const TIER_COLORS: Record<WeaponTier, string> = {
  1: "#9ca3af",
  2: "#60a5fa",
  3: "#c084fc",
  4: "#fb923c",
  5: "#ef4444",
};

const SLOT_DESCRIPTION: Record<ItemSlot, string> = {
  arme: "Dégâts (bruts ou avec effet)",
  tete: "Offensif (buff dégâts, pénétration)",
  torse: "Défensif (HP, résistances, survie)",
  bottes: "Mobilité (PM, push, pull, déplacement)",
};

const ICON_BY_SLOT: Record<ItemSlot, Record<ResourceType, string>> = {
  arme: WEAPON_ICON_BY_TYPE,
  tete: HELMET_ICON_BY_TYPE,
  torse: CHEST_ICON_BY_TYPE,
  bottes: BOOTS_ICON_BY_TYPE,
};

function getItemIdForSlot(slot: ItemSlot, type: ResourceType, tier: WeaponTier): string {
  switch (slot) {
    case "arme": return getWeaponItemId(type, tier);
    case "tete": return getHelmetItemId(type, tier);
    case "torse": return getChestItemId(type, tier);
    case "bottes": return getBootsItemId(type, tier);
  }
}

function getEffectDescriptionForSlot(slot: ItemSlot, type: ResourceType, tier: WeaponTier): string {
  switch (slot) {
    case "arme": return getWeaponEffectDescription(type, tier);
    case "tete": return getHelmetEffectDescription(type, tier);
    case "torse": return getChestEffectDescription(type, tier);
    case "bottes": return getBootsEffectDescription(type, tier);
  }
}

function StatSummary({ player }: { player: PlayerState }) {
  const classDef = getClassById(player.classId);
  if (!classDef) return null;
  const bonuses = getEquipmentBonuses(player);
  const weaponDmg = bonuses.weaponDamage ?? 10;
  const baseHp = classDef.baseHp + (bonuses.hp ?? 0);
  const hpMaxPct = bonuses.hpMaxPercentBonus ?? 0;
  const maxHp = Math.floor(baseHp * (1 + hpMaxPct / 100));

  const pills: { label: string; value: string; color: string; bg?: string; title?: string }[] = [
    { label: "PV", value: String(maxHp), color: "#dc2626" },
    { label: "ATK", value: String(classDef.baseAttack + (bonuses.attack ?? 0)), color: "#60a5fa" },
    { label: "PM", value: String(classDef.basePm + (bonuses.bonusMoveRange ?? 0)), color: "#c084fc" },
    { label: "PS max", value: String(classDef.basePsMax + (bonuses.psMaxBonus ?? 0)), color: "#f87171" },
    { label: "ARME", value: `${weaponDmg} dmg`, color: "#c084fc", bg: "#1a1224" },
  ];
  if (bonuses.lifestealPct) {
    pills.push({ label: "Lifesteal", value: `${bonuses.lifestealPct}%`, color: "#f59e0b" });
  }
  if (bonuses.burnOnHitStacks) {
    pills.push({ label: "Burn/hit", value: `×${bonuses.burnOnHitStacks}`, color: "#fb923c" });
  }
  if (bonuses.flatDamageReduction) {
    pills.push({ label: "DR", value: `-${bonuses.flatDamageReduction}`, color: "#94a3b8" });
  }
  if (bonuses.flatResistancePct) {
    pills.push({ label: "Res+", value: `+${Math.round(bonuses.flatResistancePct * 100)}%`, color: "#a7f3d0" });
  }
  if (bonuses.firstDashesDiscount) {
    pills.push({ label: "Dash", value: `${bonuses.firstDashesDiscount}×-1 PM`, color: "#fde68a" });
  }
  if (bonuses.psToPfCostOverride != null) {
    pills.push({ label: "PS→PF", value: `${bonuses.psToPfCostOverride}`, color: "#fca5a5" });
  }
  if (bonuses.bonusSpells && bonuses.bonusSpells.length > 0) {
    pills.push({
      label: "Sorts bonus",
      value: `+${bonuses.bonusSpells.length}`,
      color: "#60a5fa",
      title: bonuses.bonusSpells.map((s) => s.name).join(", "),
    });
  }

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      {pills.map((p) => (
        <div
          key={p.label}
          title={p.title}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 8px",
            background: p.bg ?? "#12121f",
            border: `1px solid ${p.color}33`,
            borderRadius: 6,
            fontFamily: "monospace",
            fontSize: 12,
          }}
        >
          <span style={{ color: p.color, fontWeight: 700 }}>{p.label}</span>
          <span style={{ color: "#eee", fontWeight: 700 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function ItemCell({
  slot,
  resourceType,
  tier,
  player,
  onCraft,
  onEquip,
}: {
  slot: ItemSlot;
  resourceType: ResourceType;
  tier: WeaponTier;
  player: PlayerState;
  onCraft: () => void;
  onEquip: () => void;
}) {
  const itemId = getItemIdForSlot(slot, resourceType, tier);
  const item = getItemById(itemId);
  if (!item) return null;

  const owned = player.ownedItems.includes(itemId);
  const equipped = player.equipment[slot] === itemId;
  const craftable = canCraft(player, itemId);
  const tierColor = TIER_COLORS[tier];
  const effect = getEffectDescriptionForSlot(slot, resourceType, tier);
  const headline = slot === "arme" ? `${getWeaponDamage(resourceType, tier)} dégâts` : item.name.split(" ").slice(-1)[0];

  const bgColor = equipped ? "#0e1e18" : owned ? "#121a18" : "#12121f";
  const borderColor = equipped ? "#44aa66" : owned ? "#2a4a3a" : tierColor + "33";

  return (
    <div
      style={{
        padding: 8,
        borderRadius: 8,
        background: bgColor,
        border: `2px solid ${borderColor}`,
        display: "flex",
        flexDirection: "column",
        gap: 5,
        position: "relative",
        minHeight: 180,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 20 }}>{ICON_BY_SLOT[slot][resourceType]}</span>
        <span
          style={{
            fontSize: 9,
            fontFamily: "monospace",
            fontWeight: 700,
            color: tierColor,
            border: `1px solid ${tierColor}`,
            borderRadius: 3,
            padding: "0 4px",
          }}
        >
          T{tier}
        </span>
      </div>
      {slot === "arme" && (
        <div style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 700, color: "#eee" }}>
          {headline}
        </div>
      )}
      <div
        style={{
          fontFamily: "sans-serif",
          fontSize: 10,
          color: "#9aa",
          lineHeight: 1.3,
          minHeight: 58,
        }}
      >
        {effect}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {item.recipe.map(({ resourceId, qty }) => {
          const res = getResourceById(resourceId);
          const ownedQty = player.resources[resourceId] ?? 0;
          const enough = ownedQty >= qty;
          return (
            <div
              key={resourceId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                fontFamily: "monospace",
                fontSize: 9,
                color: enough ? "#889" : "#733",
              }}
            >
              <span>{res?.icon ?? "?"}</span>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {res?.name ?? resourceId}
              </span>
              <span style={{ color: enough ? "#6a8" : "#c44", fontWeight: 700 }}>
                {ownedQty}/{qty}
              </span>
            </div>
          );
        })}
      </div>
      {equipped ? (
        <div
          style={{
            marginTop: "auto",
            padding: "4px 0",
            textAlign: "center",
            fontFamily: "monospace",
            fontSize: 10,
            fontWeight: 700,
            color: "#44aa66",
            border: "1px solid #44aa66",
            borderRadius: 4,
          }}
        >
          ÉQUIPÉ
        </div>
      ) : owned ? (
        <button
          onClick={onEquip}
          style={{
            marginTop: "auto",
            padding: "5px 0",
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "sans-serif",
            color: "#44aa66",
            background: "#0e1e18",
            border: "1px solid #33664a",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Équiper
        </button>
      ) : (
        <button
          onClick={onCraft}
          disabled={!craftable}
          style={{
            marginTop: "auto",
            padding: "5px 0",
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "sans-serif",
            color: craftable ? "#fff" : "#555",
            background: craftable ? "#1a3a2a" : "#0e0e1a",
            border: `1px solid ${craftable ? "#44aa66" : "#333"}`,
            borderRadius: 4,
            cursor: craftable ? "pointer" : "not-allowed",
          }}
        >
          Crafter
        </button>
      )}
    </div>
  );
}

function SlotGrid({
  slot,
  player,
  onCraft,
  onEquip,
}: {
  slot: ItemSlot;
  player: PlayerState;
  onCraft: (id: string) => void;
  onEquip: (id: string) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "100px repeat(5, 1fr)",
        gap: 6,
        alignItems: "stretch",
      }}
    >
      <div />
      {WEAPON_TIERS.map((tier) => (
        <div
          key={`h-${tier}`}
          style={{
            textAlign: "center",
            fontFamily: "monospace",
            fontSize: 11,
            fontWeight: 700,
            color: TIER_COLORS[tier],
            padding: "2px 0",
            borderBottom: `1px solid ${TIER_COLORS[tier]}44`,
          }}
        >
          Tier {tier}
        </div>
      ))}
      {RESOURCE_TYPES.map((type) => (
        <Fragment key={type}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "0 6px",
              fontFamily: "sans-serif",
              fontSize: 12,
              fontWeight: 700,
              color: RESOURCE_TYPE_COLORS[type],
              borderRight: `1px solid ${RESOURCE_TYPE_COLORS[type]}33`,
            }}
          >
            <span style={{ fontSize: 16 }}>{RESOURCE_TYPE_ICONS[type]}</span>
            <span>{RESOURCE_TYPE_LABELS[type]}</span>
          </div>
          {WEAPON_TIERS.map((tier) => (
            <ItemCell
              key={`${type}-${tier}`}
              slot={slot}
              resourceType={type}
              tier={tier}
              player={player}
              onCraft={() => onCraft(getItemIdForSlot(slot, type, tier))}
              onEquip={() => onEquip(getItemIdForSlot(slot, type, tier))}
            />
          ))}
        </Fragment>
      ))}
    </div>
  );
}

export function Crafting({ player, onPlayerChange, onBack }: Props) {
  const [activeSlot, setActiveSlot] = useState<ItemSlot>("arme");
  const handleCraft = (itemId: string) => onPlayerChange(craftItem(player, itemId));
  const handleEquip = (itemId: string) => onPlayerChange(equipItem(player, itemId));

  const hasResources = RESOURCES.some((r) => (player.resources[r.id] ?? 0) > 0);
  const craftedCountsBySlot = ITEM_SLOTS.reduce<Record<ItemSlot, number>>((acc, s) => {
    acc[s] = getItemsBySlot(s).filter((it) => player.ownedItems.includes(it.id)).length;
    return acc;
  }, {} as Record<ItemSlot, number>);

  // Bogus reference to ITEMS for tree-shaking safety
  void ITEMS;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a14",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "28px 24px 48px",
        gap: 24,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ margin: "0 0 4px", color: "#eee", fontFamily: "sans-serif", fontSize: "1.8rem" }}>
          Atelier de craft
        </h1>
        <p style={{ margin: 0, color: "#666", fontFamily: "sans-serif", fontSize: "0.85rem" }}>
          80 items • 4 slots × 4 types × 5 tiers (spec INFO EDOUARD JEU)
        </p>
      </div>

      <div style={{ width: "100%", maxWidth: 1100 }}>
        <StatSummary player={player} />
      </div>

      {/* Ressources grouped by type */}
      <div style={{ width: "100%", maxWidth: 1100 }}>
        <h2
          style={{
            color: "#888",
            fontFamily: "sans-serif",
            fontSize: "0.8rem",
            textTransform: "uppercase",
            letterSpacing: 2,
            margin: "0 0 8px",
          }}
        >
          Ressources
        </h2>
        {hasResources ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
            }}
          >
            {RESOURCE_TYPES.map((type) => {
              const typeResources = RESOURCES.filter((r) => r.type === type);
              return (
                <div
                  key={type}
                  style={{
                    background: "#12121f",
                    border: `1px solid ${RESOURCE_TYPE_COLORS[type]}44`,
                    borderRadius: 8,
                    padding: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: "monospace",
                      fontSize: 11,
                      fontWeight: 700,
                      color: RESOURCE_TYPE_COLORS[type],
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{RESOURCE_TYPE_ICONS[type]}</span>
                    <span>{RESOURCE_TYPE_LABELS[type]}</span>
                  </div>
                  {typeResources.map((r) => {
                    const qty = player.resources[r.id] ?? 0;
                    return (
                      <div
                        key={r.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          fontFamily: "monospace",
                          fontSize: 10,
                          color: qty > 0 ? "#bbb" : "#333",
                          padding: "1px 0",
                        }}
                      >
                        <span style={{ fontSize: 11 }}>{r.icon}</span>
                        <span
                          style={{
                            fontSize: 8,
                            color: "#666",
                            border: "1px solid #333",
                            borderRadius: 2,
                            padding: "0 3px",
                          }}
                        >
                          T{r.tier}
                        </span>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {r.name}
                        </span>
                        <span style={{ color: qty > 0 ? "#8ba" : "#444", fontWeight: 700 }}>×{qty}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: "#444", fontFamily: "sans-serif", fontSize: "0.85rem", margin: 0 }}>
            Aucune ressource. Complète des donjons (ou active le cheat du Hub) pour en obtenir.
          </p>
        )}
      </div>

      {/* Slot tabs */}
      <div style={{ width: "100%", maxWidth: 1100 }}>
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #2a2a3a", marginBottom: 12 }}>
          {ITEM_SLOTS.map((slot) => {
            const active = activeSlot === slot;
            const count = craftedCountsBySlot[slot];
            return (
              <button
                key={slot}
                onClick={() => setActiveSlot(slot)}
                style={{
                  padding: "8px 16px",
                  background: active ? "#1a1a2e" : "transparent",
                  border: "none",
                  borderBottom: `2px solid ${active ? "#c084fc" : "transparent"}`,
                  color: active ? "#eee" : "#666",
                  fontFamily: "sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {ITEM_SLOT_LABELS[slot]} <span style={{ color: "#666", fontSize: 10 }}>({count}/20)</span>
              </button>
            );
          })}
        </div>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 11,
            color: "#667",
            marginBottom: 8,
          }}
        >
          {SLOT_DESCRIPTION[activeSlot]}
        </div>
        <SlotGrid slot={activeSlot} player={player} onCraft={handleCraft} onEquip={handleEquip} />
      </div>

      <button
        onClick={onBack}
        style={{
          padding: "10px 28px",
          fontSize: "0.9rem",
          fontFamily: "sans-serif",
          color: "#888",
          background: "transparent",
          border: "1px solid #444",
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        ← Retour au Hub
      </button>
    </div>
  );
}
