import type { GridPos } from "./grid";
import { posKey, manhattan } from "./grid";
import type { EnemyState, GameState, Spell } from "./gameState";
import { getBlockedSet } from "./gameState";
import { getReachableTiles, findPath } from "./pathfinding";

export interface EnemyMoveDecision {
  target: GridPos;
  path: GridPos[];
}

/**
 * Decide where the enemy should move (approach the player).
 * Returns null if the enemy should stay put.
 */
export function decideEnemyMove(
  enemy: EnemyState,
  state: GameState,
): EnemyMoveDecision | null {
  const blocked = getBlockedSet(state);
  // Remove this enemy from blocked set so it can move
  blocked.delete(posKey(enemy.pos));
  // Block the player position (can't walk onto it)
  blocked.add(posKey(state.character.pos));

  const reachable = getReachableTiles(enemy.pos, enemy.moveRange, blocked);

  // Pick the tile closest to the player
  let bestKey: string | null = null;
  let bestDist = Infinity;
  const playerPos = state.character.pos;

  for (const [tileKey] of reachable) {
    const [tx, ty] = tileKey.split(",").map(Number);
    const dist = Math.abs(tx - playerPos.x) + Math.abs(ty - playerPos.y);
    if (dist < bestDist) {
      bestDist = dist;
      bestKey = tileKey;
    }
  }

  if (!bestKey) return null;

  const [tx, ty] = bestKey.split(",").map(Number);
  const target: GridPos = { x: tx, y: ty };
  const path = findPath(enemy.pos, target, blocked);

  if (!path || path.length === 0) return null;

  return { target, path };
}

/**
 * Decide if the enemy should attack (returns the spell to use, or null).
 * Attacks if the player is within range of any spell.
 */
export function decideEnemyAttack(
  enemy: EnemyState,
  playerPos: GridPos,
): Spell | null {
  for (const spell of enemy.spells) {
    if (manhattan(enemy.pos, playerPos) <= spell.range) {
      return spell;
    }
  }
  return null;
}
