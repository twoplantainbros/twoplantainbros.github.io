/**
 * Gambit checkout. Bind to your ORDERS Google Sheet (Extensions → Apps Script).
 *
 * Site uses JSONP (format=jsonp) so Stripe opens from gambitchips.com, not inside
 * Google's iframe (which blocks redirects).
 *
 * Script properties:
 *   STRIPE_SECRET_KEY
 *   STRIPE_PRICE_ID       ($6/bag case, see stripe-order-config.json)
 *   STRIPE_PRICE_ID_SOLO  ($11.25/bag solo, 1–5 bags)
 *
 * Deploy → Web app → Execute as: Me → Anyone
 */

var MIN_BAGS = 6;
var MAX_SOLO_BAGS = 5;
var PRICE_CENTS = 600;
var SOLO_PRICE_CENTS = 1125;
var SITE_URL = "https://gambitchips.com";
var ORDER_PAGE = "/build.html";
var SOLO_PAGE = "/buy.html";

function doGet(e) {
  var p = e.parameter || {};
  if (p.format === "jsonp" && p.callback) {
    return jsonp_(p.callback, jsonpAction_(p));
  }
  if (p.action === "fulfill") {
    var result = fulfillSessionCore_(p.session_id);
    if (result.ok) {
      return externalRedirect_(SITE_URL + "/?paid=1", "Order confirmed…");
    }
    return htmlPage_("<p>" + (result.error || "Could not confirm order.") + "</p>");
  }
  return htmlPage_(
    "<p>Use checkout from <a href='" + SITE_URL + "/#shop'>" + SITE_URL + "</a></p>"
  );
}

function jsonpAction_(p) {
  if (p.action === "fulfill") {
    return fulfillSessionCore_(p.session_id);
  }
  if (p.action === "checkout") {
    if (p.tier === "solo") {
      return checkoutSoloCore_(p);
    }
    return checkoutCore_(p);
  }
  if (p.action === "checkout_solo") {
    return checkoutSoloCore_(p);
  }
  return { error: "Unknown action" };
}

function checkoutCore_(p) {
  var salt = num_(p.salt);
  var bbq = num_(p.bbq);
  var churro = num_(p.churro);
  var total = salt + bbq + churro;
  if (total < MIN_BAGS) {
    return { error: "Minimum order is " + MIN_BAGS + " bags." };
  }
  if (!p.email || !p.name || !p.street || !p.city || !p.state || !p.zip) {
    return { error: "Missing shipping info." };
  }
  var sessionUrl = createStripeCheckout_(p, salt, bbq, churro, total, "case");
  if (sessionUrl) {
    return { url: sessionUrl };
  }
  return { error: "Checkout not configured (Stripe keys in Apps Script)." };
}

function checkoutSoloCore_(p) {
  var salt = num_(p.salt);
  var bbq = num_(p.bbq);
  var churro = num_(p.churro);
  var total = salt + bbq + churro;
  if (total < 1) {
    return { error: "Pick at least 1 bag." };
  }
  if (total > MAX_SOLO_BAGS) {
    return { error: "For 6+ bags use case checkout on Build your box." };
  }
  if (!p.email || !p.name || !p.street || !p.city || !p.state || !p.zip) {
    return { error: "Missing shipping info." };
  }
  var sessionUrl = createStripeCheckout_(p, salt, bbq, churro, total, "solo");
  if (sessionUrl) {
    return { url: sessionUrl };
  }
  return { error: "Solo checkout not configured (STRIPE_PRICE_ID_SOLO)." };
}

function fulfillSessionCore_(sessionId) {
  if (!sessionId) {
    return { error: "Missing payment session." };
  }
  var key = PropertiesService.getScriptProperties().getProperty("STRIPE_SECRET_KEY");
  if (!key) {
    return { error: "Stripe not configured." };
  }

  var res = UrlFetchApp.fetch(
    "https://api.stripe.com/v1/checkout/sessions/" + encodeURIComponent(sessionId),
    {
      headers: { Authorization: "Bearer " + key },
      muteHttpExceptions: true,
    }
  );
  var session = JSON.parse(res.getContentText());
  if (!session || session.error) {
    return { error: "Could not verify payment." };
  }
  if (session.payment_status !== "paid") {
    return { error: "Payment not completed." };
  }
  if (sessionAlreadyRecorded_(sessionId)) {
    return fulfillPayload_(session, true);
  }

  var meta = session.metadata || {};
  appendPaidOrderRow_(meta, session);
  return fulfillPayload_(session, false);
}

function fulfillPayload_(session, already) {
  var meta = session.metadata || {};
  var salt = num_(meta.salt);
  var bbq = num_(meta.bbq);
  var churro = num_(meta.churro);
  var name = meta.name || "";
  var first = name.split(/\s+/)[0] || "";
  return {
    ok: true,
    already: !!already,
    name: name,
    firstName: first,
    totalBags: salt + bbq + churro,
    salt: salt,
    bbq: bbq,
    churro: churro,
  };
}

