var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// Top bar: clock in India and scroll progress.
(function () {
  var clock = document.getElementById("clock");
  var bar = document.getElementById("progress");
  function tick() {
    try {
      clock.textContent = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata"
      }).format(new Date()) + " IST";
    } catch (e) { clock.hidden = true; }
  }
  function progress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty("--p", (max > 0 ? (window.scrollY / max) * 100 : 0) + "%");
  }
  tick(); setInterval(tick, 20000);
  progress();
  window.addEventListener("scroll", progress, { passive: true });
  window.addEventListener("resize", progress);
})();

// Dock: magnify icons near the pointer, and mark the section in view.
(function () {
  var dock = document.getElementById("dock");
  var items = Array.prototype.slice.call(dock.querySelectorAll("a"));

  if (finePointer && !reduced) {
    dock.addEventListener("pointermove", function (e) {
      items.forEach(function (a) {
        var r = a.getBoundingClientRect();
        var d = Math.abs(e.clientX - (r.left + r.width / 2));
        a.style.setProperty("--s", (1 + 0.45 * Math.max(0, 1 - d / 120)).toFixed(3));
      });
    });
    dock.addEventListener("pointerleave", function () {
      items.forEach(function (a) { a.style.setProperty("--s", 1); });
    });
  }

  var targets = items.filter(function (a) { return a.dataset.target; });
  var seen = {};
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { seen[en.target.id] = en.intersectionRatio; });
    var best = null, bestRatio = 0;
    Object.keys(seen).forEach(function (id) {
      if (seen[id] > bestRatio) { best = id; bestRatio = seen[id]; }
    });
    targets.forEach(function (a) {
      var on = a.dataset.target === best;
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
  }, { threshold: [0, 0.15, 0.3, 0.5, 0.75, 1] });
  targets.forEach(function (a) {
    var s = document.getElementById(a.dataset.target);
    if (s) io.observe(s);
  });
})();
