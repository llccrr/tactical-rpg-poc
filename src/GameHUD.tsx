import type { GameState } from "./game/core/gameState";
import { ActionMode } from "./game/core/gameState";

interface GameHUDProps {
  state: GameState | null;
  onSelectSpell: (index: number) => void;
  onEndTurn: () => void;
}

/* ── Small SVG icons ─────────────────────────────── */

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="#60a5fa">
      <path d="M12 2l2.9 6.3L22 9.2l-5 4.6L18.2 21 12 17.3 5.8 21 7 13.8 2 9.2l7.1-.9z" />
    </svg>
  );
}

function BootIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="#facc15">
      <path d="M2 22l1-4h4l1-2h4l1-4h4l2-2V4l-4 2-1 4h-4l-1 2H5L4 14H2z" />
    </svg>
  );
}

function BloodIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="#ef4444">
      <path d="M12 2C12 2 5 11 5 15.5C5 19.09 8.13 22 12 22s7-2.91 7-6.5C19 11 12 2 12 2z" />
    </svg>
  );
}

function FunctionIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="#c084fc">
      <path d="M12 2l3 7h7l-5.5 4.5L18 22l-6-4-6 4 1.5-8.5L2 9h7z" />
    </svg>
  );
}

/* ── HP bar ───────────────────────────────────────── */

function HPBar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const barColor = pct > 50 ? "#dc2626" : pct > 25 ? "#ea580c" : "#b91c1c";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 140 }}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="#dc2626" style={{ flexShrink: 0 }}>
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z" />
      </svg>
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            fontWeight: 700,
            color: "#e8e8e8",
            marginBottom: 3,
            fontFamily: "monospace",
          }}
        >
          <span>{value}</span>
          <span style={{ color: "#666" }}>{max}</span>
        </div>
        <div
          style={{
            height: 6,
            background: "#1a1a2e",
            borderRadius: 3,
            border: "1px solid #2a2a3e",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: barColor,
              borderRadius: 3,
              transition: "width 0.3s ease",
              boxShadow: `0 0 6px ${barColor}44`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Point counter ───────────────────────────────── */

function PointCounter({
  icon,
  value,
  suffix,
  color,
  bgColor,
  title,
}: {
  icon: React.ReactNode;
  value: number;
  /** Small subscript text, e.g. "+1" for regen or "/10" for capped resources. */
  suffix: string;
  color: string;
  bgColor: string;
  title: string;
}) {
  return (
    <div
      title={title}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 8px 3px 6px",
        background: bgColor,
        borderRadius: 4,
        border: `1px solid ${color}33`,
      }}
    >
      {icon}
      <span
        style={{
          fontSize: 14,
          fontWeight: 800,
          color,
          fontFamily: "monospace",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 10,
          color: "#555",
          fontWeight: 600,
          fontFamily: "monospace",
          lineHeight: 1,
        }}
      >
        {suffix}
      </span>
    </div>
  );
}

/* ── Spell slot ──────────────────────────────────── */

function SpellSlot({
  spell,
  isActive,
  canAfford,
  disabled,
  onSelect,
}: {
  spell: { name: string; range: number; cost: number; element?: string; description?: string };
  isActive: boolean;
  canAfford: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const elementColor: Record<string, string> = {
    fire: "#fb923c",
    water: "#60a5fa",
    wind: "#a3e635",
    earth: "#a16207",
    neutral: "#a1a1aa",
  };
  const accent = spell.element ? elementColor[spell.element] ?? "#2a2a3e" : "#2a2a3e";

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      title={spell.description ?? `${spell.name} — ${spell.cost} PA — ${spell.range} PO`}
      style={{
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
          ? `2px solid ${accent}`
          : `2px solid ${accent}44`,
        borderRadius: 6,
        cursor: disabled ? "default" : "pointer",
        outline: "none",
        padding: 0,
        boxShadow: isActive
          ? `0 0 8px ${accent}44, inset 0 0 12px ${accent}22`
          : "inset 0 2px 4px rgba(0,0,0,0.4)",
        transition: "border-color 0.15s, box-shadow 0.15s",
        color: disabled ? "#444" : "#ddd",
        fontFamily: "monospace",
      }}
    >
      <span style={{ fontSize: 18, fontWeight: 800, lineHeight: 1 }}>
        {spell.name.charAt(0)}
      </span>
      <span style={{ fontSize: 8, opacity: 0.5, lineHeight: 1 }}>
        {spell.range}PO
      </span>

      <div
        style={{
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
        }}
      >
        {spell.cost}
      </div>
    </button>
  );
}

