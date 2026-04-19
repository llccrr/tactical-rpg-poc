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
 * Decide where the enemy should move based on its behavior archetype.
 * - melee: rush toward the player
 * - ranged: stay at max spell range, flee if too close
 * - tank: position between the player and the nearest allied ranged/boss enemy
 * - boss: approach if out of range, otherwise reposition to best spell distance
 */
export function decideEnemyMove(
  enemy: EnemyState,
  state: GameState,
): EnemyMoveDecision | null {
  const blocked = getBlockedSet(state);
  blocked.delete(posKey(enemy.pos));
  blocked.add(posKey(state.character.pos));

  const reachable = getReachableTiles(enemy.pos, enemy.moveRange, blocked);
  const playerPos = state.character.pos;

  let scoreFn: (pos: GridPos) => number;

  switch (enemy.behavior) {
    case "ranged":
      scoreFn = (pos) => scoreRanged(pos, playerPos, enemy);
      break;
    case "tank":
      scoreFn = (pos) => scoreTank(pos, playerPos, enemy, state);
      break;
    case "boss":
      scoreFn = (pos) => scoreBoss(pos, playerPos, enemy);
      break;
    case "melee":
    default:
      scoreFn = (pos) => scoreMelee(pos, playerPos);
      break;
  }

  let bestKey: string | null = null;
  let bestScore = -Infinity;

  for (const [tileKey] of reachable) {
    const [tx, ty] = tileKey.split(",").map(Number);
    const pos: GridPos = { x: tx, y: ty };
    const score = scoreFn(pos);
    if (score > bestScore) {
      bestScore = score;
      bestKey = tileKey;
    }
  }

  if (!bestKey) return null;

  const [tx, ty] = bestKey.split(",").map(Number);
  const target: GridPos = { x: tx, y: ty };

  // Don't move if already at the best tile
  if (target.x === enemy.pos.x && target.y === enemy.pos.y) return null;

  const path = findPath(enemy.pos, target, blocked);
  if (!path || path.length === 0) return null;

  return { target, path };
}

/** Melee: get as close as possible to the player */
function scoreMelee(pos: GridPos, playerPos: GridPos): number {
  return -manhattan(pos, playerPos);
}

/** Ranged: ideal distance is max spell range. Penalize being too close or too far. */
function scoreRanged(pos: GridPos, playerPos: GridPos, enemy: EnemyState): number {
  const maxRange = Math.max(...enemy.spells.map((s) => s.range));
  const dist = manhattan(pos, playerPos);
  // Ideal distance = maxRange (can attack without being adjacent)
  // Strong penalty for being in melee range
  if (dist <= 1) return -100;
  if (dist <= maxRange) return 50 - Math.abs(dist - maxRange);
  return -dist; // too far, move closer
}

/** Tank: move toward the midpoint between the player and the nearest fragile ally */
function scoreTank(pos: GridPos, playerPos: GridPos, enemy: EnemyState, state: GameState): number {
  // Find an allied ranged or boss enemy to protect
  const allyToProtect = state.enemies.find(
    (e) => e.id !== enemy.id && (e.behavior === "ranged" || e.behavior === "boss"),
  );

  if (allyToProtect) {
    // Try to stand between the player and the ally
    const midX = (playerPos.x + allyToProtect.pos.x) / 2;
    const midY = (playerPos.y + allyToProtect.pos.y) / 2;
    const distToMid = Math.abs(pos.x - midX) + Math.abs(pos.y - midY);
    // Also want to be near the player to be threatening
    const distToPlayer = manhattan(pos, playerPos);
    return -(distToMid * 2 + distToPlayer);
  }

  // No ally to protect — just rush like melee
  return -manhattan(pos, playerPos);
}

/** Boss: if in range of best spell, stay; otherwise approach to ideal range */
function scoreBoss(pos: GridPos, playerPos: GridPos, enemy: EnemyState): number {
  const dist = manhattan(pos, playerPos);
  // Find best usable spell at this position
  const bestSpell = enemy.spells
    .filter((s) => dist <= s.range)
    .sort((a, b) => b.damagePercent - a.damagePercent)[0];

  if (bestSpell) {
    // In range of a spell — prefer to stay at max range of that spell
    return 100 - Math.abs(dist - bestSpell.range);
  }
  // Not in range — get closer
  return -dist;
}

/**
 * Post-attack flee for ranged enemies.
 * Uses remaining PM to get as far from the player as possible.
 */
export function decideEnemyFlee(
  enemy: EnemyState,
  state: GameState,
  remainingPM: number,
): EnemyMoveDecision | null {
  if (remainingPM <= 0) return null;

  const blocked = getBlockedSet(state);
  blocked.delete(posKey(enemy.pos));
  blocked.add(posKey(state.character.pos));

  const reachable = getReachableTiles(enemy.pos, remainingPM, blocked);
  const playerPos = state.character.pos;

  let bestKey: string | null = null;
  let bestDist = -Infinity;

  for (const [tileKey] of reachable) {
    const [tx, ty] = tileKey.split(",").map(Number);
    const dist = manhattan({ x: tx, y: ty }, playerPos);
    if (dist > bestDist) {
      bestDist = dist;
      bestKey = tileKey;
    }
  }

  if (!bestKey) return null;

  const [tx, ty] = bestKey.split(",").map(Number);
  const target: GridPos = { x: tx, y: ty };
  if (target.x === enemy.pos.x && target.y === enemy.pos.y) return null;

  const path = findPath(enemy.pos, target, blocked);
  if (!path || path.length === 0) return null;

  return { target, path };
}

/**
 * Decide which spell the enemy should use.
 * - melee/tank: use first spell in range
 * - ranged: use longest-range spell in range
 * - boss: use highest-damage spell in range, considering AP
 */
export function decideEnemyAttack(
  enemy: EnemyState,
  playerPos: GridPos,
): Spell | null {
  const dist = manhattan(enemy.pos, playerPos);
  const inRange = enemy.spells.filter((s) => dist <= s.range);
  if (inRange.length === 0) return null;

  switch (enemy.behavior) {
    case "ranged":
      // Prefer longest range spell
      return inRange.sort((a, b) => b.range - a.range)[0];
    case "boss":
      // Prefer highest damage spell the boss can afford
      return inRange
        .filter((s) => s.cost <= enemy.ap)
        .sort((a, b) => b.damagePercent - a.damagePercent)[0] ?? null;
    case "melee":
    case "tank":
    default:
      return inRange[0];
  }
}
