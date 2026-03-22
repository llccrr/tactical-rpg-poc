import { posKey } from "./grid";
import { GRID_COLS, GRID_ROWS, DEFAULT_MOVE_RANGE, DEFAULT_AP } from "../config";
import { getClassById } from "../data/classes";
export var TileType;
(function (TileType) {
    TileType["Empty"] = "empty";
    TileType["Obstacle"] = "obstacle";
})(TileType || (TileType = {}));
export var ActionMode;
(function (ActionMode) {
    ActionMode["Move"] = "move";
    ActionMode["Targeting"] = "targeting";
})(ActionMode || (ActionMode = {}));
/** Predefined obstacle positions for the POC */
const OBSTACLE_POSITIONS = [
    { x: 3, y: 2 },
    { x: 3, y: 3 },
    { x: 4, y: 3 },
    { x: 6, y: 5 },
    { x: 7, y: 5 },
    { x: 7, y: 6 },
    { x: 5, y: 8 },
    { x: 2, y: 7 },
    { x: 1, y: 4 },
];
/** Create the initial game state based on chosen class */
export function createInitialState(classId) {
    const classDef = getClassById(classId);
    if (!classDef)
        throw new Error(`Unknown class: ${classId}`);
    const tiles = Array.from({ length: GRID_ROWS }, () => Array.from({ length: GRID_COLS }, () => TileType.Empty));
    for (const obs of OBSTACLE_POSITIONS) {
        tiles[obs.y][obs.x] = TileType.Obstacle;
    }
    return {
        tiles,
        character: {
            pos: { x: 4, y: 5 },
            hp: classDef.baseHp,
            maxHp: classDef.baseHp,
            attack: classDef.baseAttack,
            defense: classDef.baseDefense,
            moveRange: classDef.basePm,
            ap: classDef.basePa,
            selected: true,
            spells: [...classDef.spells],
        },
        enemies: [
            {
                id: "gobelin",
                name: "Gobelin",
                pos: { x: 7, y: 2 },
                hp: 8,
                maxHp: 8,
                attack: 2,
                defense: 0,
                moveRange: 4,
                ap: DEFAULT_AP,
                spells: [{ name: "Griffe", range: 1, cost: 3, baseDamage: 3 }],
            },
            {
                id: "squelette",
                name: "Squelette",
                pos: { x: 2, y: 1 },
                hp: 12,
                maxHp: 12,
                attack: 3,
                defense: 1,
                moveRange: DEFAULT_MOVE_RANGE,
                ap: DEFAULT_AP,
                spells: [{ name: "Os tranchant", range: 1, cost: 3, baseDamage: 4 }],
            },
            {
                id: "slime",
                name: "Slime",
                pos: { x: 8, y: 7 },
                hp: 20,
                maxHp: 20,
                attack: 2,
                defense: 3,
                moveRange: 2,
                ap: DEFAULT_AP,
                spells: [{ name: "Ecrasement", range: 1, cost: 3, baseDamage: 2 }],
            },
        ],
        actionMode: ActionMode.Move,
        activeSpellIndex: null,
        currentTurn: "player",
        turnNumber: 1,
        remainingPM: classDef.basePm,
        remainingPA: classDef.basePa,
        fightResult: "ongoing",
        combatLog: [],
    };
}
/** Collect all blocked tile keys (obstacles + enemy positions) */
export function getBlockedSet(state) {
    const blocked = new Set();
    for (let y = 0; y < GRID_ROWS; y++) {
        for (let x = 0; x < GRID_COLS; x++) {
            if (state.tiles[y][x] === TileType.Obstacle) {
                blocked.add(posKey({ x, y }));
            }
        }
    }
    for (const enemy of state.enemies) {
        blocked.add(posKey(enemy.pos));
    }
    return blocked;
}
