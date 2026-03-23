import type { GameState } from "./game/core/gameState";
import { ActionMode } from "./game/core/gameState";
import type { IopLikeState } from "./game/core/ioplike";

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
    <svg viewBox="0 0 24 24" width="14" height="14" fill="#4ade80">
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

function ConcentrationIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="#f59e0b">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
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

/* ── Concentration bar ───────────────────────────── */

function ConcentrationBar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 120 }}>
      <ConcentrationIcon />
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 9,
            fontWeight: 700,
            color: "#f59e0b",
            marginBottom: 2,
            fontFamily: "monospace",
          }}
        >
          <span>{value}</span>
          <span style={{ color: "#666" }}>{max}</span>
        </div>
        <div
          style={{
            height: 5,
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
              background: `linear-gradient(90deg, #f59e0b, #f97316)`,
              borderRadius: 3,
              transition: "width 0.3s ease",
              boxShadow: `0 0 6px #f59e0b44`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Point counter (PA / PM / Blood) ─────────────── */

function PointCounter({
  icon,
  value,
  max,
  color,
  bgColor,
}: {
  icon: React.ReactNode;
  value: number;
  max: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div
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
        /{max}
      </span>
    </div>
  );
}

/* ── Status badge (Courroux / Préparation) ───────── */

function StatusBadge({
  label,
  stacks,
  color,
  glowColor,
}: {
  label: string;
  stacks: number;
  color: string;
  glowColor: string;
}) {
  if (stacks <= 0) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 7px",
        background: `${color}22`,
        borderRadius: 4,
        border: `1px solid ${color}66`,
        boxShadow: `0 0 8px ${glowColor}`,
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 800,
          color,
          fontFamily: "monospace",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </span>
      {stacks > 1 && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 900,
            color,
            fontFamily: "monospace",
          }}
        >
          x{stacks}
        </span>
      )}
    </div>
  );
}

/* ── Spell slot ──────────────────────────────────── */

function SpellSlot({
  spell,
  index,
  isActive,
  canAfford,
  disabled,
  onSelect,
}: {
  spell: { name: string; range: number; cost: number; bloodPointCost?: number; mpCost?: number; element?: string; description?: string };
  index: number;
  isActive: boolean;
  canAfford: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  // Determine cost label
  const isBlood = (spell.bloodPointCost ?? 0) > 0;
  const isMp = (spell.mpCost ?? 0) > 0;
  const costValue = isBlood
    ? spell.bloodPointCost!
    : isMp
      ? spell.mpCost!
      : spell.cost;
  const costLabel = isBlood ? "PS" : isMp ? "PM" : "PA";
  const costBadgeColor = isBlood
    ? (canAfford ? "#dc2626" : "#333")
    : (canAfford ? "#2563eb" : "#333");

  // Element border accent
  const elementColor: Record<string, string> = {
    air: "#7dd3fc",
    earth: "#a3e635",
    fire: "#fb923c",
    neutral: "#a1a1aa",
  };
  const accent = spell.element ? elementColor[spell.element] ?? "#2a2a3e" : "#2a2a3e";

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      title={spell.description ?? `${spell.name} — ${costValue} ${costLabel} — ${spell.range} PO`}
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

      {/* Cost badge */}
      <div
        style={{
          position: "absolute",
          top: -6,
          right: -6,
          minWidth: 16,
          height: 16,
          borderRadius: 3,
          background: costBadgeColor,
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
        {costValue}
      </div>

      {/* Blood/MP indicator dot */}
      {(isBlood || isMp) && (
        <div
          style={{
            position: "absolute",
            top: -6,
            left: -4,
            fontSize: 8,
            fontWeight: 900,
            color: isBlood ? "#ef4444" : "#4ade80",
            fontFamily: "monospace",
          }}
        >
          {costLabel}
        </div>
      )}
    </button>
  );
}

/* ── IopLike resource panel ──────────────────────── */

function IopLikePanel({ iop, remainingPA }: { iop: IopLikeState; remainingPA: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {/* Concentration bar */}
      <ConcentrationBar value={iop.concentration} max={iop.concentrationMax} />
      {/* Blood points + statuses */}
      <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
        <PointCounter
          icon={<BloodIcon />}
          value={iop.bloodPoints}
          max={iop.bloodPointsMax}
          color="#ef4444"
          bgColor="#ef444411"
        />
        <StatusBadge
          label="Courroux"
          stacks={iop.courroux}
          color="#f97316"
          glowColor="#f9731633"
        />
        <StatusBadge
          label="Prép."
          stacks={iop.preparation}
          color="#a855f7"
          glowColor="#a855f733"
        />
      </div>
    </div>
  );
}

/* ── Main HUD ────────────────────────────────────── */

export function GameHUD({ state, onSelectSpell, onEndTurn }: GameHUDProps) {
  if (!state) return null;

  const { character } = state;
  const isPlayerTurn = state.currentTurn === "player";
  const iop = state.ioplikeState;

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
          <div style={{ display: "flex", gap: 6 }}>
            <PointCounter
              icon={<StarIcon />}
              value={state.remainingPA}
              max={character.ap}
              color="#60a5fa"
              bgColor="#60a5fa11"
            />
            <PointCounter
              icon={<BootIcon />}
              value={state.remainingPM}
              max={character.moveRange}
              color="#4ade80"
              bgColor="#4ade8011"
            />
          </div>
        </div>

        {/* ── IopLike resources ── */}
        {iop && (
          <>
            <div
              style={{
                width: 2,
                alignSelf: "stretch",
                background: "linear-gradient(to bottom, transparent, #2a2a3e, transparent)",
                margin: "0 2px",
              }}
            />
            <IopLikePanel iop={iop} remainingPA={state.remainingPA} />
          </>
        )}

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

            // Affordability check: blood > mp > pa
            const isBlood = (spell.bloodPointCost ?? 0) > 0;
            const isMp = (spell.mpCost ?? 0) > 0;
            const canAfford = isBlood
              ? (iop?.bloodPoints ?? 0) >= spell.bloodPointCost!
              : isMp
                ? state.remainingPM >= spell.mpCost!
                : state.remainingPA >= spell.cost;
            const disabled = !isPlayerTurn || !canAfford;

            return (
              <SpellSlot
                key={i}
                spell={spell}
                index={i}
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
