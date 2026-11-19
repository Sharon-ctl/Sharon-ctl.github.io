var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// Card spotlight follows the pointer.
document.querySelectorAll(".card").forEach(function (card) {
  card.addEventListener("pointermove", function (e) {
    var r = card.getBoundingClientRect();
    card.style.setProperty("--mx", e.clientX - r.left + "px");
    card.style.setProperty("--my", e.clientY - r.top + "px");
  });
});

// Top bar: live clock in India and scroll progress.
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
    var p = max > 0 ? (window.scrollY / max) * 100 : 0;
    bar.style.setProperty("--p", p + "%");
  }
  tick(); setInterval(tick, 20000);
  progress();
  window.addEventListener("scroll", progress, { passive: true });
  window.addEventListener("resize", progress);
})();

// Hero: rotating role line. Shows the first role only if motion is reduced.
(function () {
  var el = document.getElementById("role");
  var roles = ["backend developer", "discord bot builder", "audio systems tinkerer", "minecraft horror youtuber"];
  if (!el || reduced) return;
  var i = 0, n = 0, deleting = false;
  function step() {
    var word = roles[i];
    n += deleting ? -1 : 1;
    el.textContent = word.slice(0, n);
    var delay = deleting ? 35 : 70;
    if (!deleting && n === word.length) { deleting = true; delay = 1500; }
    else if (deleting && n === 0) { deleting = false; i = (i + 1) % roles.length; delay = 350; }
    setTimeout(step, delay);
  }
  el.textContent = "";
  step();
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
        var s = 1 + 0.5 * Math.max(0, 1 - d / 120);
        a.style.setProperty("--s", s.toFixed(3));
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

// Hero: audio-style equalizer that rises where the pointer is.
(function () {
  var canvas = document.getElementById("eq");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var w = 0, h = 0, mouse = 0.5, t = 0, running = true;

  function resize() {
    var box = canvas.getBoundingClientRect();
    w = box.width; h = box.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    var gap = 6, barW = 6;
    var count = Math.max(8, Math.floor(w / (barW + gap)));
    var grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "#7c5cff");
    grad.addColorStop(0.55, "#ff4fa3");
    grad.addColorStop(1, "#35e0ff");
    ctx.fillStyle = grad;
    for (var i = 0; i < count; i++) {
      var x = i * (barW + gap);
      var p = i / count;
      var wave = Math.sin(p * 9 + t) * 0.5 + Math.sin(p * 21 - t * 1.7) * 0.3 + Math.sin(p * 4 + t * 0.6) * 0.2;
      var near = Math.exp(-Math.pow((p - mouse) * 5, 2));
      var level = 0.3 + 0.22 * (wave + 1) + 0.38 * near;
      var bh = Math.min(h, Math.max(6, level * h));
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, h - bh, barW, bh, barW / 2); else ctx.rect(x, h - bh, barW, bh);
      ctx.fill();
    }
  }

  function loop() {
    if (!running) return;
    t += 0.035;
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize);
  resize();
  if (reduced) return;

  document.querySelector(".hero").addEventListener("pointermove", function (e) {
    var r = canvas.getBoundingClientRect();
    mouse = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  });
  new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) { if (!running) { running = true; loop(); } }
    else running = false;
  }).observe(canvas);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) running = false;
    else if (!running) { running = true; loop(); }
  });
  loop();
})();
