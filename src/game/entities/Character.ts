import Phaser from "phaser";
import { TILE_WIDTH, TILE_HEIGHT, MOVE_STEP_DURATION } from "../config";
import { gridToScreen } from "../core/iso";
import type { GridPos } from "../core/grid";

/** Cube dimensions in isometric projection */
const CUBE_W = TILE_WIDTH * 0.45;   // width of the cube footprint
const CUBE_H = TILE_HEIGHT * 0.45;  // depth of the cube footprint (iso)
const CUBE_ELEVATION = 20;          // cube height in pixels

export interface CharacterColors {
  top: number;
  left: number;
  right: number;
  topSelected: number;
  leftSelected: number;
  rightSelected: number;
  stroke: number;
}

const PLAYER_COLORS: CharacterColors = {
  top:    0xee5533,
  left:   0xbb3322,
  right:  0xdd4428,
  topSelected:    0xffaa44,
  leftSelected:   0xcc8833,
  rightSelected:  0xdd9938,
  stroke: 0xffffff,
};

export const ENEMY_COLORS: CharacterColors = {
  top:    0x5566ee,
  left:   0x3344bb,
  right:  0x4455dd,
  topSelected:    0x77aaff,
  leftSelected:   0x5588dd,
  rightSelected:  0x6699ee,
  stroke: 0xffffff,
};

/**
 * Character rendered as a small isometric cube,
 * centered on its tile. Used for both player and enemies.
 */
export class Character extends Phaser.GameObjects.Graphics {
  public gridPos: GridPos;
  private _selected = false;
  public isMoving = false;
  private colors: CharacterColors;

  constructor(scene: Phaser.Scene, gridPos: GridPos, colors: CharacterColors = PLAYER_COLORS) {
    super(scene);

    this.colors = colors;
    this.gridPos = gridPos;
    const screen = gridToScreen(gridPos);
    this.setPosition(screen.x, screen.y);
    this.setDepth(10);
    this.draw();

    // Hit area: a rectangle covering the cube for easy clicking
    const hitW = CUBE_W + 4;
    const hitH = CUBE_ELEVATION + CUBE_H + 4;
    this.setInteractive(
      new Phaser.Geom.Rectangle(-hitW / 2, -CUBE_ELEVATION - CUBE_H / 2, hitW, hitH),
      Phaser.Geom.Rectangle.Contains,
    );

    scene.add.existing(this);
  }

  get selected(): boolean {
    return this._selected;
  }

  set selected(value: boolean) {
    this._selected = value;
    this.draw();
  }

  /** Animate movement along a path with smooth acceleration/deceleration */
  async moveAlongPath(
    scene: Phaser.Scene,
    path: GridPos[],
  ): Promise<void> {
    this.isMoving = true;
    const len = path.length;

    for (let i = 0; i < len; i++) {
      const target = gridToScreen(path[i]);

      // First step: ease in — last step: ease out — middle: linear
      let ease: string;
      if (len === 1) ease = "Sine.easeInOut";
      else if (i === 0) ease = "Sine.easeIn";
      else if (i === len - 1) ease = "Sine.easeOut";
      else ease = "Linear";

      await new Promise<void>((resolve) => {
        scene.tweens.add({
          targets: this,
          x: target.x,
          y: target.y,
          duration: MOVE_STEP_DURATION,
          ease,
          onComplete: () => {
            this.gridPos = { ...path[i] };
            resolve();
          },
        });
      });
    }

    this.isMoving = false;
  }

  /** Draw the three visible faces of the isometric cube */
  private draw(): void {
    this.clear();

    const hw = CUBE_W / 2;   // half-width
    const hh = CUBE_H / 2;   // half-height (iso depth)
    const el = CUBE_ELEVATION;

    const c = this.colors;
    const top   = this._selected ? c.topSelected   : c.top;
    const left  = this._selected ? c.leftSelected  : c.left;
    const right = this._selected ? c.rightSelected : c.right;

    // -- Top face (diamond) --
    this.fillStyle(top, 1);
    this.lineStyle(1.5, c.stroke, 0.5);
    this.beginPath();
    this.moveTo(0, -el - hh);       // north
    this.lineTo(hw, -el);            // east
    this.lineTo(0, -el + hh);       // south
    this.lineTo(-hw, -el);           // west
    this.closePath();
    this.fillPath();
    this.strokePath();

    // -- Left face --
    this.fillStyle(left, 1);
    this.lineStyle(1.5, c.stroke, 0.3);
    this.beginPath();
    this.moveTo(-hw, -el);           // top-left
    this.lineTo(0, -el + hh);       // top-right (south of top face)
    this.lineTo(0, hh);              // bottom-right
    this.lineTo(-hw, 0);             // bottom-left
    this.closePath();
    this.fillPath();
    this.strokePath();

    // -- Right face --
    this.fillStyle(right, 1);
    this.lineStyle(1.5, c.stroke, 0.3);
    this.beginPath();
    this.moveTo(hw, -el);            // top-right
    this.lineTo(0, -el + hh);       // top-left (south of top face)
    this.lineTo(0, hh);              // bottom-left
    this.lineTo(hw, 0);              // bottom-right
    this.closePath();
    this.fillPath();
    this.strokePath();
  }
}
