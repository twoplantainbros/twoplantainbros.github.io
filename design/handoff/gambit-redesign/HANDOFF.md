# Gambit site redesign: implementation handoff

**For:** the Cursor agent working in the Gambit codebase. You already know the backend; this doc covers the frontend design, motion, assets and the points where the UI talks to the backend.
**Status:** design approved for build (rev 8, 11 Nov 2026).
**Important:** every flavor is **sold out right now**. Ship the sold-out state (§7.4) first. The in-stock shop is the same page with inventory switched on.

---

## 0. Start here

1. Open `reference/desktop.html` and `reference/mobile.html` straight from disk in Chrome. These are the source of truth for every animation and interaction. Scroll the desktop page slowly, hover the bowls, fill in and submit the waitlist form (name + phone), and tap the flavor tabs on mobile. To see the in-stock shop (box builder, case shelf, order summary), add `?instock` to the URL.
2. Look at `screenshots/` for the resting states.
3. Read this doc for exact values, rules and wiring.
4. Build it in the **existing frontend stack** as one responsive page. Don't ship the reference pages. They run on a throwaway template renderer (see §10).

### Package contents

| Path | What |
|---|---|
| `HANDOFF.md` | This spec |
| `reference/desktop.html`, `reference/mobile.html` | Runnable prototypes (desktop is 1440 wide; mobile is a 390×844 phone frame) |
| `design-source/Main.dc.html`, `Mobile.dc.html` | Raw design files: markup, CSS and logic in one file each. Use them to look up any exact value this doc doesn't list. |
| `assets/` | Every production image (see §6) |
| `screenshots/desktop`, `screenshots/mobile` | Static captures of each section |
| `tools/` | Python scripts that made the bowl cut-outs and bag shots, so the photos can be regenerated when better ones arrive |

---

## 1. Non-negotiables

- **The chips are the hero.** Whole bowls of real chips, shot top-down, lead the landing page and the flavor section. Don't crop in tighter.
- **The bags are small up top and the star of the box builder.**
- **Real photos only.** No 3D, no cut-out floating chips, no generated imagery. Everything that moves is a real photo or the real label art.
- **Copy:** long-form copy is verbatim from gambitchips.com. Don't edit it (see §8 for what's verbatim and what's new).
- **Shipping is free on every order, singles and cases alike.** Never show "calculated at checkout", and never make free shipping depend on buying a case.
- **The order flow must feel like an established snack brand:** a clear price, a summary with line items, an explicit "Shipping: Free", a lock on the checkout button, and trust lines. Use only claims that are true (§8.4). Don't invent reviews, badges or payment logos.
- **`prefers-reduced-motion`:** switch off every animation and the scroll spin. The layout must still work fully.

---

## 2. Responsive model

Designs exist at **1440px** (desktop) and **390px** (mobile). Build one page with a breakpoint at **860px**:

| Area | ≥ 860px (desktop) | < 860px (mobile) |
|---|---|---|
| Header | Logo · Flavors/About/FAQ links · Instagram · Box pill with count | Logo · Box pill with count. Pad the top by `env(safe-area-inset-top)`. |
| Hero | Headline left, intro + CTA right, then a row of 3 bowls, each with its bag | Headline + intro, one big bowl with its bag, Salt/BBQ/Churro segmented tabs, flavor description, add button. The hero background recolors per flavor. |
| Flavor showcase | 3 scroll chapters on the left, sticky spinning bowl on the right | Not a separate section; the tabbed hero covers it |
| Real-photo strip | Auto-drifting marquee | Horizontal swipe, scroll-snap, 300px 4:5 cards |
| Build your box | 3 flavor cards with big bags, then "Your case" shelf and Order summary side by side | Swipeable flavor cards, a "Your case" shelf and a "Review box" button that opens a bottom sheet with the summary |
| About / Our gambit | Sticky square founders photo left, copy right, on a dark band | Stacked on a dark band, 4:3 photo |
| Closing | Butter band, 3 big bowls spin in, headline, CTA | Same at smaller size (128px bowls, idle spin only) |
| FAQ | Centered column, accordion | Same |
| Second ticker | Red band above the footer, scrolling in reverse | (optional on mobile) |
| Footer | 4 columns | Stacked. Pad the bottom by `env(safe-area-inset-bottom)`. |

Use `px` or `clamp()` for section heights, not `vh`. The design avoids viewport units for layout.

---

## 3. Design tokens

