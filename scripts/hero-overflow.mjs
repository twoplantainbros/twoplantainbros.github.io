import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1024, height: 900 });
await page.goto("http://127.0.0.1:8765/", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
const data = await page.evaluate(() => {
  const root = document.querySelector(".g-hero-desk");
  const vw = document.documentElement.clientWidth;
  return [...root.querySelectorAll("*")].map((el) => {
    const r = el.getBoundingClientRect();
    return { cls: el.className ? String(el.className).slice(0, 60) : el.tagName, right: Math.round(r.right), over: Math.round(r.right - vw) };
  }).filter((x) => x.over > 1).sort((a, b) => b.over - a.over);
});
console.log(data.slice(0, 15));
await browser.close();
