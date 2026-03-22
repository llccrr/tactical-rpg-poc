import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { BoardScene } from "./game/scenes/BoardScene";
import type { GameState } from "./game/core/gameState";
import { DebugPanel } from "./DebugPanel";

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

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div id="phaser-container" style={{ flex: 1 }} />
      <DebugPanel
        state={gameState}
        onReset={handleReset}
        onSelectSpell={handleSelectSpell}
      />
    </div>
  );
}
