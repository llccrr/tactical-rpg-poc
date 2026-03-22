import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { ActionMode } from "./game/core/gameState";
export function DebugPanel({ state, onReset, onSelectSpell, onEndTurn, }) {
    if (!state)
        return null;
    const { character } = state;
    const isPlayerTurn = state.currentTurn === "player";
    const hoveredEnemy = state.hoveredEnemyId != null
        ? state.enemies.find((e) => e.id === state.hoveredEnemyId) ?? null
        : null;
    return (_jsxs("div", { style: {
            width: 220,
            padding: 16,
            background: "#0e0e1a",
            color: "#ccc",
            fontFamily: "monospace",
            fontSize: 13,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            borderLeft: "1px solid #333",
        }, children: [_jsxs("div", { style: {
                    padding: "8px 12px",
                    background: isPlayerTurn ? "#1a3a2a" : "#3a1a1a",
                    border: `1px solid ${isPlayerTurn ? "#44cc88" : "#cc4444"}`,
                    borderRadius: 4,
                    textAlign: "center",
                }, children: [_jsxs("div", { style: { fontSize: 11, color: "#888", marginBottom: 2 }, children: ["Tour ", state.turnNumber] }), _jsx("strong", { style: { color: isPlayerTurn ? "#44cc88" : "#cc4444" }, children: isPlayerTurn ? "Tour du joueur" : "Tour ennemi" })] }), _jsx("h3", { style: { margin: 0, color: "#ee5533" }, children: "Joueur" }), _jsxs("div", { children: [_jsx("strong", { children: "Position:" }), " (", character.pos.x, ", ", character.pos.y, ")"] }), _jsxs("div", { children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 4 }, children: [_jsx("strong", { style: { color: "#44cc88" }, children: "PM" }), _jsxs("span", { children: [state.remainingPM, " / ", character.moveRange] })] }), _jsx("div", { style: {
                            height: 8,
                            background: "#222",
                            borderRadius: 4,
                            overflow: "hidden",
                        }, children: _jsx("div", { style: {
                                width: `${(state.remainingPM / character.moveRange) * 100}%`,
                                height: "100%",
                                background: "#44cc88",
                                borderRadius: 4,
                                transition: "width 0.2s",
                            } }) })] }), _jsxs("div", { children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", marginBottom: 4 }, children: [_jsx("strong", { style: { color: "#4488ee" }, children: "PA" }), _jsxs("span", { children: [state.remainingPA, " / ", character.ap] })] }), _jsx("div", { style: {
                            height: 8,
                            background: "#222",
                            borderRadius: 4,
                            overflow: "hidden",
                        }, children: _jsx("div", { style: {
                                width: `${(state.remainingPA / character.ap) * 100}%`,
                                height: "100%",
                                background: "#4488ee",
                                borderRadius: 4,
                                transition: "width 0.2s",
                            } }) })] }), _jsx("h3", { style: { margin: "8px 0 0", color: "#4488ee" }, children: "Sorts" }), _jsx("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: character.spells.map((spell, i) => {
                    const isActive = state.actionMode === ActionMode.Targeting &&
                        state.activeSpellIndex === i;
                    const canAfford = state.remainingPA >= spell.cost;
                    const disabled = !isPlayerTurn || !canAfford;
                    return (_jsxs("button", { onClick: () => onSelectSpell(i), disabled: disabled, style: {
                            padding: "8px 12px",
                            background: isActive ? "#4488ee" : disabled ? "#222" : "#333",
                            color: disabled ? "#666" : "#fff",
                            border: isActive ? "1px solid #66aaff" : "1px solid #555",
                            borderRadius: 4,
                            cursor: disabled ? "not-allowed" : "pointer",
                            fontFamily: "monospace",
                            textAlign: "left",
                        }, children: [spell.name, " (", spell.range, " PO) \u2014 ", spell.cost, " PA"] }, i));
                }) }), _jsx("button", { onClick: onEndTurn, disabled: !isPlayerTurn, style: {
                    padding: "10px 12px",
                    background: isPlayerTurn ? "#cc8833" : "#222",
                    color: isPlayerTurn ? "#fff" : "#666",
                    border: `1px solid ${isPlayerTurn ? "#eebb55" : "#555"}`,
                    borderRadius: 4,
                    cursor: isPlayerTurn ? "pointer" : "not-allowed",
                    fontFamily: "monospace",
                    fontWeight: "bold",
                    fontSize: 14,
                }, children: "Fin du tour" }), hoveredEnemy && (_jsxs(_Fragment, { children: [_jsx("h3", { style: { margin: "8px 0 0", color: "#5566ee" }, children: hoveredEnemy.name }), _jsxs("div", { children: [_jsx("strong", { children: "Position:" }), " (", hoveredEnemy.pos.x, ",", " ", hoveredEnemy.pos.y, ")"] }), _jsxs("div", { children: [_jsx("strong", { children: "HP:" }), " ", hoveredEnemy.hp, " / ", hoveredEnemy.maxHp] }), _jsxs("div", { children: [_jsx("strong", { children: "ATK:" }), " ", hoveredEnemy.attack, " ", _jsx("strong", { children: "DEF:" }), " ", hoveredEnemy.defense] }), _jsxs("div", { children: [_jsx("strong", { children: "PM:" }), " ", hoveredEnemy.moveRange, " ", _jsx("strong", { children: "PA:" }), " ", hoveredEnemy.ap] })] })), _jsx("button", { onClick: onReset, style: {
                    marginTop: "auto",
                    padding: "8px 12px",
                    background: "#333",
                    color: "#fff",
                    border: "1px solid #555",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontFamily: "monospace",
                }, children: "Reset Board" })] }));
}
