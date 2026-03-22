import type { GameState } from "./game/core/gameState";
import { ActionMode } from "./game/core/gameState";

interface DebugPanelProps {
  state: GameState | null;
  onReset: () => void;
  onSelectSpell: (index: number) => void;
}

export function DebugPanel({ state, onReset, onSelectSpell }: DebugPanelProps) {
  if (!state) return null;

  const { character } = state;

  return (
    <div
      style={{
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
      }}
    >
      <h3 style={{ margin: 0, color: "#ee5533" }}>Debug</h3>

      <div>
        <strong>Position:</strong> ({character.pos.x}, {character.pos.y})
      </div>

      <div>
        <strong>Move range:</strong> {character.moveRange}
      </div>

      <div>
        <strong>Mode:</strong> {state.actionMode}
      </div>

      {/* Spell bar */}
      <h3 style={{ margin: "8px 0 0", color: "#4488ee" }}>Sorts</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {character.spells.map((spell, i) => {
          const isActive =
            state.actionMode === ActionMode.Targeting &&
            state.activeSpellIndex === i;
          return (
            <button
              key={i}
              onClick={() => onSelectSpell(i)}
              style={{
                padding: "8px 12px",
                background: isActive ? "#4488ee" : "#333",
                color: "#fff",
                border: isActive ? "1px solid #66aaff" : "1px solid #555",
                borderRadius: 4,
                cursor: "pointer",
                fontFamily: "monospace",
                textAlign: "left",
              }}
            >
              {spell.name} ({spell.range} PO)
            </button>
          );
        })}
      </div>

      <button
        onClick={onReset}
        style={{
          marginTop: 16,
          padding: "8px 12px",
          background: "#333",
          color: "#fff",
          border: "1px solid #555",
          borderRadius: 4,
          cursor: "pointer",
          fontFamily: "monospace",
        }}
      >
        Reset Board
      </button>
    </div>
  );
}
