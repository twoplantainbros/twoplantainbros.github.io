# Gambit redesign: delta to rev 9

**For Cursor.** This file only covers what changed since the handoff package you're already building from (rev 8.1: sold-out mode + Name/Phone waitlist). Everything not mentioned here is unchanged, including assets, sold-out mode, waitlist wiring, pricing and SEO.

Apply the changes in order. Each section says **where**, **what**, and **how to check it**.

---

## 1. Hero headline copy (desktop + mobile)

**Where:** hero `h1`, hero intro paragraph, both tickers.

| | Before | After |
|---|---|---|
| h1 line 2 | `Ridiculously crisp.` | `One chip and you’ll get it.` |
| Intro paragraph | "We took a gambit on these chips and we’re hoping you will too. One chip and you’ll get it." | "We took a gambit on these chips and we’re hoping you will too." (drop the last sentence; it's the headline now) |
| Ticker items | `Waffle cut · Ridiculously crisp · Plantain chips` | `Waffle cut · One chip and you’ll get it · Plantain chips` (both the dark ticker and the red reverse ticker) |

Sizes change because the line is longer:
- Desktop h1: `font-size: clamp(44px, 4.7vw, 76px); line-height: .92` (was `clamp(48px, 5.6vw, 88px)`).
- Desktop intro column: `max-width: 320px` (was 360px). At ≥ 1024px the headline and intro must sit side by side, with the three bowls visible above the fold at 1440×900.
- Mobile h1: `42px`, `line-height: .92` (was 46px). It now wraps to 3 lines ("Waffle cut. / One chip and / you’ll get it."), which is expected.
- Keep the clip-rise animation on both h1 lines exactly as before.

Search the codebase for "Ridiculously crisp". It should appear nowhere afterwards, including meta titles and OG text.

---

## 2. Flavor-showcase spin: soft detents + eased motion (desktop)

**Why:** the bowl should "land" on each flavor and glide on mouse-wheel steps. **Don't** use `scroll-snap-type` or any scroll hijacking. It fights trackpad momentum, traps users, breaks anchors and find-in-page, and is flaky with `position: sticky` in Safari.

**Replace** the old mapping `rotate(progress × 540deg)` with the following (framework-agnostic; adapt to your component). Run `update()` on scroll and resize, rAF-throttled. Write the transform directly to the bowl element, **never through component state**.

```js
// chapters: the 3 [data-chapter] elements (Salt, BBQ, Churro) in order
// bowlEl: the rotating wrapper inside the sticky stage
let angle = 0, target = 0, spinning = false;

function update() {
  const vc = window.innerHeight / 2;
  const c = chapters.map(n => { const b = n.getBoundingClientRect(); return b.top + b.height / 2; });
  // f = continuous chapter position: 0 at Salt's center, 1 at BBQ's, 2 at Churro's (extrapolated past the ends)
  let f;
  if (vc <= c[0]) f = (vc - c[0]) / (c[1] - c[0]);
  else if (vc >= c[c.length - 1]) f = (c.length - 1) + (vc - c[c.length - 1]) / (c[c.length - 1] - c[c.length - 2]);
  else { let i = 0; while (vc > c[i + 1]) i++; f = i + (vc - c[i]) / (c[i + 1] - c[i]); }

  // Detents: rest while a flavor is centered, turn 120° between flavors, slight drift so it never looks frozen.
  const base = Math.floor(f), frac = f - base;
  const t = Math.min(1, Math.max(0, (frac - 0.22) / 0.56));
  const ease = t * t * (3 - 2 * t);                                  // smoothstep
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  target = reduce ? 0 : (base + 0.12 * frac + 0.88 * ease) * 120;   // monotonic in scroll
  reduce ? (angle = 0, apply()) : start();

  setActiveFlavor(Math.max(0, Math.min(chapters.length - 1, Math.round(f)))); // switches mid-turn
}

function apply() { bowlEl.style.transform = `rotate(${angle.toFixed(2)}deg)`; }

function start() {               // frame-rate-independent easing toward the target
  if (spinning) return; spinning = true; let last = performance.now();
  const tick = now => {
    const dt = Math.min(64, now - last) / 1000; last = now;
    const d = target - angle;
    if (Math.abs(d) < 0.05) { angle = target; apply(); spinning = false; return; }
    angle += d * (1 - Math.exp(-dt * 7));
    apply(); requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
```

The active flavor now comes from `Math.round(f)`, replacing "nearest chapter center". It switches halfway through the turn, so the theme color, bowl crossfade and bag swap all happen while the bowl is moving.

**Check:** with a flavor centered, the bowl sits at about 0°, 120° or 240° and barely moves. Between flavors it turns smoothly, never backwards. One notched mouse-wheel click glides instead of jumping. With reduced motion on, the bowl stays at 0°.

---

## 3. Flavor dots on the stage (desktop)

**Where:** inside the sticky stage, on its right edge.

**What:** a vertical `nav` with 3 buttons (`aria-label="Salt" | "BBQ" | "Churro"`, `aria-current="true"` on the active one). Clicking one smooth-scrolls that chapter to the viewport center (`scrollIntoView({ behavior: 'smooth', block: 'center' })`).

```css
.dots{position:absolute;right:-6px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:10px;z-index:4}
.dot{position:relative;width:10px;height:10px;border-radius:999px;border:0;padding:0;background:currentColor;opacity:.3;cursor:pointer;
     transition:height .4s cubic-bezier(.2,.8,.2,1),opacity .3s ease}
.dot[aria-current="true"]{height:28px;opacity:.9}
.dot::before{content:"";position:absolute;inset:-12px}   /* 34px hit area */
@media (max-width: 767px){.dots{display:none}}
```

The dots inherit the section's theme ink color through `currentColor`.

---

## 4. Responsive tiers (replaces the single 860px breakpoint)

The desktop layout now holds down to 768px (half-screen on a laptop). Below that, use the mobile design.

| Width | Tier | Rules |
|---|---|---|
| ≥ 1181px | Desktop | As designed. Content max 1320px (Build your box 1240px). |
| 1024–1180px | Laptop | Hero trio captions stack: name above the short line, centered, and the hover arrow is hidden. |
| 768–1023px | Small laptop / half-screen | Showcase **stays two columns with the sticky spinning bowl**. Box cards **stay 3-up**. About stays two columns. |
| < 768px | Mobile | Mobile design (tabbed hero, swipe cards, bottom sheet). **Cap mobile content at about 560px, centered**, so 600–767px windows don't stretch. |

```css
/* Box cards: always 3-up on desktop tiers; bags scale with width */
.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(12px,1.6vw,20px)}
.bagbox{height:clamp(230px,24vw,320px)}               /* card bag area */
.bagbox .bag{height:clamp(210px,22.6vw,300px)}        /* the bag image (explicit height, not %) */

/* About: fixed two-column ratio instead of auto-fit (auto-fit stacked at ~900px and blew the photo up) */
.story{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);gap:clamp(36px,6vw,88px);align-items:start}

@media (max-width: 1180px){
  .hero-caption{flex-direction:column;align-items:center;gap:2px;text-align:center}
  .hero-caption .arrow{display:none}
}
@media (max-width: 1023px){
  .showcase-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
  .chapter{min-height:560px}
  .chapter h2{font-size:clamp(56px,8vw,96px)}
  .stage{top:110px}
}
```

Notes:
- The box-card bag must have an **explicit height** (above), not `height: calc(100% − …)`. A percentage height inside the grid cell resolves to the image's natural 1280px and overflows into About.
- The **"Sold out" sticker on box cards** is now positioned `top: 8px; right: max(6px, calc(50% − 150px))` (was `left: calc(50% + 46px)`), so it stays inside narrow cards.
- Anywhere you used `min-height` in `vh` for showcase chapters, use `px` (640 desktop, 560 at ≤ 1023).

**Check:** no horizontal scroll and no 2 + 1 orphaned card row at 1920, 1440, 1280, 1024, 900 and 768. At 768 the bowl still spins with scroll. At 600 and 390 you see the mobile design, centered and capped.

---

## 5. Acceptance additions

- [ ] "Ridiculously crisp" appears nowhere. The headline is "Waffle cut. / One chip and you’ll get it." on desktop and mobile, and the intro no longer repeats the tagline.
- [ ] Spin rests on each flavor, glides on wheel clicks, never reverses, and dots jump to each flavor. Test with a trackpad **and** a notched mouse.
- [ ] Tiers hold at 1920 / 1440 / 1280 / 1024 / 900 / 768, with mobile below 768.
- [ ] Reduced motion still disables everything (spin stays at 0°).

Reference: `reference/desktop.html` in the original package shows the old spin. The live design canvas has rev 9 if you need to eyeball it.
