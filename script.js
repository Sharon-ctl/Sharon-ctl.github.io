// 1) Card spotlight follows the pointer.
document.querySelectorAll(".card").forEach(function (card) {
  card.addEventListener("pointermove", function (e) {
    var r = card.getBoundingClientRect();
    card.style.setProperty("--mx", e.clientX - r.left + "px");
    card.style.setProperty("--my", e.clientY - r.top + "px");
  });
});

// 2) Audio-style equalizer in the hero. Static if the person prefers reduced motion.
(function () {
  var canvas = document.getElementById("eq");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
      var near = Math.exp(-Math.pow((p - mouse) * 5, 2)); // bump under the pointer
      var level = 0.28 + 0.22 * (wave + 1) / 2 * 2 + 0.38 * near;
      var bh = Math.min(h, Math.max(6, level * h));
      var r = barW / 2;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, h - bh, barW, bh, r) : ctx.rect(x, h - bh, barW, bh);
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

  canvas.parentElement.addEventListener("pointermove", function (e) {
    var r = canvas.getBoundingClientRect();
    mouse = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  });
  // Pause when the hero is off-screen or the tab is hidden.
  new IntersectionObserver(function (entries) {
    var visible = entries[0].isIntersecting;
    if (visible && !running) { running = true; loop(); }
    if (!visible) running = false;
  }).observe(canvas);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) running = false;
    else if (!running) { running = true; loop(); }
  });
  loop();
})();
