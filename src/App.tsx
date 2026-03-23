import { useEffect, useRef, useState, useCallback } from "react";
import Phaser from "phaser";
import { BoardScene } from "./game/scenes/BoardScene";
import type { GameState } from "./game/core/gameState";
import { DebugPanel } from "./DebugPanel";
import { GameHUD } from "./GameHUD";
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

type Screen = "create" | "hub" | "craft" | "fight" | "dungeon-end";

const BASE_PHASER_CONFIG: Omit<Phaser.Types.Core.GameConfig, "parent"> = {
  type: Phaser.AUTO,
  width: 1024,
  height: 640,
  backgroundColor: "#16162a",
  scene: [],
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
  const playerRef = useRef<PlayerState>(createPlayerState("bretteur"));

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [screen, setScreen] = useState<Screen>("create");
  const [roomKey, setRoomKey] = useState(0); // incremented to trigger a new Phaser instance

  const [player, setPlayer] = useState<PlayerState>(createPlayerState("bretteur"));
  const [dungeonRun, setDungeonRun] = useState<DungeonRunState | null>(null);
  const [dungeonEndData, setDungeonEndData] = useState<{
    dungeonId: string;
    success: boolean;
    lootedResourceId?: string;
  } | null>(null);

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
      setDungeonEndData({ dungeonId: run.dungeonId, success: true, lootedResourceId });
      setGameState(null);
      setScreen("dungeon-end");
    } else {
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

  // ── Render ──────────────────────────────────────────────────

  if (screen === "create") {
    return <CharacterCreate onStart={handleClassSelected} />;
  }

  if (screen === "hub") {
    return (
      <Hub
        player={player}
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
    );
  }

  if (screen === "craft") {
    return (
      <Crafting
        player={player}
        onPlayerChange={setPlayer}
        onBack={() => setScreen("hub")}
      />
    );
  }

  if (screen === "dungeon-end" && dungeonEndData) {
    return (
      <DungeonEnd
        dungeonId={dungeonEndData.dungeonId}
        success={dungeonEndData.success}
        lootedResourceId={dungeonEndData.lootedResourceId}
        onBackToHub={handleBackToHub}
        onGoToCraft={() => { setDungeonRun(null); setDungeonEndData(null); setScreen("craft"); }}
      />
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
        <CombatLog state={gameState} />
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
    </div>
  );
}
