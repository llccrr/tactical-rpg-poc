import { DUNGEONS, type DungeonDef } from "../game/data/dungeons";
import { getResourceById, RESOURCES } from "../game/data/resources";
import { getItemById, type ItemSlot } from "../game/data/items";
import { getClassById } from "../game/data/classes";
import { getEquipmentBonuses, unequipSlot, equipItem, type PlayerState } from "../game/core/playerState";

interface Props {
  player: PlayerState;
  onPlayerChange: (player: PlayerState) => void;
  onStartDungeon: (dungeonId: string) => void;
  onOpenCraft: () => void;
  onChangeClass: () => void;
  onCheat: () => void;
}

const TIER_COLORS: Record<number, string> = {
  1: "#44aa88",
  2: "#ee8833",
  3: "#cc3333",
};

const SLOT_ORDER: { slot: ItemSlot; label: string; emptyIcon: string }[] = [
  { slot: "arme", label: "Arme", emptyIcon: "⚔️" },
  { slot: "armure", label: "Armure", emptyIcon: "🛡️" },
  { slot: "accessoire", label: "Accessoire", emptyIcon: "💍" },
];

/* ── Sidebar components ──────────────────────────────────── */

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h3
        style={{
          margin: 0,
          color: "#666",
          fontFamily: "sans-serif",
          fontSize: "0.7rem",
          textTransform: "uppercase",
          letterSpacing: 2,
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function EquipmentSlot({
  slot,
  label,
  emptyIcon,
  player,
  onUnequip,
}: {
  slot: ItemSlot;
  label: string;
  emptyIcon: string;
  player: PlayerState;
  onUnequip: () => void;
}) {
  const itemId = player.equipment[slot];
  const item = itemId ? getItemById(itemId) : undefined;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        background: item ? "#0e1e18" : "#0e0e18",
        border: `1px solid ${item ? "#33664a" : "#222233"}`,
        borderRadius: 8,
      }}
    >
      {/* Slot icon */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 6,
          background: item ? "#1a3a2a" : "#14141f",
          border: `2px solid ${item ? "#44aa66" : "#2a2a3a"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        {item ? item.icon : <span style={{ opacity: 0.3 }}>{emptyIcon}</span>}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "0.65rem",
            color: "#555",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {label}
        </div>
        {item ? (
          <>
            <div style={{ fontFamily: "sans-serif", fontSize: "0.82rem", color: "#ddd", fontWeight: 600 }}>
              {item.name}
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#88ccaa" }}>
              {item.description}
            </div>
          </>
        ) : (
          <div style={{ fontFamily: "sans-serif", fontSize: "0.8rem", color: "#444", fontStyle: "italic" }}>
            Vide
          </div>
        )}
      </div>

      {/* Unequip button */}
      {item && (
        <button
          onClick={onUnequip}
          title="Retirer"
          style={{
            width: 24,
            height: 24,
            borderRadius: 4,
            border: "1px solid #553333",
            background: "#1a1015",
            color: "#aa5555",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            padding: 0,
            lineHeight: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#2a1520";
            e.currentTarget.style.borderColor = "#aa4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#1a1015";
            e.currentTarget.style.borderColor = "#553333";
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

function StatBar({
  label,
  base,
  bonus,
  color,
}: {
  label: string;
  base: number;
  bonus: number;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "4px 0",
      }}
    >
      <span style={{ color, fontFamily: "monospace", fontSize: 12, fontWeight: 700, width: 32 }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "monospace", fontSize: 13 }}>
        <span style={{ color: "#888" }}>{base}</span>
        {bonus > 0 && <span style={{ color: "#44cc66", fontWeight: 700 }}>+{bonus}</span>}
        <span style={{ color: "#555" }}>=</span>
        <span style={{ color: "#eee", fontWeight: 700, minWidth: 20, textAlign: "right" }}>
          {base + bonus}
        </span>
      </div>
    </div>
  );
}

/* ── Dungeon card ────────────────────────────────────────── */

function DungeonCard({ dungeon, onStart }: { dungeon: DungeonDef; onStart: () => void }) {
  const tierColor = TIER_COLORS[dungeon.tier] ?? "#888";

  return (
    <div
      style={{
        width: 260,
        padding: 20,
        borderRadius: 12,
        background: "#12121f",
        border: "2px solid #333",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, color: "#eee", fontSize: "1.1rem", fontFamily: "sans-serif" }}>
          {dungeon.name}
        </h2>
        <span
          style={{
            fontSize: "0.75rem",
            fontFamily: "monospace",
            color: tierColor,
            border: `1px solid ${tierColor}`,
            borderRadius: 4,
            padding: "2px 6px",
          }}
        >
          T{dungeon.tier}
        </span>
      </div>
      <p style={{ margin: 0, color: "#777", fontSize: "0.8rem", fontFamily: "sans-serif", lineHeight: 1.4 }}>
        {dungeon.description}
      </p>
      <div style={{ fontFamily: "monospace", fontSize: 12, color: "#888" }}>
        {dungeon.rooms.length} salles · Boss en salle {dungeon.rooms.length}
      </div>
      <div style={{ fontFamily: "monospace", fontSize: 11, color: "#666" }}>
        Loot possible :{" "}
        {dungeon.lootTable.map((e) => getResourceById(e.resourceId)?.icon ?? "?").join(" ")}
      </div>
      <button
        onClick={onStart}
        style={{
          marginTop: 4,
          padding: "10px 0",
          fontSize: "0.95rem",
          fontWeight: "bold",
          fontFamily: "sans-serif",
          color: "#fff",
          background: "#1a3a2a",
          border: "2px solid #44aa66",
          borderRadius: 8,
          cursor: "pointer",
          transition: "transform 0.1s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        Entrer
      </button>
    </div>
  );
}

/* ── Hub ─────────────────────────────────────────────────── */

export function Hub({ player, onPlayerChange, onStartDungeon, onOpenCraft, onChangeClass, onCheat }: Props) {
  const hasResources = RESOURCES.some((r) => (player.resources[r.id] ?? 0) > 0);
  const equippedIds = new Set(Object.values(player.equipment));
  const unequippedItems = player.ownedItems
    .map((id) => getItemById(id))
    .filter((item) => item && !equippedIds.has(item.id));
  const hasEquipmentOrResources =
    Object.keys(player.equipment).length > 0 || hasResources || player.ownedItems.length > 0;

  const classDef = getClassById(player.classId);
  const bonuses = getEquipmentBonuses(player);

  const handleChangeClass = () => {
    if (hasEquipmentOrResources) {
      const confirmed = window.confirm(
        "Changer de classe va reinitialiser tes ressources et ton equipement. Continuer ?",
      );
      if (!confirmed) return;
    }
    onChangeClass();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a14",
        display: "flex",
        fontFamily: "sans-serif",
      }}
    >
      {/* ── LEFT SIDEBAR ─────────────────────────────────── */}
      <div
        style={{
          width: 300,
          flexShrink: 0,
          background: "#0c0c18",
          borderRight: "2px solid #1a1a2e",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          padding: "28px 18px",
          overflowY: "auto",
        }}
      >
        {/* Character header */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: "0 auto 10px",
              borderRadius: "50%",
              background: `${classDef?.color ?? "#888"}22`,
              border: `3px solid ${classDef?.color ?? "#888"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            {classDef?.id === "bretteur" ? "⚔️" : "🏹"}
          </div>
          <div style={{ color: classDef?.color ?? "#aaa", fontWeight: 700, fontSize: "1.1rem" }}>
            {classDef?.name ?? player.classId}
          </div>
          <div style={{ color: "#555", fontSize: "0.75rem", marginTop: 2 }}>
            {classDef?.description.slice(0, 60)}...
          </div>
        </div>

        {/* Separator */}
        <div style={{ height: 1, background: "#1a1a2e" }} />

        {/* Stats */}
        <SidebarSection title="Stats">
          <div
            style={{
              padding: "8px 10px",
              background: "#0e0e1a",
              border: "1px solid #1a1a2e",
              borderRadius: 8,
            }}
          >
            {classDef && (
              <>
                <StatBar label="PV" base={classDef.baseHp} bonus={bonuses.hp ?? 0} color="#dc2626" />
                <StatBar label="ATK" base={classDef.baseAttack} bonus={bonuses.attack ?? 0} color="#60a5fa" />
                <StatBar label="DEF" base={classDef.baseDefense} bonus={bonuses.defense ?? 0} color="#4ade80" />
                <StatBar label="PM" base={classDef.basePm} bonus={0} color="#c084fc" />
                <StatBar label="PA" base={classDef.basePa} bonus={0} color="#facc15" />
              </>
            )}
          </div>
        </SidebarSection>

        {/* Separator */}
        <div style={{ height: 1, background: "#1a1a2e" }} />

        {/* Equipment */}
        <SidebarSection title="Équipement">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {SLOT_ORDER.map(({ slot, label, emptyIcon }) => (
              <EquipmentSlot
                key={slot}
                slot={slot}
                label={label}
                emptyIcon={emptyIcon}
                player={player}
                onUnequip={() => onPlayerChange(unequipSlot(player, slot))}
              />
            ))}
          </div>
          <button
            onClick={onOpenCraft}
            style={{
              marginTop: 4,
              padding: "8px 0",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "#4488aa",
              background: "#0e1520",
              border: "1px solid #1a3a4a",
              borderRadius: 6,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#142030")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#0e1520")}
          >
            Atelier de craft
          </button>
        </SidebarSection>

        {/* Separator */}
        <div style={{ height: 1, background: "#1a1a2e" }} />

        {/* Owned items (inventory) */}
        <SidebarSection title="Inventaire">
          {unequippedItems.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {unequippedItems.map((item) => item && (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 8px",
                    background: "#0e0e1a",
                    border: "1px solid #1a1a2e",
                    borderRadius: 6,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "sans-serif", fontSize: "0.8rem", color: "#bbb" }}>
                      {item.name}
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: "0.65rem", color: "#667" }}>
                      {item.description}
                    </div>
                  </div>
                  <button
                    onClick={() => onPlayerChange(equipItem(player, item.id))}
                    style={{
                      padding: "3px 8px",
                      fontSize: "0.7rem",
                      fontFamily: "sans-serif",
                      fontWeight: 600,
                      color: "#44aa66",
                      background: "#0e1e18",
                      border: "1px solid #33664a",
                      borderRadius: 4,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#1a3a2a")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#0e1e18")}
                  >
                    Équiper
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#333", fontSize: "0.8rem", margin: 0, fontStyle: "italic" }}>
              {player.ownedItems.length > 0 ? "Tous les objets sont équipés" : "Aucun objet"}
            </p>
          )}
        </SidebarSection>

        {/* Separator */}
        <div style={{ height: 1, background: "#1a1a2e" }} />

        {/* Resources inventory */}
        <SidebarSection title="Ressources">
          {hasResources ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {RESOURCES.filter((r) => (player.resources[r.id] ?? 0) > 0).map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "4px 8px",
                    background: "#0e0e1a",
                    border: "1px solid #1a1a2e",
                    borderRadius: 6,
                    fontFamily: "monospace",
                    fontSize: 12,
                    color: "#bbb",
                  }}
                >
                  <span style={{ fontSize: 15 }}>{r.icon}</span>
                  <span style={{ flex: 1 }}>{r.name}</span>
                  <span style={{ color: "#666", fontWeight: 700 }}>×{player.resources[r.id]}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#333", fontSize: "0.8rem", margin: 0, fontStyle: "italic" }}>
              Aucune ressource
            </p>
          )}
        </SidebarSection>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Bottom actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button
            onClick={handleChangeClass}
            style={{
              padding: "8px 0",
              fontSize: "0.8rem",
              color: "#666",
              background: "transparent",
              border: "1px solid #2a2a3a",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Changer de classe
          </button>
          <button
            onClick={onCheat}
            style={{
              padding: "6px 0",
              fontSize: "0.75rem",
              color: "#884488",
              background: "transparent",
              border: "1px dashed #44224455",
              borderRadius: 6,
              cursor: "pointer",
              opacity: 0.5,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
          >
            +3 ressources (cheat)
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "40px 32px",
          gap: 40,
          overflowY: "auto",
        }}
      >
        {/* Title */}
        <div style={{ textAlign: "center" }}>
          <h1 style={{ margin: "0 0 6px", color: "#eee", fontSize: "1.8rem" }}>
            Donjons
          </h1>
          <p style={{ margin: 0, color: "#555", fontSize: "0.85rem" }}>
            Choisis un donjon et pars à l'aventure
          </p>
        </div>

        {/* Dungeon grid */}
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
          {DUNGEONS.map((d) => (
            <DungeonCard key={d.id} dungeon={d} onStart={() => onStartDungeon(d.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}
