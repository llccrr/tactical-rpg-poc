import Phaser from "phaser";
import { TILE_WIDTH, TILE_HEIGHT, DPR } from "../config";
import { gridToScreen } from "../core/iso";
import type { GridPos } from "../core/grid";
import { TileType } from "../core/gameState";
import type { Biome } from "../data/dungeons";

/** Texture keys per biome — 3 variants each */
export const TILE_TEX: Record<Biome, readonly [string, string, string]> = {
  grass:    ["tile_grass_0", "tile_grass_1", "tile_grass_2"],
  crypt:    ["tile_crypt_0", "tile_crypt_1", "tile_crypt_2"],
  swamp:    ["tile_swamp_0", "tile_swamp_1", "tile_swamp_2"],
  fortress: ["tile_fortress_0", "tile_fortress_1", "tile_fortress_2"],
};

/** Kept for backward compat — default grass */
export const TILE_TEX_GRASS = TILE_TEX.grass;

/** Diamond half-dimensions */
const HW = TILE_WIDTH / 2;
const HH = TILE_HEIGHT / 2;

interface HighlightStyle {
  fill: number;
  fillAlpha: number;
  stroke: number;
  strokeAlpha: number;
  strokeWidth: number;
}

const HIGHLIGHT: Record<string, HighlightStyle> = {
  reachable:   { fill: 0x44cc88, fillAlpha: 0.45, stroke: 0x88ffcc, strokeAlpha: 1,    strokeWidth: 2 * DPR },
  pathPreview: { fill: 0xe8cc44, fillAlpha: 0.55, stroke: 0xffee88, strokeAlpha: 1,    strokeWidth: 2.5 * DPR },
  spellRange:  { fill: 0x4488ee, fillAlpha: 0.45, stroke: 0x88ccff, strokeAlpha: 1,    strokeWidth: 2 * DPR },
  hover:       { fill: 0x88bbff, fillAlpha: 0.5,  stroke: 0xccddff, strokeAlpha: 1,    strokeWidth: 2.5 * DPR },
  enemyThreat: { fill: 0xcc4444, fillAlpha: 0.4,  stroke: 0xff6666, strokeAlpha: 1,    strokeWidth: 2 * DPR },
  none:        { fill: 0x000000, fillAlpha: 0,     stroke: 0xffffff, strokeAlpha: 0.25, strokeWidth: 1 * DPR },
};

/**
 * Sprite-based isometric tile.
 * Terrain sprites live in the container (depth 0).
 * Grid overlay is a separate Graphics at depth 5, drawn on top of everything.
 */
export class Tile extends Phaser.GameObjects.Container {
  public readonly gridPos: GridPos;
  public tileType: TileType;

  /** Separate overlay drawn above the terrain at higher depth */
  private grid: Phaser.GameObjects.Graphics;
  private reachable = false;
  private pathPreview = false;
  private spellHighlighted = false;
  private threatHighlighted = false;
  private _hover = false;

  constructor(scene: Phaser.Scene, gridPos: GridPos, tileType: TileType, biome: Biome = "grass") {
    const screen = gridToScreen(gridPos);
    super(scene, screen.x, screen.y);

    this.gridPos = gridPos;
    this.tileType = tileType;

    // Pick a tile variant based on grid position for visual variety
    const texKeys = TILE_TEX[biome];
    const variantIdx = (gridPos.x + gridPos.y * 3) % texKeys.length;
    const grassKey = texKeys[variantIdx];

    if (tileType !== TileType.Obstacle) {
      // Terrain block sprite
      const grass = scene.add.image(0, 0, grassKey);
      const scaleX = TILE_WIDTH / grass.width;
      const scaleY = TILE_HEIGHT / (grass.height * 0.5);
      const scale = Math.max(scaleX, scaleY);
      grass.setScale(scale);
      grass.setOrigin(0.5, 0.35);
      this.add(grass);
    } else {
      // Hole/pit for obstacle tiles
      const hole = scene.add.graphics();
      hole.fillStyle(0x0a0008, 0.85);
      hole.beginPath();
      hole.moveTo(0, -HH);
      hole.lineTo(HW, 0);
      hole.lineTo(0, HH);
      hole.lineTo(-HW, 0);
      hole.closePath();
      hole.fillPath();
      // Subtle inner shadow
      hole.fillStyle(0x220011, 0.5);
      const s = 0.6;
      hole.beginPath();
      hole.moveTo(0, -HH * s);
      hole.lineTo(HW * s, 0);
      hole.lineTo(0, HH * s);
      hole.lineTo(-HW * s, 0);
      hole.closePath();
      hole.fillPath();
      this.add(hole);
    }

    this.setDepth(0);

    // Grid overlay — independent Graphics object at higher depth
    this.grid = scene.add.graphics();
    this.grid.setPosition(screen.x, screen.y);
    this.grid.setDepth(5);
    this.drawOverlay(HIGHLIGHT.none);

    // Diamond hit area for interaction
    const points = [
      new Phaser.Geom.Point(HW, 0),
      new Phaser.Geom.Point(TILE_WIDTH, HH),
      new Phaser.Geom.Point(HW, TILE_HEIGHT),
      new Phaser.Geom.Point(0, HH),
    ];
    if (tileType !== TileType.Obstacle) {
      this.setSize(TILE_WIDTH, TILE_HEIGHT);
      this.setInteractive(
        new Phaser.Geom.Polygon(points),
        Phaser.Geom.Polygon.Contains,
      );
    }

    scene.add.existing(this);
  }

  override destroy(fromScene?: boolean): void {
    this.grid.destroy(fromScene);
    super.destroy(fromScene);
  }

  setReachable(on: boolean): void {
    this.reachable = on;
    this.applyAppearance();
  }

  setPathPreview(on: boolean): void {
    this.pathPreview = on;
    this.applyAppearance();
  }

  setSpellRange(on: boolean): void {
    this.spellHighlighted = on;
    this.applyAppearance();
  }

  setEnemyThreat(on: boolean): void {
    this.threatHighlighted = on;
    this.applyAppearance();
  }

  setHover(on: boolean): void {
    this._hover = on;
    this.applyAppearance();
  }

  private applyAppearance(): void {
    let h: HighlightStyle;

    if (this.threatHighlighted)       h = HIGHLIGHT.enemyThreat;
    else if (this.spellHighlighted)   h = HIGHLIGHT.spellRange;
    else if (this._hover)             h = HIGHLIGHT.hover;
    else if (this.pathPreview)        h = HIGHLIGHT.pathPreview;
    else if (this.reachable)          h = HIGHLIGHT.reachable;
    else                              h = HIGHLIGHT.none;

    this.drawOverlay(h);
  }

  /** Redraw the diamond overlay (fill + stroke) */
  private drawOverlay(h: HighlightStyle): void {
    this.grid.clear();

    // Fill
    if (h.fillAlpha > 0) {
      this.grid.fillStyle(h.fill, h.fillAlpha);
      this.grid.beginPath();
      this.grid.moveTo(0, -HH);    // north
      this.grid.lineTo(HW, 0);     // east
      this.grid.lineTo(0, HH);     // south
      this.grid.lineTo(-HW, 0);    // west
      this.grid.closePath();
      this.grid.fillPath();
    }

    // Stroke (always drawn for grid visibility)
    this.grid.lineStyle(h.strokeWidth, h.stroke, h.strokeAlpha);
    this.grid.beginPath();
    this.grid.moveTo(0, -HH);
    this.grid.lineTo(HW, 0);
    this.grid.lineTo(0, HH);
    this.grid.lineTo(-HW, 0);
    this.grid.closePath();
    this.grid.strokePath();
  }
}
