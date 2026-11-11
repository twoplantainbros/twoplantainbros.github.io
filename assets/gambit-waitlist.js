(function () {
  var cfg = {
    formResponseUrl:
      "https://docs.google.com/forms/d/e/1FAIpQLScJREpXQ4RiTi5_xfZW2WmZSuWqhR4NW1svv4EMoLp2OokZog/formResponse",
    entries: {
      name: "entry.9005319",
      phone: "entry.867260026",
    },
    joinedMessage:
      "Once we restock you'll be the first to know. Thanks for your support!",
  };
  var STORAGE_KEY = "gambit_waitlist_joined";

  function digits(phone) {
    return String(phone || "").replace(/\D/g, "");
  }

  /** Up to 11 digits: optional leading 1 (US) + 10-digit national number. */
  function capDigits(d) {
    d = digits(d);
    return d.length > 11 ? d.slice(0, 11) : d;
  }

  function nationalDigits(d) {
    d = capDigits(d);
    if (d.charAt(0) === "1" && d.length > 1) return d.slice(1, 11);
    return d.slice(0, 10);
  }

  function isPhoneValid(d) {
    d = capDigits(d);
    if (d.length === 10) return true;
    if (d.length === 11 && d.charAt(0) === "1") return nationalDigits(d).length === 10;
    return false;
  }

  function formatPhone(d) {
    d = capDigits(d);
    if (!d) return "";
    var useCountry = d.charAt(0) === "1" && d.length > 1;
    var n = useCountry ? d.slice(1) : d;
    var out = useCountry ? "+1 " : "";
    if (n.length === 0) return d === "1" ? "+1 " : out;
    if (n.length <= 3) return out + "(" + n;
    if (n.length <= 6) return out + "(" + n.slice(0, 3) + ") " + n.slice(3);
    return out + "(" + n.slice(0, 3) + ") " + n.slice(3, 6) + "-" + n.slice(6, 10);
  }

  function digitIndexBefore(formatted, pos) {
    var count = 0;
    for (var i = 0; i < pos && i < formatted.length; i++) {
      if (/\d/.test(formatted.charAt(i))) count++;
    }
    return count;
  }

  function cursorAfterDigits(formatted, digitCount) {
    if (digitCount <= 0) return useCountryStart(formatted);
    var seen = 0;
    for (var i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted.charAt(i))) {
        seen++;
        if (seen === digitCount) return i + 1;
      }
    }
    return formatted.length;
  }

  function useCountryStart(formatted) {
    return formatted.indexOf("(") >= 0 ? formatted.indexOf("(") + 1 : formatted.length;
  }

  function applyPhoneMask(input) {
    var prev = input.value;
    var start = input.selectionStart;
    var digitBefore = digitIndexBefore(prev, start);
    var d = capDigits(prev);
    var formatted = formatPhone(d);
    input.value = formatted;
    var next = cursorAfterDigits(formatted, digitBefore);
    try {
      input.setSelectionRange(next, next);
    } catch (e) {}
    return d;
  }

  function showFieldError(input, errEl, msg) {
    if (errEl) {
      errEl.textContent = msg;
      errEl.hidden = !msg;
    }
    if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
  }

  function setFormSuccess(form, name) {
    var panel = form.closest("[data-waitlist-panel]");
    if (!panel) return;
    var first = (name || "").trim().split(/\s+/)[0] || "friend";
    var wrap = panel.querySelector("[data-waitlist-form-wrap]");
    if (wrap) wrap.hidden = true;
    var ok = panel.querySelector("[data-waitlist-success]");
    if (ok) {
      ok.hidden = false;
      var h = ok.querySelector("[data-waitlist-success-name]");
      if (h) h.textContent = "You\u2019re on the list, " + first + ".";
    }
    try {
      if (name) localStorage.setItem(STORAGE_KEY, name);
    } catch (e) {}
  }

  function bindForm(form) {
    var nameInput = form.querySelector("[data-wl-name]");
    var phoneInput = form.querySelector("[data-wl-phone]");
    var submitBtn = form.querySelector("[data-wl-submit]");
    var formErr = form.querySelector("[data-wl-form-error]");
    var nameErr = form.querySelector("[data-wl-name-error]");
    var phoneErr = form.querySelector("[data-wl-phone-error]");
    var hp = form.querySelector("[data-wl-hp]");
    var phoneTouched = false;

    function refreshSubmit() {
      var nameOk = nameInput && nameInput.value.trim().length > 0;
      var d = phoneInput ? capDigits(phoneInput.value) : "";
      var phoneOk = isPhoneValid(d);
      if (submitBtn) submitBtn.disabled = !(nameOk && phoneOk);
      if (phoneTouched && phoneInput && !phoneOk && d.length > 0) {
        showFieldError(phoneInput, phoneErr, "Please enter a valid 10-digit phone number.");
      } else if (phoneTouched && phoneOk) {
        showFieldError(phoneInput, phoneErr, "");
      }
    }

    if (nameInput) {
      nameInput.addEventListener("input", refreshSubmit);
    }

    if (phoneInput) {
      phoneInput.addEventListener("input", function () {
        applyPhoneMask(phoneInput);
        refreshSubmit();
      });
      phoneInput.addEventListener("blur", function () {
        phoneTouched = true;
        refreshSubmit();
      });
      phoneInput.addEventListener("paste", function () {
        setTimeout(function () {
          applyPhoneMask(phoneInput);
          refreshSubmit();
        }, 0);
      });
    }

    refreshSubmit();

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (formErr) formErr.hidden = true;
      phoneTouched = true;
      var name = nameInput ? nameInput.value.trim() : "";
      var d = phoneInput ? capDigits(phoneInput.value) : "";
      var phone = phoneInput ? formatPhone(d) : "";
      var okName = name.length > 0;
      var okPhone = isPhoneValid(d);
      showFieldError(nameInput, nameErr, okName ? "" : "Please enter your name.");
      showFieldError(
        phoneInput,
        phoneErr,
        okPhone ? "" : "Please enter a valid 10-digit phone number."
      );
      refreshSubmit();
      if (!okName || !okPhone) return;
      if (hp && hp.value) return;

      if (!cfg.formResponseUrl || !cfg.entries.name || !cfg.entries.phone) {
        if (formErr) {
          formErr.textContent =
            "Waitlist isn\u2019t wired on this preview. Open the site from gambitchips.com or run a local server.";
          formErr.hidden = false;
        }
        return;
      }

      submitBtn.disabled = true;

      var body = new URLSearchParams();
      body.set(cfg.entries.name, name);
      body.set(cfg.entries.phone, phone);

      fetch(cfg.formResponseUrl, { method: "POST", mode: "no-cors", body: body })
        .then(function () {
          setFormSuccess(form, name);
        })
        .catch(function () {
          if (formErr) {
            formErr.textContent = "Something went wrong, try again.";
            formErr.hidden = false;
          }
          submitBtn.disabled = false;
          refreshSubmit();
        });
    });
  }

  document.querySelectorAll("[data-waitlist-form]").forEach(bindForm);

  fetch("waitlist-config.json", { cache: "no-store" })
    .then(function (r) {
      return r.json();
    })
    .then(function (json) {
      cfg.formResponseUrl = json.formResponseUrl || cfg.formResponseUrl;
      cfg.entries = json.entries || cfg.entries;
      cfg.joinedMessage = json.joinedMessage || cfg.joinedMessage;
      document.querySelectorAll("[data-waitlist-joined-msg]").forEach(function (el) {
        el.textContent = cfg.joinedMessage;
      });
    })
    .catch(function () {});
})();
