(function () {
  var root = document.querySelector(".about-carousel");
  if (!root) return;

  var tablist = root.querySelector(".about-carousel-tabs");
  var tabs = root.querySelectorAll(".about-carousel-tab");
  var slides = root.querySelectorAll(".about-carousel-slide");
  var active = 0;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var stacked = reduceMotion || root.classList.contains("about-carousel--stacked");

  if (stacked) {
    root.classList.add("about-carousel--stacked");
    slides.forEach(function (slide) {
      slide.classList.add("is-active");
      slide.hidden = false;
    });
    tabs.forEach(function (tab) {
      tab.setAttribute("aria-selected", "false");
      tab.tabIndex = -1;
    });
    return;
  }

  function setSlide(index, focusTab) {
    if (index < 0 || index >= slides.length) return;
    active = index;
    slides.forEach(function (slide, i) {
      var on = i === index;
      slide.classList.toggle("is-active", on);
      slide.hidden = !on;
    });
    tabs.forEach(function (tab, i) {
      var on = i === index;
      tab.classList.toggle("is-active", on);
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
    });
    if (focusTab && tabs[index]) tabs[index].focus();
  }

  tabs.forEach(function (tab, i) {
    tab.id = tab.id || "about-tab-btn-" + i;
    tab.setAttribute("role", "tab");
    tab.tabIndex = i === 0 ? 0 : -1;
    tab.addEventListener("click", function () {
      setSlide(i, false);
    });
    tab.addEventListener("keydown", function (ev) {
      var next = active;
      if (ev.key === "ArrowRight" || ev.key === "ArrowDown") {
        ev.preventDefault();
        next = (active + 1) % tabs.length;
      } else if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") {
        ev.preventDefault();
        next = (active - 1 + tabs.length) % tabs.length;
      } else if (ev.key === "Home") {
        ev.preventDefault();
        next = 0;
      } else if (ev.key === "End") {
        ev.preventDefault();
        next = tabs.length - 1;
      } else {
        return;
      }
      setSlide(next, true);
    });
  });

  if (tablist) tablist.setAttribute("role", "tablist");

  setSlide(0, false);
})();
