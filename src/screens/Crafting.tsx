import { ITEMS, type ItemDef, type ItemSlot } from "../game/data/items";
import { getResourceById, RESOURCES } from "../game/data/resources";
import { getClassById } from "../game/data/classes";
import { canCraft, craftItem, getEquipmentBonuses, type PlayerState } from "../game/core/playerState";

interface Props {
  player: PlayerState;
  onPlayerChange: (player: PlayerState) => void;
  onBack: () => void;
}

const SLOT_LABELS: Record<ItemSlot, string> = {
  arme: "Armes",
  armure: "Armures",
  accessoire: "Accessoires",
};

const SLOT_ORDER: ItemSlot[] = ["arme", "armure", "accessoire"];

const TIER_COLORS: Record<number, string> = {
  1: "#44aa88",
  2: "#ee8833",
};

function StatSummary({ player }: { player: PlayerState }) {
  const classDef = getClassById(player.classId);
  if (!classDef) return null;
  const bonuses = getEquipmentBonuses(player);

  const stats = [
    { label: "PV", base: classDef.baseHp, bonus: bonuses.hp ?? 0, color: "#dc2626" },
    { label: "ATK", base: classDef.baseAttack, bonus: bonuses.attack ?? 0, color: "#60a5fa" },
  ];

  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 10px",
            background: "#12121f",
            border: "1px solid #2a2a3a",
            borderRadius: 6,
            fontFamily: "monospace",
            fontSize: 13,
          }}
        >
          <span style={{ color: s.color, fontWeight: 700 }}>{s.label}</span>
          <span style={{ color: "#aaa" }}>{s.base}</span>
          {s.bonus > 0 && (
            <span style={{ color: "#44cc66", fontWeight: 700 }}>+{s.bonus}</span>
          )}
          <span style={{ color: "#666" }}>=</span>
          <span style={{ color: "#eee", fontWeight: 700 }}>{s.base + s.bonus}</span>
        </div>
      ))}
    </div>
  );
}

function ItemCard({
  item,
  player,
  onCraft,
}: {
  item: ItemDef;
  player: PlayerState;
  onCraft: () => void;
}) {
  const owned = player.ownedItems.includes(item.id);
  const equipped = player.equipment[item.slot] === item.id;
  const craftable = canCraft(player, item.id);
  const tierColor = TIER_COLORS[item.tier] ?? "#888";

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 10,
        background: equipped ? "#0e1e18" : "#12121f",
        border: `2px solid ${equipped ? "#44aa66" : "#2a2a3a"}`,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        width: 220,
        position: "relative",
      }}
    >
      {owned && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            fontSize: "0.65rem",
            fontFamily: "monospace",
            color: equipped ? "#44aa66" : "#888",
            border: `1px solid ${equipped ? "#44aa66" : "#555"}`,
            borderRadius: 4,
            padding: "1px 5px",
          }}
        >
          {equipped ? "ÉQUIPÉ" : "POSSÉDÉ"}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 24 }}>{item.icon}</span>
        <div>
          <div style={{ color: "#ddd", fontFamily: "sans-serif", fontSize: "0.9rem", fontWeight: "bold" }}>
            {item.name}
          </div>
          <div style={{ color: tierColor, fontFamily: "monospace", fontSize: "0.7rem" }}>
            T{item.tier}
          </div>
        </div>
      </div>

      <div style={{ color: "#88ccaa", fontFamily: "monospace", fontSize: "0.8rem" }}>
        {item.description}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {item.recipe.map(({ resourceId, qty }) => {
          const res = getResourceById(resourceId);
          const owned = player.resources[resourceId] ?? 0;
          const enough = owned >= qty;
          return (
            <div
              key={resourceId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "monospace",
                fontSize: "0.78rem",
                color: enough ? "#888" : "#883333",
              }}
            >
              <span>{res?.icon ?? "?"}</span>
              <span>{res?.name ?? resourceId}</span>
              <span style={{ marginLeft: "auto", color: enough ? "#66aa88" : "#cc4444" }}>
                {owned}/{qty}
              </span>
            </div>
          );
        })}
      </div>

      {owned ? (
        <div
          style={{
            marginTop: 4,
            padding: "8px 0",
            fontSize: "0.8rem",
            fontFamily: "sans-serif",
            color: "#556",
            textAlign: "center",
            fontStyle: "italic",
          }}
        >
          Déjà crafté
        </div>
      ) : (
        <button
          onClick={onCraft}
          disabled={!craftable}
          style={{
            marginTop: 4,
            padding: "8px 0",
            fontSize: "0.85rem",
            fontWeight: "bold",
            fontFamily: "sans-serif",
            color: craftable ? "#fff" : "#555",
            background: craftable ? "#1a3a2a" : "#0e0e1a",
            border: `2px solid ${craftable ? "#44aa66" : "#333"}`,
            borderRadius: 7,
            cursor: craftable ? "pointer" : "not-allowed",
            transition: "transform 0.1s",
          }}
          onMouseEnter={(e) => craftable && (e.currentTarget.style.transform = "scale(1.03)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          Crafter & Équiper
        </button>
      )}
    </div>
  );
}

export function Crafting({ player, onPlayerChange, onBack }: Props) {
  const handleCraft = (itemId: string) => {
    onPlayerChange(craftItem(player, itemId));
  };

  const hasResources = RESOURCES.some((r) => (player.resources[r.id] ?? 0) > 0);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a14",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 24px",
        gap: 32,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <h1 style={{ margin: "0 0 8px", color: "#eee", fontFamily: "sans-serif", fontSize: "2rem" }}>
          Atelier de craft
        </h1>
        <p style={{ margin: 0, color: "#555", fontFamily: "sans-serif", fontSize: "0.9rem" }}>
          Fabrique des équipements à partir de tes ressources
        </p>
      </div>

      {/* Stats summary */}
      <div style={{ width: "100%", maxWidth: 740 }}>
        <h2 style={{ color: "#888", fontFamily: "sans-serif", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>
          Stats
        </h2>
        <StatSummary player={player} />
      </div>

      {/* Resource inventory */}
      <div style={{ width: "100%", maxWidth: 740 }}>
        <h2 style={{ color: "#888", fontFamily: "sans-serif", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>
          Ressources disponibles
        </h2>
        {hasResources ? (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {RESOURCES.filter((r) => (player.resources[r.id] ?? 0) > 0).map((r) => (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 10px",
                  background: "#1a1a2e",
                  border: "1px solid #333",
                  borderRadius: 8,
                  fontFamily: "monospace",
                  fontSize: 12,
                  color: "#ccc",
                }}
              >
                <span style={{ fontSize: 16 }}>{r.icon}</span>
                <span>{r.name}</span>
                <span style={{ color: "#888", marginLeft: 4 }}>×{player.resources[r.id]}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#444", fontFamily: "sans-serif", fontSize: "0.85rem", margin: 0 }}>
            Aucune ressource. Complète des donjons pour en obtenir.
          </p>
        )}
      </div>

      {/* Slots */}
      {SLOT_ORDER.map((slot) => {
        const slotItems = ITEMS.filter((i) => i.slot === slot);
        return (
          <div key={slot} style={{ width: "100%", maxWidth: 740 }}>
            <h2
              style={{
                color: "#888",
                fontFamily: "sans-serif",
                fontSize: "0.9rem",
                textTransform: "uppercase",
                letterSpacing: 2,
                margin: "0 0 16px",
              }}
            >
              {SLOT_LABELS[slot]}
            </h2>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {slotItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  player={player}
                  onCraft={() => handleCraft(item.id)}
                />
              ))}
            </div>
          </div>
        );
      })}

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
