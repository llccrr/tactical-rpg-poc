import { TILE_WIDTH, TILE_HEIGHT, BOARD_ORIGIN_X, BOARD_ORIGIN_Y } from "../config";
/** Convert grid coordinates to isometric screen position (centre of the tile) */
export function gridToScreen(pos) {
    return {
        x: BOARD_ORIGIN_X + (pos.x - pos.y) * (TILE_WIDTH / 2),
        y: BOARD_ORIGIN_Y + (pos.x + pos.y) * (TILE_HEIGHT / 2),
    };
}
/** Convert screen coordinates back to the nearest grid position */
export function screenToGrid(screen) {
    const sx = screen.x - BOARD_ORIGIN_X;
    const sy = screen.y - BOARD_ORIGIN_Y;
    const gx = (sx / (TILE_WIDTH / 2) + sy / (TILE_HEIGHT / 2)) / 2;
    const gy = (sy / (TILE_HEIGHT / 2) - sx / (TILE_WIDTH / 2)) / 2;
    return { x: Math.round(gx), y: Math.round(gy) };
}
