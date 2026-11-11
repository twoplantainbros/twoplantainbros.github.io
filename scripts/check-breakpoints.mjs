import { chromium } from "playwright";

const widths = [390, 600, 767, 768, 900, 1024, 1180, 1280, 1440, 1920];
const base = "http://127.0.0.1:8765/";

const browser = await chromium.launch();
const page = await browser.newPage();

const rows = [];
for (const w of widths) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  const metrics = await page.evaluate(() => {
    const de = document.documentElement;
    const body = document.body;
    const desk = document.querySelector(".g-hero-desk");
    const mob = document.querySelector(".g-hero-mob");
    const deskOn = desk && getComputedStyle(desk).display !== "none";
    const mobOn = mob && getComputedStyle(mob).display !== "none";
    return {
      scrollW: Math.max(de.scrollWidth, body.scrollWidth),
      clientW: de.clientWidth,
      overflow: Math.max(de.scrollWidth, body.scrollWidth) - de.clientWidth,
      deskHero: deskOn,
      mobHero: mobOn,
    };
  });
  rows.push({ w, ...metrics });
  await page.screenshot({
    path: `/Users/athu/Documents/GitHub/twoplantainbros.github.io/design/check-${w}.png`,
    fullPage: false,
  });
}

console.table(rows);
const bad = rows.filter((r) => r.overflow > 2);
if (bad.length) {
  console.log("OVERFLOW at:", bad.map((r) => r.w).join(", "));
  process.exitCode = 1;
}
await browser.close();
