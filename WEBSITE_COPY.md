# Gambit website copy (edit here)

Edit tone and wording in this file, then ask to **sync copy to the site**. Each block has an **ID** that maps to HTML/JS files.

**Pricing** (solo $11.25/bag, case $36/6 bags) lives in `order-config.json` — change numbers there or in copy below if they diverge.

**Waitlist form URL:** `https://forms.gle/Fcv5u5New5oidTjJ7` (`waitlist-config.json`)

**Contact email:** `twoplantainbros@gmail.com`

---

## Global (header & footer)

| ID | Where used | Copy |
|----|------------|------|
| `global.brand.tagline` | Header on all pages | Waffle cut plantain chips |
| `global.brand.name` | Header | Gambit |
| `global.nav.about` | Header | About |
| `global.nav.shop` | Header | Shop |
| `global.footer.line1` | Footer | © Gambit · Waffle cut plantain chips · gambitchips.com |
| `global.footer.email` | Footer link label | twoplantainbros@gmail.com |

---

## Home (`index.html`)

### SEO & social

| ID | Copy |
|----|------|
| `home.meta.title` | Gambit \| Waffle Cut Plantain Chips |
| `home.meta.description` | Gambit waffle cut plantain chips: Salt, BBQ, and Churro. Case of 6 with free shipping from $36. |
| `home.og.description` | Salt, BBQ, and Churro. One chip and you'll get it. |
| `home.hero.image_alt` | Gambit waffle cut plantain chips: BBQ, Churro, and Salt bags |
| `home.shop.image_alt` | Gambit BBQ, Churro, and Salt bags. Pick your flavor below. |

### Hero

| ID | Copy |
|----|------|
| `home.hero.eyebrow` | Waffle cut plantain chips |
| `home.hero.title` | Gambit |
| `home.hero.flavor_line` | Waffle cut. Ridiculously crisp. |
| `home.hero.lede` | We took a gambit on these chips and we're hoping you will to. **One chip and you'll get it.** |
| `home.hero.badge.case` | Case of 6 · from $36 |
| `home.hero.badge.shipping` | Free shipping |
| `home.hero.badge.servings` | 3 servings per bag |
| `home.hero.cta.primary` | Shop all flavors |
| `home.hero.cta.secondary` | Our gambit |

### Tagline band

| ID | Copy |
|----|------|
| `home.tagline` | One chip and you'll get it. |

### Shop section

| ID | Copy |
|----|------|
| `home.shop.title` | Order by the case |
| `home.shop.subhead` | **Case of 6** · **free shipping** · from **$36** · continental U.S. · mix any flavors · add extra bags anytime |
| `home.shop.cta.build` | Build your box |
| `home.shop.cta.solo` | Try one chip · $11.25 |
| `home.shop.cta.note` | Case of 6 · from $36 · free shipping · or 1–5 bags solo |

### Flavor placards

**Salt**

| ID | Copy |
|----|------|
| `home.flavor.salt.name` | Salt |
| `home.flavor.salt.stock` | Sold out |
| `home.flavor.salt.meta` | 3 servings · classic |
| `home.flavor.salt.body` | Golden waffle ridges and coarse sea salt. Clean, crisp, and the reason we cut the lattice in the first place. |

**BBQ**

| ID | Copy |
|----|------|
| `home.flavor.bbq.name` | BBQ |
| `home.flavor.bbq.stock` | Sold out |
| `home.flavor.bbq.meta` | 3 servings · savory |
| `home.flavor.bbq.body` | Smoky sweet rub with paprika and garlic that catches in every waffle pocket. Built for backyard snacking. |

**Churro**

| ID | Copy |
|----|------|
| `home.flavor.churro.name` | Churro |
| `home.flavor.churro.stock` | Sold out |
| `home.flavor.churro.meta` | 3 servings · sweet |
| `home.flavor.churro.body` | Cinnamon sugar on ripe plantain. Fairground nostalgia on a savory plantain base. |

*(Stock labels: use `Sold out`, `12 left`, etc. — sync updates placard + checkout when you restock.)*

### About (scroll carousel, `index.html` #about)

| ID | Copy |
|----|------|
| `home.about.slide1.title` | About Gambit |
| `home.about.slide1.body` | Our chips break out of boundaries. We understand what makes plantain chips so good, that's why we're not afraid to take a gambit with new shapes and flavors. We've run tests day after day for months to narrow down on the shapes and flavors we have for Gambits today, and we've landed on something special. Try one and you'll get it too. |
| `home.about.slide2.title` | Our gambit |
| `home.about.slide2.body` | It all started when Himanshu grabbed a bag of "Hot and Spicy" Plantain Chips… (see `index.html` for full story) |
| `home.about.slide3.title` | Your gambit |
| `home.about.slide3.body` | Try one and you'll get it too. |
| `home.about.slide3.cta` | Build your box |