function jsonp_(callback, data) {
  var cb = sanitizeCallback_(callback);
  if (!cb) {
    return ContentService.createTextOutput("").setMimeType(ContentService.MimeType.TEXT);
  }
  return ContentService.createTextOutput(cb + "(" + JSON.stringify(data) + ");").setMimeType(
    ContentService.MimeType.JAVASCRIPT
  );
}

function sanitizeCallback_(name) {
  if (!name || !/^[a-zA-Z_$][\w.$]*$/.test(name)) {
    return null;
  }
  return name;
}

function sessionAlreadyRecorded_(sessionId) {
  var sheet = getOrderSheet_();
  if (!sheet || sheet.getLastRow() < 2) return false;
  var ids = sheet.getRange(2, 17, sheet.getLastRow(), 17).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] === sessionId) return true;
  }
  return false;
}

function appendPaidOrderRow_(meta, session) {
  var sheet = getOrderSheet_();
  if (!sheet) return;
  var salt = num_(meta.salt);
  var bbq = num_(meta.bbq);
  var churro = num_(meta.churro);
  var total = salt + bbq + churro;
  var amount = session.amount_total ? session.amount_total / 100 : total * (PRICE_CENTS / 100);
  sheet.appendRow([
    new Date(),
    salt,
    bbq,
    churro,
    total,
    amount,
    meta.name || "",
    meta.email || (session.customer_details && session.customer_details.email) || "",
    meta.phone || "",
    meta.street || "",
    meta.street2 || "",
    meta.city || "",
    meta.state || "",
    meta.zip || "",
    meta.notes || "",
    "paid",
    session.id,
  ]);
}

function getOrderSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return null;
  return ss.getSheets()[0];
}

function createStripeCheckout_(p, salt, bbq, churro, total, tier) {
  var key = PropertiesService.getScriptProperties().getProperty("STRIPE_SECRET_KEY");
  var isSolo = tier === "solo";
  var priceId = PropertiesService.getScriptProperties().getProperty(
    isSolo ? "STRIPE_PRICE_ID_SOLO" : "STRIPE_PRICE_ID"
  );
  if (!key || !priceId) return null;

  var lineItems = [];
  if (salt > 0) lineItems.push({ price: priceId, quantity: salt });
  if (bbq > 0) lineItems.push({ price: priceId, quantity: bbq });
  if (churro > 0) lineItems.push({ price: priceId, quantity: churro });
  if (lineItems.length === 0) return null;

  var returnPage = isSolo ? SOLO_PAGE : ORDER_PAGE;
  var payload = {
    mode: "payment",
    success_url: SITE_URL + returnPage + "?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: SITE_URL + returnPage,
    customer_email: p.email,
    line_items: lineItems,
    metadata: {
      salt: String(salt),
      bbq: String(bbq),
      churro: String(churro),
      name: trimMeta_(p.name),
      email: trimMeta_(p.email),
      phone: trimMeta_(p.phone),
      street: trimMeta_(p.street),
      street2: trimMeta_(p.street2),
      city: trimMeta_(p.city),
      state: trimMeta_(p.state),
      zip: trimMeta_(p.zip),
      notes: trimMeta_(p.notes),
      tier: isSolo ? "solo" : "case",
    },
  };

  var res = UrlFetchApp.fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "post",
    headers: { Authorization: "Bearer " + key },
    payload: flattenStripe_(payload),
    muteHttpExceptions: true,
  });
  var json = JSON.parse(res.getContentText());
  return json.url || null;
}

function trimMeta_(s) {
  s = s ? String(s) : "";
  return s.length > 490 ? s.substring(0, 490) : s;
}

function num_(v) {
  var n = parseInt(v, 10);
  return isNaN(n) ? 0 : Math.max(0, n);
}

function flattenStripe_(obj, prefix) {
  prefix = prefix || "";
  var out = {};
  Object.keys(obj).forEach(function (k) {
    var val = obj[k];
    var key = prefix ? prefix + "[" + k + "]" : k;
    if (val === undefined || val === null) return;
    if (val && typeof val === "object" && !Array.isArray(val)) {
      var nested = flattenStripe_(val, key);
      Object.keys(nested).forEach(function (nk) {
        out[nk] = nested[nk];
      });
    } else if (Array.isArray(val)) {
      val.forEach(function (item, i) {
        var nested = flattenStripe_(item, key + "[" + i + "]");
        Object.keys(nested).forEach(function (nk) {
          out[nk] = nested[nk];
        });
      });
    } else {
      out[key] = String(val);
    }
  });
  return out;
}

function htmlPage_(body) {
  return HtmlService.createHtmlOutput(
    "<!doctype html><html><body>" + body + "</body></html>"
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function externalRedirect_(url, message) {
  var safe = JSON.stringify(String(url));
  var html =
    "<!doctype html><html><body><p>" +
    (message || "Redirecting…") +
    "</p><script>window.top.location.replace(" +
    safe +
    ");</script></body></html>";
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(
    HtmlService.XFrameOptionsMode.ALLOWALL
  );
}
