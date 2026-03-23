import type { FightResult } from "./game/core/gameState";

interface Props {
  result: FightResult;
  onPrimary: () => void;
  primaryLabel: string;
  onSecondary: () => void;
  secondaryLabel: string;
}

export function FightResultOverlay({
  result,
  onPrimary,
  primaryLabel,
  onSecondary,
  secondaryLabel,
}: Props) {
  if (result === "ongoing") return null;

  const isVictory = result === "victory";

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        zIndex: 100,
      }}
    >
      <h1
        style={{
          fontSize: "3rem",
          fontWeight: "bold",
          color: isVictory ? "#44cc44" : "#cc3333",
          textShadow: `0 0 20px ${isVictory ? "#44cc44" : "#cc3333"}`,
          marginBottom: "1.5rem",
          fontFamily: "sans-serif",
        }}
      >
        {isVictory ? "Victoire !" : "Defaite..."}
      </h1>
      <div style={{ display: "flex", gap: 16 }}>
        <button
          onClick={onPrimary}
          style={{
            padding: "12px 32px",
            fontSize: "1.1rem",
            fontWeight: "bold",
            color: "#fff",
            backgroundColor: isVictory ? "#2a8a2a" : "#8a2a2a",
            border: "2px solid " + (isVictory ? "#44cc44" : "#cc3333"),
            borderRadius: "8px",
            cursor: "pointer",
            fontFamily: "sans-serif",
            transition: "transform 0.1s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {primaryLabel}
        </button>
        <button
          onClick={onSecondary}
          style={{
            padding: "12px 32px",
            fontSize: "1.1rem",
            fontWeight: "bold",
            color: "#fff",
            backgroundColor: "#333",
            border: "2px solid #888",
            borderRadius: "8px",
            cursor: "pointer",
            fontFamily: "sans-serif",
            transition: "transform 0.1s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {secondaryLabel}
        </button>
      </div>
    </div>
  );
}
