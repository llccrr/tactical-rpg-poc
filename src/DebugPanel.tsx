import type { GameState, EnemyState } from "./game/core/gameState";
import { ActionMode } from "./game/core/gameState";

interface DebugPanelProps {
  state: (GameState & { hoveredEnemy: number | null }) | null;
  onReset: () => void;
  onSelectSpell: (index: number) => void;
  onEndTurn: () => void;
}

export function DebugPanel({
  state,
  onReset,
  onSelectSpell,
  onEndTurn,
}: DebugPanelProps) {
  if (!state) return null;

  const { character } = state;
  const isPlayerTurn = state.currentTurn === "player";
  const hoveredEnemy: EnemyState | null =
    state.hoveredEnemy != null ? state.enemies[state.hoveredEnemy] : null;

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
      {/* Turn info */}
      <div
        style={{
          padding: "8px 12px",
          background: isPlayerTurn ? "#1a3a2a" : "#3a1a1a",
          border: `1px solid ${isPlayerTurn ? "#44cc88" : "#cc4444"}`,
          borderRadius: 4,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>
          Tour {state.turnNumber}
        </div>
        <strong style={{ color: isPlayerTurn ? "#44cc88" : "#cc4444" }}>
          {isPlayerTurn ? "Tour du joueur" : "Tour ennemi"}
        </strong>
      </div>

      <h3 style={{ margin: 0, color: "#ee5533" }}>Joueur</h3>

      <div>
        <strong>Position:</strong> ({character.pos.x}, {character.pos.y})
      </div>

      {/* PM / PA bars */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <strong style={{ color: "#44cc88" }}>PM</strong>
          <span>
            {state.remainingPM} / {character.moveRange}
          </span>
        </div>
        <div
          style={{
            height: 8,
            background: "#222",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${(state.remainingPM / character.moveRange) * 100}%`,
              height: "100%",
              background: "#44cc88",
              borderRadius: 4,
              transition: "width 0.2s",
            }}
          />
        </div>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <strong style={{ color: "#4488ee" }}>PA</strong>
          <span>
            {state.remainingPA} / {character.ap}
          </span>
        </div>
        <div
          style={{
            height: 8,
            background: "#222",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${(state.remainingPA / character.ap) * 100}%`,
              height: "100%",
              background: "#4488ee",
              borderRadius: 4,
              transition: "width 0.2s",
            }}
          />
        </div>
      </div>

      {/* Spell bar */}
      <h3 style={{ margin: "8px 0 0", color: "#4488ee" }}>Sorts</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {character.spells.map((spell, i) => {
          const isActive =
            state.actionMode === ActionMode.Targeting &&
            state.activeSpellIndex === i;
          const canAfford = state.remainingPA >= spell.cost;
          const disabled = !isPlayerTurn || !canAfford;
          return (
            <button
              key={i}
              onClick={() => onSelectSpell(i)}
              disabled={disabled}
              style={{
                padding: "8px 12px",
                background: isActive ? "#4488ee" : disabled ? "#222" : "#333",
                color: disabled ? "#666" : "#fff",
                border: isActive ? "1px solid #66aaff" : "1px solid #555",
                borderRadius: 4,
                cursor: disabled ? "not-allowed" : "pointer",
                fontFamily: "monospace",
                textAlign: "left",
              }}
            >
              {spell.name} ({spell.range} PO) — {spell.cost} PA
            </button>
          );
        })}
      </div>

      {/* End Turn button */}
      <button
        onClick={onEndTurn}
        disabled={!isPlayerTurn}
        style={{
          padding: "10px 12px",
          background: isPlayerTurn ? "#cc8833" : "#222",
          color: isPlayerTurn ? "#fff" : "#666",
          border: `1px solid ${isPlayerTurn ? "#eebb55" : "#555"}`,
          borderRadius: 4,
          cursor: isPlayerTurn ? "pointer" : "not-allowed",
          fontFamily: "monospace",
          fontWeight: "bold",
          fontSize: 14,
        }}
      >
        Fin du tour
      </button>

      {/* Enemy info on hover */}
      {hoveredEnemy && (
        <>
          <h3 style={{ margin: "8px 0 0", color: "#5566ee" }}>Ennemi</h3>
          <div>
            <strong>Position:</strong> ({hoveredEnemy.pos.x},{" "}
            {hoveredEnemy.pos.y})
          </div>
          <div>
            <strong>HP:</strong> {hoveredEnemy.hp} / {hoveredEnemy.maxHp}
          </div>
          <div>
            <strong>ATK:</strong> {hoveredEnemy.attack}{" "}
            <strong>DEF:</strong> {hoveredEnemy.defense}
          </div>
          <div>
            <strong>PM:</strong> {hoveredEnemy.moveRange}{" "}
            <strong>PA:</strong> {hoveredEnemy.ap}
          </div>
        </>
      )}

      <button
        onClick={onReset}
        style={{
          marginTop: "auto",
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
