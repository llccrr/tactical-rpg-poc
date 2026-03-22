import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
function formatEvent(event, state) {
    switch (event.type) {
        case "damage": {
            const attacker = event.attackerId === "player"
                ? "Joueur"
                : state.enemies.find((e) => e.id === event.attackerId)?.name ??
                    event.attackerId;
            const target = event.targetId === "player"
                ? "Joueur"
                : state.enemies.find((e) => e.id === event.targetId)?.name ??
                    event.targetId;
            return `${attacker} lance ${event.spell} → ${target} (-${event.damage} HP)`;
        }
        case "death": {
            const name = event.entityId === "player"
                ? "Joueur"
                : event.entityId;
            return `${name} est vaincu !`;
        }
        case "fightEnd":
            return event.result === "victory" ? "--- Victoire ! ---" : "--- Defaite... ---";
        default:
            return null;
    }
}
export function CombatLog({ state }) {
    const scrollRef = useRef(null);
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [state?.combatLog.length]);
    if (!state)
        return null;
    const messages = state.combatLog
        .map((event) => formatEvent(event, state))
        .filter((m) => m !== null);
    return (_jsx("div", { ref: scrollRef, style: {
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
        }, children: messages.length === 0 ? (_jsx("div", { style: { color: "#666", fontStyle: "italic" }, children: "En attente de combat..." })) : (messages.map((msg, i) => (_jsx("div", { style: {
                marginBottom: 3,
                color: msg.includes("vaincu")
                    ? "#ff6644"
                    : msg.includes("Victoire")
                        ? "#44cc44"
                        : msg.includes("Defaite")
                            ? "#cc3333"
                            : "#ccc",
            }, children: msg }, i)))) }));
}
