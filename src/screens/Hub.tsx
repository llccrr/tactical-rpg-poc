import { DUNGEONS, type DungeonDef } from "../game/data/dungeons";
import { getResourceById, RESOURCES } from "../game/data/resources";
import { getItemById, type ItemSlot } from "../game/data/items";
import { getClassById } from "../game/data/classes";
import { getEquipmentBonuses, unequipSlot, equipItem, type PlayerState } from "../game/core/playerState";
import {
  ELEMENTS,
  ELEMENT_COLORS,
  ELEMENT_ICONS,
  clampResistance,
  type Element,
  type Resistances,
} from "../game/data/elements";

interface Props {
  player: PlayerState;
  completedDungeons: string[];
  onPlayerChange: (player: PlayerState) => void;
  onStartDungeon: (dungeonId: string) => void;
  onOpenCraft: () => void;
  onChangeClass: () => void;
  onCheat: () => void;
}

const TIER_COLORS: Record<number, string> = {
  1: "#44aa88",
  2: "#ee8833",
  3: "#cc3333",
};

const SLOT_ORDER: { slot: ItemSlot; label: string; emptyIcon: string }[] = [
  { slot: "arme", label: "Arme", emptyIcon: "\u2694\uFE0F" },
  { slot: "tete", label: "T\u00eate", emptyIcon: "\u26d1\uFE0F" },
  { slot: "torse", label: "Torse", emptyIcon: "\uD83D\uDEE1\uFE0F" },
  { slot: "bottes", label: "Bottes", emptyIcon: "\uD83E\uDD7E" },
];

