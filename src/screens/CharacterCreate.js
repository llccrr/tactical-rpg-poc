import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { CLASSES } from "../game/data/classes";
function ClassCard({ cls, selected, onClick, }) {
    return (_jsxs("div", { onClick: onClick, style: {
            width: 300,
            padding: 24,
            borderRadius: 12,
            cursor: "pointer",
            background: selected ? "#1a1a2e" : "#12121f",
            border: `2px solid ${selected ? cls.color : "#333"}`,
            boxShadow: selected ? `0 0 20px ${cls.color}44` : "none",
            transition: "all 0.2s",
        }, children: [_jsx("h2", { style: {
                    margin: "0 0 8px",
                    color: cls.color,
                    fontSize: "1.4rem",
                    fontFamily: "sans-serif",
                }, children: cls.name }), _jsx("p", { style: {
                    margin: "0 0 16px",
                    color: "#999",
                    fontSize: "0.85rem",
                    lineHeight: 1.4,
                    fontFamily: "sans-serif",
                }, children: cls.description }), _jsxs("div", { style: {
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "6px 16px",
                    marginBottom: 16,
                    fontFamily: "monospace",
                    fontSize: 13,
                }, children: [_jsx(Stat, { label: "HP", value: cls.baseHp, color: "#cc4444" }), _jsx(Stat, { label: "ATK", value: cls.baseAttack, color: "#ee8833" }), _jsx(Stat, { label: "DEF", value: cls.baseDefense, color: "#4488ee" }), _jsx(Stat, { label: "PM", value: cls.basePm, color: "#44cc88" })] }), _jsxs("div", { style: { fontFamily: "monospace", fontSize: 12 }, children: [_jsx("div", { style: { color: "#888", marginBottom: 6, textTransform: "uppercase", fontSize: 10 }, children: "Sorts" }), cls.spells.map((spell, i) => (_jsxs("div", { style: {
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "4px 0",
                            borderBottom: "1px solid #222",
                            color: "#ccc",
                        }, children: [_jsx("span", { children: spell.name }), _jsxs("span", { style: { color: "#888" }, children: [spell.range, " PO | ", spell.cost, " PA | ", spell.baseDamage, " dmg"] })] }, i)))] })] }));
}
function Stat({ label, value, color }) {
    return (_jsxs("div", { style: { display: "flex", justifyContent: "space-between" }, children: [_jsx("span", { style: { color }, children: label }), _jsx("span", { style: { color: "#ccc" }, children: value })] }));
}
export function CharacterCreate({ onStart }) {
    const [selectedId, setSelectedId] = useState(null);
    return (_jsxs("div", { style: {
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#0a0a14",
            gap: 32,
        }, children: [_jsx("h1", { style: {
                    color: "#eee",
                    fontFamily: "sans-serif",
                    fontSize: "1.8rem",
                    margin: 0,
                }, children: "Choisis ta classe" }), _jsx("div", { style: { display: "flex", gap: 24 }, children: CLASSES.map((cls) => (_jsx(ClassCard, { cls: cls, selected: selectedId === cls.id, onClick: () => setSelectedId(cls.id) }, cls.id))) }), _jsx("button", { disabled: !selectedId, onClick: () => selectedId && onStart(selectedId), style: {
                    padding: "14px 40px",
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    fontFamily: "sans-serif",
                    color: "#fff",
                    background: selectedId ? "#cc8833" : "#333",
                    border: `2px solid ${selectedId ? "#eebb55" : "#555"}`,
                    borderRadius: 8,
                    cursor: selectedId ? "pointer" : "not-allowed",
                    transition: "all 0.2s",
                }, children: "Commencer" })] }));
}
