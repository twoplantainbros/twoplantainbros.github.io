import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1024, height: 900 });
await page.goto("http://127.0.0.1:8765/", { waitUntil: "networkidle" });
await page.waitForTimeout(2000);
const data = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const picks = ["header", "main > section", "main > div", ".g-showcase", "footer"];
  const sections = [...document.querySelectorAll("body.gambit-page > * , main > *")];
  return sections.map((el) => {
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName + (el.className ? "." + String(el.className).split(" ")[0] : ""),
      scrollW: el.scrollWidth,
      clientW: el.clientWidth,
      rectRight: Math.round(r.right),
      over: Math.round(r.right - vw),
    };
  }).filter((x) => x.over > 2 || x.scrollW > vw + 2);
});
console.log(data);
await browser.close();
