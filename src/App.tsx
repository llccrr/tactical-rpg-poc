import { useEffect, useRef, useState, useCallback } from "react";
import Phaser from "phaser";
import { BoardScene } from "./game/scenes/BoardScene";
import type { GameState } from "./game/core/gameState";
import { DebugPanel } from "./DebugPanel";
import { GameHUD, EnemyTooltip } from "./GameHUD";
import { FightResultOverlay } from "./FightResultOverlay";
import { CombatLog } from "./CombatLog";
import { CharacterCreate } from "./screens/CharacterCreate";
import { Hub } from "./screens/Hub";
import { DungeonEnd } from "./screens/DungeonEnd";
import { Crafting } from "./screens/Crafting";
import { createPlayerState, addResource, getEquipmentBonuses, type PlayerState } from "./game/core/playerState";
import type { DungeonRunState } from "./game/core/dungeonState";
import { getDungeonById, rollLoot } from "./game/data/dungeons";
import { RESOURCES } from "./game/data/resources";
import { loadOrCreateSave, writeSave, deleteSave, type SaveData } from "./game/core/saveSystem";
import { ScreenTransition } from "./components/ScreenTransition";

type Screen = "create" | "hub" | "craft" | "fight" | "dungeon-end";

const DPR = Math.min(window.devicePixelRatio || 1, 2);

