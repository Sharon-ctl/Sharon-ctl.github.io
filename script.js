var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// Top bar: clock in India and scroll progress.
(function () {
  var clocks = [document.getElementById("clock"), document.getElementById("clock2")];
  var bar = document.getElementById("progress");
  function tick() {
    var now = new Date();
    try {
      var t = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" }).format(now);
      if (clocks[0]) clocks[0].textContent = t + " IST";
      if (clocks[1]) clocks[1].textContent = t + " IST, India time";
    } catch (e) { clocks.forEach(function (c) { if (c) c.hidden = true; }); }
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

// Live GitHub numbers. The page already shows sensible values, so any failure just leaves them as they are.
(function () {
  var USER = "Sharon-ctl";
  var API = "https://api.github.com/";

  function get(path) {
    var key = "gh:" + path;
    try {
      var cached = sessionStorage.getItem(key);
      if (cached) return Promise.resolve(JSON.parse(cached));
    } catch (e) {}
    return fetch(API + path, { headers: { Accept: "application/vnd.github+json" } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        try { sessionStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
        return data;
      });
  }

  function ago(iso) {
    var secs = (new Date(iso).getTime() - Date.now()) / 1000;
    var units = [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]];
    var rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    for (var i = 0; i < units.length; i++) {
      if (Math.abs(secs) >= units[i][1] || i === units.length - 1) return rtf.format(Math.round(secs / units[i][1]), units[i][0]);
    }
  }

  if (!window.fetch || !window.Intl || !Intl.RelativeTimeFormat) return;

  get("users/" + USER).then(function (u) {
    document.querySelectorAll("[data-gh]").forEach(function (el) {
      var v = u[el.dataset.gh];
      if (typeof v === "number") el.textContent = v;
    });
  }).catch(function () {});

  document.querySelectorAll("[data-repo]").forEach(function (card) {
    get("repos/" + USER + "/" + card.dataset.repo).then(function (r) {
      var stars = card.querySelector(".stars");
      if (stars) {
        if (r.stargazers_count > 0) {
          stars.textContent = r.stargazers_count + (r.stargazers_count === 1 ? " star" : " stars");
          stars.hidden = false;
        } else { stars.hidden = true; }
      }
      var up = card.querySelector(".updated");
      if (up && r.pushed_at) up.textContent = "Updated " + ago(r.pushed_at);
    }).catch(function () {});
  });
})();
