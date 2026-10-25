/**
 * Gambit — optional Google Apps Script (Extensions → Apps Script on your Form or Sheet).
 *
 * Mode 1 — Form submit trigger: Form → Sheet (default Google behavior) + validate min 6 bags.
 * Mode 2 — Web App doGet: ?salt=2&bbq=2&churro=2&name=... → Sheet row + Stripe Checkout redirect.
 *
 * Script properties: STRIPE_SECRET_KEY, STRIPE_PRICE_ID (price_... for $6/bag, same SKU for all flavors)
 */

var MIN_BAGS = 6;
var PRICE_CENTS = 600;

function onFormSubmit(e) {
  if (!e || !e.namedValues) return;
  var salt = num_(e.namedValues["Salt"]);
  var bbq = num_(e.namedValues["BBQ"]);
  var churro = num_(e.namedValues["Churro"]);
  var total = salt + bbq + churro;
  if (total < MIN_BAGS) {
    MailApp.sendEmail(
      Session.getActiveUser().getEmail(),
      "Gambit order below minimum",
      "Received " + total + " bags; minimum is " + MIN_BAGS + "."
    );
  }
}

function doGet(e) {
  var p = e.parameter;
  var salt = num_(p.salt);
  var bbq = num_(p.bbq);
  var churro = num_(p.churro);
  var total = salt + bbq + churro;
  if (total < MIN_BAGS) {
    return HtmlService.createHtmlOutput(
      "<p>Minimum order is " + MIN_BAGS + " bags. Go back and add more.</p>"
    );
  }
  appendOrderRow_(p, salt, bbq, churro, total);
  var sessionUrl = createStripeCheckout_(p, salt, bbq, churro, total);
  if (sessionUrl) {
    return HtmlService.createHtmlOutput(
      '<meta http-equiv="refresh" content="0;url=' + sessionUrl + '">Redirecting to payment…'
    );
  }
  return HtmlService.createHtmlOutput("<p>Order saved. We will email payment instructions.</p>");
}

function num_(v) {
  var n = parseInt(v, 10);
  return isNaN(n) ? 0 : Math.max(0, n);
}

function appendOrderRow_(p, salt, bbq, churro, total) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;
  var sheet = ss.getSheets()[0];
  sheet.appendRow([
    new Date(),
    salt,
    bbq,
    churro,
    total,
    total * (PRICE_CENTS / 100),
    p.name || "",
    p.email || "",
    p.phone || "",
    p.street || "",
    p.street2 || "",
    p.city || "",
    p.state || "",
    p.zip || "",
    p.notes || "",
    "pending",
  ]);
}

function createStripeCheckout_(p, salt, bbq, churro, total) {
  var key = PropertiesService.getScriptProperties().getProperty("STRIPE_SECRET_KEY");
  var priceId = PropertiesService.getScriptProperties().getProperty("STRIPE_PRICE_ID");
  if (!key || !priceId) return null;

  var lineItems = [];
  if (salt > 0) lineItems.push({ price: priceId, quantity: salt });
  if (bbq > 0) lineItems.push({ price: priceId, quantity: bbq });
  if (churro > 0) lineItems.push({ price: priceId, quantity: churro });
  if (lineItems.length === 0) return null;

  var payload = {
    mode: "payment",
    success_url: "https://gambitchips.com/?paid=1",
    cancel_url: "https://gambitchips.com/#shop",
    customer_email: p.email || undefined,
    shipping_address_collection: { allowed_countries: ["US"] },
    line_items: lineItems,
    metadata: {
      salt: String(salt),
      bbq: String(bbq),
      churro: String(churro),
      ship_name: p.name || "",
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

function flattenStripe_(obj, prefix) {
  prefix = prefix || "";
  var out = {};
  Object.keys(obj).forEach(function (k) {
    var val = obj[k];
    var key = prefix ? prefix + "[" + k + "]" : k;
    if (val === undefined) return;
    if (val && typeof val === "object" && !Array.isArray(val)) {
      Object.assign(out, flattenStripe_(val, key));
    } else if (Array.isArray(val)) {
      val.forEach(function (item, i) {
        Object.assign(out, flattenStripe_(item, key + "[" + i + "]"));
      });
    } else {
      out[key] = String(val);
    }
  });
  return out;
}
