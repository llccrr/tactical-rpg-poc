import Phaser from "phaser";
import { TILE_WIDTH, TILE_HEIGHT } from "../config";
import { gridToScreen } from "../core/iso";
import type { GridPos } from "../core/grid";
import { TileType } from "../core/gameState";

const COLORS = {
  empty: 0x3a3a5c,
  emptyStroke: 0x5a5a8c,
  obstacle: 0x1a1a2e,
  obstacleStroke: 0x2e2e4a,
  reachable: 0x44cc88,
  reachableStroke: 0x66eebb,
  spellRange: 0x4488ee,
  spellRangeStroke: 0x66aaff,
  hover: 0x5588dd,
  hoverStroke: 0x77aaff,
  enemyThreat: 0xcc4444,
  enemyThreatStroke: 0xee6666,
} as const;

/**
 * Visual representation of a single isometric tile.
 * Purely a Phaser display object — no gameplay logic.
 */
export class Tile extends Phaser.GameObjects.Polygon {
  public readonly gridPos: GridPos;
  public tileType: TileType;

  private baseColor: number;
  private baseStroke: number;
  private highlighted = false;
  private spellHighlighted = false;
  private threatHighlighted = false;

  constructor(scene: Phaser.Scene, gridPos: GridPos, tileType: TileType) {
    const screen = gridToScreen(gridPos);

    // Diamond vertices in positive space (top-left of bbox at 0,0)
    // so that setOrigin(0.5, 0.5) correctly centres the tile at its position
    const hw = TILE_WIDTH / 2;
    const hh = TILE_HEIGHT / 2;
    const points = [
      { x: hw, y: 0 },
      { x: TILE_WIDTH, y: hh },
      { x: hw, y: TILE_HEIGHT },
      { x: 0, y: hh },
    ];

    super(scene, screen.x, screen.y, points);

    this.gridPos = gridPos;
    this.tileType = tileType;

    if (tileType === TileType.Obstacle) {
      this.baseColor = COLORS.obstacle;
      this.baseStroke = COLORS.obstacleStroke;
    } else {
      this.baseColor = COLORS.empty;
      this.baseStroke = COLORS.emptyStroke;
    }

    this.setFillStyle(this.baseColor, 1);
    this.setStrokeStyle(1.5, this.baseStroke, 0.8);
    this.setOrigin(0.5, 0.5);

    // Make interactive only for non-obstacle tiles
    if (tileType !== TileType.Obstacle) {
      this.setInteractive(
        new Phaser.Geom.Polygon(points),
        Phaser.Geom.Polygon.Contains,
      );
    }

    scene.add.existing(this);
  }

  /** Show this tile as reachable (movement highlight) */
  setReachable(on: boolean): void {
    this.highlighted = on;
    if (on) {
      this.setFillStyle(COLORS.reachable, 0.35);
      this.setStrokeStyle(2, COLORS.reachableStroke, 0.9);
    } else {
      this.setFillStyle(this.baseColor, 1);
      this.setStrokeStyle(1.5, this.baseStroke, 0.8);
    }
  }

  /** Show this tile as in spell range (targeting highlight) */
  setSpellRange(on: boolean): void {
    this.spellHighlighted = on;
    if (on) {
      this.setFillStyle(COLORS.spellRange, 0.35);
      this.setStrokeStyle(2, COLORS.spellRangeStroke, 0.9);
    } else {
      this.setFillStyle(this.baseColor, 1);
      this.setStrokeStyle(1.5, this.baseStroke, 0.8);
    }
  }

  /** Show this tile as enemy threat zone */
  setEnemyThreat(on: boolean): void {
    this.threatHighlighted = on;
    if (on) {
      this.setFillStyle(COLORS.enemyThreat, 0.25);
      this.setStrokeStyle(1.5, COLORS.enemyThreatStroke, 0.7);
    } else if (this.spellHighlighted) {
      this.setSpellRange(true);
    } else if (this.highlighted) {
      this.setReachable(true);
    } else {
      this.setFillStyle(this.baseColor, 1);
      this.setStrokeStyle(1.5, this.baseStroke, 0.8);
    }
  }

  /** Hover feedback */
  setHover(on: boolean): void {
    if (on) {
      this.setFillStyle(COLORS.hover, 0.45);
      this.setStrokeStyle(2, COLORS.hoverStroke, 1);
    } else if (this.threatHighlighted) {
      this.setEnemyThreat(true);
    } else if (this.spellHighlighted) {
      this.setSpellRange(true);
    } else if (this.highlighted) {
      this.setReachable(true);
    } else {
      this.setFillStyle(this.baseColor, 1);
      this.setStrokeStyle(1.5, this.baseStroke, 0.8);
    }
  }
}
