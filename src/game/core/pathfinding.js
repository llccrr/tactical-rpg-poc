import { getNeighbours, posKey } from "./grid";
/**
 * BFS flood-fill: returns all reachable tiles within `range` steps,
 * respecting blocked tiles.
 */
export function getReachableTiles(origin, range, blocked) {
    const visited = new Map(); // key -> distance
    const queue = [{ pos: origin, dist: 0 }];
    visited.set(posKey(origin), 0);
    while (queue.length > 0) {
        const { pos, dist } = queue.shift();
        if (dist >= range)
            continue;
        for (const n of getNeighbours(pos)) {
            const key = posKey(n);
            if (visited.has(key) || blocked.has(key))
                continue;
            visited.set(key, dist + 1);
            queue.push({ pos: n, dist: dist + 1 });
        }
    }
    // Remove the origin itself — the character already stands there
    visited.delete(posKey(origin));
    return visited;
}
/**
 * BFS shortest path from `start` to `end`, avoiding blocked tiles.
 * Returns the path as an ordered list of GridPos (excluding `start`).
 * Returns null if no path exists.
 */
export function findPath(start, end, blocked) {
    const startKey = posKey(start);
    const endKey = posKey(end);
    const cameFrom = new Map();
    const visited = new Set([startKey]);
    const queue = [start];
    while (queue.length > 0) {
        const current = queue.shift();
        const currentKey = posKey(current);
        if (currentKey === endKey) {
            // Reconstruct path
            const path = [];
            let key = endKey;
            while (key !== startKey) {
                const [x, y] = key.split(",").map(Number);
                path.unshift({ x, y });
                key = cameFrom.get(key);
            }
            return path;
        }
        for (const n of getNeighbours(current)) {
            const nKey = posKey(n);
            if (visited.has(nKey) || blocked.has(nKey))
                continue;
            visited.add(nKey);
            cameFrom.set(nKey, currentKey);
            queue.push(n);
        }
    }
    return null;
}
