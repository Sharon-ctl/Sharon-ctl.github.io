// Torch effect: only for people with a mouse who haven't asked for less motion.
// Everyone else sees the hero fully lit.
(function () {
  var hero = document.querySelector(".hero");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!hero || !finePointer || reduced) return;

  var radius = "18rem";
  hero.style.setProperty("--r", "0px");
  requestAnimationFrame(function () {
    hero.classList.add("torch");
    hero.style.setProperty("--r", radius);
  });

  hero.addEventListener("pointermove", function (e) {
    var box = hero.getBoundingClientRect();
    hero.classList.remove("torch"); // follow the pointer without easing lag
    hero.style.setProperty("--x", e.clientX - box.left + "px");
    hero.style.setProperty("--y", e.clientY - box.top + "px");
  });
})();
