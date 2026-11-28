// Decorative bees scattered down both sides of the page, behind the content cards.
(() => {
  const BEE = `<svg viewBox="0 0 64 56" aria-hidden="true">
    <path d="M6 44c6-2 9-6 12-11" fill="none" stroke="#5f7458" stroke-width="1.4" stroke-dasharray="2 3" stroke-linecap="round" opacity=".55"/>
    <ellipse cx="27" cy="17" rx="10" ry="13" transform="rotate(-25 27 17)" fill="#fff" stroke="#c9d3bf" stroke-width="1.5" opacity=".95"/>
    <ellipse cx="40" cy="15" rx="9" ry="12" transform="rotate(20 40 15)" fill="#fff" stroke="#c9d3bf" stroke-width="1.5" opacity=".95"/>
    <ellipse cx="34" cy="34" rx="17" ry="13" fill="#f2bf33"/>
    <path d="M27 22.5c-2.5 7-2.5 16 0 23" stroke="#2b3027" stroke-width="4.2" fill="none"/>
    <path d="M36 21.2c-2.2 8-2.2 17.5 0 25.6" stroke="#2b3027" stroke-width="4.2" fill="none"/>
    <path d="M17.5 31l-4.5 3 4.5 2.2" fill="#2b3027"/>
    <circle cx="46" cy="31" r="2.3" fill="#2b3027"/><circle cx="46.8" cy="30.2" r=".8" fill="#fff"/>
    <path d="M44.5 37c1.8 1.6 4 1.6 5.6-.2" stroke="#2b3027" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <circle cx="50" cy="35" r="1.8" fill="#f4a3a3" opacity=".7"/>
    <path d="M45 22c1-4 3-6 6-7M48 23c2-3 4-4 7-4" stroke="#2b3027" stroke-width="1.3" fill="none" stroke-linecap="round"/>
  </svg>`;
  const layer = document.createElement("div");
  layer.className = "bee-layer";
  layer.setAttribute("aria-hidden", "true");
  document.body.prepend(layer);

  // Seeded random so bees keep their spots between redraws.
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  function draw() {
    seed = 7;
    const h = document.documentElement.scrollHeight;
    const step = window.innerWidth < 700 ? 520 : 340;
    let html = "";
    for (let y = 120, i = 0; y < h - 120; y += step * (0.75 + rnd() * 0.5), i++) {
      const left = i % 2 === 0;
      const size = 32 + Math.round(rnd() * 22);
      const x = rnd() * 4.5 + 0.5; // % from the edge
      const tilt = Math.round(rnd() * 30 - 15);
      const flip = left ? 1 : -1; // bees face toward the middle
      const delay = (rnd() * 4).toFixed(2);
      html += `<span class="bee" style="top:${Math.round(y)}px;${left ? "left" : "right"}:${x.toFixed(1)}%;width:${size}px;--tilt:${tilt}deg;--flip:${flip};animation-delay:-${delay}s">${BEE}</span>`;
    }
    layer.innerHTML = html;
    perch();
  }
  // A small bee perched on the top edge of every third card (visible on phones too).
  function perch() {
    document.querySelectorAll("article.cat, .vgroup, .rpanel").forEach((card, i) => {
      if (i % 3 !== 1 || card.querySelector(":scope > .perch")) return;
      const s = document.createElement("span");
      s.className = "bee perch"; s.setAttribute("aria-hidden", "true");
      s.style.cssText = `--tilt:${i % 2 ? 12 : -10}deg;--flip:${i % 2 ? -1 : 1};animation-delay:-${(i % 5) * 0.7}s`;
      s.innerHTML = BEE; card.appendChild(s);
    });
  }
  let t;
  const redraw = () => { clearTimeout(t); t = setTimeout(draw, 150); };
  window.addEventListener("load", draw);
  window.addEventListener("resize", redraw);
  if ("ResizeObserver" in window) new ResizeObserver(redraw).observe(document.querySelector("main"));
  draw();
})();
