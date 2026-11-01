(function () {
  var cfg = { waitlistFormUrl: "https://forms.gle/Fcv5u5New5oidTjJ7" };

  function allFlavorsSoldOut() {
    var steppers = document.querySelectorAll(".qty-stepper");
    if (!steppers.length) return false;
    var sold = document.querySelectorAll('.qty-stepper[data-sold-out="true"]');
    return sold.length === steppers.length;
  }

  function applyWaitlistLinks(url) {
    document.querySelectorAll("[data-waitlist-link]").forEach(function (a) {
      a.href = url;
    });
  }

  function setCheckoutVisible(show) {
    document.body.classList.toggle("all-flavors-sold-out", !show);
    document.querySelectorAll("[data-hide-when-all-sold-out]").forEach(function (el) {
      el.hidden = !show;
    });
  }

  var modalKeyHandler = null;

  function closeModal(overlay) {
    overlay.remove();
    document.body.style.overflow = "";
    if (modalKeyHandler) {
      document.removeEventListener("keydown", modalKeyHandler);
      modalKeyHandler = null;
    }
  }

  function openWaitlistModal(url) {
    if (document.getElementById("waitlist-modal")) return;

    var overlay = document.createElement("div");
    overlay.id = "waitlist-modal";
    overlay.className = "waitlist-modal";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "waitlist-modal-title");

    var card = document.createElement("div");
    card.className = "waitlist-modal-card";
    card.innerHTML =
      '<p class="waitlist-eyebrow">Everything sold out</p>' +
      '<h2 class="waitlist-title" id="waitlist-modal-title">Know when we restock</h2>' +
      "<p class=\"waitlist-copy\">We&rsquo;ll text you when bags are back so you don&rsquo;t have to keep checking.</p>" +
      '<div class="waitlist-actions waitlist-actions--center">' +
      '<a class="btn btn-primary waitlist-cta" data-waitlist-link href="' +
      url +
      '" target="_blank" rel="noopener noreferrer">Get restock alerts</a>' +
      "</div>" +
      '<button type="button" class="waitlist-modal-close">Not now</button>';

    overlay.appendChild(card);
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    var closeBtn = card.querySelector(".waitlist-modal-close");
    closeBtn.addEventListener("click", function () {
      closeModal(overlay);
    });
    overlay.addEventListener("click", function (ev) {
      if (ev.target === overlay) closeModal(overlay);
    });
    modalKeyHandler = function (ev) {
      if (ev.key === "Escape") closeModal(overlay);
    };
    document.addEventListener("keydown", modalKeyHandler);
    var cta = card.querySelector(".waitlist-cta");
    if (cta) cta.focus();
  }

  function initCheckoutWaitlist(url) {
    if (!document.querySelector("[data-waitlist-checkout]")) return;
    if (!allFlavorsSoldOut()) {
      setCheckoutVisible(true);
      return;
    }
    setCheckoutVisible(false);
    openWaitlistModal(url);
  }

  fetch("waitlist-config.json", { cache: "no-store" })
    .then(function (r) {
      return r.json();
    })
    .then(function (json) {
      cfg.waitlistFormUrl = json.waitlistFormUrl || cfg.waitlistFormUrl;
      applyWaitlistLinks(cfg.waitlistFormUrl);
      if (document.body.hasAttribute("data-waitlist-page")) return;
      initCheckoutWaitlist(cfg.waitlistFormUrl);
    })
    .catch(function () {
      applyWaitlistLinks(cfg.waitlistFormUrl);
      if (!document.body.hasAttribute("data-waitlist-page")) {
        initCheckoutWaitlist(cfg.waitlistFormUrl);
      }
    });
})();