### Story

| ID | Copy |
|----|------|
| `home.story.title` | Why waffle cut? |
| `home.story.body` | More surface area means more crunch and more room for seasoning. Gambit starts with ripe plantain, not potato, and a cut you can see through the bag. |

---

## Solo checkout (`buy.html`)

| ID | Copy |
|----|------|
| `buy.meta.title` | Try one chip \| Gambit |
| `buy.meta.description` | Order 1–5 Gambit bags at solo pricing ($11.25/bag). Cases of 6+ on Build your box. |
| `buy.back` | ← Back to flavors |
| `buy.tier.solo.label` | Try one chip |
| `buy.tier.solo.price` | $11.25 / bag |
| `buy.tier.solo.note` | 1–5 bags · solo pricing |
| `buy.tier.case.label` | Build your box |
| `buy.tier.case.price` | From $36 |
| `buy.tier.case.note` | Case of 6+ · free shipping |
| `buy.title` | Try one chip |
| `buy.intro` | Not ready for a full case? Grab a bag for **$11.25**. Hit **6 bags** and we'll move you to Build your box for case pricing and free shipping. |

### Flavor rows (checkout)

| ID | Flavor | Hint | Stock |
|----|--------|------|-------|
| `buy.flavor.salt.hint` | Sea salt | Sold out |
| `buy.flavor.bbq.hint` | Smoky sweet | Sold out |
| `buy.flavor.churro.hint` | Cinnamon & sugar | Sold out |

| ID | Copy |
|----|------|
| `buy.summary.case_line_default` | Solo bags · $11.25 each · 1–5 bags before case pricing. |
| `buy.summary.shipping_note` | Continental U.S. · confirmation email shortly after checkout |
| `buy.summary.warn_empty` | Pick 1–5 bags to check out solo. |
| `buy.form.submit` | Continue to secure payment |
| `buy.form.label.name` | Full name |
| `buy.form.label.email` | Email |
| `buy.form.label.phone` | Phone |
| `buy.form.label.street` | Street address |
| `buy.form.label.street2` | Apt / unit (optional) |
| `buy.form.label.city` | City |
| `buy.form.label.state` | State |
| `buy.form.label.zip` | ZIP |
| `buy.form.label.notes` | Notes (optional) |

---

## Case checkout (`build.html`)

| ID | Copy |
|----|------|
| `build.meta.title` | Build your box \| Gambit |
| `build.meta.description` | Build your Gambit case: 6+ bags, mix Salt, BBQ, and Churro. From $36 with free shipping. |
| `build.back` | ← Back to flavors |
| `build.tier.solo.label` | Try one chip |
| `build.tier.solo.price` | $11.25 / bag |
| `build.tier.solo.note` | 1–5 bags · solo pricing |
| `build.tier.case.label` | Build your box |
| `build.tier.case.price` | From $36 |
| `build.tier.case.note` | Case of 6+ · free shipping |
| `build.title` | Build your box |
| `build.intro` | Every order is a **case of 6 or more** with free shipping (from **$36** for 6 bags, any mix). Stack extra bags on the same case if you want more. Pay securely, then we pack and ship. |

### Flavor rows

| ID | Flavor | Hint | Stock |
|----|--------|------|-------|
| `build.flavor.salt.hint` | Sea salt · golden crisp | Sold out |
| `build.flavor.bbq.hint` | Smoky sweet rub | Sold out |
| `build.flavor.churro.hint` | Cinnamon & sugar | Sold out |

| ID | Copy |
|----|------|
| `build.summary.case_line_default` | Cases start at $36 (6 bags, any mix). |
| `build.summary.shipping_note` | Free shipping · continental U.S. · confirmation email shortly after checkout |
| `build.summary.warn_empty` | Add 6 bags to your case to check out. |
| `build.form.submit` | Continue to secure payment |
| *(form labels same as `buy.form.label.*`)* | |

---

## Waitlist page (`waitlist.html`)

