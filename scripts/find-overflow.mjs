import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1024, height: 900 });
await page.goto("http://127.0.0.1:8765/", { waitUntil: "networkidle" });
await page.waitForTimeout(2500);

const offenders = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const out = [];
  document.querySelectorAll("*").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.right > vw + 2 || r.left < -2) {
      const cs = getComputedStyle(el);
      out.push({
        tag: el.tagName,
        cls: (el.className && String(el.className).slice(0, 80)) || "",
        left: Math.round(r.left),
        right: Math.round(r.right),
        w: Math.round(r.width),
      });
    }
  });
  out.sort((a, b) => b.right - a.right);
  return out.slice(0, 25);
});
console.log(offenders);
await browser.close();