/* ── Sidebar components ──────────────────────────────────── */

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <h3
        style={{
          margin: 0,
          color: "#666",
          fontFamily: "sans-serif",
          fontSize: "0.7rem",
          textTransform: "uppercase",
          letterSpacing: 2,
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function EquipmentSlot({
  slot,
  label,
  emptyIcon,
  player,
  onUnequip,
}: {
  slot: ItemSlot;
  label: string;
  emptyIcon: string;
  player: PlayerState;
  onUnequip: () => void;
}) {
  const itemId = player.equipment[slot];
  const item = itemId ? getItemById(itemId) : undefined;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        background: item ? "#0e1e18" : "#0e0e18",
        border: `1px solid ${item ? "#33664a" : "#222233"}`,
        borderRadius: 8,
      }}
    >
      {/* Slot icon */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 6,
          background: item ? "#1a3a2a" : "#14141f",
          border: `2px solid ${item ? "#44aa66" : "#2a2a3a"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        {item ? item.icon : <span style={{ opacity: 0.3 }}>{emptyIcon}</span>}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: "0.65rem",
            color: "#555",
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          {label}
        </div>
        {item ? (
          <>
            <div style={{ fontFamily: "sans-serif", fontSize: "0.82rem", color: "#ddd", fontWeight: 600 }}>
              {item.name}
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "0.7rem", color: "#88ccaa" }}>
              {item.description}
            </div>
          </>
        ) : (
          <div style={{ fontFamily: "sans-serif", fontSize: "0.8rem", color: "#444", fontStyle: "italic" }}>
            Vide
          </div>
        )}
      </div>

      {/* Unequip button */}
      {item && (
        <button
          onClick={onUnequip}
          title="Retirer"
          style={{
            width: 24,
            height: 24,
            borderRadius: 4,
            border: "1px solid #553333",
            background: "#1a1015",
            color: "#aa5555",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            padding: 0,
            lineHeight: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#2a1520";
            e.currentTarget.style.borderColor = "#aa4444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#1a1015";
            e.currentTarget.style.borderColor = "#553333";
          }}
        >
          \u2715
        </button>
      )}
    </div>
  );
}

function StatBar({
  label,
  base,
  bonus,
  color,
}: {
  label: string;
  base: number;
  bonus: number;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "4px 0",
      }}
    >
      <span style={{ color, fontFamily: "monospace", fontSize: 12, fontWeight: 700, width: 32 }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 4, fontFamily: "monospace", fontSize: 13 }}>
        <span style={{ color: "#888" }}>{base}</span>
        {bonus > 0 && <span style={{ color: "#44cc66", fontWeight: 700 }}>+{bonus}</span>}
        <span style={{ color: "#555" }}>=</span>
        <span style={{ color: "#eee", fontWeight: 700, minWidth: 20, textAlign: "right" }}>
          {base + bonus}
        </span>
      </div>
    </div>
  );
}

function ResistanceSummary({
  bonuses,
  classResistances,
}: {
  bonuses?: Partial<Resistances>;
  classResistances?: Partial<Resistances>;
}) {
  const totals: Record<Element, number> = {} as Record<Element, number>;
  for (const el of ELEMENTS) {
    const base = classResistances?.[el] ?? 0;
    const bonus = bonuses?.[el] ?? 0;
    totals[el] = clampResistance(base + bonus);
  }
  return (
    <div style={{ display: "flex", gap: 4, marginTop: 4, justifyContent: "space-between" }}>
      {ELEMENTS.map((el) => {
        const pct = Math.round(totals[el] * 100);
        const dim = pct === 0;
        return (
          <div
            key={el}
            title={`R\u00e9sistance ${el} : ${pct}%`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flex: 1,
              padding: "2px 0",
              borderRadius: 4,
              background: dim ? "#0b0b12" : `${ELEMENT_COLORS[el]}11`,
              border: `1px solid ${dim ? "#1a1a2a" : ELEMENT_COLORS[el] + "44"}`,
            }}
          >
            <span style={{ fontSize: 11 }}>{ELEMENT_ICONS[el]}</span>
            <span
              style={{
                color: dim ? "#555" : ELEMENT_COLORS[el],
                fontFamily: "monospace",
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
  );
}

/* \u2500\u2500 Dungeon node on the map \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

/** Dungeon positions on the visual map (percentage-based) */
const DUNGEON_MAP_POSITIONS: Record<string, { x: number; y: number }> = {
  caverne_gobelins:     { x: 18, y: 65 },
  crypte_squelettes:    { x: 42, y: 40 },
  marais_slime:         { x: 65, y: 60 },
  forteresse_demoniaque:{ x: 85, y: 28 },
};

/** Path connections between dungeons */
const DUNGEON_PATHS: [string, string][] = [
  ["caverne_gobelins", "crypte_squelettes"],
  ["crypte_squelettes", "marais_slime"],
  ["marais_slime", "forteresse_demoniaque"],
];

function isDungeonUnlocked(dungeon: DungeonDef, completedDungeons: string[]): boolean {
  // Tier 1 dungeons are always unlocked
  if (dungeon.tier <= 1) return true;
  // Higher tiers: need at least one dungeon of the previous tier completed
  const prevTierDungeons = DUNGEONS.filter((d) => d.tier === dungeon.tier - 1);
  return prevTierDungeons.some((d) => completedDungeons.includes(d.id));
}

function DungeonNode({
  dungeon,
  completed,
  unlocked,
  onStart,
}: {
  dungeon: DungeonDef;
  completed: boolean;
  unlocked: boolean;
  onStart: () => void;
}) {
  const tierColor = TIER_COLORS[dungeon.tier] ?? "#888";
  const pos = DUNGEON_MAP_POSITIONS[dungeon.id] ?? { x: 50, y: 50 };

  return (
    <div
      style={{
        position: "absolute",
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        zIndex: 2,
      }}
    >
      {/* Node circle */}
      <button
        onClick={unlocked ? onStart : undefined}
        disabled={!unlocked}
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          border: `3px solid ${unlocked ? tierColor : "#333"}`,
          background: completed
            ? `${tierColor}33`
            : unlocked
            ? "#12121f"
            : "#0a0a10",
          cursor: unlocked ? "pointer" : "not-allowed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          transition: "all 0.2s",
          boxShadow: completed
            ? `0 0 16px ${tierColor}55`
            : unlocked
            ? `0 0 8px ${tierColor}22`
            : "none",
          opacity: unlocked ? 1 : 0.4,
          position: "relative",
        }}
        onMouseEnter={(e) => {
          if (unlocked) {
            e.currentTarget.style.transform = "scale(1.12)";
            e.currentTarget.style.boxShadow = `0 0 24px ${tierColor}88`;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = completed
            ? `0 0 16px ${tierColor}55`
            : unlocked
            ? `0 0 8px ${tierColor}22`
            : "none";
        }}
      >
        {completed ? (
          <span style={{ fontSize: 28 }}>{"\u2714"}</span>
        ) : !unlocked ? (
          <span style={{ fontSize: 22, opacity: 0.5 }}>{"\uD83D\uDD12"}</span>
        ) : (
          <span style={{ fontSize: 22 }}>{"\u2694\uFE0F"}</span>
        )}
      </button>

      {/* Label */}
      <div
        style={{
          textAlign: "center",
          maxWidth: 140,
        }}
      >
        <div
          style={{
            fontFamily: "sans-serif",
            fontSize: "0.82rem",
            fontWeight: 700,
            color: unlocked ? "#ddd" : "#555",
            lineHeight: 1.2,
          }}
        >
          {dungeon.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 3 }}>
          <span
            style={{
              fontSize: "0.65rem",
              fontFamily: "monospace",
              color: tierColor,
              border: `1px solid ${unlocked ? tierColor : "#333"}`,
              borderRadius: 3,
              padding: "1px 5px",
              opacity: unlocked ? 1 : 0.5,
            }}
          >
            T{dungeon.tier}
          </span>
          <span style={{ fontSize: "0.65rem", fontFamily: "monospace", color: "#666" }}>
            {dungeon.rooms.length} salles
          </span>
        </div>
        {unlocked && (
          <div style={{ fontSize: "0.65rem", fontFamily: "monospace", color: "#555", marginTop: 2 }}>
            {dungeon.lootTable.map((e) => getResourceById(e.resourceId)?.icon ?? "?").join(" ")}
          </div>
        )}
      </div>
    </div>
  );
}

/* \u2500\u2500 Training node (isolated, no path) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

function TrainingNode({
  dungeon,
  onStart,
}: {
  dungeon: DungeonDef;
  onStart: () => void;
}) {
  const color = "#9a6ad0";
  return (
    <div
      style={{
        position: "absolute",
        left: "12%",
        top: "18%",
        transform: "translate(-50%, -50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        zIndex: 2,
      }}
    >
      <button
        onClick={onStart}
        title={dungeon.description}
        style={{
          width: 64,
          height: 64,
          borderRadius: 12,
          border: `2px dashed ${color}`,
          background: "#141024",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
          transition: "all 0.2s",
          boxShadow: `0 0 8px ${color}33`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.12)";
          e.currentTarget.style.boxShadow = `0 0 24px ${color}aa`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = `0 0 8px ${color}33`;
        }}
      >
        {"\uD83C\uDFAF"}
      </button>

      <div style={{ textAlign: "center", maxWidth: 160 }}>
        <div
          style={{
            fontFamily: "sans-serif",
            fontSize: "0.82rem",
            fontWeight: 700,
            color: "#ddd",
            lineHeight: 1.2,
          }}
        >
          {dungeon.name}
        </div>
        <div
          style={{
            fontSize: "0.65rem",
            fontFamily: "monospace",
            color,
            border: `1px solid ${color}88`,
            borderRadius: 3,
            padding: "1px 5px",
            marginTop: 3,
            display: "inline-block",
          }}
        >
          SANDBOX
        </div>
      </div>
    </div>
  );
}

/* \u2500\u2500 Path SVG between nodes \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

function DungeonPaths({ completedDungeons }: { completedDungeons: string[] }) {
  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1 }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {DUNGEON_PATHS.map(([fromId, toId]) => {
        const from = DUNGEON_MAP_POSITIONS[fromId];
        const to = DUNGEON_MAP_POSITIONS[toId];
        if (!from || !to) return null;

        const bothCompleted = completedDungeons.includes(fromId) && completedDungeons.includes(toId);
        const oneCompleted = completedDungeons.includes(fromId) || completedDungeons.includes(toId);

        return (
          <line
            key={`${fromId}-${toId}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={bothCompleted ? "#44aa8866" : oneCompleted ? "#44aa8833" : "#222233"}
            strokeWidth={0.4}
            strokeDasharray={bothCompleted ? "none" : "1 0.8"}
          />
        );
      })}
    </svg>
  );
}

