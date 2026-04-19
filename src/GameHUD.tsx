import { useState } from "react";
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

/* ── Point counter (PA / PF / PP / PS) ───────────── */

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

/* ── Element badges ──────────────────────────────── */

const ELEMENT_META: Record<string, { label: string; color: string; icon: string }> = {
  air: { label: "Air", color: "#7dd3fc", icon: "💨" },
  wind: { label: "Vent", color: "#a3e635", icon: "💨" },
  water: { label: "Eau", color: "#60a5fa", icon: "💧" },
  earth: { label: "Terre", color: "#a16207", icon: "🪨" },
  fire: { label: "Feu", color: "#fb923c", icon: "🔥" },
  neutral: { label: "Neutre", color: "#a1a1aa", icon: "⚔️" },
};

function ElementBadge({ element }: { element: string }) {
  const meta = ELEMENT_META[element];
  if (!meta) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: "1px 6px",
        borderRadius: 3,
        background: `${meta.color}18`,
        border: `1px solid ${meta.color}44`,
        fontSize: 10,
        fontWeight: 700,
        color: meta.color,
        fontFamily: "monospace",
      }}
    >
      <span style={{ fontSize: 11 }}>{meta.icon}</span>
      {meta.label}
    </span>
  );
}

/* ── Spell tooltip ──────────────────────────────────── */

