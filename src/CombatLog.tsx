import { useEffect, useRef } from "react";
import type { CombatEvent } from "./game/core/events";
import type { GameState } from "./game/core/gameState";

interface Props {
  state: GameState | null;
}

function formatEvent(event: CombatEvent, state: GameState): string | null {
  switch (event.type) {
    case "damage": {
      const attacker =
        event.attackerId === "player"
          ? "Joueur"
          : state.enemies.find((e) => e.id === event.attackerId)?.name ??
            event.attackerId;
      const target =
        event.targetId === "player"
          ? "Joueur"
          : state.enemies.find((e) => e.id === event.targetId)?.name ??
            event.targetId;
      return `${attacker} lance ${event.spell} → ${target} (-${event.damage} HP)`;
    }
    case "death": {
      const name =
        event.entityId === "player"
          ? "Joueur"
          : event.entityId;
      return `${name} est vaincu !`;
    }
    case "fightEnd":
      return event.result === "victory" ? "--- Victoire ! ---" : "--- Defaite... ---";
    case "info":
      return event.message;
    case "selfHarm":
      return `Sacrifice : −${event.amount} HP`;
    case "stacks": {
      const target =
        state.enemies.find((e) => e.id === event.targetId)?.name ?? event.targetId;
      if (event.action === "apply") {
        return `+${event.count} stacks ${event.element} sur ${target}`;
      }
      return `${target} : tick ${event.element} (${event.count} stacks consommés)`;
    }
    default:
      return null;
  }
}

export function CombatLog({ state }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state?.combatLog.length]);

  if (!state) return null;

  const messages = state.combatLog
    .map((event) => formatEvent(event, state))
    .filter((m): m is string => m !== null);

  return (
    <div
      ref={scrollRef}
      style={{
        position: "absolute",
        top: 8,
        left: 8,
        width: 280,
        maxHeight: 160,
        overflowY: "auto",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        borderRadius: 6,
        padding: "8px 10px",
        fontFamily: "monospace",
        fontSize: 11,
        color: "#ccc",
        pointerEvents: "auto",
        zIndex: 10,
      }}
    >
      {messages.length === 0 ? (
        <div style={{ color: "#666", fontStyle: "italic" }}>
          En attente de combat...
        </div>
      ) : (
        messages.map((msg, i) => (
          <div
            key={i}
            style={{
              marginBottom: 3,
              color: msg.includes("vaincu")
                ? "#ff6644"
                : msg.includes("Victoire")
                  ? "#44cc44"
                  : msg.includes("Defaite")
                    ? "#cc3333"
                    : "#ccc",
            }}
          >
            {msg}
          </div>
        ))
      )}
    </div>
  );
}
