import Phaser from "phaser";
import { TILE_HEIGHT, MOVE_STEP_DURATION, DPR } from "../config";
import { gridToScreen } from "../core/iso";
import type { GridPos } from "../core/grid";
import { HpBar } from "./HpBar";

/** Texture keys loaded in BoardScene.preload */
export const BLOB_TEX_IDLE = "blob_red";
export const BLOB_TEX_WALK = "blob_red_walk";
export const BLOB_TEX_ATTACK = "blob_red_attack";
export const BLOB_TEX_HIT = "blob_red_hit";

/** Target display size for the enemy sprite on the board */
const SPRITE_DISPLAY_H = TILE_HEIGHT * 1.4;

/**
 * Sprite-based enemy character.
 * Same public API as Character so BoardScene can use them interchangeably.
 */
export class EnemyCharacter extends Phaser.GameObjects.Container {
  public gridPos: GridPos;
  public isMoving = false;
  private _selected = false;
  private sprite: Phaser.GameObjects.Image;
  private hpBar: HpBar;
  private idleTexture: string;

  constructor(scene: Phaser.Scene, gridPos: GridPos, textureKey = BLOB_TEX_IDLE) {
    super(scene);

    this.idleTexture = textureKey;
    this.gridPos = gridPos;
    const screen = gridToScreen(gridPos);
    this.setPosition(screen.x, screen.y);
    this.setDepth(10);

    // Create the sprite image centered in the container
    this.sprite = scene.add.image(0, 0, textureKey);
    this.applyScale();

    // Offset so the sprite sits on the tile (anchor at bottom-center)
    this.sprite.setOrigin(0.5, 0.85);

    this.add(this.sprite);

    // Make the sprite itself interactive (pixel-perfect with its displayed bounds)
    this.sprite.setInteractive({ useHandCursor: true });
    // Relay sprite events to the container so BoardScene listeners work
    this.sprite.on("pointerover", () => this.emit("pointerover"));
    this.sprite.on("pointerout", () => this.emit("pointerout"));
    this.sprite.on("pointerdown", (p: Phaser.Input.Pointer) => this.emit("pointerdown", p));

    // HP bar
    this.hpBar = new HpBar(scene);
    this.hpBar.syncPosition(screen.x, screen.y);

    scene.add.existing(this);
  }

  get selected(): boolean {
    return this._selected;
  }

  set selected(value: boolean) {
    this._selected = value;
    this.sprite.setTint(value ? 0xffdd88 : 0xffffff);
  }

  updateHp(hp: number, maxHp: number): void {
    this.hpBar.updateHp(hp, maxHp);
  }

  syncHpBarPosition(): void {
    this.hpBar.syncPosition(this.x, this.y);
  }

  override destroy(fromScene?: boolean): void {
    this.hpBar.destroy(fromScene);
    super.destroy(fromScene);
  }

  /** Switch texture and re-apply consistent scale */
  private setTexture(key: string): void {
    this.sprite.setTexture(key);
    this.applyScale();
  }

  /** Scale sprite so it always fits the same display height */
  private applyScale(): void {
    const scale = SPRITE_DISPLAY_H / this.sprite.height;
    this.sprite.setScale(scale);
  }

  /** Quick shake + flash on hit, swap to hurt texture then back to idle */
  playHitReaction(scene: Phaser.Scene): void {
    const baseX = this.x;
    const baseY = this.y;

    this.setTexture(BLOB_TEX_HIT);

    scene.tweens.add({
      targets: this,
      x: baseX - 4 * DPR,
      duration: 40,
      yoyo: true,
      repeat: 2,
      ease: "Sine.easeInOut",
      onUpdate: () => this.hpBar.syncPosition(this.x, this.y),
      onComplete: () => {
        this.setPosition(baseX, baseY);
        this.hpBar.syncPosition(baseX, baseY);
        this.setTexture(this.idleTexture);
      },
    });

    const originalAlpha = this.alpha;
    scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 60,
      yoyo: true,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.alpha = originalAlpha;
      },
    });
  }

  /** Shrink + fade, then destroy */
  playDeathAnimation(scene: Phaser.Scene): Promise<void> {
    return new Promise((resolve) => {
      scene.tweens.add({
        targets: this,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration: 300,
        ease: "Back.easeIn",
        onUpdate: () => this.hpBar.syncPosition(this.x, this.y),
        onComplete: () => {
          this.destroy();
          resolve();
        },
      });
      scene.tweens.add({
        targets: this.hpBar,
        alpha: 0,
        duration: 200,
      });
    });
  }

  /** Face toward a target grid position */
  faceToward(target: GridPos): void {
    this.updateFacing(this.gridPos, target);
  }

  /** Play attack animation: swap to jump texture, bounce up, then back to idle */
  playAttackAnimation(scene: Phaser.Scene): Promise<void> {
    return new Promise((resolve) => {
      this.setTexture(BLOB_TEX_ATTACK);

      scene.tweens.add({
        targets: this,
        y: this.y - 12 * DPR,
        duration: 150,
        yoyo: true,
        ease: "Sine.easeOut",
        onUpdate: () => this.hpBar.syncPosition(this.x, this.y),
        onComplete: () => {
          this.setTexture(this.idleTexture);
          this.hpBar.syncPosition(this.x, this.y);
          resolve();
        },
      });
    });
  }

  /** Flip sprite based on movement direction in grid space.
   *  Default (scaleX > 0) faces bottom-left; flipped (scaleX < 0) faces bottom-right. */
  private updateFacing(from: GridPos, to: GridPos): void {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    // In iso: moving +x or -y means heading screen-right → flip
    if (dx > 0 || dy < 0) {
      this.sprite.setFlipX(true);
    } else if (dx < 0 || dy > 0) {
      this.sprite.setFlipX(false);
    }
  }

  /** Move along grid path with walk texture and smooth easing */
  async moveAlongPath(scene: Phaser.Scene, path: GridPos[]): Promise<void> {
    this.isMoving = true;
    this.setTexture(BLOB_TEX_WALK);
    const len = path.length;

    for (let i = 0; i < len; i++) {
      const prevPos = i === 0 ? this.gridPos : path[i - 1];
      this.updateFacing(prevPos, path[i]);
      const target = gridToScreen(path[i]);

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
          onUpdate: () => {
            this.hpBar.syncPosition(this.x, this.y);
          },
          onComplete: () => {
            this.gridPos = { ...path[i] };
            this.hpBar.syncPosition(this.x, this.y);
            resolve();
          },
        });
      });
    }

    this.setTexture(this.idleTexture);
    this.isMoving = false;
  }
}