### Color

```
--cream:        #F6F0E6  /* page background, header */
--ink:          #22130B  /* text, primary buttons, footer, About band */
--sand:         #EFE6D6  /* "Your case" panel, quiet panels */
--stepper:      #EAE0CF  /* stepper pill background, disabled CTA */
--paper:        #FFFCF6  /* order summary card */
--text-2:       #4A3428  /* body copy on cream */
--text-3:       #6B5446  /* captions, meta */
--gold:         #E3A92B  /* ticker glyph, @handle on dark */
--butter:       #F3E2AE  /* closing band */
--red-band:     #A42D1E  /* second ticker */
```

Flavor themes. The showcase section and the mobile hero swap to these; transition `background-color` and `color` over .9s (desktop) or .7s (mobile).

| Token | Salt | BBQ | Churro |
|---|---|---|---|
| bg | `#F3E2AE` | `#A42D1E` | `#6A381D` |
| ink | `#22130B` | `#FFF3EA` | `#FBEEDD` |
| sub (body) | `rgba(34,19,11,.78)` | `rgba(255,243,234,.86)` | `rgba(251,238,221,.86)` |
| accent (eyebrow) | `#94650A` | `#FFC9A8` | `#F2B36B` |
| button bg / ink | `#22130B` / `#F6F0E6` | `#FFF3EA` / `#5A140B` | `#FBEEDD` / `#3E1F0D` |
| pill (stepper/tabs) | `rgba(34,19,11,.10)` | `rgba(255,243,234,.16)` | `rgba(251,238,221,.16)` |
| box card tint | `#F6EBC8` | `#F1D6C0` | `#EEDCCB` |

### Type

- **Archivo** (Google Fonts, variable): `family=Archivo:wdth,wght@62..125,400..900`. It is the only typeface.
- Display: weight 800, tracking −0.03 to −0.045em, line-height .86–.95.
  - Hero h1: `clamp(48px, 5.6vw, 88px)` (46px on mobile).
  - Chapter name: `clamp(64px, 8vw, 128px)`.
  - Section h2: `clamp(44px, 5vw, 72px)`.
- Ticker: weight 800, `font-stretch: 112%`, 30px (20px on mobile).
- Eyebrows: 12–13px, weight 700, uppercase, letter-spacing .16–.18em.
- Body: 16–20px, line-height 1.55–1.7.

### Shape and elevation

- Radii: buttons/pills 999px; cards 24–28px; photos 18–24px; mini-bag slots 8–10px.
- Bowl contact shadow: a blurred ellipse under each bowl, not `box-shadow`, because the bowl rotates. Hero: `rgba(34,19,11,.5)`, blur 16px, 80% of bowl width, 14% tall.
- Bags: `filter: drop-shadow(0 14px 14px rgba(34,19,11,.32))`. Box cards use an ellipse shadow instead.
- Tap targets ≥ 44px. Primary buttons are 52–58px tall.

---

## 4. Page sections (desktop, top to bottom)

Exact markup and inline values are in `design-source/Main.dc.html`, with section comments matching these headings.

