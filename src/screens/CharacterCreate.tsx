import { useState } from "react";
import { CLASSES, type ClassDefinition } from "../game/data/classes";

interface Props {
  onStart: (classId: string) => void;
}

function ClassCard({
  cls,
  selected,
  onClick,
}: {
  cls: ClassDefinition;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 300,
        padding: 24,
        borderRadius: 12,
        cursor: "pointer",
        background: selected ? "#1a1a2e" : "#12121f",
        border: `2px solid ${selected ? cls.color : "#333"}`,
        boxShadow: selected ? `0 0 20px ${cls.color}44` : "none",
        transition: "all 0.2s",
      }}
    >
      <h2
        style={{
          margin: "0 0 8px",
          color: cls.color,
          fontSize: "1.4rem",
          fontFamily: "sans-serif",
        }}
      >
        {cls.name}
      </h2>
      <p
        style={{
          margin: "0 0 16px",
          color: "#999",
          fontSize: "0.85rem",
          lineHeight: 1.4,
          fontFamily: "sans-serif",
        }}
      >
        {cls.description}
      </p>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "6px 16px",
          marginBottom: 16,
          fontFamily: "monospace",
          fontSize: 13,
        }}
      >
        <Stat label="HP" value={cls.baseHp} color="#cc4444" />
        <Stat label="ATK" value={cls.baseAttack} color="#ee8833" />
        <Stat label="DEF" value={cls.baseDefense} color="#4488ee" />
        <Stat label="PM" value={cls.basePm} color="#44cc88" />
      </div>

      {/* Spells */}
      <div style={{ fontFamily: "monospace", fontSize: 12 }}>
        <div
          style={{ color: "#888", marginBottom: 6, textTransform: "uppercase", fontSize: 10 }}
        >
          Sorts
        </div>
        {cls.spells.map((spell, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "4px 0",
              borderBottom: "1px solid #222",
              color: "#ccc",
            }}
          >
            <span>{spell.name}</span>
            <span style={{ color: "#888" }}>
              {spell.range} PO | {spell.cost} PA | {spell.baseDamage} dmg
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ color }}>{label}</span>
      <span style={{ color: "#ccc" }}>{value}</span>
    </div>
  );
}

export function CharacterCreate({ onStart }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a14",
        gap: 32,
      }}
    >
      <h1
        style={{
          color: "#eee",
          fontFamily: "sans-serif",
          fontSize: "1.8rem",
          margin: 0,
        }}
      >
        Choisis ta classe
      </h1>

      <div style={{ display: "flex", gap: 24 }}>
        {CLASSES.map((cls) => (
          <ClassCard
            key={cls.id}
            cls={cls}
            selected={selectedId === cls.id}
            onClick={() => setSelectedId(cls.id)}
          />
        ))}
      </div>

      <button
        disabled={!selectedId}
        onClick={() => selectedId && onStart(selectedId)}
        style={{
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
        }}
      >
        Commencer
      </button>
    </div>
  );
}
