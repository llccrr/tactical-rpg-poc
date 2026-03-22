import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ActionMode } from "./game/core/gameState";
/* ── Small SVG icons ─────────────────────────────── */
function StarIcon() {
    return (_jsx("svg", { viewBox: "0 0 24 24", width: "14", height: "14", fill: "#60a5fa", children: _jsx("path", { d: "M12 2l2.9 6.3L22 9.2l-5 4.6L18.2 21 12 17.3 5.8 21 7 13.8 2 9.2l7.1-.9z" }) }));
}
function BootIcon() {
    return (_jsx("svg", { viewBox: "0 0 24 24", width: "14", height: "14", fill: "#4ade80", children: _jsx("path", { d: "M2 22l1-4h4l1-2h4l1-4h4l2-2V4l-4 2-1 4h-4l-1 2H5L4 14H2z" }) }));
}
/* ── HP bar ───────────────────────────────────────── */
function HPBar({ value, max }) {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    const barColor = pct > 50 ? "#dc2626" : pct > 25 ? "#ea580c" : "#b91c1c";
    return (_jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, minWidth: 140 }, children: [_jsx("svg", { viewBox: "0 0 24 24", width: "18", height: "18", fill: "#dc2626", style: { flexShrink: 0 }, children: _jsx("path", { d: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" }) }), _jsxs("div", { style: { flex: 1 }, children: [_jsxs("div", { style: {
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 11,
                            fontWeight: 700,
                            color: "#e8e8e8",
                            marginBottom: 3,
                            fontFamily: "monospace",
                        }, children: [_jsx("span", { children: value }), _jsx("span", { style: { color: "#666" }, children: max })] }), _jsx("div", { style: {
                            height: 6,
                            background: "#1a1a2e",
                            borderRadius: 3,
                            border: "1px solid #2a2a3e",
                            overflow: "hidden",
                        }, children: _jsx("div", { style: {
                                width: `${pct}%`,
                                height: "100%",
                                background: barColor,
                                borderRadius: 3,
                                transition: "width 0.3s ease",
                                boxShadow: `0 0 6px ${barColor}44`,
                            } }) })] })] }));
}
/* ── Point counter (PA / PM) ─────────────────────── */
function PointCounter({ icon, value, max, color, bgColor, }) {
    return (_jsxs("div", { style: {
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 8px 3px 6px",
            background: bgColor,
            borderRadius: 4,
            border: `1px solid ${color}33`,
        }, children: [icon, _jsx("span", { style: {
                    fontSize: 14,
                    fontWeight: 800,
                    color,
                    fontFamily: "monospace",
                    lineHeight: 1,
                }, children: value }), _jsxs("span", { style: {
                    fontSize: 10,
                    color: "#555",
                    fontWeight: 600,
                    fontFamily: "monospace",
                    lineHeight: 1,
                }, children: ["/", max] })] }));
}
/* ── Spell slot ──────────────────────────────────── */
function SpellSlot({ spell, index, isActive, canAfford, disabled, onSelect, }) {
    return (_jsxs("button", { onClick: onSelect, disabled: disabled, title: `${spell.name} — ${spell.cost} PA — ${spell.range} PO`, style: {
            width: 48,
            height: 48,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            background: isActive
                ? "#1a2a4a"
                : disabled
                    ? "#15151f"
                    : "#1e1e2e",
            border: isActive
                ? "2px solid #60a5fa"
                : "2px solid #2a2a3e",
            borderRadius: 6,
            cursor: disabled ? "default" : "pointer",
            outline: "none",
            padding: 0,
            boxShadow: isActive
                ? "0 0 8px #60a5fa44, inset 0 0 12px #60a5fa22"
                : "inset 0 2px 4px rgba(0,0,0,0.4)",
            transition: "border-color 0.15s, box-shadow 0.15s",
            color: disabled ? "#444" : "#ddd",
            fontFamily: "monospace",
        }, children: [_jsx("span", { style: { fontSize: 18, fontWeight: 800, lineHeight: 1 }, children: spell.name.charAt(0) }), _jsxs("span", { style: { fontSize: 8, opacity: 0.5, lineHeight: 1 }, children: [spell.range, "PO"] }), _jsx("div", { style: {
                    position: "absolute",
                    top: -6,
                    right: -6,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 3,
                    background: canAfford ? "#2563eb" : "#333",
                    color: canAfford ? "#fff" : "#666",
                    fontSize: 10,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 3px",
                    border: "2px solid #0c0c14",
                }, children: spell.cost })] }));
}
/* ── Main HUD ────────────────────────────────────── */
export function GameHUD({ state, onSelectSpell, onEndTurn }) {
    if (!state)
        return null;
    const { character } = state;
    const isPlayerTurn = state.currentTurn === "player";
    return (_jsx("div", { style: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
        }, children: _jsxs("div", { style: {
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 16px",
                background: "linear-gradient(to top, #0c0c14 0%, #14141f 100%)",
                borderTop: "2px solid #2a2a3e",
                borderLeft: "1px solid #2a2a3e",
                borderRight: "1px solid #2a2a3e",
                borderRadius: "10px 10px 0 0",
                pointerEvents: "auto",
                boxShadow: "0 -4px 20px rgba(0,0,0,0.5)",
            }, children: [_jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: [_jsx(HPBar, { value: character.hp, max: character.maxHp }), _jsxs("div", { style: { display: "flex", gap: 6 }, children: [_jsx(PointCounter, { icon: _jsx(StarIcon, {}), value: state.remainingPA, max: character.ap, color: "#60a5fa", bgColor: "#60a5fa11" }), _jsx(PointCounter, { icon: _jsx(BootIcon, {}), value: state.remainingPM, max: character.moveRange, color: "#4ade80", bgColor: "#4ade8011" })] })] }), _jsx("div", { style: {
                        width: 2,
                        alignSelf: "stretch",
                        background: "linear-gradient(to bottom, transparent, #2a2a3e, transparent)",
                        margin: "0 2px",
                    } }), _jsx("div", { style: { display: "flex", gap: 4, alignItems: "center" }, children: character.spells.map((spell, i) => {
                        const isActive = state.actionMode === ActionMode.Targeting &&
                            state.activeSpellIndex === i;
                        const canAfford = state.remainingPA >= spell.cost;
                        const disabled = !isPlayerTurn || !canAfford;
                        return (_jsx(SpellSlot, { spell: spell, index: i, isActive: isActive, canAfford: canAfford, disabled: disabled, onSelect: () => onSelectSpell(i) }, i));
                    }) }), _jsx("div", { style: {
                        width: 2,
                        alignSelf: "stretch",
                        background: "linear-gradient(to bottom, transparent, #2a2a3e, transparent)",
                        margin: "0 2px",
                    } }), _jsx("button", { onClick: onEndTurn, disabled: !isPlayerTurn, style: {
                        height: 48,
                        padding: "0 16px",
                        background: isPlayerTurn
                            ? "linear-gradient(to bottom, #b45309, #92400e)"
                            : "#1a1a24",
                        color: isPlayerTurn ? "#fde68a" : "#444",
                        border: isPlayerTurn
                            ? "2px solid #d97706"
                            : "2px solid #2a2a3e",
                        borderRadius: 6,
                        cursor: isPlayerTurn ? "pointer" : "default",
                        fontFamily: "monospace",
                        fontWeight: 800,
                        fontSize: 11,
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                        outline: "none",
                        boxShadow: isPlayerTurn
                            ? "0 0 12px #b4530944, inset 0 1px 0 #fbbf2444"
                            : "inset 0 2px 4px rgba(0,0,0,0.4)",
                        transition: "all 0.15s",
                        whiteSpace: "nowrap",
                    }, children: "Fin du tour" }), _jsxs("div", { style: {
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                    }, children: [_jsx("div", { style: {
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: isPlayerTurn ? "#4ade80" : "#ef4444",
                                boxShadow: `0 0 6px ${isPlayerTurn ? "#4ade80" : "#ef4444"}`,
                            } }), _jsx("span", { style: {
                                fontSize: 10,
                                color: "#555",
                                fontWeight: 700,
                                fontFamily: "monospace",
                            }, children: state.turnNumber })] })] }) }));
}
