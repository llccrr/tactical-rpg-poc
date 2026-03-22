import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState, useCallback } from "react";
import Phaser from "phaser";
import { BoardScene } from "./game/scenes/BoardScene";
import { DebugPanel } from "./DebugPanel";
import { GameHUD } from "./GameHUD";
import { FightResultOverlay } from "./FightResultOverlay";
import { CombatLog } from "./CombatLog";
import { CharacterCreate } from "./screens/CharacterCreate";
const PHASER_CONFIG = {
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
    const gameRef = useRef(null);
    const sceneRef = useRef(null);
    const [gameState, setGameState] = useState(null);
    const [screen, setScreen] = useState("create");
    const [classId, setClassId] = useState(null);
    const startFight = useCallback((selectedClassId) => {
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
        if (screen !== "fight" || !classId)
            return;
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
    const handleSelectSpell = (index) => {
        sceneRef.current?.selectSpell(index);
    };
    const handleEndTurn = () => {
        sceneRef.current?.endTurn();
    };
    if (screen === "create") {
        return _jsx(CharacterCreate, { onStart: startFight });
    }
    return (_jsxs("div", { style: { display: "flex", height: "100vh" }, children: [_jsxs("div", { style: { flex: 1, position: "relative" }, children: [_jsx("div", { id: "phaser-container", style: { width: "100%", height: "100%" } }), _jsx(CombatLog, { state: gameState }), _jsx(GameHUD, { state: gameState, onSelectSpell: handleSelectSpell, onEndTurn: handleEndTurn }), gameState && (_jsx(FightResultOverlay, { result: gameState.fightResult, onRetry: handleReset, onBackToMenu: backToMenu }))] }), _jsx(DebugPanel, { state: gameState, onReset: handleReset, onSelectSpell: handleSelectSpell, onEndTurn: handleEndTurn })] }));
}
