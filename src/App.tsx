import { useEffect, useRef, useState, useCallback } from "react";
import Phaser from "phaser";
import { BoardScene } from "./game/scenes/BoardScene";
import type { GameState } from "./game/core/gameState";
import { DebugPanel } from "./DebugPanel";
import { GameHUD } from "./GameHUD";
import { FightResultOverlay } from "./FightResultOverlay";
import { CombatLog } from "./CombatLog";
import { CharacterCreate } from "./screens/CharacterCreate";

type Screen = "create" | "fight";

const PHASER_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 640,
  backgroundColor: "#16162a",
  parent: "phaser-container",
  scene: [],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

export default function App() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<BoardScene | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [screen, setScreen] = useState<Screen>("create");
  const [classId, setClassId] = useState<string | null>(null);

  const startFight = useCallback((selectedClassId: string) => {
    setClassId(selectedClassId);
    setScreen("fight");
  }, []);

  const backToMenu = useCallback(() => {
    // Destroy Phaser game before going back
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    }
    setGameState(null);
    setScreen("create");
  }, []);

  useEffect(() => {
    if (screen !== "fight" || !classId) return;

    const game = new Phaser.Game(PHASER_CONFIG);
    gameRef.current = game;

    const boardScene = new BoardScene();
    sceneRef.current = boardScene;

    boardScene.setOnStateChange(setGameState);
    boardScene.setClassId(classId);
    game.scene.add("BoardScene", boardScene, true);

    return () => {
      game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
  }, [screen, classId]);

  const handleReset = () => {
    sceneRef.current?.resetBoard();
  };

  const handleSelectSpell = (index: number) => {
    sceneRef.current?.selectSpell(index);
  };

  const handleEndTurn = () => {
    sceneRef.current?.endTurn();
  };

  if (screen === "create") {
    return <CharacterCreate onStart={startFight} />;
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ flex: 1, position: "relative" }}>
        <div id="phaser-container" style={{ width: "100%", height: "100%" }} />
        <CombatLog state={gameState} />
        <GameHUD
          state={gameState}
          onSelectSpell={handleSelectSpell}
          onEndTurn={handleEndTurn}
        />
        {gameState && (
          <FightResultOverlay
            result={gameState.fightResult}
            onRetry={handleReset}
            onBackToMenu={backToMenu}
          />
        )}
      </div>
      <DebugPanel
        state={gameState as any}
        onReset={handleReset}
        onSelectSpell={handleSelectSpell}
        onEndTurn={handleEndTurn}
      />
    </div>
  );
}
