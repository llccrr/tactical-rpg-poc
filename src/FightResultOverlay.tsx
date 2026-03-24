import { useEffect, useState } from "react";
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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (result !== "ongoing") {
      const timer = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(timer);
    }
    setVisible(false);
  }, [result]);

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
        backgroundColor: visible ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0)",
        transition: "background-color 0.4s ease",
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
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(0.8)",
          transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {isVictory ? "Victoire !" : "Defaite..."}
      </h1>
      <div
        style={{
          display: "flex",
          gap: 16,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(15px)",
          transition: "all 0.4s ease 0.2s",
        }}
      >
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
