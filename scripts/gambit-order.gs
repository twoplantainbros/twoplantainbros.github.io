/**
 * Gambit checkout — bind this script to your ORDERS Google Sheet (Extensions → Apps Script).
 *
 * Flow: gambitchips.com → doGet checkout → Stripe → doGet fulfill → row in Sheet (paid).
 * Google Form is NOT used on this path (payment before fulfillment).
 *
 * Script properties (Project settings → Script properties):
 *   STRIPE_SECRET_KEY   sk_live_... or sk_test_...
 *   STRIPE_PRICE_ID     price_... ($6/bag, from create-stripe-bag-product.py)
 *   WEB_APP_URL         https://script.google.com/macros/s/XXXX/exec  (after deploy)
 *
 * Deploy: Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone
 * Paste WEB_APP_URL into order-config.json → appsScriptCheckoutUrl
 */

var MIN_BAGS = 6;
var PRICE_CENTS = 600;
var SITE_URL = "https://gambitchips.com";

function doGet(e) {
  var p = e.parameter || {};
  if (p.action === "fulfill") {
    return fulfillFromSession_(p.session_id);
  }
  return startCheckout_(p);
}

function startCheckout_(p) {
  var salt = num_(p.salt);
  var bbq = num_(p.bbq);
  var churro = num_(p.churro);
  var total = salt + bbq + churro;
  if (total < MIN_BAGS) {
    return htmlPage_("<p>Minimum order is " + MIN_BAGS + " bags. <a href='" + SITE_URL + "/#shop'>Go back</a></p>");
  }
  if (!p.email || !p.name || !p.street || !p.city || !p.state || !p.zip) {
    return htmlPage_("<p>Missing shipping info. <a href='" + SITE_URL + "/#shop'>Go back</a></p>");
  }

  var sessionUrl = createStripeCheckout_(p, salt, bbq, churro, total);
  if (sessionUrl) {
    return HtmlService.createHtmlOutput(
      '<meta http-equiv="refresh" content="0;url=' + escapeAttr_(sessionUrl) + '"><p>Redirecting to Stripe…</p>'
    );
  }
  return htmlPage_("<p>Checkout is not configured (Stripe keys in Apps Script). <a href='" + SITE_URL + "/#shop'>Go back</a></p>");
}

function fulfillFromSession_(sessionId) {
  if (!sessionId) {
    return htmlPage_("<p>Missing payment session. <a href='" + SITE_URL + "/#shop'>Shop</a></p>");
  }
  var key = PropertiesService.getScriptProperties().getProperty("STRIPE_SECRET_KEY");
  if (!key) {
    return htmlPage_("<p>Stripe not configured.</p>");
  }

  var res = UrlFetchApp.fetch("https://api.stripe.com/v1/checkout/sessions/" + encodeURIComponent(sessionId), {
    headers: { Authorization: "Bearer " + key },
    muteHttpExceptions: true,
  });
  var session = JSON.parse(res.getContentText());
  if (!session || session.error) {
    return htmlPage_("<p>Could not verify payment. Email hello@gambitchips.com with ref " + sessionId + "</p>");
  }
  if (session.payment_status !== "paid") {
    return htmlPage_("<p>Payment not completed. <a href='" + SITE_URL + "/#shop'>Try again</a></p>");
  }
  if (sessionAlreadyRecorded_(sessionId)) {
    return redirect_(SITE_URL + "/?paid=1");
  }

  var meta = session.metadata || {};
  appendPaidOrderRow_(meta, session);
  return redirect_(SITE_URL + "/?paid=1");
}

function sessionAlreadyRecorded_(sessionId) {
  var sheet = getOrderSheet_();
  if (!sheet) return false;
  var lastCol = sheet.getLastColumn();
  if (sheet.getLastRow() < 2) return false;
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

function createStripeCheckout_(p, salt, bbq, churro, total) {
  var key = PropertiesService.getScriptProperties().getProperty("STRIPE_SECRET_KEY");
  var priceId = PropertiesService.getScriptProperties().getProperty("STRIPE_PRICE_ID");
  var webAppUrl = PropertiesService.getScriptProperties().getProperty("WEB_APP_URL");
  if (!key || !priceId || !webAppUrl) return null;

  var lineItems = [];
  if (salt > 0) lineItems.push({ price: priceId, quantity: salt });
  if (bbq > 0) lineItems.push({ price: priceId, quantity: bbq });
  if (churro > 0) lineItems.push({ price: priceId, quantity: churro });
  if (lineItems.length === 0) return null;

  var payload = {
    mode: "payment",
    success_url: webAppUrl + "?action=fulfill&session_id={CHECKOUT_SESSION_ID}",
    cancel_url: SITE_URL + "/#shop",
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
  return HtmlService.createHtmlOutput("<!doctype html><html><body>" + body + "</body></html>");
}

function redirect_(url) {
  return HtmlService.createHtmlOutput(
    '<meta http-equiv="refresh" content="0;url=' + escapeAttr_(url) + '">'
  );
}

function escapeAttr_(url) {
  return String(url).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
