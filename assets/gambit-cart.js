(function () {
  if (!document.documentElement.classList.contains("is-in-stock")) return;

  var NAMES = { salt: "Salt", bbq: "BBQ", churro: "Churro" };
  var BAGS = {
    salt: "assets/bag-salt.webp",
    bbq: "assets/bag-bbq.webp",
    churro: "assets/bag-churro.webp",
  };
  var ORDER = ["salt", "bbq", "churro"];
  var MAX_PER = 36;

  var cfg = {
    casePricePerBag: 6,
    soloPricePerBag: 11.25,
    caseMin: 6,
    appsScriptCheckoutUrl: "",
    checkoutMode: "stripe",
  };

  var counts = { salt: 0, bbq: 0, churro: 0 };
  var addSequence = [];

  function total() {
    return counts.salt + counts.bbq + counts.churro;
  }

  function money(n) {
    var r = Math.round(n * 100) / 100;
    return r % 1 === 0 ? "$" + r : "$" + r.toFixed(2);
  }

  function qty(flavor) {
    return counts[flavor] || 0;
  }

  function setQty(flavor, n) {
    n = Math.min(MAX_PER, Math.max(0, parseInt(n, 10) || 0));
    var prev = counts[flavor];
    counts[flavor] = n;
    if (n > prev) {
      for (var i = 0; i < n - prev; i++) addSequence.push(flavor);
    } else if (n < prev) {
      var remove = prev - n;
      for (var j = addSequence.length - 1; j >= 0 && remove > 0; j--) {
        if (addSequence[j] === flavor) {
          addSequence.splice(j, 1);
          remove--;
        }
      }
    }
    refresh();
  }

  function addOne(flavor) {
    setQty(flavor, qty(flavor) + 1);
  }

  function subOne(flavor) {
    setQty(flavor, qty(flavor) - 1);
  }

  function fillMix() {
    var n = total();
    if (n <= 0 || n >= cfg.caseMin) return;
    while (total() < cfg.caseMin) {
      var pick = ORDER[0];
      var low = qty(pick);
      ORDER.forEach(function (f) {
        var q = qty(f);
        if (q < low) {
          low = q;
          pick = f;
        }
      });
      addOne(pick);
    }
  }

  function jsonpToAppsScript(params, callbackName, onDone) {
    var prior = document.getElementById("gambit-jsonp");
    if (prior) prior.remove();
    window[callbackName] = function (data) {
      delete window[callbackName];
      var tag = document.getElementById("gambit-jsonp");
      if (tag) tag.remove();
      onDone(data || {});
    };
    var q = new URLSearchParams(params);
    q.set("format", "jsonp");
    q.set("callback", callbackName);
    var script = document.createElement("script");
    script.id = "gambit-jsonp";
    script.src = cfg.appsScriptCheckoutUrl + "?" + q.toString();
    script.onerror = function () {
      delete window[callbackName];
      script.remove();
      onDone({ error: "Could not reach checkout. Try again or email twoplantainbros@gmail.com." });
    };
    document.body.appendChild(script);
  }

  function refresh() {
    var n = total();
    var isCase = n >= cfg.caseMin;
    var dollars = n * (isCase ? cfg.casePricePerBag : cfg.soloPricePerBag);
    var soloTotal = n * cfg.soloPricePerBag;

    document.querySelectorAll("[data-box-count]").forEach(function (el) {
      el.textContent = String(n);
    });

    var caseNote = document.getElementById("case-note");
    if (caseNote) {
      if (n >= cfg.caseMin) caseNote.textContent = "case pricing unlocked";
      else if (n > 0) caseNote.textContent = cfg.caseMin - n + " to case pricing";
      else caseNote.textContent = "case pricing at 6";
    }

    var caseCount = document.getElementById("case-count");
    if (caseCount) caseCount.textContent = String(Math.min(n, cfg.caseMin));

    var bar = document.getElementById("case-progress");
    if (bar) {
      var w = Math.min(n, cfg.caseMin) / cfg.caseMin;
      bar.style.width = w * 100 + "%";
      bar.parentElement.setAttribute("aria-valuenow", String(Math.min(n, cfg.caseMin)));
    }

    var slots = document.querySelectorAll("[data-case-slot]");
    slots.forEach(function (slot, i) {
      var flavor = addSequence[i];
      var img = slot.querySelector("img");
      if (!flavor) {
        if (img) img.style.opacity = "0";
        return;
      }
      if (img) {
        img.src = BAGS[flavor];
        img.style.opacity = "1";
        img.style.transform = "translateY(0) scale(1)";
      }
    });

    var status = document.getElementById("cart-status");
    if (status) {
      if (n === 0) {
        status.textContent =
          "Pick any 6 for case pricing, or 1–5 single bags. Shipping is always free.";
      } else if (n < cfg.caseMin) {
        var msg = "Add " + (cfg.caseMin - n) + " more and your total drops to $36";
        if (soloTotal > 36) msg += " (you save " + money(soloTotal - 36) + ").";
        else msg += ".";
        status.textContent = msg;
      } else {
        status.textContent =
          "Case pricing unlocked. You're saving " +
          money(soloTotal - n * cfg.casePricePerBag) +
          " vs. single bags.";
      }
    }

    var lines = document.getElementById("summary-lines");
    if (lines) {
      lines.innerHTML = "";
      var any = false;
      ORDER.forEach(function (f) {
        var c = qty(f);
        if (!c) return;
        any = true;
        var row = document.createElement("div");
        row.style.cssText =
          "display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid rgba(34,19,11,.08)";
        row.innerHTML =
          '<img src="' +
          BAGS[f] +
          '" alt="" style="width:28px;height:auto">' +
          '<span style="flex-grow:1;font-size:15px">' +
          c +
          " × " +
          NAMES[f] +
          "</span>" +
          '<span style="font-size:15px;font-weight:600">' +
          money(c * (isCase ? cfg.casePricePerBag : cfg.soloPricePerBag)) +
          "</span>";
        lines.appendChild(row);
      });
      if (!any) {
        lines.innerHTML =
          '<p style="padding:10px 0;font-size:15px;color:rgba(34,19,11,.55);margin:0">Your box is empty.</p>';
      }
    }

    var totalEl = document.getElementById("summary-total");
    var strike = document.getElementById("summary-strike");
    if (totalEl) totalEl.textContent = money(dollars);
    if (strike) {
      if (isCase && n > 0) {
        strike.textContent = money(soloTotal);
        strike.hidden = false;
      } else strike.hidden = true;
    }

    var fillBtn = document.getElementById("fill-mix");
    if (fillBtn) fillBtn.hidden = !(n > 0 && n < cfg.caseMin);

    document.querySelectorAll("[data-cart-count]").forEach(function (el) {
      var f = el.getAttribute("data-flavor");
      var c = qty(f);
      el.textContent = String(c);
      var wrap = el.closest("[data-cart-stepper]");
      var addBtn = el.closest("[data-cart-add-wrap]");
      if (wrap) wrap.hidden = c === 0;
      if (addBtn) addBtn.hidden = c > 0;
    });

    var submit = document.getElementById("checkout-submit");
    if (submit) {
      var wired = cfg.checkoutMode === "stripe" && cfg.appsScriptCheckoutUrl;
      submit.disabled = !wired || n === 0;
      submit.textContent =
        n > 0 ? "Continue to secure payment" : "Add a bag to start";
      if (n === 0) submit.style.background = "#EAE0CF";
      else submit.style.background = "#22130B";
    }
  }

  document.querySelectorAll("[data-cart-add]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      addOne(btn.getAttribute("data-flavor"));
    });
  });

  document.querySelectorAll("[data-cart-stepper]").forEach(function (wrap) {
    var f = wrap.getAttribute("data-flavor");
    wrap.querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.getAttribute("data-action") === "inc") addOne(f);
        else subOne(f);
      });
    });
  });

  var fill = document.getElementById("fill-mix");
  if (fill) fill.addEventListener("click", fillMix);

  var form = document.getElementById("checkout-form");
  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var n = total();
      if (n < 1) return;
      var isSolo = n < cfg.caseMin;
      var params = {
        salt: counts.salt,
        bbq: counts.bbq,
        churro: counts.churro,
        name: document.getElementById("field-name").value,
        email: document.getElementById("field-email").value,
        phone: document.getElementById("field-phone").value,
        street: document.getElementById("field-street").value,
        street2: document.getElementById("field-street2").value,
        city: document.getElementById("field-city").value,
        state: document.getElementById("field-state").value,
        zip: document.getElementById("field-zip").value,
        notes: document.getElementById("field-notes").value,
      };
      if (isSolo) params.action = "solo";
      else {
        params.action = "checkout";
      }
      var submit = document.getElementById("checkout-submit");
      submit.disabled = true;
      submit.textContent = "Opening Stripe…";
      jsonpToAppsScript(params, "gambitCheckoutCb", function (data) {
        if (data.url) {
          var fullName = document.getElementById("field-name").value.trim();
          sessionStorage.setItem("gambit_first_name", fullName.split(/\s+/)[0] || "friend");
          window.location.href = data.url;
          return;
        }
        submit.disabled = false;
        submit.textContent = "Continue to secure payment";
        var note = document.getElementById("checkout-error");
        if (note) {
          note.hidden = false;
          note.textContent = data.error || "Checkout failed.";
        }
      });
    });
  }

  fetch("order-config.json", { cache: "no-store" })
    .then(function (r) {
      return r.json();
    })
    .then(function (json) {
      cfg.casePricePerBag = json.pricePerBag || 6;
      cfg.soloPricePerBag = json.soloPricePerBag || 11.25;
      cfg.caseMin = json.minBags || 6;
      cfg.appsScriptCheckoutUrl = json.appsScriptCheckoutUrl || "";
      cfg.checkoutMode = json.checkoutMode || "stripe";
      refresh();
      var qs = new URLSearchParams(window.location.search);
      if (qs.get("session_id")) {
        jsonpToAppsScript(
          { action: "fulfill", session_id: qs.get("session_id") },
          "gambitFulfillCb",
          function (data) {
            if (data.ok) {
              history.replaceState({}, "", window.location.pathname + "?paid=1&instock=1");
            }
          }
        );
      }
    })
    .catch(function () {
      refresh();
    });

  refresh();
})();
