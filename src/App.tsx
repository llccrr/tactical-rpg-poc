import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { BoardScene } from "./game/scenes/BoardScene";
import type { GameState } from "./game/core/gameState";
import { DebugPanel } from "./DebugPanel";
import { GameHUD } from "./GameHUD";

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

  useEffect(() => {
    const game = new Phaser.Game(PHASER_CONFIG);
    gameRef.current = game;

    const boardScene = new BoardScene();
    sceneRef.current = boardScene;

    boardScene.setOnStateChange(setGameState);
    game.scene.add("BoardScene", boardScene, true);

    return () => {
      game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
  }, []);

  const handleReset = () => {
    sceneRef.current?.resetBoard();
  };

  const handleSelectSpell = (index: number) => {
    sceneRef.current?.selectSpell(index);
  };

  const handleEndTurn = () => {
    sceneRef.current?.endTurn();
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ flex: 1, position: "relative" }}>
        <div id="phaser-container" style={{ width: "100%", height: "100%" }} />
        <GameHUD
          state={gameState}
          onSelectSpell={handleSelectSpell}
          onEndTurn={handleEndTurn}
        />
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
