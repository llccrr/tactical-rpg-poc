import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();

// Collect console logs
const logs = [];
page.on("console", (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));
page.on("pageerror", (err) => logs.push(`[PAGE ERROR] ${err.message}`));

await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);

// Step 1: CharacterCreate screen
console.log("=== Step 1: CharacterCreate ===");
const createTitle = await page.textContent("h1");
console.log("Title:", createTitle);

// Click first class card then Commencer
const classCards = await page.locator("h2").all();
console.log("Class cards:", classCards.length);
if (classCards.length > 0) {
  await classCards[0].click();
  await page.waitForTimeout(300);
}
const startBtn = page.locator("button", { hasText: "Commencer" });
await startBtn.click();
await page.waitForTimeout(500);

// Step 2: Should be on Hub now
console.log("\n=== Step 2: Hub ===");
const hubTitle = await page.textContent("h1");
console.log("Title:", hubTitle);

// Click first dungeon "Entrer" button
const enterBtn = page.locator("button", { hasText: "Entrer" }).first();
if (await enterBtn.isVisible()) {
  console.log("Found 'Entrer' button, clicking...");
  await enterBtn.click();
} else {
  console.log("ERROR: No 'Entrer' button found!");
}
await page.waitForTimeout(2000); // Wait for Phaser to init

// Step 3: Fight screen
console.log("\n=== Step 3: Fight screen ===");

// Check for canvas
const canvases = await page.locator("canvas").all();
console.log("Canvas elements found:", canvases.length);

for (let i = 0; i < canvases.length; i++) {
  const box = await canvases[i].boundingBox();
  console.log(`  Canvas ${i}: ${JSON.stringify(box)}`);
  const visible = await canvases[i].isVisible();
  console.log(`  Visible: ${visible}`);
}

// Check container ref div
const containerDiv = await page.locator('[style*="width: 100%"]').first();
if (containerDiv) {
  const box = await containerDiv.boundingBox();
  console.log("Container div boundingBox:", JSON.stringify(box));
}

// Check parent div (flex: 1)
const parentBox = await page.evaluate(() => {
  const el = document.querySelector("canvas");
  if (!el) return "no canvas found";
  const parent = el.parentElement;
  if (!parent) return "no parent";
  const pp = parent.parentElement;
  return {
    canvas: { w: el.clientWidth, h: el.clientHeight, display: getComputedStyle(el).display },
    parent: { w: parent.clientWidth, h: parent.clientHeight, tag: parent.tagName, style: parent.getAttribute("style") },
    grandparent: pp ? { w: pp.clientWidth, h: pp.clientHeight, tag: pp.tagName, style: pp.getAttribute("style") } : null,
  };
});
console.log("DOM hierarchy:", JSON.stringify(parentBox, null, 2));

// Check game state via HUD
const hpText = await page.evaluate(() => {
  // Look for HP numbers in the HUD
  const spans = Array.from(document.querySelectorAll("span"));
  return spans.slice(0, 20).map((s) => s.textContent).filter(Boolean);
});
console.log("Span texts:", hpText);

// Print console logs from browser
console.log("\n=== Browser console ===");
for (const log of logs) {
  console.log(log);
}

await browser.close();
