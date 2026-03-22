import Phaser from "phaser";

/**
 * Floating damage number that rises and fades out.
 * Self-destructs after animation completes.
 */
export function showDamagePopup(
  scene: Phaser.Scene,
  x: number,
  y: number,
  damage: number,
): void {
  const text = scene.add.text(x, y - 20, `-${damage}`, {
    fontFamily: "monospace",
    fontSize: "16px",
    fontStyle: "bold",
    color: "#ff4444",
    stroke: "#000000",
    strokeThickness: 3,
  });
  text.setOrigin(0.5);
  text.setDepth(30);

  scene.tweens.add({
    targets: text,
    y: y - 50,
    alpha: 0,
    duration: 600,
    ease: "Sine.easeOut",
    onComplete: () => text.destroy(),
  });
}