/* ── Main HUD ────────────────────────────────────── */

export function GameHUD({ state, onSelectSpell, onEndTurn }: GameHUDProps) {
  if (!state) return null;

  const { character } = state;
  const isPlayerTurn = state.currentTurn === "player";

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      {/* Main panel */}
      <div
        style={{
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
        }}
      >
        {/* ── Stats block ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <HPBar value={character.hp} max={character.maxHp} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <PointCounter
              icon={<StarIcon />}
              value={state.remainingPA}
              suffix={`+${character.ap}`}
              color="#60a5fa"
              bgColor="#60a5fa11"
              title={`PA (Points d'Action) — gain +${character.ap} / tour`}
            />
            <PointCounter
              icon={<FunctionIcon />}
              value={state.remainingPF}
              suffix={`+${character.pf}`}
              color="#c084fc"
              bgColor="#c084fc11"
              title={`PF (Points de Fonction) — gain +${character.pf} / tour`}
            />
            <PointCounter
              icon={<BootIcon />}
              value={state.remainingPM}
              suffix={`+${character.moveRange}`}
              color="#facc15"
              bgColor="#facc1511"
              title={`PP (Points de Placement) — gain +${character.moveRange} / tour`}
            />
            <PointCounter
              icon={<BloodIcon />}
              value={state.remainingPS}
              suffix={`/${character.psMax}`}
              color="#ef4444"
              bgColor="#ef444411"
              title={`PS (Points de Sang) — cap ${character.psMax}, +1 par d\u00e9g\u00e2t inflig\u00e9 ou subi`}
            />
          </div>
        </div>

        {/* ── Divider ── */}
        <div
          style={{
            width: 2,
            alignSelf: "stretch",
            background: "linear-gradient(to bottom, transparent, #2a2a3e, transparent)",
            margin: "0 2px",
          }}
        />

        {/* ── Spells ── */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {character.spells.map((spell, i) => {
            const isActive =
              state.actionMode === ActionMode.Targeting &&
              state.activeSpellIndex === i;
            const canAfford = state.remainingPA >= spell.cost;
            const disabled = !isPlayerTurn || !canAfford;

            return (
              <SpellSlot
                key={i}
                spell={spell}
                isActive={isActive}
                canAfford={canAfford}
                disabled={disabled}
                onSelect={() => onSelectSpell(i)}
              />
            );
          })}
        </div>

        {/* ── Divider ── */}
        <div
          style={{
            width: 2,
            alignSelf: "stretch",
            background: "linear-gradient(to bottom, transparent, #2a2a3e, transparent)",
            margin: "0 2px",
          }}
        />

        {/* ── End turn ── */}
        <button
          onClick={onEndTurn}
          disabled={!isPlayerTurn}
          style={{
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
          }}
        >
          Fin du tour
        </button>

        {/* Turn counter */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: isPlayerTurn ? "#4ade80" : "#ef4444",
              boxShadow: `0 0 6px ${isPlayerTurn ? "#4ade80" : "#ef4444"}`,
            }}
          />
          <span
            style={{
              fontSize: 10,
              color: "#555",
              fontWeight: 700,
              fontFamily: "monospace",
            }}
          >
            {state.turnNumber}
          </span>
        </div>
      </div>
    </div>
  );
}
