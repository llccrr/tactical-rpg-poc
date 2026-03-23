import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();

page.on("pageerror", (err) => console.log("[PAGE ERROR]", err.message));

await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(500);

// 1. Character create
console.log("=== 1. Character Create ===");
await page.locator("h2").first().click();
await page.waitForTimeout(200);
await page.locator("button", { hasText: "Commencer" }).click();
await page.waitForTimeout(500);
console.log("OK - class selected, moved to hub");

// 2. Hub screen
console.log("\n=== 2. Hub ===");
const hubTitle = await page.textContent("h1");
console.log("Hub title:", hubTitle);

// 3. Enter dungeon
console.log("\n=== 3. Enter dungeon ===");
await page.locator("button", { hasText: "Entrer" }).first().click();
await page.waitForTimeout(3000);

const fightState = await page.evaluate(() => {
  const canvas = document.querySelector("canvas");
  const canvasParent = canvas?.parentElement;
  const canvasRect = canvas?.getBoundingClientRect();

  // Check HUD - HP values
  const spans = Array.from(document.querySelectorAll("span"));
  const hpTexts = spans.map(s => s.textContent).filter(Boolean);

  return {
    canvasExists: !!canvas,
    canvasInContainer: canvasParent?.getAttribute("style")?.includes("width: 100%"),
    canvasVisible: canvasRect ? canvasRect.y >= 0 && canvasRect.y < window.innerHeight : false,
    canvasSize: canvasRect ? { w: Math.round(canvasRect.width), h: Math.round(canvasRect.height) } : null,
    hpTexts: hpTexts.slice(0, 10),
  };
});

console.log("Canvas exists:", fightState.canvasExists);
console.log("Canvas in container:", fightState.canvasInContainer);
console.log("Canvas visible:", fightState.canvasVisible);
console.log("Canvas size:", JSON.stringify(fightState.canvasSize));
console.log("HP texts:", fightState.hpTexts);

console.log("\n=== RESULT: " + (fightState.canvasVisible ? "SUCCESS" : "FAIL") + " ===");

await browser.close();
