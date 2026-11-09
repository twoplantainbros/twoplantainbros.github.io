(function () {
  var root = document.querySelector(".about-carousel");
  if (!root) return;

  var slides = root.querySelectorAll(".about-carousel-slide");
  var tabs = root.querySelectorAll(".about-carousel-tab");
  var triggers = root.querySelectorAll(".about-carousel-trigger");
  var active = 0;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setSlide(index) {
    if (index < 0 || index >= slides.length || index === active) return;
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
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var i = parseInt(tab.getAttribute("data-slide"), 10);
      setSlide(i);
      var target = triggers[i];
      if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    });
  });

  if (!reduceMotion && triggers.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var i = parseInt(entry.target.getAttribute("data-slide"), 10);
          if (!isNaN(i)) setSlide(i);
        });
      },
      { root: null, rootMargin: "-35% 0px -35% 0px", threshold: 0 }
    );
    triggers.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    setSlide(0);
  }
})();
