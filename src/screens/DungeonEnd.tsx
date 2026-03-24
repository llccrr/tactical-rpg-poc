import { useEffect, useState } from "react";
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

  // Staged reveal animation
  const [showTitle, setShowTitle] = useState(false);
  const [showLoot, setShowLoot] = useState(false);
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowTitle(true), 100);
    const t2 = setTimeout(() => setShowLoot(true), 600);
    const t3 = setTimeout(() => setShowButtons(true), 1100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

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
      {/* Title */}
      <div
        style={{
          opacity: showTitle ? 1 : 0,
          transform: showTitle ? "translateY(0) scale(1)" : "translateY(-20px) scale(0.9)",
          transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <h1
          style={{
            fontSize: "2.8rem",
            fontWeight: "bold",
            color: success ? "#44cc44" : "#cc3333",
            textShadow: `0 0 30px ${success ? "#44cc4466" : "#cc333366"}`,
            margin: 0,
            textAlign: "center",
          }}
        >
          {success ? "Donjon termine !" : "Defaite..."}
        </h1>
        <p style={{ color: "#888", margin: "8px 0 0", fontSize: "1rem", textAlign: "center" }}>
          {dungeon?.name ?? dungeonId}
        </p>
      </div>

      {/* Loot reveal */}
      {success && resource && (
        <div
          style={{
            opacity: showLoot ? 1 : 0,
            transform: showLoot ? "translateY(0) scale(1)" : "translateY(20px) scale(0.8)",
            transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            padding: "28px 48px",
            background: "linear-gradient(135deg, #1a1a2e, #0e1e18)",
            border: "2px solid #44aa66",
            borderRadius: 16,
            boxShadow: showLoot ? "0 0 40px #44aa6633" : "none",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#888",
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: 3,
            }}
          >
            Ressource obtenue
          </p>
          <div
            style={{
              fontSize: "4rem",
              animation: showLoot ? "loot-bounce 0.6s ease-out" : "none",
            }}
          >
            {resource.icon}
          </div>
          <p
            style={{
              margin: 0,
              color: "#eee",
              fontSize: "1.3rem",
              fontWeight: "bold",
            }}
          >
            {resource.name}
          </p>
        </div>
      )}

      {!success && (
        <div
          style={{
            opacity: showLoot ? 1 : 0,
            transition: "opacity 0.5s ease",
          }}
        >
          <p style={{ color: "#666", margin: 0, fontSize: "0.9rem" }}>
            Aucune ressource obtenue. Retente le donjon pour reussir.
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div
        style={{
          display: "flex",
          gap: 12,
          opacity: showButtons ? 1 : 0,
          transform: showButtons ? "translateY(0)" : "translateY(10px)",
          transition: "all 0.4s ease",
        }}
      >
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

      {/* CSS animation for loot bounce */}
      <style>{`
        @keyframes loot-bounce {
          0% { transform: scale(0.3) rotate(-10deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(5deg); }
          70% { transform: scale(0.95) rotate(-2deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
