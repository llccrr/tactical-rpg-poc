import Phaser from "phaser";
const BAR_WIDTH = 32;
const BAR_HEIGHT = 4;
const BAR_OFFSET_Y = -28; // above the character cube
export class HpBar extends Phaser.GameObjects.Graphics {
    constructor(scene) {
        super(scene);
        this.currentRatio = 1;
        this.setDepth(20);
        this.drawBar(1);
        scene.add.existing(this);
    }
    /** Update the bar to reflect current HP ratio (0..1) */
    updateHp(hp, maxHp) {
        const ratio = Math.max(0, Math.min(1, hp / maxHp));
        if (ratio === this.currentRatio)
            return;
        this.currentRatio = ratio;
        this.drawBar(ratio);
    }
    /** Position the bar relative to a character's screen position */
    syncPosition(x, y) {
        this.setPosition(x, y + BAR_OFFSET_Y);
    }
    drawBar(ratio) {
        this.clear();
        const hw = BAR_WIDTH / 2;
        const hh = BAR_HEIGHT / 2;
        // Background (dark)
        this.fillStyle(0x222222, 0.8);
        this.fillRect(-hw, -hh, BAR_WIDTH, BAR_HEIGHT);
        // Fill (green → yellow → red based on ratio)
        const color = ratio > 0.5 ? 0x44cc44 : ratio > 0.25 ? 0xcccc44 : 0xcc3333;
        this.fillStyle(color, 1);
        this.fillRect(-hw, -hh, BAR_WIDTH * ratio, BAR_HEIGHT);
        // Border
        this.lineStyle(1, 0x000000, 0.5);
        this.strokeRect(-hw, -hh, BAR_WIDTH, BAR_HEIGHT);
    }
}
