import type { GameState, EnemyState } from "./game/core/gameState";
import { ActionMode } from "./game/core/gameState";
import {
  ELEMENTS,
  ELEMENT_COLORS,
  ELEMENT_ICONS,
  ELEMENT_LABELS,
  type Element,
} from "./game/data/elements";

interface DebugPanelProps {
  state: GameState | null;
  onReset: () => void;
  onSelectSpell: (index: number) => void;
  onEndTurn: () => void;
  onWinFight: () => void;
  onLoseFight: () => void;
}

export function DebugPanel({
  state,
  onReset,
  onSelectSpell,
  onEndTurn,
  onWinFight,
  onLoseFight,
}: DebugPanelProps) {
  if (!state) {
    return (
      <div
        style={{
          width: 220,
          flexShrink: 0,
          padding: 16,
          background: "#0e0e1a",
          borderLeft: "1px solid #333",
        }}
      />
    );
  }

  const { character } = state;
  const isPlayerTurn = state.currentTurn === "player";
  const hoveredEnemy: EnemyState | null =
    state.hoveredEnemyId != null
      ? state.enemies.find((e) => e.id === state.hoveredEnemyId) ?? null
      : null;

  return (
    <div
      style={{
        width: 220,
        flexShrink: 0,
        padding: 16,
        background: "#0e0e1a",
        color: "#ccc",
        fontFamily: "monospace",
        fontSize: 13,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        borderLeft: "1px solid #333",
        overflowY: "auto",
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

      {/* Ressources (spec Edouard) */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
        <div>
          <strong style={{ color: "#4488ee" }}>PA</strong> {state.remainingPA}
          <span style={{ color: "#666" }}> (+{character.ap}/tour)</span>
        </div>
        <div>
          <strong style={{ color: "#c084fc" }}>PF</strong> {state.remainingPF}
          <span style={{ color: "#666" }}> (+{character.pf}/tour)</span>
        </div>
        <div>
          <strong style={{ color: "#facc15" }}>PM</strong> {state.remainingPM}
          <span style={{ color: "#666" }}> (+{character.moveRange}/tour)</span>
        </div>
        <div>
          <strong style={{ color: "#ef4444" }}>PS</strong> {state.remainingPS} /{" "}
          {character.psMax}
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
          const costLabel = `${spell.cost} PA`;
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
              {spell.name} — {costLabel}
              {spell.description && (
                <div
                  style={{
                    fontSize: 10,
                    color: "#999",
                    fontWeight: "normal",
                    marginTop: 3,
                    whiteSpace: "pre-line",
                    lineHeight: 1.3,
                  }}
                >
                  {spell.description}
                </div>
              )}
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
          <h3 style={{ margin: "8px 0 0", color: "#5566ee" }}>{hoveredEnemy.name}</h3>
          <div>
            <strong>Position:</strong> ({hoveredEnemy.pos.x},{" "}
            {hoveredEnemy.pos.y})
          </div>
          <div>
            <strong>HP:</strong> {hoveredEnemy.hp} / {hoveredEnemy.maxHp}
          </div>
          <div>
            <strong>ATK:</strong> {hoveredEnemy.attack}
          </div>
          <div>
            <strong>PM:</strong> {hoveredEnemy.moveRange}{" "}
            <strong>PA:</strong> {hoveredEnemy.ap}
          </div>
          <EnemyResistances enemy={hoveredEnemy} />
        </>
      )}

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
        <button
          onClick={onWinFight}
          style={{
            padding: "8px 12px",
            background: "#1a3a1a",
            color: "#44cc88",
            border: "1px solid #44cc88",
            borderRadius: 4,
            cursor: "pointer",
            fontFamily: "monospace",
          }}
        >
          Win fight
        </button>
        <button
          onClick={onLoseFight}
          style={{
            padding: "8px 12px",
            background: "#3a1a1a",
            color: "#cc4444",
            border: "1px solid #cc4444",
            borderRadius: 4,
            cursor: "pointer",
            fontFamily: "monospace",
          }}
        >
          Lose fight
        </button>
        <button
          onClick={onReset}
          style={{
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
    </div>
  );
}

function EnemyResistances({ enemy }: { enemy: EnemyState }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 4 }}>
      <div style={{ color: "#666", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
        R\u00e9sistances
      </div>
      <div style={{ display: "flex", gap: 3 }}>
        {ELEMENTS.map((el: Element) => {
          const pct = Math.round((enemy.resistances[el] ?? 0) * 100);
          const dim = pct === 0;
          return (
            <div
              key={el}
              title={`${ELEMENT_LABELS[el]} : ${pct}%`}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "2px 0",
                borderRadius: 3,
                background: dim ? "#12121c" : `${ELEMENT_COLORS[el]}11`,
                border: `1px solid ${dim ? "#1a1a2a" : ELEMENT_COLORS[el] + "44"}`,
              }}
            >
              <span style={{ fontSize: 11 }}>{ELEMENT_ICONS[el]}</span>
              <span
                style={{
                  color: dim ? "#555" : ELEMENT_COLORS[el],
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