function SpellTooltip({
  spell,
}: {
  spell: {
    name: string;
    range: number;
    cost: number;
    baseDamage: number;
    rangeMin?: number;
    element?: string;
    description?: string;
  };
}) {
  const costColor = "#60a5fa";
  const rangeMin = spell.rangeMin ?? 1;
  const rangeText = rangeMin === spell.range ? `${spell.range}` : `${rangeMin}-${spell.range}`;

  const descLines = (spell.description ?? "").split("\n").filter(Boolean);
  const headerLine = descLines[0] ?? "";
  const hasHeaderLine = headerLine.includes("—") && headerLine.includes("|");
  const bodyLines = hasHeaderLine ? descLines.slice(1) : descLines;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100% + 12px)",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        pointerEvents: "none",
        display: "flex",
        gap: 0,
        filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.8))",
      }}
    >
      <div
        style={{
          minWidth: 220,
          maxWidth: 280,
          background: "linear-gradient(180deg, #1a1e2e 0%, #12141f 100%)",
          border: "2px solid #2a3050",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "8px 12px 6px",
            background: "linear-gradient(180deg, #222840 0%, #1a1e2e 100%)",
            borderBottom: "1px solid #2a3050",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "#f0f0f0",
              fontFamily: "monospace",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            {spell.name}
          </div>

          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
            {spell.element && <ElementBadge element={spell.element} />}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                padding: "1px 6px",
                borderRadius: 3,
                background: `${costColor}18`,
                border: `1px solid ${costColor}44`,
                fontSize: 10,
                fontWeight: 700,
                color: costColor,
                fontFamily: "monospace",
              }}
            >
              {spell.cost} PA
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                padding: "1px 6px",
                borderRadius: 3,
                background: "#ffffff0a",
                border: "1px solid #ffffff18",
                fontSize: 10,
                fontWeight: 700,
                color: "#aaa",
                fontFamily: "monospace",
              }}
            >
              {rangeText} PO
            </span>
            {spell.baseDamage > 0 && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  padding: "1px 6px",
                  borderRadius: 3,
                  background: "#ef444418",
                  border: "1px solid #ef444444",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#f87171",
                  fontFamily: "monospace",
                }}
              >
                {spell.baseDamage} DMG
              </span>
            )}
          </div>
        </div>

        {bodyLines.length > 0 && (
          <div style={{ padding: "8px 12px 10px" }}>
            {bodyLines.map((line, i) => (
              <div
                key={i}
                style={{
                  fontSize: 11,
                  color: "#c8c8d4",
                  fontFamily: "monospace",
                  lineHeight: 1.5,
                  marginBottom: i < bodyLines.length - 1 ? 2 : 0,
                }}
              >
                {line}
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: -6,
          left: "50%",
          transform: "translateX(-50%)",
          width: 12,
          height: 6,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            background: "#12141f",
            border: "2px solid #2a3050",
            transform: "rotate(45deg)",
            position: "absolute",
            top: -6,
            left: 1,
          }}
        />
      </div>
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
  spell: { name: string; range: number; cost: number; baseDamage: number; rangeMin?: number; element?: string; description?: string };
  isActive: boolean;
  canAfford: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const elementColor: Record<string, string> = {
    air: "#7dd3fc",
    wind: "#a3e635",
    water: "#60a5fa",
    earth: "#a16207",
    fire: "#fb923c",
    neutral: "#a1a1aa",
  };
  const accent = spell.element ? elementColor[spell.element] ?? "#2a2a3e" : "#2a2a3e";

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && <SpellTooltip spell={spell} />}
      <button
        onClick={onSelect}
        disabled={disabled}
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
    </div>
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

/* ── Enemy hover tooltip ─────────────────────────── */

const BEHAVIOR_LABEL: Record<string, { label: string; color: string }> = {
  melee: { label: "M\u00eal\u00e9e", color: "#f87171" },
  ranged: { label: "Distance", color: "#38bdf8" },
  tank: { label: "Tank", color: "#a3e635" },
  boss: { label: "Boss", color: "#f59e0b" },
};

export function EnemyTooltip({ state }: { state: GameState | null }) {
  if (!state || !state.hoveredEnemyId) return null;

  const enemy = state.enemies.find((e) => e.id === state.hoveredEnemyId);
  if (!enemy) return null;

  const hpPct = Math.max(0, Math.min(100, (enemy.hp / enemy.maxHp) * 100));
  const hpBarColor = hpPct > 50 ? "#44cc44" : hpPct > 25 ? "#cccc44" : "#cc3333";
  const behavior = BEHAVIOR_LABEL[enemy.behavior];

  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 30,
        pointerEvents: "none",
        filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.7))",
      }}
    >
      <div
        style={{
          minWidth: 200,
          background: "linear-gradient(180deg, #1a1e2e 0%, #12141f 100%)",
          border: "2px solid #2a3050",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "8px 12px 6px",
            background: "linear-gradient(180deg, #222840 0%, #1a1e2e 100%)",
            borderBottom: "1px solid #2a3050",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: "#f0f0f0",
              fontFamily: "monospace",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {enemy.name}
          </span>
          {behavior && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: behavior.color,
                fontFamily: "monospace",
                padding: "1px 6px",
                background: `${behavior.color}18`,
                border: `1px solid ${behavior.color}44`,
                borderRadius: 3,
                textTransform: "uppercase",
                letterSpacing: 0.3,
              }}
            >
              {behavior.label}
            </span>
          )}
        </div>

        <div style={{ padding: "8px 12px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 3,
              }}
            >
              <span style={{ fontSize: 10, color: "#888", fontFamily: "monospace", fontWeight: 700 }}>
                PV
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#e8e8e8", fontFamily: "monospace" }}>
                {enemy.hp}
                <span style={{ color: "#555" }}> / {enemy.maxHp}</span>
              </span>
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
                  width: `${hpPct}%`,
                  height: "100%",
                  background: hpBarColor,
                  borderRadius: 3,
                  transition: "width 0.3s ease",
                  boxShadow: `0 0 6px ${hpBarColor}44`,
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <StatPill label="ATQ" value={enemy.attack} color="#fb923c" />
            <StatPill label="DEF" value={enemy.defense} color="#60a5fa" />
            <StatPill label="PP" value={enemy.moveRange} color="#facc15" />
            <StatPill label="PA" value={enemy.ap} color="#a78bfa" />
          </div>

          {enemy.spells.length > 0 && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 2 }}>
              {enemy.spells.map((s, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: "#aaa",
                    fontFamily: "monospace",
                    padding: "1px 5px",
                    background: "#ffffff08",
                    borderRadius: 3,
                    border: "1px solid #ffffff15",
                  }}
                >
                  {s.name} ({s.baseDamage}dmg, {s.range}po)
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 6px",
        background: `${color}12`,
        borderRadius: 3,
        border: `1px solid ${color}33`,
      }}
    >
      <span style={{ fontSize: 9, fontWeight: 700, color: `${color}99`, fontFamily: "monospace" }}>
        {label}
      </span>
      <span style={{ fontSize: 11, fontWeight: 800, color, fontFamily: "monospace" }}>
        {value}
      </span>
    </div>
  );
}
