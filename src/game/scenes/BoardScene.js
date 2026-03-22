import Phaser from "phaser";
import { GRID_COLS, GRID_ROWS } from "../config";
import { posKey } from "../core/grid";
import { createInitialState, getBlockedSet, TileType, ActionMode, } from "../core/gameState";
import { computeDamage } from "../core/combat";
import { FightController } from "../core/fightController";
import { CombatEventBus } from "../core/events";
import { decideEnemyMove, decideEnemyAttack } from "../core/ai";
import { getReachableTiles, findPath } from "../core/pathfinding";
import { Tile } from "../entities/Tile";
import { Character, ENEMY_COLORS } from "../entities/Character";
import { showDamagePopup } from "../entities/DamagePopup";
import { gridToScreen } from "../core/iso";
export class BoardScene extends Phaser.Scene {
    constructor() {
        super({ key: "BoardScene" });
        this.tileMap = new Map();
        this.enemySprites = new Map();
        this.reachableKeys = new Set();
        this.spellRangeKeys = new Set();
        this.hoveredEnemyId = null;
        this.classId = "bretteur";
    }
    /** Allow React to subscribe to state changes */
    setOnStateChange(cb) {
        this.onStateChange = cb;
    }
    /** Set classId before scene starts */
    setClassId(classId) {
        this.classId = classId;
    }
    /** Start a fight with the given class — called from React */
    startFight(classId) {
        this.classId = classId;
        this.resetBoard();
    }
    create() {
        this.initFight();
        this.buildBoard();
        this.character = this.createPlayerCharacter();
        this.createEnemySprites();
        this.showReachable();
        this.emitState();
    }
    /** Reset board to initial state */
    resetBoard() {
        this.tileMap.forEach((t) => t.destroy());
        this.tileMap.clear();
        this.character.destroy();
        this.enemySprites.forEach((s) => s.destroy());
        this.enemySprites.clear();
        this.reachableKeys.clear();
        this.spellRangeKeys.clear();
        this.hoveredEnemyId = null;
        this.eventBus.clear();
        this.initFight();
        this.buildBoard();
        this.character = this.createPlayerCharacter();
        this.createEnemySprites();
        this.showReachable();
        this.emitState();
    }
    /** Called from React when a spell button is clicked */
    selectSpell(index) {
        if (this.state.fightResult !== "ongoing")
            return;
        if (!this.fight.isPlayerTurn())
            return;
        if (this.character.isMoving)
            return;
        const spell = this.state.character.spells[index];
        if (!spell)
            return;
        if (!this.fight.canPlayerAfford(spell.cost))
            return;
        // Toggle: clicking the same spell again goes back to move mode
        if (this.state.actionMode === ActionMode.Targeting &&
            this.state.activeSpellIndex === index) {
            this.switchToMoveMode();
            return;
        }
        this.clearReachable();
        this.clearSpellRange();
        this.state.actionMode = ActionMode.Targeting;
        this.state.activeSpellIndex = index;
        this.showSpellRange();
        this.emitState();
    }
    /** Called from React when End Turn button is clicked */
    endTurn() {
        if (this.state.fightResult !== "ongoing")
            return;
        if (!this.fight.isPlayerTurn())
            return;
        this.clearReachable();
        this.clearSpellRange();
        this.state.actionMode = ActionMode.Move;
        this.state.activeSpellIndex = null;
        this.fight.endPlayerTurn();
        this.emitState();
        // Run enemy turns after a short delay
        this.time.delayedCall(500, () => this.runEnemyPhase());
    }
    // ── internal ──────────────────────────────────────────────
    initFight() {
        this.state = createInitialState(this.classId);
        this.eventBus = new CombatEventBus();
        this.fight = new FightController(this.state, this.eventBus);
    }
    createPlayerCharacter() {
        const char = new Character(this, this.state.character.pos);
        char.selected = true;
        char.on("pointerdown", () => {
            if (!this.fight.isPlayerTurn())
                return;
            if (char.isMoving)
                return;
            this.switchToMoveMode();
        });
        return char;
    }
    createEnemySprites() {
        for (const enemy of this.state.enemies) {
            const sprite = new Character(this, enemy.pos, ENEMY_COLORS);
            const id = enemy.id;
            sprite.on("pointerover", () => {
                this.hoveredEnemyId = id;
                this.emitState();
            });
            sprite.on("pointerout", () => {
                if (this.hoveredEnemyId === id) {
                    this.hoveredEnemyId = null;
                    this.emitState();
                }
            });
            sprite.on("pointerdown", () => {
                const e = this.state.enemies.find((en) => en.id === id);
                if (e)
                    this.handleTileClick(e.pos);
            });
            this.enemySprites.set(id, sprite);
        }
    }
    switchToMoveMode() {
        this.clearSpellRange();
        this.state.actionMode = ActionMode.Move;
        this.state.activeSpellIndex = null;
        if (this.fight.canPlayerMove()) {
            this.showReachable();
        }
        this.emitState();
    }
    /** Refresh highlights based on current state */
    refreshHighlights() {
        this.clearReachable();
        this.clearSpellRange();
        if (this.state.actionMode === ActionMode.Targeting) {
            this.showSpellRange();
        }
        else if (this.fight.canPlayerMove()) {
            this.showReachable();
        }
    }
    buildBoard() {
        for (let y = 0; y < GRID_ROWS; y++) {
            for (let x = 0; x < GRID_COLS; x++) {
                const tileType = this.state.tiles[y][x];
                const tile = new Tile(this, { x, y }, tileType);
                this.tileMap.set(posKey({ x, y }), tile);
                if (tileType !== TileType.Obstacle) {
                    tile.on("pointerover", () => tile.setHover(true));
                    tile.on("pointerout", () => tile.setHover(false));
                    tile.on("pointerdown", () => this.handleTileClick({ x, y }));
                }
            }
        }
    }
    showReachable() {
        this.clearReachable();
        if (!this.fight.canPlayerMove())
            return;
        const blocked = getBlockedSet(this.state);
        const reachable = getReachableTiles(this.state.character.pos, this.state.remainingPM, blocked);
        for (const key of reachable.keys()) {
            this.reachableKeys.add(key);
            this.tileMap.get(key)?.setReachable(true);
        }
    }
    clearReachable() {
        for (const key of this.reachableKeys) {
            this.tileMap.get(key)?.setReachable(false);
        }
        this.reachableKeys.clear();
    }
    showSpellRange() {
        this.clearSpellRange();
        const spell = this.state.character.spells[this.state.activeSpellIndex];
        if (!spell)
            return;
        // Spell range ignores enemies — only obstacles block line of fire
        const obstaclesOnly = getBlockedSet(this.state);
        for (const enemy of this.state.enemies) {
            obstaclesOnly.delete(posKey(enemy.pos));
        }
        const inRange = getReachableTiles(this.state.character.pos, spell.range, obstaclesOnly);
        for (const key of inRange.keys()) {
            this.spellRangeKeys.add(key);
            this.tileMap.get(key)?.setSpellRange(true);
        }
    }
    clearSpellRange() {
        for (const key of this.spellRangeKeys) {
            this.tileMap.get(key)?.setSpellRange(false);
        }
        this.spellRangeKeys.clear();
    }
    async handleTileClick(pos) {
        if (this.state.fightResult !== "ongoing")
            return;
        if (!this.fight.isPlayerTurn())
            return;
        if (this.character.isMoving)
            return;
        const key = posKey(pos);
        // ── Targeting mode: cast spell on enemy ──
        if (this.state.actionMode === ActionMode.Targeting) {
            if (!this.spellRangeKeys.has(key))
                return;
            const enemy = this.state.enemies.find((e) => posKey(e.pos) === key);
            if (!enemy)
                return;
            const spell = this.state.character.spells[this.state.activeSpellIndex];
            if (!spell)
                return;
            if (!this.fight.canPlayerAfford(spell.cost))
                return;
            this.fight.spendPA(spell.cost);
            // Compute and apply damage
            const { damage, killed } = computeDamage(this.state.character, enemy, spell, enemy.hp);
            enemy.hp -= damage;
            // Emit damage event
            this.eventBus.emit({
                type: "damage",
                attackerId: "player",
                targetId: enemy.id,
                damage,
                spell: spell.name,
            });
            // Visual feedback
            const enemySprite = this.enemySprites.get(enemy.id);
            if (enemySprite) {
                const screen = gridToScreen(enemy.pos);
                showDamagePopup(this, screen.x, screen.y, damage);
            }
            if (killed) {
                this.eventBus.emit({ type: "death", entityId: enemy.id });
                this.removeEnemy(enemy.id);
            }
            else if (enemySprite) {
                enemySprite.selected = true;
                this.time.delayedCall(200, () => {
                    enemySprite.selected = false;
                });
            }
            // Go back to move mode
            this.state.actionMode = ActionMode.Move;
            this.state.activeSpellIndex = null;
            this.refreshHighlights();
            this.checkFightEnd();
            this.emitState();
            return;
        }
        // ── Move mode: move to reachable tile ──
        if (!this.fight.canPlayerMove())
            return;
        if (!this.reachableKeys.has(key))
            return;
        const blocked = getBlockedSet(this.state);
        const path = findPath(this.state.character.pos, pos, blocked);
        if (!path || path.length === 0)
            return;
        if (path.length > this.state.remainingPM)
            return;
        this.clearReachable();
        this.emitState();
        await this.character.moveAlongPath(this, path);
        this.fight.spendPM(path.length);
        this.state.character.pos = { ...pos };
        this.refreshHighlights();
        this.emitState();
    }
    /** Run all enemy turns sequentially */
    async runEnemyPhase() {
        // Snapshot IDs at start of phase (safe against mid-loop removal)
        const enemyIds = this.fight.getLivingEnemyIds();
        for (const id of enemyIds) {
            const enemy = this.state.enemies.find((e) => e.id === id);
            if (!enemy)
                continue; // already dead
            const sprite = this.enemySprites.get(id);
            if (!sprite)
                continue;
            this.eventBus.emit({
                type: "turnStart",
                entityId: id,
                turnNumber: this.state.turnNumber,
            });
            // AI: decide movement
            const moveDecision = decideEnemyMove(enemy, this.state);
            if (moveDecision) {
                await sprite.moveAlongPath(this, moveDecision.path);
                enemy.pos = { ...moveDecision.target };
            }
            // AI: decide attack
            const spell = decideEnemyAttack(enemy, this.state.character.pos);
            if (spell) {
                const { damage } = computeDamage(enemy, this.state.character, spell, this.state.character.hp);
                this.state.character.hp -= damage;
                this.eventBus.emit({
                    type: "damage",
                    attackerId: id,
                    targetId: "player",
                    damage,
                    spell: spell.name,
                });
                // Visual feedback
                const playerScreen = gridToScreen(this.state.character.pos);
                showDamagePopup(this, playerScreen.x, playerScreen.y, damage);
                this.character.selected = false;
                this.time.delayedCall(200, () => {
                    this.character.selected = true;
                });
                this.checkFightEnd();
                if (this.state.fightResult !== "ongoing") {
                    this.emitState();
                    return;
                }
            }
            this.eventBus.emit({ type: "turnEnd", entityId: id });
            this.emitState();
        }
        // Enemy phase done — back to player
        this.fight.endEnemyPhase();
        this.refreshHighlights();
        this.emitState();
    }
    /** Remove a dead enemy from state and scene */
    removeEnemy(id) {
        const index = this.state.enemies.findIndex((e) => e.id === id);
        if (index !== -1)
            this.state.enemies.splice(index, 1);
        const sprite = this.enemySprites.get(id);
        if (sprite) {
            sprite.destroy();
            this.enemySprites.delete(id);
        }
        if (this.hoveredEnemyId === id) {
            this.hoveredEnemyId = null;
        }
    }
    /** Check if fight is over (victory or defeat) */
    checkFightEnd() {
        if (this.state.character.hp <= 0) {
            this.state.character.hp = 0;
            this.state.fightResult = "defeat";
            this.eventBus.emit({ type: "fightEnd", result: "defeat" });
        }
        else if (this.state.enemies.length === 0) {
            this.state.fightResult = "victory";
            this.eventBus.emit({ type: "fightEnd", result: "victory" });
        }
    }
    /** Sync all HP bar visuals with current state */
    syncHpBars() {
        this.character.updateHp(this.state.character.hp, this.state.character.maxHp);
        for (const enemy of this.state.enemies) {
            this.enemySprites.get(enemy.id)?.updateHp(enemy.hp, enemy.maxHp);
        }
    }
    emitState() {
        this.syncHpBars();
        this.fight.syncLog();
        this.onStateChange?.({
            ...this.state,
            character: {
                ...this.state.character,
                pos: { ...this.state.character.pos },
                spells: [...this.state.character.spells],
            },
            enemies: this.state.enemies.map((e) => ({
                ...e,
                pos: { ...e.pos },
                spells: [...e.spells],
            })),
            combatLog: [...this.state.combatLog],
            hoveredEnemyId: this.hoveredEnemyId,
        });
    }
}