/* ── Hub ─────────────────────────────────────────────────── */

export function Hub({ player, completedDungeons, onPlayerChange, onStartDungeon, onOpenCraft, onChangeClass, onCheat }: Props) {
  const hasResources = RESOURCES.some((r) => (player.resources[r.id] ?? 0) > 0);
  const equippedIds = new Set(Object.values(player.equipment));
  const unequippedItems = player.ownedItems
    .map((id) => getItemById(id))
    .filter((item) => item && !equippedIds.has(item.id));
  const hasEquipmentOrResources =
    Object.keys(player.equipment).length > 0 || hasResources || player.ownedItems.length > 0;

  const classDef = getClassById(player.classId);
  const bonuses = getEquipmentBonuses(player);

  const trainingDungeon = DUNGEONS.find((d) => d.isTraining);
  const regularDungeons = DUNGEONS.filter((d) => !d.isTraining);

  const handleChangeClass = () => {
    const confirmed = window.confirm(
      "Changer de classe va reinitialiser ta sauvegarde (ressources, equipement, progression). Continuer ?",
    );
    if (!confirmed) return;
    onChangeClass();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a14",
        display: "flex",
        fontFamily: "sans-serif",
      }}
    >
      {/* ── LEFT SIDEBAR ─────────────────────────────────── */}
      <div
        style={{
          width: 300,
          flexShrink: 0,
          background: "#0c0c18",
          borderRight: "2px solid #1a1a2e",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          padding: "28px 18px",
          overflowY: "auto",
        }}
      >
        {/* Character header */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: "0 auto 10px",
              borderRadius: "50%",
              background: `${classDef?.color ?? "#888"}22`,
              border: `3px solid ${classDef?.color ?? "#888"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            {classDef?.id === "bretteur" ? "\u2694\uFE0F" : classDef?.id === "sentinelle" ? "\uD83C\uDFF9" : "\uD83D\uDCA5"}
          </div>
          <div style={{ color: classDef?.color ?? "#aaa", fontWeight: 700, fontSize: "1.1rem" }}>
            {classDef?.name ?? player.classId}
          </div>
          <div style={{ color: "#555", fontSize: "0.75rem", marginTop: 2 }}>
            {classDef?.description.slice(0, 60)}...
          </div>
        </div>

        {/* Separator */}
        <div style={{ height: 1, background: "#1a1a2e" }} />

        {/* Stats */}
        <SidebarSection title="Stats">
          <div
            style={{
              padding: "8px 10px",
              background: "#0e0e1a",
              border: "1px solid #1a1a2e",
              borderRadius: 8,
            }}
          >
            {classDef && (
              <>
                <StatBar label="PV" base={classDef.baseHp} bonus={bonuses.hp ?? 0} color="#dc2626" />
                <StatBar label="ATK" base={classDef.baseAttack} bonus={bonuses.attack ?? 0} color="#60a5fa" />
                <StatBar label="PM" base={classDef.basePm} bonus={0} color="#c084fc" />
                <StatBar label="PA" base={classDef.basePa} bonus={0} color="#facc15" />
                <ResistanceSummary bonuses={bonuses.resistances} classResistances={classDef.resistances} />
              </>
            )}
          </div>
        </SidebarSection>

        {/* Separator */}
        <div style={{ height: 1, background: "#1a1a2e" }} />

        {/* Equipment */}
        <SidebarSection title="\u00C9quipement">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {SLOT_ORDER.map(({ slot, label, emptyIcon }) => (
              <EquipmentSlot
                key={slot}
                slot={slot}
                label={label}
                emptyIcon={emptyIcon}
                player={player}
                onUnequip={() => onPlayerChange(unequipSlot(player, slot))}
              />
            ))}
          </div>
          <button
            onClick={onOpenCraft}
            style={{
              marginTop: 4,
              padding: "8px 0",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "#4488aa",
              background: "#0e1520",
              border: "1px solid #1a3a4a",
              borderRadius: 6,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#142030")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#0e1520")}
          >
            Atelier de craft
          </button>
        </SidebarSection>

        {/* Separator */}
        <div style={{ height: 1, background: "#1a1a2e" }} />

        {/* Owned items (inventory) */}
        <SidebarSection title="Inventaire">
          {unequippedItems.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {unequippedItems.map((item) => item && (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 8px",
                    background: "#0e0e1a",
                    border: "1px solid #1a1a2e",
                    borderRadius: 6,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "sans-serif", fontSize: "0.8rem", color: "#bbb" }}>
                      {item.name}
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: "0.65rem", color: "#667" }}>
                      {item.description}
                    </div>
                  </div>
                  <button
                    onClick={() => onPlayerChange(equipItem(player, item.id))}
                    style={{
                      padding: "3px 8px",
                      fontSize: "0.7rem",
                      fontFamily: "sans-serif",
                      fontWeight: 600,
                      color: "#44aa66",
                      background: "#0e1e18",
                      border: "1px solid #33664a",
                      borderRadius: 4,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#1a3a2a")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#0e1e18")}
                  >
                    \u00C9quiper
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#333", fontSize: "0.8rem", margin: 0, fontStyle: "italic" }}>
              {player.ownedItems.length > 0 ? "Tous les objets sont \u00e9quip\u00e9s" : "Aucun objet"}
            </p>
          )}
        </SidebarSection>

        {/* Separator */}
        <div style={{ height: 1, background: "#1a1a2e" }} />

        {/* Resources inventory */}
        <SidebarSection title="Ressources">
          {hasResources ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {RESOURCES.filter((r) => (player.resources[r.id] ?? 0) > 0).map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "4px 8px",
                    background: "#0e0e1a",
                    border: "1px solid #1a1a2e",
                    borderRadius: 6,
                    fontFamily: "monospace",
                    fontSize: 12,
                    color: "#bbb",
                  }}
                >
                  <span style={{ fontSize: 15 }}>{r.icon}</span>
                  <span style={{ flex: 1 }}>{r.name}</span>
                  <span style={{ color: "#666", fontWeight: 700 }}>\u00d7{player.resources[r.id]}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#333", fontSize: "0.8rem", margin: 0, fontStyle: "italic" }}>
              Aucune ressource
            </p>
          )}
        </SidebarSection>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Bottom actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button
            onClick={handleChangeClass}
            style={{
              padding: "8px 0",
              fontSize: "0.8rem",
              color: "#666",
              background: "transparent",
              border: "1px solid #2a2a3a",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Changer de classe
          </button>
          <button
            onClick={onCheat}
            style={{
              padding: "6px 0",
              fontSize: "0.75rem",
              color: "#884488",
              background: "transparent",
              border: "1px dashed #44224455",
              borderRadius: 6,
              cursor: "pointer",
              opacity: 0.5,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
          >
            +10 de chaque ressource (cheat)
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT — DUNGEON MAP ────────────────────── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Title bar */}
        <div style={{ textAlign: "center", padding: "24px 0 0" }}>
          <h1 style={{ margin: "0 0 4px", color: "#eee", fontSize: "1.6rem" }}>
            Carte des Donjons
          </h1>
          <p style={{ margin: 0, color: "#555", fontSize: "0.8rem" }}>
            {completedDungeons.length}/{regularDungeons.length} donjons termines
          </p>
        </div>

        {/* Map area */}
        <div
          style={{
            flex: 1,
            position: "relative",
            margin: "20px 32px 32px",
            background: "#0e0e1a",
            border: "1px solid #1a1a2e",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {/* Background pattern */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.04,
              backgroundImage:
                "radial-gradient(circle, #ffffff 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* SVG paths between dungeons */}
          <DungeonPaths completedDungeons={completedDungeons} />

          {/* Dungeon nodes */}
          {regularDungeons.map((d) => (
            <DungeonNode
              key={d.id}
              dungeon={d}
              completed={completedDungeons.includes(d.id)}
              unlocked={isDungeonUnlocked(d, completedDungeons)}
              onStart={() => onStartDungeon(d.id)}
            />
          ))}

          {/* Training room — isolated node, no path connections */}
          {trainingDungeon && (
            <TrainingNode
              dungeon={trainingDungeon}
              onStart={() => onStartDungeon(trainingDungeon.id)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
