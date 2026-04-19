import Phaser from "phaser";
import { DPR } from "../config";

/**
 * Floating damage number that rises and fades out.
 * Scales up for bigger hits. Self-destructs after animation completes.
 */
export function showDamagePopup(
  scene: Phaser.Scene,
  x: number,
  y: number,
  damage: number,
): void {
  const isBigHit = damage >= 10;
  const fontSize = isBigHit ? `${22 * DPR}px` : `${16 * DPR}px`;
  const color = isBigHit ? "#ff2222" : "#ff4444";

  const text = scene.add.text(x, y - 20 * DPR, `-${damage}`, {
    fontFamily: "monospace",
    fontSize,
    fontStyle: "bold",
    color,
    stroke: "#000000",
    strokeThickness: 3 * DPR,
  });
  text.setOrigin(0.5);
  text.setDepth(30);

  // Start slightly scaled up for big hits, then settle
  if (isBigHit) {
    text.setScale(1.4);
    scene.tweens.add({
      targets: text,
      scaleX: 1,
      scaleY: 1,
      duration: 150,
      ease: "Back.easeOut",
    });
  }

  scene.tweens.add({
    targets: text,
    y: y - 55 * DPR,
    alpha: 0,
    duration: 700,
    ease: "Sine.easeOut",
    onComplete: () => text.destroy(),
  });
}
