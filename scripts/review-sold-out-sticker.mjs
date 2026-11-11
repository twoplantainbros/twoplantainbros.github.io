import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

import fs from "fs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const base = "http://127.0.0.1:8765/";
const outDir = path.join(root, "design", "sticker-review");
fs.mkdirSync(outDir, { recursive: true });

const cases = [
  { name: "hero-desk", width: 1280, height: 900, before: async (page) => page.locator(".g-hero-desk").scrollIntoViewIfNeeded() },
  { name: "hero-mob", width: 390, height: 844, before: async (page) => page.locator("#hero-mobile").scrollIntoViewIfNeeded() },
  {
    name: "showcase-salt",
    width: 1280,
    height: 900,
    before: async (page) => {
      await page.locator("#chapter-salt").scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
    },
  },
  {
    name: "showcase-bbq",
    width: 1280,
    height: 900,
    before: async (page) => {
      await page.locator("#chapter-bbq").scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
    },
  },
];

function reportPlacement(label, bag, sticker) {
  if (!bag || !sticker) return { label, ok: false, reason: "missing element" };
  const br = bag.getBoundingClientRect();
  const sr = sticker.getBoundingClientRect();
  const visible = sr.width > 2 && sr.height > 2;
  const cx = (sr.left + sr.right) / 2;
  const cy = (sr.top + sr.bottom) / 2;
  const bagTopRight = { x: br.right, y: br.top };
  const inTopRight =
    cx >= br.left + br.width * 0.45 && cy <= br.top + br.height * 0.35;
  const notClippedLeft = sr.left >= br.left - 4;
  const inFront = visible && sr.width > 0;
  return {
    label,
    ok: visible && inTopRight && notClippedLeft,
    visible,
    inTopRight,
    bag: { w: Math.round(br.width), h: Math.round(br.height), top: Math.round(br.top), right: Math.round(br.right) },
    sticker: {
      top: Math.round(sr.top),
      right: Math.round(sr.right),
      centerX: Math.round(cx),
      centerY: Math.round(cy),
    },
    deltaFromBagTopRight: {
      x: Math.round(cx - bagTopRight.x),
      y: Math.round(cy - bagTopRight.y),
    },
  };
}

const browser = await chromium.launch();
const results = [];

for (const c of cases) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: c.width, height: c.height });
  await page.goto(base, { waitUntil: "networkidle" });
  await c.before(page);

  const data = await page.evaluate(() => {
    const pick = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        rect: { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height },
        opacity: cs.opacity,
        visibility: cs.visibility,
        zIndex: cs.zIndex,
        top: cs.top,
        right: cs.right,
        left: cs.left,
        transform: cs.transform,
      };
    };
    return {
      heroDeskSalt: {
        bag: pick(".g-hero-desk [data-flavor=salt] .g-bowl-bag img"),
        sticker: pick(".g-hero-desk [data-flavor=salt] .g-bowl-bag .g-sticker"),
      },
      mob: {
        bag: pick(".m-stage__bag-img.is-active"),
        sticker: pick(".m-stage__bag .g-sticker--mob"),
      },
      showcase: {
        bag: pick(".g-stage__bag-pocket .g-stage__bag.is-active"),
        sticker: pick(".g-stage__bag-pocket .g-sticker--showcase"),
      },
    };
  });

  await page.screenshot({ path: path.join(outDir, `${c.name}.png`) });

  const desk = data.heroDeskSalt;
  const mob = data.mob;
  const show = data.showcase;

  if (c.name.startsWith("hero-desk") && desk.bag && desk.sticker) {
    results.push(
      reportPlacement(
        "hero-desk-salt",
        { getBoundingClientRect: () => desk.bag.rect },
        { getBoundingClientRect: () => desk.sticker.rect }
      )
    );
  }
  if (c.name === "hero-mob" && mob.bag && mob.sticker) {
    results.push(
      reportPlacement(
        "hero-mob",
        { getBoundingClientRect: () => mob.bag.rect },
        { getBoundingClientRect: () => mob.sticker.rect }
      )
    );
  }
  if (c.name.startsWith("showcase") && show.bag && show.sticker) {
    results.push(
      reportPlacement(
        c.name,
        { getBoundingClientRect: () => show.bag.rect },
        { getBoundingClientRect: () => show.sticker.rect }
      )
    );
  }

  await page.close();
}

await browser.close();

fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
const bad = results.filter((r) => !r.ok);
process.exitCode = bad.length ? 1 : 0;
