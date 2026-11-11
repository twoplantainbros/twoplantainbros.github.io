(function () {
  var FLAVORS = ["salt", "bbq", "churro"];
  var THEMES = {
    salt: {
      bg: "#F3E2AE",
      ink: "#22130B",
      sub: "rgba(34,19,11,.78)",
      accent: "#94650A",
      btnBg: "#22130B",
      btnInk: "#F6F0E6",
      pill: "rgba(34,19,11,.10)",
    },
    bbq: {
      bg: "#A42D1E",
      ink: "#FFF3EA",
      sub: "rgba(255,243,234,.86)",
      accent: "#FFC9A8",
      btnBg: "#FFF3EA",
      btnInk: "#5A140B",
      pill: "rgba(255,243,234,.16)",
    },
    churro: {
      bg: "#6A381D",
      ink: "#FBEEDD",
      sub: "rgba(251,238,221,.86)",
      accent: "#F2B36B",
      btnBg: "#FBEEDD",
      btnInk: "#3E1F0D",
      pill: "rgba(251,238,221,.16)",
    },
  };

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var activeFlavor = "salt";
  var mobSpinDeg = 0;

  function applyTheme(el, id) {
    var t = THEMES[id];
    if (!el || !t) return;
    el.style.backgroundColor = t.bg;
    el.style.color = t.ink;
    el.querySelectorAll("[data-theme-sub]").forEach(function (n) {
      n.style.color = t.sub;
    });
    el.querySelectorAll("[data-theme-accent]").forEach(function (n) {
      n.style.color = t.accent;
    });
    el.querySelectorAll("[data-theme-pill]").forEach(function (n) {
      n.style.backgroundColor = t.pill;
    });
    el.querySelectorAll("[data-flavor-tab]").forEach(function (btn) {
      var on = btn.getAttribute("data-flavor") === id;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.style.background = on ? t.btnBg : "transparent";
      btn.style.color = on ? t.btnInk : t.ink;
    });
    el.querySelectorAll("[data-mob-flavor-panel]").forEach(function (panel) {
      panel.hidden = panel.getAttribute("data-flavor") !== id;
    });
  }

  function setShowcaseFlavor(id) {
    if (!id || id === activeFlavor) {
      if (id) updateDots(id);
      return;
    }
    activeFlavor = id;
    var section = document.getElementById("flavors");
    if (section) applyTheme(section, id);
    document.querySelectorAll(".g-stage__bowl").forEach(function (img) {
      img.classList.toggle("is-active", img.getAttribute("data-flavor") === id);
    });
    document.querySelectorAll(".g-stage__bag").forEach(function (img) {
      img.classList.toggle("is-active", img.getAttribute("data-flavor") === id);
    });
    updateDots(id);
  }

  function updateDots(id) {
    document.querySelectorAll("[data-flavor-dot]").forEach(function (btn) {
      var on = btn.getAttribute("data-flavor-dot") === id;
      btn.setAttribute("aria-current", on ? "true" : "false");
    });
  }

  var refreshShowcaseScroll = function () {};

  function bindShowcaseScroll() {
    var chapters = Array.prototype.slice.call(document.querySelectorAll("[data-chapter]"));
    var bowlEl = document.getElementById("showcase-spin");
    if (!chapters.length || !bowlEl) return;

    var angle = 0;
    var target = 0;
    var spinning = false;
    var ticking = false;

    bowlEl.style.transformOrigin = "50% 50%";

    function apply() {
      bowlEl.style.transform = "rotate(" + angle.toFixed(2) + "deg)";
    }

    function start() {
      if (spinning || reduced) return;
      spinning = true;
      var last = performance.now();
      function tick(now) {
        var dt = Math.min(64, now - last) / 1000;
        last = now;
        var d = target - angle;
        if (Math.abs(d) < 0.05) {
          angle = target;
          apply();
          spinning = false;
          return;
        }
        angle += d * (1 - Math.exp(-dt * 7));
        apply();
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    function update() {
      ticking = false;
      var showcase = document.getElementById("flavors");
      if (showcase && getComputedStyle(showcase).display === "none") return;
      var vc = window.innerHeight / 2;
      var c = chapters.map(function (n) {
        var b = n.getBoundingClientRect();
        return b.top + b.height / 2;
      });
      var f;
      if (vc <= c[0]) f = (vc - c[0]) / (c[1] - c[0]);
      else if (vc >= c[c.length - 1]) {
        f = c.length - 1 + (vc - c[c.length - 1]) / (c[c.length - 1] - c[c.length - 2]);
      } else {
        var i = 0;
        while (vc > c[i + 1]) i++;
        f = i + (vc - c[i]) / (c[i + 1] - c[i]);
      }

      var base = Math.floor(f);
      var frac = f - base;
      var t = Math.min(1, Math.max(0, (frac - 0.22) / 0.56));
      var ease = t * t * (3 - 2 * t);

      if (reduced) {
        target = 0;
        angle = 0;
        apply();
      } else {
        target = (base + 0.12 * frac + 0.88 * ease) * 120;
        start();
      }

      var idx = Math.max(0, Math.min(chapters.length - 1, Math.round(f)));
      setShowcaseFlavor(chapters[idx].getAttribute("data-flavor"));
    }

    window.addEventListener(
      "scroll",
      function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      },
      { passive: true }
    );
    window.addEventListener("resize", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    });
    window.addEventListener("scrollend", function () {
      update();
    });
    refreshShowcaseScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    update();

    document.querySelectorAll("[data-flavor-dot]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-flavor-dot");
        var ch = document.getElementById("chapter-" + id);
        if (ch) ch.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      });
    });
  }

  function bindMobileHero() {
    var hero = document.getElementById("hero-mobile");
    if (!hero) return;
    applyTheme(hero, activeFlavor);
    var turn = document.getElementById("mob-bowl-turn");
    document.querySelectorAll("[data-flavor-tab]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-flavor");
        if (!id || id === activeFlavor) return;
        document.querySelectorAll(".m-stage__bowl").forEach(function (img) {
          img.classList.toggle("is-active", img.getAttribute("data-flavor") === id);
        });
        document.querySelectorAll(".m-stage__bag-img").forEach(function (img) {
          var on = img.getAttribute("data-flavor") === id;
          img.classList.toggle("is-active", on);
        });
        if (!reduced && turn) {
          mobSpinDeg += 120;
          turn.style.transform = "rotate(" + mobSpinDeg + "deg)";
        }
        applyTheme(hero, id);
        activeFlavor = id;
      });
    });
  }

  function bindFaq() {
    document.querySelectorAll(".g-faq__item").forEach(function (item) {
      var btn = item.querySelector("button");
      var panel = item.querySelector(".g-faq__answer");
      var vLine = item.querySelector("[data-faq-v]");
      if (!btn || !panel) return;
      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        document.querySelectorAll(".g-faq__item button").forEach(function (b) {
          b.setAttribute("aria-expanded", "false");
        });
        document.querySelectorAll(".g-faq__answer").forEach(function (p) {
          p.hidden = true;
        });
        document.querySelectorAll("[data-faq-v]").forEach(function (v) {
          v.style.opacity = "1";
        });
        if (!open) {
          btn.setAttribute("aria-expanded", "true");
          panel.hidden = false;
          if (vLine) vLine.style.opacity = "0";
        }
      });
    });
  }

  function bindClosingSpin() {
    var section = document.getElementById("closing");
    if (!section || reduced) return;
    var once = false;
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (once || !e.isIntersecting) return;
          if (e.intersectionRatio < 0.2 && e.boundingClientRect.top > window.innerHeight * 0.8) return;
          once = true;
          section.querySelectorAll(".g-closing-roll").forEach(function (el, i) {
            el.classList.add("g-roll");
            el.style.setProperty("--from-x", ["125%", "115%", "105%"][i]);
            el.style.setProperty("--from-r", ["420deg", "480deg", "540deg"][i]);
            el.style.animationDelay = [0, 0.14, 0.28][i] + "s";
          });
        });
      },
      { threshold: [0, 0.2, 0.5] }
    );
    obs.observe(section);
  }

  bindShowcaseScroll();
  bindMobileHero();
  bindFaq();
  bindClosingSpin();
  setShowcaseFlavor("salt");

  document.querySelectorAll(".g-bowl-btn").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var f = a.getAttribute("data-flavor");
      if (!f) return;
      var showcase = document.getElementById("flavors");
      if (!showcase || getComputedStyle(showcase).display === "none") return;
      var ch = document.getElementById("chapter-" + f);
      if (!ch) return;
      e.preventDefault();
      ch.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
      if (reduced) {
        setShowcaseFlavor(f);
      } else {
        refreshShowcaseScroll();
        var n = 0;
        (function pulse() {
          refreshShowcaseScroll();
          if (++n < 90) requestAnimationFrame(pulse);
        })();
      }
    });
  });
})();
