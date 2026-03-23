import { getResourceById } from "../game/data/resources";
import { getDungeonById } from "../game/data/dungeons";

interface Props {
  dungeonId: string;
  success: boolean;
  /** resourceId looted, only set on success */
  lootedResourceId?: string;
  onBackToHub: () => void;
  onGoToCraft: () => void;
}

export function DungeonEnd({ dungeonId, success, lootedResourceId, onBackToHub, onGoToCraft }: Props) {
  const dungeon = getDungeonById(dungeonId);
  const resource = lootedResourceId ? getResourceById(lootedResourceId) : undefined;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a14",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
        fontFamily: "sans-serif",
      }}
    >
      <h1
        style={{
          fontSize: "2.8rem",
          fontWeight: "bold",
          color: success ? "#44cc44" : "#cc3333",
          textShadow: `0 0 20px ${success ? "#44cc44" : "#cc3333"}`,
          margin: 0,
        }}
      >
        {success ? "Donjon termine !" : "Defaite..."}
      </h1>

      <p style={{ color: "#888", margin: 0, fontSize: "1rem" }}>
        {dungeon?.name ?? dungeonId}
      </p>

      {success && resource && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            padding: "24px 40px",
            background: "#1a1a2e",
            border: "2px solid #44aa66",
            borderRadius: 16,
          }}
        >
          <p style={{ margin: 0, color: "#888", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: 2 }}>
            Ressource obtenue
          </p>
          <span style={{ fontSize: "3rem" }}>{resource.icon}</span>
          <p style={{ margin: 0, color: "#eee", fontSize: "1.2rem", fontWeight: "bold" }}>
            {resource.name}
          </p>
        </div>
      )}

      {!success && (
        <p style={{ color: "#666", margin: 0, fontSize: "0.9rem" }}>
          Aucune ressource obtenue. Retente le donjon pour reussir.
        </p>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        {success && (
          <button
            onClick={onGoToCraft}
            style={{
              padding: "14px 40px",
              fontSize: "1.1rem",
              fontWeight: "bold",
              color: "#fff",
              background: "#1a2a3a",
              border: "2px solid #4488bb",
              borderRadius: 8,
              cursor: "pointer",
              transition: "transform 0.1s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Aller crafter
          </button>
        )}
        <button
          onClick={onBackToHub}
          style={{
            padding: "14px 40px",
            fontSize: "1.1rem",
            fontWeight: "bold",
            color: success ? "#888" : "#fff",
            background: success ? "transparent" : "#1a2a3a",
            border: success ? "2px solid #444" : "2px solid #4488bb",
            borderRadius: 8,
            cursor: "pointer",
            transition: "transform 0.1s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          Retour au Hub
        </button>
      </div>
    </div>
  );
}
