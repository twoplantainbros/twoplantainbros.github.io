(function () {
        var cfg = {
          pricePerBag: 11.25,
          minBags: 1,
          soloMaxBags: 5,
          caseMinBags: 6,
          casePrice: 36,
          checkoutMode: "form",
          googleForm: { formResponseUrl: "", entries: {} },
          appsScriptCheckoutUrl: "",
        };
        var redirectingToCase = false;

        var form = document.getElementById("order-form");
        var summary = document.getElementById("order-summary");
        var summaryBags = document.getElementById("summary-bags");
        var summaryTotal = document.getElementById("summary-total");
        var summaryCaseLine = document.getElementById("summary-case-line");
        var submitBtn = document.getElementById("order-submit");
        var setupNote = document.getElementById("order-setup-note");

        function flavorSoldOut(flavor) {
          var stepper = document.querySelector('.qty-stepper[data-flavor="' + flavor + '"]');
          return stepper && stepper.getAttribute("data-sold-out") === "true";
        }

        function qty(flavor) {
          if (flavorSoldOut(flavor)) return 0;
          var row = document.querySelector('.qty-stepper[data-flavor="' + flavor + '"] input');
          return row ? Math.max(0, parseInt(row.value, 10) || 0) : 0;
        }

        function setQty(flavor, n) {
          if (flavorSoldOut(flavor)) n = 0;
          var input = document.querySelector('.qty-stepper[data-flavor="' + flavor + '"] input');
          if (input) input.value = String(Math.min(99, Math.max(0, n)));
          refresh();
        }

        function applyPrefillFromQuery() {
          var qs = new URLSearchParams(window.location.search);
          ["salt", "bbq", "churro"].forEach(function (flavor) {
            if (!qs.has(flavor)) return;
            setQty(flavor, parseInt(qs.get(flavor), 10) || 0);
          });
        }

        function refresh() {
          var salt = qty("salt");
          var bbq = qty("bbq");
          var churro = qty("churro");
          var totalBags = salt + bbq + churro;
          if (totalBags >= cfg.caseMinBags && !redirectingToCase) {
            redirectingToCase = true;
            var q = new URLSearchParams();
            if (salt) q.set("salt", String(salt));
            if (bbq) q.set("bbq", String(bbq));
            if (churro) q.set("churro", String(churro));
            window.location.replace("build.html?" + q.toString());
            return;
          }
          var dollars = Math.round(totalBags * cfg.pricePerBag * 100) / 100;
          summaryBags.textContent = String(totalBags);
          summaryTotal.textContent = dollars % 1 === 0 ? String(dollars) : dollars.toFixed(2);
          if (summaryCaseLine) {
            if (totalBags === 0) {
              summaryCaseLine.textContent =
                "Solo bags · $" + cfg.pricePerBag + " each · 1–5 bags before case pricing.";
            } else if (totalBags === cfg.soloMaxBags) {
              summaryCaseLine.textContent =
                "Max solo order. One more bag switches you to Build your box (case pricing).";
            } else {
              summaryCaseLine.textContent =
                "Try one chip pricing · add 6+ bags total for case pricing on Build your box.";
            }
          }
          var ok = totalBags >= cfg.minBags && totalBags <= cfg.soloMaxBags;
          summary.classList.toggle("ok", ok);
          var useStripe =
            cfg.checkoutMode === "stripe" && cfg.appsScriptCheckoutUrl;
          var wired = useStripe || cfg.googleForm.formResponseUrl;
          submitBtn.disabled = !ok || !wired;
          submitBtn.textContent = useStripe ? "Continue to secure payment" : "Submit order";
          var warn = document.getElementById("summary-warn");
          if (warn) {
            warn.textContent =
              totalBags === 0
                ? "Pick 1–5 bags to check out solo."
                : totalBags > cfg.soloMaxBags
                  ? "Redirecting to case checkout…"
                  : "";
          }
        }

        document.querySelectorAll(".qty-stepper").forEach(function (stepper) {
          var flavor = stepper.getAttribute("data-flavor");
          stepper.querySelectorAll("button").forEach(function (btn) {
            btn.addEventListener("click", function () {
              var d = btn.getAttribute("data-action") === "inc" ? 1 : -1;
              setQty(flavor, qty(flavor) + d);
            });
          });
          stepper.querySelector("input").addEventListener("change", function () {
            setQty(flavor, qty(flavor));
          });
        });

        function hidden(name, value) {
          var el = document.createElement("input");
          el.type = "hidden";
          el.name = name;
          el.value = value;
          return el;
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

        function flavorRecap(data) {
          if (!data || !data.totalBags) return "";
          var parts = [];
          if (data.salt) parts.push("Salt × " + data.salt);
          if (data.bbq) parts.push("BBQ × " + data.bbq);
          if (data.churro) parts.push("Churro × " + data.churro);
          return parts.join(" · ");
        }

        function fireConfetti() {
          if (typeof confetti !== "function") return;
          var end = Date.now() + 2200;
          (function burst() {
            confetti({
              particleCount: 4,
              angle: 60,
              spread: 55,
              origin: { x: 0, y: 0.65 },
              colors: ["#e8b923", "#3d2314", "#f4ede3", "#ff6b00"],
            });
            confetti({
              particleCount: 4,
              angle: 120,
              spread: 55,
              origin: { x: 1, y: 0.65 },
              colors: ["#e8b923", "#3d2314", "#f4ede3", "#ff6b00"],
            });
            if (Date.now() < end) requestAnimationFrame(burst);
          })();
        }

        function withConfettiLib(then) {
          if (typeof confetti === "function") {
            then();
            return;
          }
          var s = document.createElement("script");
          s.src =
            "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js";
          s.onload = then;
          s.onerror = then;
          document.head.appendChild(s);
        }

        function showOrderCelebration(data) {
          if (document.getElementById("celebrate-overlay")) return;
          var first =
            (data && data.firstName) ||
            sessionStorage.getItem("gambit_first_name") ||
            "friend";
          sessionStorage.removeItem("gambit_first_name");
          var recap = flavorRecap(data);
          var bags = data && data.totalBags ? data.totalBags : "";

          var overlay = document.createElement("div");
          overlay.id = "celebrate-overlay";
          overlay.className = "celebrate-overlay";
          overlay.setAttribute("role", "dialog");
          overlay.setAttribute("aria-modal", "true");
          overlay.setAttribute("aria-labelledby", "celebrate-title");
          overlay.innerHTML =
            '<div class="celebrate-card">' +
            '<p class="emoji" aria-hidden="true">🎉</p>' +
            '<h2 id="celebrate-title">Order locked, ' +
            escapeHtml(first) +
            "!</h2>" +
            "<p>Payment went through. We&rsquo;re packing your gambits now.</p>" +
            (recap
              ? '<p class="order-recap"><strong>' +
                bags +
                " bags</strong><br />" +
                escapeHtml(recap) +
                "</p>"
              : "") +
            "<p>You&rsquo;ll receive a confirmation email shortly!</p>" +
            '<button type="button" class="celebrate-dismiss">Nice</button>' +
            "</div>";
          document.body.appendChild(overlay);
          document.body.style.overflow = "hidden";
          overlay.querySelector(".celebrate-dismiss").addEventListener("click", function () {
            overlay.remove();
            document.body.style.overflow = "";
          });
          overlay.addEventListener("click", function (ev) {
            if (ev.target === overlay) {
              overlay.remove();
              document.body.style.overflow = "";
            }
          });
          withConfettiLib(fireConfetti);
        }

        function escapeHtml(s) {
          return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
        }

        function maybeFulfillFromReturn() {
          var qs = new URLSearchParams(window.location.search);
          var sessionId = qs.get("session_id");
          if (!sessionId || !cfg.appsScriptCheckoutUrl) return;
          jsonpToAppsScript(
            { action: "fulfill", session_id: sessionId },
            "gambitFulfillCb",
            function (data) {
              if (data.ok) {
                showOrderCelebration(data);
                history.replaceState({}, "", window.location.pathname + "?paid=1");
              } else if (data.error) {
                setupNote.hidden = false;
                setupNote.textContent = data.error;
              }
            }
          );
        }

        form.addEventListener("submit", function (ev) {
          var salt = qty("salt");
          var bbq = qty("bbq");
          var churro = qty("churro");
          var totalBags = salt + bbq + churro;
          if (totalBags < cfg.minBags || totalBags > cfg.soloMaxBags) {
            ev.preventDefault();
            return;
          }

          var useStripe =
            cfg.checkoutMode === "stripe" && cfg.appsScriptCheckoutUrl;
          if (useStripe) {
            ev.preventDefault();
            submitBtn.disabled = true;
            submitBtn.textContent = "Opening Stripe…";
            jsonpToAppsScript(
              {
                action: "checkout",
                tier: "solo",
                salt: salt,
                bbq: bbq,
                churro: churro,
                name: document.getElementById("field-name").value,
                email: document.getElementById("field-email").value,
                phone: document.getElementById("field-phone").value,
                street: document.getElementById("field-street").value,
                street2: document.getElementById("field-street2").value,
                city: document.getElementById("field-city").value,
                state: document.getElementById("field-state").value,
                zip: document.getElementById("field-zip").value,
                notes: document.getElementById("field-notes").value,
              },
              "gambitCheckoutCb",
              function (data) {
                if (data.url) {
                  var fullName = document.getElementById("field-name").value.trim();
                  var first = fullName.split(/\s+/)[0] || "friend";
                  sessionStorage.setItem("gambit_first_name", first);
                  window.location.href = data.url;
                  return;
                }
                submitBtn.disabled = false;
                submitBtn.textContent = "Continue to secure payment";
                setupNote.hidden = false;
                setupNote.textContent = data.error || "Checkout failed.";
              }
            );
            return;
          }

          var e = cfg.googleForm.entries;
          form.querySelectorAll("input[data-gf]").forEach(function (node) {
            node.remove();
          });
          var pairs = [
            [e.salt, salt],
            [e.bbq, bbq],
            [e.churro, churro],
            [e.totalBags, totalBags],
            [e.orderTotal, (totalBags * cfg.pricePerBag).toFixed(2)],
            [e.name, document.getElementById("field-name").value],
            [e.email, document.getElementById("field-email").value],
            [e.phone, document.getElementById("field-phone").value],
            [e.street, document.getElementById("field-street").value],
            [e.street2, document.getElementById("field-street2").value],
            [e.city, document.getElementById("field-city").value],
            [e.state, document.getElementById("field-state").value],
            [e.zip, document.getElementById("field-zip").value],
            [e.notes, document.getElementById("field-notes").value],
          ];
          pairs.forEach(function (pair) {
            if (!pair[0]) return;
            var input = hidden(pair[0], pair[1]);
            input.setAttribute("data-gf", "1");
            form.appendChild(input);
          });
        });

        fetch("order-config.json")
          .then(function (r) {
            return r.json();
          })
          .then(function (json) {
            cfg.pricePerBag = json.soloPricePerBag || 11.25;
            cfg.soloMaxBags = json.soloMaxBags || 5;
            cfg.caseMinBags = json.minBags || 6;
            cfg.casePrice = json.casePrice || cfg.caseMinBags * (json.pricePerBag || 6);
            cfg.minBags = 1;
            cfg.checkoutMode = json.checkoutMode || "form";
            cfg.googleForm = json.googleForm || cfg.googleForm;
            cfg.appsScriptCheckoutUrl = json.appsScriptCheckoutUrl || "";
            var useStripe =
              cfg.checkoutMode === "stripe" && cfg.appsScriptCheckoutUrl;
            if (useStripe) {
              setupNote.hidden = true;
              setupNote.textContent = "";
            } else if (cfg.googleForm.formResponseUrl) {
              form.action = cfg.googleForm.formResponseUrl;
              setupNote.hidden = false;
              setupNote.textContent =
                "Orders submit to our team (payment follow up). Switch checkoutMode to stripe for pay first checkout.";
            } else {
              setupNote.hidden = false;
              setupNote.textContent =
                "Checkout wiring: set appsScriptCheckoutUrl + checkoutMode stripe (see scripts/ORDER_SETUP.txt).";
            }
            refresh();
            maybeFulfillFromReturn();
          })
          .catch(function () {
            setupNote.hidden = false;
            setupNote.textContent = "Could not load order-config.json.";
            refresh();
          });

        if (new URLSearchParams(window.location.search).get("paid") === "1") {
          showOrderCelebration({ firstName: sessionStorage.getItem("gambit_first_name") || "friend" });
        }

        refresh();
      })();