const BASE_PHASER_CONFIG: Omit<Phaser.Types.Core.GameConfig, "parent"> = {
  type: Phaser.AUTO,
  width: 1024 * DPR,
  height: 640 * DPR,
  backgroundColor: "#16162a",
  scene: [],
  render: {
    antialias: true,
    roundPixels: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

export default function App() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<BoardScene | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dungeonRunRef = useRef<DungeonRunState | null>(null);

  // Load save once on first render
  const [initialSave] = useState<SaveData>(() => loadOrCreateSave());
  const playerRef = useRef<PlayerState>(initialSave.playerState);

  const [gameState, setGameState] = useState<GameState | null>(null);
  // Skip character create if we have a saved game
  const [screen, setScreen] = useState<Screen>(() => {
    const s = initialSave;
    const hasProgress =
      s.completedDungeons.length > 0 ||
      Object.keys(s.playerState.resources).length > 0 ||
      s.playerState.ownedItems.length > 0;
    return hasProgress ? "hub" : "create";
  });
  const [roomKey, setRoomKey] = useState(0);

  const [player, setPlayer] = useState<PlayerState>(initialSave.playerState);
  const [completedDungeons, setCompletedDungeons] = useState<string[]>(initialSave.completedDungeons);
  const [dungeonRun, setDungeonRun] = useState<DungeonRunState | null>(null);
  const [dungeonEndData, setDungeonEndData] = useState<{
    dungeonId: string;
    success: boolean;
    lootedResourceId?: string;
  } | null>(null);

  /** Brief announcement text shown on top of the board, fades out on its own */
  const [roomAnnounce, setRoomAnnounce] = useState<string | null>(null);

  // Auto-save whenever player state or completed dungeons change
  useEffect(() => {
    const data: SaveData = { version: 1, playerState: player, completedDungeons };
    writeSave(data);
  }, [player, completedDungeons]);

  // Keep refs in sync so the effect always reads latest values without re-running
  dungeonRunRef.current = dungeonRun;
  playerRef.current = player;

  // ── Phaser init — runs only when roomKey changes ────────────
  // Uses requestAnimationFrame so the browser has finished layout
  // and the container has real dimensions before Phaser measures it.

  useEffect(() => {
    if (screen !== "fight") return;

    const run = dungeonRunRef.current;
    if (!run) return;

    const dungeon = getDungeonById(run.dungeonId);
    if (!dungeon) return;
    const roomDef = dungeon.rooms[run.currentRoom];
    if (!roomDef) return;

    // Destroy any previous Phaser instance
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    }

    const container = containerRef.current;
    if (!container) return;

    const game = new Phaser.Game({ ...BASE_PHASER_CONFIG, parent: container });
    gameRef.current = game;

    const boardScene = new BoardScene();
    sceneRef.current = boardScene;

    boardScene.setOnStateChange(setGameState);
    boardScene.setClassId(playerRef.current.classId);
    boardScene.setRoomConfig({ room: roomDef, playerHp: run.playerHp });
    boardScene.setEquipmentBonuses(getEquipmentBonuses(playerRef.current));
    boardScene.setDungeonId(run.dungeonId);
    game.scene.add("BoardScene", boardScene, true);

    return () => {
      game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomKey]);

  // ── Navigation ──────────────────────────────────────────────

  const handleClassSelected = useCallback((classId: string) => {
    setPlayer(createPlayerState(classId));
    setScreen("hub");
  }, []);

  const startRoom = useCallback((run: DungeonRunState) => {
    dungeonRunRef.current = run;
    setDungeonRun(run);
    setGameState(null);
    setScreen("fight");
    setRoomKey((k) => k + 1);
  }, []);

  const handleStartDungeon = useCallback((dungeonId: string) => {
    const dungeon = getDungeonById(dungeonId);
    if (!dungeon) return;
    setRoomAnnounce(`Salle 1/${dungeon.rooms.length}`);
    startRoom({ dungeonId, currentRoom: 0, playerHp: undefined });
  }, [startRoom]);

  const handleNextRoom = useCallback(() => {
    const run = dungeonRunRef.current;
    if (!run) return;
    const dungeon = getDungeonById(run.dungeonId);
    if (!dungeon) return;

    const currentHp = sceneRef.current?.getPlayerHp() ?? 1;
    const nextRoom = run.currentRoom + 1;

    if (nextRoom >= dungeon.rooms.length) {
      const lootedResourceId = rollLoot(dungeon.lootTable);
      setPlayer((prev) => addResource(prev, lootedResourceId));
      setCompletedDungeons((prev) =>
        prev.includes(run.dungeonId) ? prev : [...prev, run.dungeonId],
      );
      setDungeonEndData({ dungeonId: run.dungeonId, success: true, lootedResourceId });
      setGameState(null);
      setScreen("dungeon-end");
    } else {
      setRoomAnnounce(`Salle ${nextRoom + 1}/${dungeon.rooms.length}`);
      startRoom({ ...run, currentRoom: nextRoom, playerHp: currentHp });
    }
  }, [startRoom]);

  const handleDefeat = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    }
    setDungeonRun(null);
    setDungeonEndData(null);
    setGameState(null);
    setScreen("hub");
  }, []);

  const handleRetryRoom = useCallback(() => {
    const run = dungeonRunRef.current;
    if (!run) return;
    startRoom({ ...run, playerHp: undefined });
  }, [startRoom]);

  const handleBackToHub = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    }
    setDungeonRun(null);
    setDungeonEndData(null);
    setGameState(null);
    setScreen("hub");
  }, []);

  const handleChangeClass = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    }
    setDungeonRun(null);
    setDungeonEndData(null);
    setGameState(null);
    setCompletedDungeons([]);
    deleteSave();
    setScreen("create");
  }, []);

  // ── In-fight helpers ────────────────────────────────────────

  const handleReset = () => sceneRef.current?.resetBoard();
  const handleSelectSpell = (index: number) => sceneRef.current?.selectSpell(index);
  const handleEndTurn = () => sceneRef.current?.endTurn();

  // ── Overlay labels ──────────────────────────────────────────

  const isLastRoom = (() => {
    if (!dungeonRun) return false;
    const dungeon = getDungeonById(dungeonRun.dungeonId);
    return dungeon ? dungeonRun.currentRoom >= dungeon.rooms.length - 1 : false;
  })();

  const isVictory = gameState?.fightResult === "victory";
  const overlayPrimaryLabel = isVictory
    ? isLastRoom ? "Terminer le donjon" : "Salle suivante"
    : "Reessayer";
  const overlayPrimaryAction = isVictory ? handleNextRoom : handleRetryRoom;
  const overlaySecondaryAction = isVictory ? handleBackToHub : handleDefeat;

  // Auto-clear room announcement after 1.5s
  useEffect(() => {
    if (!roomAnnounce) return;
    const timer = setTimeout(() => setRoomAnnounce(null), 1500);
    return () => clearTimeout(timer);
  }, [roomAnnounce]);

  // ── Render ──────────────────────────────────────────────────

  if (screen === "create") {
    return (
      <ScreenTransition transitionKey="create">
        <CharacterCreate onStart={handleClassSelected} />
      </ScreenTransition>
    );
  }

  if (screen === "hub") {
    return (
      <ScreenTransition transitionKey="hub">
        <Hub
          player={player}
          completedDungeons={completedDungeons}
          onPlayerChange={setPlayer}
          onStartDungeon={handleStartDungeon}
          onOpenCraft={() => setScreen("craft")}
          onChangeClass={handleChangeClass}
          onCheat={() => setPlayer((prev) => {
            let next = prev;
            for (const r of RESOURCES) {
              next = addResource(next, r.id, 3);
            }
            return next;
          })}
        />
      </ScreenTransition>
    );
  }

  if (screen === "craft") {
    return (
      <ScreenTransition transitionKey="craft">
        <Crafting
          player={player}
          onPlayerChange={setPlayer}
          onBack={() => setScreen("hub")}
        />
      </ScreenTransition>
    );
  }

  if (screen === "dungeon-end" && dungeonEndData) {
    return (
      <ScreenTransition transitionKey={`end-${dungeonEndData.dungeonId}`}>
        <DungeonEnd
          dungeonId={dungeonEndData.dungeonId}
          success={dungeonEndData.success}
          lootedResourceId={dungeonEndData.lootedResourceId}
          onBackToHub={handleBackToHub}
          onGoToCraft={() => { setDungeonRun(null); setDungeonEndData(null); setScreen("craft"); }}
        />
      </ScreenTransition>
    );
  }

  // fight screen
  const dungeon = dungeonRun ? getDungeonById(dungeonRun.dungeonId) : null;
  const roomLabel = dungeon
    ? `${dungeon.name} — Salle ${(dungeonRun?.currentRoom ?? 0) + 1}/${dungeon.rooms.length}`
    : null;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <div style={{ flex: 1, position: "relative" }}>
        {roomLabel && (
          <div
            style={{
              position: "absolute",
              top: 12,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              background: "rgba(0,0,0,0.6)",
              color: "#aaa",
              fontFamily: "sans-serif",
              fontSize: "0.85rem",
              padding: "4px 14px",
              borderRadius: 20,
              border: "1px solid #333",
              pointerEvents: "none",
            }}
          >
            {roomLabel}
          </div>
        )}
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
        {roomAnnounce && (
          <div
            key={roomAnnounce}
            style={{
              position: "absolute",
              top: "38%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 50,
              fontFamily: "sans-serif",
              fontSize: "2.5rem",
              fontWeight: 800,
              color: "#fff",
              textShadow: "0 0 30px #44aa6666, 0 2px 8px rgba(0,0,0,0.9)",
              letterSpacing: 3,
              pointerEvents: "none",
              animation: "room-announce 1.5s ease-out forwards",
            }}
          >
            {roomAnnounce}
          </div>
        )}
        <CombatLog state={gameState} />
        <EnemyTooltip state={gameState} />
        <GameHUD state={gameState} onSelectSpell={handleSelectSpell} onEndTurn={handleEndTurn} />
        {gameState && (
          <FightResultOverlay
            result={gameState.fightResult}
            onPrimary={overlayPrimaryAction}
            primaryLabel={overlayPrimaryLabel}
            onSecondary={overlaySecondaryAction}
            secondaryLabel="Abandonner"
          />
        )}
      </div>
      <DebugPanel
        state={gameState as any}
        onReset={handleReset}
        onSelectSpell={handleSelectSpell}
        onEndTurn={handleEndTurn}
        onWinFight={handleNextRoom}
        onLoseFight={handleDefeat}
      />
      <style>{`
        @keyframes room-announce {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(1.8); }
          15% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          70% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
        }
      `}</style>
    </div>
  );
}