1. **Header**: sticky, solid cream, 1px bottom hairline. The Box pill shows the live bag count and scrolls to `#box`.
2. **Hero (`#top`)**: h1 "Waffle cut. / Ridiculously crisp." Right column: intro paragraph, "Build your box" button, "Free shipping on every order".
   - Below it, the **trio**: 3 equal columns. Each has a 400px bowl, its bag in front at the bottom-left (24% of the bowl's width, `left:-2%; bottom:3%`), and a caption: name, short line, and an arrow that appears on hover.
   - Clicking a bowl scrolls to that flavor's chapter.
3. **Ticker**: dark band: "Waffle cut ⌗ Ridiculously crisp ⌗ Plantain chips ⌗ …". The glyph is a small gold waffle-grid SVG.
4. **Flavor showcase (`#flavors`)**: a 2-column grid (`560px | 560px`).
   - Left: 3 chapters, each `min-height: 640px` and vertically centered. Each has an eyebrow ("01 · Classic"), the huge name, the description, and an add button. Once added, the button becomes a stepper reading "N in your box".
   - Right: a sticky stage (`top:150px`, max 560px square) holding:
     - a ring of text on a circle path ("WAFFLE-CUT PLANTAIN CHIPS • ONE CHIP AND YOU'LL GET IT •" ×2), rotating slowly;
     - the bowl, which crossfades by active flavor and spins with scroll;
     - the active flavor's bag at the bottom-left (`left:-8%; bottom:-4%; width:23%`);
     - a contact shadow.
   - The section background and text color follow the active flavor's theme.
5. **Real-photo strip**: the 3 scene photos (bowls sitting on real bags), duplicated for a seamless loop, drifting left. Paused on hover.
6. **Build your box (`#box`)**: centered h2 and intro.
   - **Flavor cards** (3-up): tinted card; 300px-tall bag with an ellipse shadow; name; "{note} · 3 servings"; "**$6** a bag in a case · $11.25 single"; "Add {Name}" button, which becomes a stepper.
   - **Your case** (sand panel): title, "{n} of 6 · {case note}", 6 bag-shaped slots that fill with mini bags in add order, a progress bar, the status message, and a "Fill the rest with a mix" outline button (shown only when 0 < n < 6).
   - **Order summary** (paper card): line items (mini bag, "2 × Salt", amount), **Shipping: Free**, Total (single-bag total struck through when case pricing applies), a "🔒 Continue to secure payment" button, and a 2×2 grid of trust lines.
   - **Sold-out mode** (current): the heading becomes "Sold out, for now.", cards get stickers and waitlist toggles, and the waitlist panel replaces the case shelf and order summary. Full spec in §7.4.
7. **About / Our gambit (`#about`, `#story`)**: dark band. Sticky square founders photo with the caption "Himanshu & Atharv" and an @twoplantainbros link (gold). Copy column: About Gambit, lede, paragraph, Our gambit, 3 paragraphs.
8. **Closing**: butter band. 3 bowls (`clamp(160px,18vw,250px)`, overlapping −18px) spin in when the section is 80% into view. h2 "Try one and you'll get it too.", "Build your box" button.
9. **FAQ (`#faq`)**: accordion, one open at a time. The +/− icon fades its vertical stroke. Closing line: "Still curious? {email}".
10. **Second ticker**: same as #3, on `--red-band`, scrolling in reverse.
11. **Footer**: logo; Shop (Flavors, Build your box); Gambit (About Gambit, Our gambit, FAQ); Say hi (@twoplantainbros); legal line.

### Mobile specifics (`design-source/Mobile.dc.html`)

- **Hero**:
  - Full-bleed flavor-themed block: h1, intro.
  - A square stage with the text ring, bowl and bag. The bag is 25% wide at the bottom-left and swaps per flavor.
  - Segmented tabs: the active tab uses the theme's button colors.
  - Eyebrow, description, then an add button or stepper.
- **Box section**:
  - Horizontally swiping flavor cards: 282px wide, scroll-snap center, 224px bags.
  - A "Your case" panel with 6 mini-bag slots and a "Review box · $X" button.
- **Bottom sheet** (the header Box button opens it too):
  - Header and slots.
  - Rows: 40px bag, name, note, stepper.
  - Status message, "Shipping: Free", Total, the locked CTA, then two trust lines and "Fill the rest with a mix".
  - Close it with the × button or by tapping the scrim.
  - Trap focus inside the sheet; Esc closes it.

---

## 5. Motion spec

All easings are listed as `cubic-bezier(...)`. "Spring" means `cubic-bezier(.2,.9,.25,1.15)` or `(.3,1.6–1.7,.5,1)`, which overshoot slightly. One-shot load animations must run **once per page load**. Make sure state changes never re-mount those nodes.

### Desktop

| Element | Trigger | Animation | Duration / easing | Delay |
|---|---|---|---|---|
| h1 lines | load | Clip-rise: `translateY(105%)→0` inside an `overflow:hidden` line | 1s `(.2,.8,.2,1)` | .05s, .17s |
| Hero intro + CTA | load | Fade-up: `opacity 0→1`, `translateY(16px)→0` | .9s `(.2,.8,.2,1)` | 1.5s |
| Hero bowls | load | **Spin in from the right**: from `translateX(70vw / 58vw / 46vw) rotate(420 / 480 / 540deg)`, opacity reaches 1 by 10% → rest | 1.7s `(.12,.82,.22,1)` | .35 / .51 / .67s |
| Bowl shadows | load | `opacity 0, scale .6 → 1` | 1.4s `(.2,.8,.2,1)` | 1.15 / 1.31 / 1.47s |
| Hero bags | load | Pop up: from `opacity 0, translateY(40px) rotate(-10deg)` → `rotate(-5deg)` | 1s spring `(.2,.9,.25,1.15)` | 1.6 / 1.76 / 1.92s |
| Hero captions | load | Fade-up | .9s | 1.3 / 1.44 / 1.58s |
| Hero bowls (idle) | always | `rotate 360deg` linear, infinite | 120s | negative offsets 0 / −37 / −74s so they aren't in sync |
| Bowl hover | hover | Bowl `translateY(-12px) rotate(28deg)`. Shadow `scale(.88)`, opacity .7. Bag `translateY(-6px) rotate(-2deg)`. Arrow fades in. | 1s / .8s `(.2,.8,.2,1)` | none |
| Ticker | always | `translateX(0 → -50%)` on a duplicated track | 36s linear infinite | none |
| Showcase bowl spin | **scroll** | `rotate(progress × 540deg)`, where `progress = clamp((vh − rect.top) / (rect.height + vh), 0, 1)` for the showcase grid. Write the transform straight to the element in a rAF-throttled scroll handler, **not through component state**. | Scroll-linked | none |
| Active flavor | scroll | The chapter whose center is nearest the viewport's vertical center | none | none |
| Showcase theme | active change | Section `background-color`/`color` transition | .9s ease | none |
| Showcase bowl swap | active change | Crossfade stacked bowls (opacity) | .8s ease | none |
| Showcase bag swap | active change | Opacity .6s, plus `translateY(24px)→0` spring | .9s `(.2,.9,.25,1.15)` | none |
| Text ring | always | `rotate` reverse, linear, infinite | 60s | none |
| Photo strip | always | Marquee `translateX(0 → -50%)`, paused on hover | 90s linear | none |
| Box card bag | qty change | `translateY(-10px)` on odd counts, `-4px` on even, so each add gives a little hop | .55s `(.3,1.7,.5,1)` | none |
| Case slot fill | bag added | Mini bag drops in: from `opacity 0, translateY(-30px), scale(.6)` → rest | .5s `(.3,1.6,.5,1)` | none |
| Case progress bar | qty change | `width` → n/6 | .5s `(.2,.8,.2,1)` | none |
| Closing bowls | section top < 80% of vh (once) | The same spin-in as the hero bowls | 1.7s | 0 / .14 / .28s |
| Buttons | hover | `translateY(-1px)`, `box-shadow 0 10px 24px rgba(34,19,11,.18)` | .2s | none |

### Mobile

| Element | Trigger | Animation |
|---|---|---|
| Hero bowl | load | From `translateX(110%) rotate(320deg)` → rest, 1.6s `(.12,.82,.22,1)`, delay .3s |
| Hero bag | load | Pop up (same as desktop), delay 1.3s |
| **Flavor tab tap** | tap | Bowl rotates **+120°** (a third of a turn, accumulating) over .9s `(.25,.75,.3,1)` while bowls crossfade (.6s). Hero background, ink and buttons transition over .7s. Bag swaps: opacity .5s, plus `translateY(18px)→0` .8s spring. *Keep it to a third of a turn; a full spin was too much.* |
| Box card bag / slots | qty change | Same as desktop |
| Bottom sheet | open | `translateY(100%)→0`, .35s `(.2,.9,.3,1)`. Scrim fades in over .25s: `rgba(34,19,11,.28)` + `backdrop-filter: blur(6px)` |
| Ticker | always | 28s marquee |

**Reduced motion:** disable all of the above. The scroll spin stays at 0°, the tab spin is instant, and marquees stand still.

---

## 6. Assets

All are in `assets/`. They're WebP (alpha where noted), already graded as one set. Serve them through the existing image pipeline with `srcset`/sizes, and lazy-load everything below the hero.

| File | Size | Alpha | Used for |
|---|---|---|---|
| `bowl-salt.webp` | 1200² | ✓ (round) | Hero bowl, showcase, closing |
| `bowl-bbq.webp` | 1200² | ✓ | 〃 |
| `bowl-churro.webp` | 960² | ✓ | 〃 (source photo is smaller) |
| `bag-salt.webp`, `bag-bbq.webp`, `bag-churro.webp` | 800×1280 | ✓ | Hero (small), showcase, box cards, case slots, summary rows |
| `scene-salt.webp`, `scene-bbq.webp` | 2000×1122 | none | Photo strip (bowl on real bags) |
| `scene-churro.webp` | 1448×1086 | none | 〃 |
| `founders.webp` | 1450×1220 | none | About. Desktop crops square with `object-position: 50% 50%`; mobile 4:3 at `50% 45%`. |
| `logo-dark.png`, `logo-light.png` | 941×248 | ✓ | Header, and footer/dark bands |

Notes:
- The **bowls** are cut from the original photos along the outer rim of the bowl, so rotating one looks like a bowl spun on a table. Render them as plain squares; the alpha channel is already round, so they need no `border-radius` or mask.
- The **bags** are flat front-on pack shots: the real label art on a matte black pouch with seal, tear notches and zipper. To regenerate them, run `tools/make_bags.py`, which reads the label PNGs from the original uploads.
- `tools/make_bowls.py` + `tools/ellipses.json` rebuild the bowls from new photos. When higher-resolution Salt/BBQ shots arrive, re-run it and swap the files. The bowl photos are the biggest single quality lever.

---

## 7. Commerce logic and backend wiring

> The backend is the source of truth for products, prices, inventory, cart and checkout. **Map each integration point below onto the existing backend APIs/models you already know.** Don't invent new pricing rules in the client. The client math below is what the UI displays; it must agree with what the backend charges.

### 7.1 Products

Three SKUs: `salt`, `bbq`, `churro`. Per product, the UI needs: name, short note ("Sea salt", "Smoky sweet", "Cinnamon & sugar"), in-stock flag, and the asset keys above. Display order: Salt, BBQ, Churro.

### 7.2 Pricing rules (as designed; confirm against the backend)

- **Single bag:** $11.25.
- **Case pricing:** once the total bag count is **≥ 6**, *every* bag is $6. Flavors mix freely, and extra bags beyond 6 also get case pricing.
- **Shipping:** **free on every order.** The summary always shows `Shipping: Free`.
- Total = `n × 6` if `n ≥ 6`, else `n × 11.25`. When case pricing applies, show the single-bag total struck through next to the total.
- Money format: `$` with two decimals, but drop `.00` ("$36", "$56.25").

### 7.3 Cart operations the UI calls

| UI action | Backend call (map to existing) | Notes |
|---|---|---|
| Add {flavor} / + | add 1 of SKU | Optimistic update. Roll back on error and show a small inline error. |
| − | remove 1 of SKU (floor 0) | none |
| Fill the rest with a mix | set quantities | Top up to 6 by repeatedly adding the flavor with the **lowest** count (ties go in Salt, BBQ, Churro order) |
| Header Box count | cart total quantity | Must stay in sync across tabs/sessions if the backend persists carts |
| Continue to secure payment | create checkout session / order → redirect to hosted payment | Disabled when n = 0 or sold out. Show a loading state; never double-submit. |
| Join the waitlist (sold out) | `POST /api/waitlist` → Google Form (see §7.4) | Name and phone number, **both required**. One general waitlist, not per flavor. Shows the success state in place. |

Cap the quantity at 36 per SKU in the UI unless the backend says otherwise.

### 7.4 Sold-out mode and waitlist (current state)

Derive `soldOut` from backend inventory. The page is in sold-out mode when every SKU is out of stock. If stock is tracked per flavor, apply the per-card treatment (sticker + "Sold out for now") only to the flavors that are out, and keep the shop live for the rest. There is **one general waitlist**; people don't sign up for a specific flavor.

What changes in sold-out mode (everything else, including motion, stays the same):

| Where | In stock | Sold out |
|---|---|---|
| Header pill | "Box {n}" | "Join the waitlist" → `#waitlist` (`#m-waitlist` on mobile) |
| Hero CTA + meta | "Build your box" · "Free shipping on every order" | "Join the waitlist" · "Every flavor is sold out for now" |
| Every bag (hero, showcase stage, box cards, mobile hero) | none | **"SOLD OUT" sticker**: cream pill, 1.5px ink ring, rotated 9°, 9–11px, weight 800, tracking .14em (`.sticker` in the design source) |
| Showcase chapter / mobile hero action | Add / stepper | "SOLD OUT FOR NOW" eyebrow + "Join the waitlist" (theme button) → scrolls to the form |
| Box section heading | "Build your box" + pricing intro | "Sold out, for now." + "Every flavor sold out. Join the waitlist and you'll be the first to know when we restock." |
| Box cards button | Add / stepper | Quiet, non-interactive label "SOLD OUT FOR NOW" (13px, uppercase, `rgba(34,19,11,.07)` pill). The waitlist panel sits directly below, so it's the only action. |
| Case shelf + order summary | shown | **Replaced by the waitlist panel** (`#waitlist`, or `#m-waitlist` on mobile) |
| Closing CTA | "Build your box" | "Join the waitlist" |

**Waitlist panel (dark ink card).** It mirrors the founders' Google Form "Gambit Chips Waitlist" exactly:
- **Left:** "Join the waitlist", then the form's own description, verbatim: "We're taking Plantain chips up on the main stage and you're invited on our journey there! Once we restock you'll be the first to know. Thanks for your support!"
- **Right:**
  - **Name** (required, `autocomplete="name"`).
  - **Phone number** (required, `type="tel"`, `inputmode="tel"`, `autocomplete="tel"`). Accept any common US format, validate at least 10 digits, and normalize before sending (e.g. `(555) 201-4477`, or E.164 `+15552014477` if the founders prefer).
  - "Join the waitlist" button.
- **Success** replaces the form in place (`role="status"`): a gold check circle, "You're on the list, {Name}." and "Once we restock you'll be the first to know. Thanks for your support!"
- **States to build:**
  - idle;
  - field errors: "Please enter your name." / "Please enter a valid phone number." inline under the field, with `aria-describedby`;
  - submitting: button disabled, with a spinner;
  - success;
  - server error: "Something went wrong, try again." inline, keeping the inputs;
  - already-joined: can be remembered in `localStorage` as a convenience, but must not be required.
- **Texting consent:** if the founders plan to **text** people from this list (the form collects phone numbers), US texting rules generally call for clear consent wording next to the button. Example: "By joining, you agree to get texts from Gambit about restocks. Msg & data rates may apply. Reply STOP to opt out." Confirm the exact wording with the founders before launch. Not legal advice.

**Forwarding to the founders' Google Form.** The waitlist lives in a Google Form today, and keeping it as the system of record is fine. Wire the site's form to forward each entry to it:

1. **Get the field IDs.** The form has two required short-answer questions: **Name** and **Phone number**. Ask the founders for the form link (it's the waitlist link on the current buy pages). In Google Forms, use ⋮ → *Get pre-filled link*, fill both questions with dummy values, and copy the link. Its query string reveals the two `entry.NNNNNNN` ids. Also check *Settings → Responses*: email collection must be off (or set to responder input) and sign-in must not be required, otherwise outside submissions are rejected.
2. **Submit server-side (recommended).**
   - Add a small endpoint in the existing backend, e.g. `POST /api/waitlist` with `{ name, phone }`.
   - Validate it:
     - name non-empty;
     - phone has ≥ 10 digits;
     - a honeypot field;
     - a basic per-IP rate limit.
   - Optionally store the entry in your own database too.
   - Then POST `application/x-www-form-urlencoded` to `https://docs.google.com/forms/d/e/<FORM_ID>/formResponse` with `entry.<id>=value` pairs.
   - Both questions are required in the Google Form; if either is missing, Google silently drops the response.
   - Treat any non-2xx as a failure and return an error to the UI.
3. **Map the fields.** Site → form: `name` → Name entry, `phone` → Phone number entry.
   - If the founders later add questions to the Google Form, add matching fields to the site form, or make the new questions optional.
   - If the form requires sign-in or restricts responses to an organization, outside submissions will fail. It must accept anonymous responses.
4. **Fallback** (only if a backend route is truly impossible): POST from the browser with `fetch(url, { method: 'POST', mode: 'no-cors', body: URLSearchParams })`. The response is opaque, so you can't confirm success. Show the success state optimistically. This is less reliable and exposes the form ID to spam, so prefer step 2.

Keep the form ID and entry IDs in backend config (env), not in frontend code.

### 7.5 Status messages (n = total bags)

| Condition | Message |
|---|---|
| n = 0 | "Pick any 6 for case pricing, or 1–5 single bags. Shipping is always free." |
| 0 < n < 6 | "Add {6−n} more and your total drops to $36" + (if single total > 36: " (you save ${single total − 36})") + "." |
| n ≥ 6 | "Case pricing unlocked. You're saving ${n×11.25 − n×6} vs. single bags." |

Case note next to "Your case": n ≥ 6 → "case pricing unlocked"; n > 0 → "{6−n} to case pricing"; n = 0 → "case pricing at 6".

CTA label: sold out → "Sold out"; n > 0 → "Continue to secure payment"; n = 0 → "Add a bag to start" (disabled, `--stepper` background). Mobile inline button: "Review box · {total}" or "Review box".

### 7.6 Analytics (optional, if the stack already tracks events)

`flavor_view` (showcase or tab change), `add_to_box`, `remove_from_box`, `fill_mix`, `begin_checkout`, `waitlist_submit`.

---

## 8. Copy deck

### 8.1 Verbatim from gambitchips.com (don't edit)

- Hero h1: **Waffle cut. / Ridiculously crisp.**
- Intro: "We took a gambit on these chips and we're hoping you will too. One chip and you'll get it."
- Salt: "Golden waffle cut plantain chips with sea salt. Clean and simple, these are the gold standard for Gambit chips."
- BBQ: "The same waffle chip texture we love, with a smoky sweet BBQ rub we formulated in house. Try one and you'll come back for seconds."
- Churro: "The same crisp, with cinnamon sugar filling every waffle pocket. It was the dark horse flavor in our flavor tests, but Churro came out on top, consistently."
- About Gambit, the lede "Our chips break out of boundaries." and its paragraph; Our gambit, all 3 paragraphs. Copy these from `design-source/Main.dc.html` §About.
- Closing: "Try one and you'll get it too."
- Label text on the ring: "WAFFLE-CUT PLANTAIN CHIPS • ONE CHIP AND YOU'LL GET IT •"

### 8.2 UI copy written for the redesign (OK to tweak)

- Hero captions:
  - Salt: "Golden, with sea salt."
  - BBQ: "Smoky sweet, made in house."
  - Churro: "Cinnamon sugar, every pocket."
- Eyebrows: "01 · Classic", "02 · Savory", "03 · Sweet". Cards: "{note} · 3 servings".
- Ticker: "Waffle cut · Ridiculously crisp · Plantain chips".
- Box intro: "Mix any flavors in a case of 6 for $6 a bag, or grab single bags for $11.25. Shipping is free on every order."
- Hero meta: "Free shipping on every order".
- Status messages, as listed in §7.5.
- Sold-out set (draft UI copy the founders can rewrite):
  - "Join the waitlist"
  - "Every flavor is sold out for now"
  - "SOLD OUT FOR NOW"
  - "Sold out, for now."
  - "Every flavor sold out. Join the waitlist and you'll be the first to know when we restock."
  - "You're on the list, {Name}."
- Waitlist body and success text are the founders' own words from the Google Form (verbatim): "We're taking Plantain chips up on the main stage and you're invited on our journey there! Once we restock you'll be the first to know. Thanks for your support!"

### 8.3 FAQ

1. **Where do you ship?** Continental U.S. Every order ships free.
2. **Can I mix flavors?** Mix any flavors in your case, and add extra bags anytime.
3. **Can I buy fewer than 6?** Not ready for a full case? Grab a bag for $11.25. Hit 6 bags and you get case pricing. Shipping is free either way.
4. **What happens after I order?** You'll get a confirmation email shortly after checkout.
5. **What's in them?** ⚠️ *Founder to supply: ingredients and allergen info per flavor.*

"Still curious? twoplantainbros@gmail.com" (swap this for a domain email if one exists).

### 8.4 Trust lines (only true claims)

"Secure checkout" · "Free shipping on every order" · "Confirmation email after checkout" · "Ships to the continental U.S."

### 8.5 Still to be written by the founders

- Sold-out headline: the design ships with "Sold out, for now." as a draft. The founders may swap in their own (6–10 words, confident, not apologetic).
- The waitlist Google Form link, so you can pull its entry IDs (§7.4).
- Ingredients/allergens FAQ answer.
- Shipping, Returns/Refunds, Privacy and Terms pages, linked from the footer. Reviewers flagged their absence as the main trust gap.

---

## 9. Accessibility

- Semantic landmarks: `header/nav`, `main`, `section` with headings, `footer`.
- Images: bowls get "A bowl of Gambit {Flavor} waffle cut chips". Bags get "Gambit {Flavor} bag". Decorative duplicates (marquee copies, case slots, the closing trio) get `alt=""`.
- The ticker, the text ring and the decorative bowls are `aria-hidden`.
- Steppers: label the buttons "Add one {Flavor}" / "Remove one {Flavor}". Put the count in `aria-live="polite"`.
- Mobile tabs use `aria-pressed`. The FAQ uses `aria-expanded`. The case shelf is `role="img"` with "{n} of 6 bags in your case". The progress bar uses `role="progressbar"` with values.
- The sheet is `role="dialog" aria-modal="true"`, focus-trapped, closes on Esc, and returns focus to the trigger.
- Focus ring: `outline: 2px solid currentColor; outline-offset: 3px`.
- Contrast: check accent eyebrows on each theme at 13px bold. Bump them if any fail AA in your audit.

---

## 10. About the design-source format (only if you open it)

`*.dc.html` files are a small templating format used by the design tool:

- `{{expr}}` interpolates values from `renderVals()`.
- `<sc-for list="{{x}}" as="item">` repeats; `<sc-if value="{{x}}">` toggles.
- `class Component extends DCLogic` holds the state (`this.state`, `setState`) and computes view values in `renderVals()`.
- Everything else is plain HTML, CSS and JS.

The reference pages bundle a tiny renderer for it that rebuilds the whole DOM on every state change. That's why they switch off one-shot animations after 3.2s. Don't copy that approach; use real components.

---

## 11. SEO and URL structure

The single long page is the right **experience**. For search, pair it with a few real URLs:

| URL | Purpose | Notes |
|---|---|---|
| `/` | This design | Brand searches ("gambit chips", "gambit plantain chips"). Organization schema (name, logo, `sameAs` Instagram). |
| `/flavors/salt`, `/flavors/bbq`, `/flavors/churro` | One page per product | Ranks for flavor searches ("churro plantain chips", "bbq plantain chips") and is what Google needs for product/merchant results. Reuse the showcase chapter: whole bowl, bag, description, waitlist or add button, FAQ snippet, links to the other two. Each gets `Product` structured data with `offers` (price `11.25`, `USD`, `availability: https://schema.org/OutOfStock` while sold out; switch to `InStock` automatically from inventory). The homepage hero bowls and chapters link to these. |
| `/faq`, `/about` | Optional | Anchors on `/` are fine at this size. Split them out only if they grow. |
| `/shipping`, `/returns`, `/privacy`, `/terms` | Trust | Linked from the footer. Founders supply the text. |
| cart, checkout, waitlist success | none | `noindex` |
| `build.html`, `buy.html` (current site) | Legacy | 301 to `/#box` (or the matching flavor page) so existing links and rankings carry over. |

Technical must-dos:
- Server-render or pre-render all content. Don't let copy exist only after JS runs.
- On mobile, **all three flavor descriptions must be in the HTML.** The tabbed hero should toggle visibility, not mount and unmount, so Google indexes every flavor.
- Give every page a unique `<title>` and meta description, a canonical URL, Open Graph/Twitter image (use a bowl + bag shot), and a `sitemap.xml`.
- Keep sold-out products **live** with `OutOfStock` and the waitlist. Don't 404 or `noindex` them while they're out.
- Performance counts: preload the three hero bowls, lazy-load the rest, reserve image boxes (CLS ≈ 0), and keep the scroll spin transform-only.
- FAQ structured data is fine to include, but don't expect FAQ rich results. Google now shows those only for a narrow set of authoritative sites.

## 12. Acceptance checklist

- [ ] Desktop and mobile match `screenshots/` at 1440 and 390, with no horizontal scroll at any width.
- [ ] Landing: the bowls spin in, then the bags pop up. Load animations play exactly once.
- [ ] Showcase: the bowl rotates with scroll (smooth, no jank, transform-only), the theme changes per chapter, and the bag swaps.
- [ ] Mobile tab tap: the bowl turns 120° (not 360°), the hero recolors, and the bag swaps.
- [ ] Box: adding a bag hops the card bag and drops a mini bag into the next slot. The summary, total, strike-through and status message follow §7.
- [ ] Shipping reads **Free** in every state. No "calculated at checkout" anywhere.
- [ ] Checkout goes through the existing backend flow, with loading, error and double-submit handling.
- [ ] Sold-out mode matches §7.4 on desktop and mobile: stickers, one general waitlist, the panel (Name + Phone, both required) replacing the cart, and the closing CTA.
- [ ] A test submission shows up in the Google Form's Responses with the name and phone filled. Validation, error and success states all work.
- [ ] `prefers-reduced-motion` turns off all motion.
- [ ] Lighthouse: images lazy-loaded below the fold, hero images preloaded, CLS ≈ 0 (reserve the bowl and bag box sizes).
- [ ] Copy matches §8. Placeholders for §8.5 are clearly marked and not shipped as-is.
