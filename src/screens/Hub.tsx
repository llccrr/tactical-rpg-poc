import { DUNGEONS, type DungeonDef } from "../game/data/dungeons";
import { getResourceById, RESOURCES } from "../game/data/resources";
import type { PlayerState } from "../game/core/playerState";

interface Props {
  player: PlayerState;
  onStartDungeon: (dungeonId: string) => void;
  onChangeClass: () => void;
}

const TIER_COLORS: Record<number, string> = {
  1: "#44aa88",
  2: "#ee8833",
  3: "#cc3333",
};

function DungeonCard({
  dungeon,
  onStart,
}: {
  dungeon: DungeonDef;
  onStart: () => void;
}) {
  const tierColor = TIER_COLORS[dungeon.tier] ?? "#888";

  return (
    <div
      style={{
        width: 260,
        padding: 20,
        borderRadius: 12,
        background: "#12121f",
        border: `2px solid #333`,
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

export function Hub({ player, onStartDungeon, onChangeClass }: Props) {
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
        gap: 40,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <h1 style={{ margin: "0 0 8px", color: "#eee", fontFamily: "sans-serif", fontSize: "2rem" }}>
          Hub
        </h1>
        <p style={{ margin: 0, color: "#555", fontFamily: "sans-serif", fontSize: "0.9rem" }}>
          Classe :{" "}
          <span style={{ color: "#aaa", textTransform: "capitalize" }}>{player.classId}</span>
        </p>
      </div>

      {/* Dungeon list */}
      <div>
        <h2 style={{ color: "#888", fontFamily: "sans-serif", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: 2, margin: "0 0 16px" }}>
          Donjons
        </h2>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
          {DUNGEONS.map((d) => (
            <DungeonCard key={d.id} dungeon={d} onStart={() => onStartDungeon(d.id)} />
          ))}
        </div>
      </div>

      {/* Resource inventory */}
      <div style={{ width: "100%", maxWidth: 820 }}>
        <h2 style={{ color: "#888", fontFamily: "sans-serif", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px" }}>
          Inventaire
        </h2>
        {hasResources ? (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {RESOURCES.filter((r) => (player.resources[r.id] ?? 0) > 0).map((r) => (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: "#1a1a2e",
                  border: "1px solid #333",
                  borderRadius: 8,
                  fontFamily: "monospace",
                  fontSize: 13,
                  color: "#ccc",
                }}
              >
                <span style={{ fontSize: 18 }}>{r.icon}</span>
                <span>{r.name}</span>
                <span style={{ color: "#888", marginLeft: 4 }}>×{player.resources[r.id]}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#444", fontFamily: "sans-serif", fontSize: "0.85rem", margin: 0 }}>
            Aucune ressource pour l'instant. Complète un donjon pour en obtenir.
          </p>
        )}
      </div>

      {/* Footer */}
      <button
        onClick={onChangeClass}
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
        Changer de classe
      </button>
    </div>
  );
}