| ID | Copy |
|----|------|
| `waitlist.meta.title` | Restock waitlist \| Gambit |
| `waitlist.meta.description` | Join the Gambit waitlist — get notified when waffle cut plantain chips are back in stock. |
| `waitlist.back` | ← Back to flavors |
| `waitlist.eyebrow` | Sold out right now |
| `waitlist.title` | Get first dibs on the next restock |
| `waitlist.body` | Salt, BBQ, and Churro are off the site until the next batch lands. Drop your number on the list and we'll text you when you can order again — no spam, just restocks. |
| `waitlist.cta.primary` | Join the waitlist |
| `waitlist.cta.secondary` | Email us |
| `waitlist.fine_print` | Opens Google Forms in a new tab · takes about a minute |

---

## Waitlist modal (`assets/waitlist.js` — buy & build when all sold out)

| ID | Copy |
|----|------|
| `waitlist.modal.eyebrow` | Everything sold out |
| `waitlist.modal.title` | Know when we restock |
| `waitlist.modal.body` | We'll text you when bags are back so you don't have to keep checking. |
| `waitlist.modal.cta` | Get restock alerts |
| `waitlist.modal.dismiss` | Not now |

---

## Dynamic checkout copy (`assets/solo-order.js`)

| ID | When shown | Copy |
|----|------------|------|
| `solo.summary.line_zero_bags` | 0 bags selected | Solo bags · $[price] each · 1–5 bags before case pricing. |
| `solo.summary.line_max_bags` | 5 bags (max solo) | Max solo order. One more bag switches you to Build your box (case pricing). |
| `solo.summary.line_mid` | 1–4 bags | Try one chip pricing · add 6+ bags total for case pricing on Build your box. |
| `solo.summary.warn_empty` | 0 bags | Pick 1–5 bags to check out solo. |
| `solo.summary.warn_redirect` | 6+ bags | Redirecting to case checkout… |
| `solo.btn.submit_stripe` | Ready | Continue to secure payment |
| `solo.btn.submit_form` | Legacy form mode | Submit order |
| `solo.btn.opening_stripe` | Loading | Opening Stripe… |
| `solo.error.checkout_failed` | Stripe error | Checkout failed. |
| `solo.error.config` | Missing config | Could not load order-config.json. |
| `solo.error.reach_checkout` | Network | Could not reach checkout. Try again or email twoplantainbros@gmail.com. |

### Post-payment celebration (solo & case)

| ID | Copy |
|----|------|
| `order.celebrate.title_prefix` | Order locked, |
| `order.celebrate.title_suffix` | ! |
| `order.celebrate.body` | Payment went through. We're packing your gambits now. |
| `order.celebrate.email_note` | You'll receive a confirmation email shortly! |
| `order.celebrate.dismiss` | Nice |
| `order.celebrate.recap_bags_suffix` | bags |

*(Recap line format: `Salt × 2 · Churro × 1` — built from quantities.)*

---

## Dynamic case checkout (`assets/order.js`)

| ID | When shown | Copy |
|----|------------|------|
| `case.summary.line_zero` | 0 bags | Cases start at $[casePrice] ([caseBags] bags, any mix). |
| `case.summary.line_under_min` | 1–5 bags | Add [N] more bag(s) to reach a $[casePrice] case. |
| `case.summary.line_exact_case` | Exactly 6 bags | One case · $[casePrice] · free shipping. |
| `case.summary.line_over_case` | 7+ bags | One case plus [N] extra bag(s) · free shipping. |
| `case.btn.submit_stripe` | Ready | Continue to secure payment |
| `case.btn.submit_form` | Legacy form | Submit order |
| `case.btn.opening_stripe` | Loading | Opening Stripe… |
| `case.error.checkout_failed` | Error | Checkout failed. |
| `case.error.config` | Config | Could not load order-config.json. |
| `case.error.reach_checkout` | Network | Could not reach checkout. Try again or email twoplantainbros@gmail.com. |

*(Celebration strings: same IDs as `order.celebrate.*` above.)*

---

## Stock & availability (quick reference)

Update these together when inventory changes:

| Flavor | Home placard (`home.flavor.*.stock`) | Checkout stock label |
|--------|--------------------------------------|----------------------|
| Salt | Sold out | Sold out |
| BBQ | Sold out | Sold out |
| Churro | Sold out | Sold out |

**Sold out** = gray placard on home, disabled stepper on buy/build.  
**Limited** = gold pill with count (e.g. `6 left`).  
**In stock** = no pill, stepper enabled.

---

## Notes for editors

- Keep **flavor names** consistent: Salt, BBQ, Churro (checkout uses same).
- **“gambits”** = bags in post-payment copy; change only if you want a different term site-wide.
- Modal copy uses **text** (not email) for restock notifications — match Google Form fields.
- After editing, say: *“Sync WEBSITE_COPY.md to the site”* and specify any IDs you changed.
