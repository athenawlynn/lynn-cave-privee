// Renders original stand-in artwork for the athenalynn.com homepage.
// All imagery is drawn procedurally here (no third-party photos).
// Usage: node render.js <outDir>
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const OUT = path.resolve(process.argv[2] || 'out');
fs.mkdirSync(OUT, { recursive: true });

// ── deterministic RNG ──
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// ── palette ──
const C = {
  navy: '#1e2d40', navyDeep: '#141f2e', navySoft: '#3d5068', gold: '#b8976a', goldLight: '#d4b896',
  ivory: '#f8f4ee', stoneSun: '#fbf4e7', stoneShade: '#d9cdba', stoneMid: '#e6dccb',
};

// shared defs: grain + stone texture
const grainDef = (id, op = 0.10, freq = 0.9) => `
  <filter id="${id}" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="7" stitchTiles="stitch"/>
    <feColorMatrix values="0 0 0 0 0.12  0 0 0 0 0.11  0 0 0 0 0.10  0 0 0 ${op * 2.2} -${op * 0.6}"/>
  </filter>`;
const stoneDef = (id, seed = 3) => `
  <filter id="${id}" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="4" seed="${seed}" result="n"/>
    <feColorMatrix in="n" values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.28  0 0 0 0.12 -0.01" result="cloud"/>
    <feTurbulence type="turbulence" baseFrequency="0.55" numOctaves="1" seed="${seed + 9}" result="p"/>
    <feColorMatrix in="p" values="0 0 0 0 0.42  0 0 0 0 0.36  0 0 0 0 0.30  0 0 0 -3.4 1.02" result="pits"/>
    <feMerge><feMergeNode in="cloud"/><feMergeNode in="pits"/></feMerge>
  </filter>`;

// ── palm frond generator (returns path data) ──
function frond(r, x0, y0, ang, len, droop, opts = {}) {
  const N = opts.n || 38, spread = opts.spread || 1;
  const dx = Math.cos(ang), dy = Math.sin(ang), px = -dy, py = dx;
  const P = t => [x0 + dx * len * t + px * droop * len * t * t, y0 + dy * len * t + py * droop * len * t * t];
  const T = t => { const a = [dx * len + px * droop * len * 2 * t, dy * len + py * droop * len * 2 * t]; const m = Math.hypot(a[0], a[1]); return [a[0] / m, a[1] / m]; };
  let d = '';
  // rachis as tapered polygon
  const w0 = len * 0.018, pts = [], back = [];
  for (let i = 0; i <= 24; i++) { const t = i / 24, [x, y] = P(t), [tx, ty] = T(t), w = w0 * (1 - t * 0.92); pts.push([x - ty * w, y + tx * w]); back.push([x + ty * w, y - tx * w]); }
  d += 'M' + pts.concat(back.reverse()).map(p => p.map(v => v.toFixed(1)).join(',')).join('L') + 'Z';
  for (let i = 1; i <= N; i++) {
    const t = 0.06 + 0.94 * (i / N) + (r() - 0.5) * 0.012;
    const [x, y] = P(t), [tx, ty] = T(t);
    const ll = len * 0.40 * Math.pow(Math.sin(Math.PI * (0.12 + 0.82 * t)), 0.7) * (1 - 0.45 * t) * (0.85 + r() * 0.3);
    for (const side of [1, -1]) {
      const a = (62 - 30 * t + (r() - 0.5) * 14) * Math.PI / 180 * spread;
      const ca = Math.cos(a * side), sa = Math.sin(a * side);
      let lx = tx * ca - ty * sa, ly = tx * sa + ty * ca;
      // droop leaflets toward gravity (down = +y) slightly
      ly += 0.25 + r() * 0.15; const m = Math.hypot(lx, ly); lx /= m; ly /= m;
      const ex = x + lx * ll, ey = y + ly * ll;
      const nx = -ly, ny = lx, w = ll * (0.055 + r() * 0.02);
      const cx = x + lx * ll * 0.5 + nx * w * 0.6 + 0, cy = y + ly * ll * 0.5 + ny * w * 0.6 + ll * 0.06;
      d += `M${(x + nx * w * 0.5).toFixed(1)},${(y + ny * w * 0.5).toFixed(1)}Q${(cx + nx * w).toFixed(1)},${(cy + ny * w).toFixed(1)} ${ex.toFixed(1)},${(ey + ll * 0.05).toFixed(1)}Q${(cx - nx * w).toFixed(1)},${(cy - ny * w).toFixed(1)} ${(x - nx * w * 0.5).toFixed(1)},${(y - ny * w * 0.5).toFixed(1)}Z`;
    }
  }
  return d;
}
function crown(seed, cx, cy, size, count = 9, startAng = -0.3, endAng = 3.4) {
  const r = rng(seed); let d = '';
  for (let i = 0; i < count; i++) {
    const a = startAng + (endAng - startAng) * (i / (count - 1)) + (r() - 0.5) * 0.25;
    const len = size * (0.75 + r() * 0.35);
    const droop = (Math.cos(a) > 0 ? 1 : -1) * (0.18 + r() * 0.15);
    d += frond(r, cx, cy, a, len, droop);
  }
  return d;
}

// ── arch helper ──
const arch = (x, y, w, h) => { const r = w / 2; return `M${x},${y + h}V${y + r}A${r},${r} 0 0 1 ${x + w},${y + r}V${y + h}Z`; };

// ── HERO LAYERS ──
function heroWall(W, H, patches) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${stoneDef('stone')}${grainDef('grain', 0.07)}
    <linearGradient id="shade" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ede4d5"/><stop offset=".55" stop-color="#e2d6c3"/><stop offset="1" stop-color="#d4c5ad"/></linearGradient>
    <linearGradient id="plinth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4ecdf"/><stop offset=".18" stop-color="#ddd0bb"/><stop offset="1" stop-color="#c9b99f"/></linearGradient>
    <linearGradient id="plinthShadow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6d5e49" stop-opacity=".28"/><stop offset="1" stop-color="#6d5e49" stop-opacity="0"/></linearGradient>
    <radialGradient id="bounce" cx=".78" cy=".55" r=".6"><stop offset="0" stop-color="#f3e3c4" stop-opacity=".55"/><stop offset="1" stop-color="#f3e3c4" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#shade)"/>
  <rect width="100%" height="100%" fill="url(#bounce)"/>
  ${coursing(W, H)}
  <rect width="100%" height="100%" filter="url(#stone)" opacity=".8"/>
  <rect x="0" y="${H * 0.9}" width="${W}" height="${H * 0.1}" fill="url(#plinth)"/>
  <rect x="0" y="${H * 0.9}" width="${W}" height="2" fill="#fff" opacity=".6"/>
  <rect x="0" y="${H * 0.9 - 26}" width="${W}" height="26" fill="url(#plinthShadow)" transform="rotate(180 ${W / 2} ${H * 0.9 - 13})"/>
</svg>`;
}
function coursing(W, H) {
  const r = rng(11); let s = '';
  const ch = Math.round(H / 7.5);
  for (let y = ch * 0.6, row = 0; y < H; y += ch, row++) {
    s += `<rect x="0" y="${y.toFixed(1)}" width="${W}" height="1.6" fill="#8a7a63" opacity=".11"/>`;
    s += `<rect x="0" y="${(y + 1.6).toFixed(1)}" width="${W}" height="1.2" fill="#fff" opacity=".18"/>`;
    for (let x = (row % 2 ? -ch * 0.9 : 0) + r() * ch * 0.6; x < W; x += ch * (2.2 + r() * 0.7))
      s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="1.4" height="${ch}" fill="#8a7a63" opacity=".12"/>`;
  }
  return s;
}
// sunlight patches: skewed arches with soft edges, white on black (mask) or warm light (light layer)
function heroPatches(W, H, patches, mode) {
  const fill = mode === 'mask' ? '#fff' : 'url(#sun)';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${W / 420}"/></filter>
    <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset=".6" stop-color="#fcf1dc"/><stop offset="1" stop-color="#f6e2bd"/></linearGradient>
  </defs>
  ${mode === 'mask' ? `<rect width="100%" height="100%" fill="#000"/>` : ''}
  <g filter="url(#soft)">${patches.map(p => `<path d="${arch(0, 0, p.w, p.h)}" transform="translate(${p.x},${p.y}) skewX(${p.skew})" fill="${fill}"/>`).join('')}</g>
</svg>`;
}
function heroShadows(W, H, crowns, blur, opacity) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs><filter id="b" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${blur}"/></filter></defs>
  <g filter="url(#b)" fill="#3e4758" opacity="${opacity}">${crowns.map(c => `<path d="${crown(c.seed, c.x, c.y, c.size, c.n, c.a0, c.a1)}" transform="${c.t || ''}"/>`).join('')}</g>
</svg>`;
}

// ── OVERSIGHT SCENES (1200 x 1500) ──
const SW = 1200, SH = 1500;
let BARE = false; // when true, scenes render without vignette/grain (for embedding in wide openings)
const frame = (inner, defs = '', grain = 0.08) => `<svg xmlns="http://www.w3.org/2000/svg" width="${SW}" height="${SH}" viewBox="0 0 ${SW} ${SH}">
  <defs>${grainDef('grain', grain)}
    <radialGradient id="vig" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0b1220" stop-opacity=".38"/></radialGradient>${defs}</defs>
  ${inner}
  ${BARE ? '' : '<rect width="100%" height="100%" fill="url(#vig)"/><rect width="100%" height="100%" filter="url(#grain)"/>'}
</svg>`;

// 1. Estate & Household Continuity — view through an arched passage to the Intracoastal
function sceneEstate() {
  const ax = 170, ay = 210, aw = 860, ah = 1290; // outer arch
  const ix = 470, iy = 560, iw = 260, ih = 560;  // far opening
  const fronds = crown(41, 760, 520, 260, 7, 1.2, 3.2);
  return frame(`
  <rect width="100%" height="100%" fill="url(#wall)"/>
  <rect width="100%" height="100%" filter="url(#stone)"/>
  <g clip-path="url(#outer)">
    <rect width="100%" height="100%" fill="#a8977f"/>
    <!-- passage walls in perspective -->
    <path d="M${ax},${ay + aw / 2} L${ix},${iy + iw / 2} L${ix},${iy + ih} L${ax},${ay + ah}Z" fill="url(#lwall)"/>
    <path d="M${ax + aw},${ay + aw / 2} L${ix + iw},${iy + iw / 2} L${ix + iw},${iy + ih} L${ax + aw},${ay + ah}Z" fill="url(#rwall)"/>
    <path d="M${ax},${ay + ah} L${ix},${iy + ih} L${ix + iw},${iy + ih} L${ax + aw},${ay + ah}Z" fill="url(#floor)"/>
    <path d="M${ax},${ay + aw / 2} A${aw / 2},${aw / 2} 0 0 1 ${ax + aw},${ay + aw / 2} L${ix + iw},${iy + iw / 2} A${iw / 2},${iw / 2} 0 0 0 ${ix},${iy + iw / 2}Z" fill="url(#vault)"/>
    <!-- floor light pool -->
    <path d="M${ix - 40},${iy + ih + 40} L${ix + iw + 40},${iy + ih + 40} L${ix + iw + 260},${ay + ah} L${ix - 260},${ay + ah}Z" fill="#f3dfb8" opacity=".55" filter="url(#soft)"/>
    <!-- far opening: sky, water, shore -->
    <g clip-path="url(#inner)">
      <rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" fill="url(#sky)"/>
      <rect x="${ix}" y="${iy + ih * 0.66}" width="${iw}" height="${ih * 0.34}" fill="url(#water)"/>
      <rect x="${ix}" y="${iy + ih * 0.655}" width="${iw}" height="6" fill="#7f8f86" opacity=".7"/>
      <path d="${fronds}" fill="#2c3a35" opacity=".85"/>
      <rect x="${ix + iw * 0.7}" y="${iy + 140}" width="9" height="${ih}" fill="#3a463f" opacity=".8" transform="rotate(-4 ${ix + iw * 0.7} ${iy + ih})"/>
    </g>
    <path d="${arch(ix, iy, iw, ih)}" fill="none" stroke="#fff3dc" stroke-opacity=".35" stroke-width="3"/>
  </g>
  <!-- outer arch reveal and soffit -->
  <path d="${arch(ax, ay, aw, ah)}" fill="none" stroke="#f6eddd" stroke-width="10" opacity=".75"/>
  <path d="${arch(ax - 34, ay - 34, aw + 68, ah + 34)}" fill="none" stroke="#b7a68d" stroke-width="2" opacity=".6"/>
  <!-- palm shadow across the facade -->
  <path d="${crown(5, 1350, -120, 820, 8, 1.6, 3.6)}" fill="#55606d" opacity=".22" filter="url(#soft2)"/>
  `, `${stoneDef('stone', 21)}
    <clipPath id="outer"><path d="${arch(ax, ay, aw, ah)}"/></clipPath>
    <clipPath id="inner"><path d="${arch(ix, iy, iw, ih)}"/></clipPath>
    <filter id="soft"><feGaussianBlur stdDeviation="30"/></filter>
    <filter id="soft2"><feGaussianBlur stdDeviation="5"/></filter>
    <linearGradient id="wall" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6eee0"/><stop offset="1" stop-color="#e3d6c1"/></linearGradient>
    <linearGradient id="lwall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8f7d66"/><stop offset="1" stop-color="#b9a68a"/></linearGradient>
    <linearGradient id="rwall" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#a08c72"/><stop offset="1" stop-color="#c8b597"/></linearGradient>
    <linearGradient id="floor" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#9a8669"/><stop offset="1" stop-color="#d9c6a4"/></linearGradient>
    <linearGradient id="vault" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7c6b56"/><stop offset="1" stop-color="#a9957a"/></linearGradient>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcd0d6"/><stop offset=".65" stop-color="#f3e8d6"/></linearGradient>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fb0b3"/><stop offset="1" stop-color="#5f8590"/></linearGradient>`);
}

// 2. Strategic Administration — a quiet writing desk in morning light
function sceneAdmin() {
  return frame(`
  <rect width="100%" height="100%" fill="url(#wood)"/>
  <rect width="100%" height="100%" filter="url(#woodgrain)" opacity=".5"/>
  <g transform="rotate(-8 600 750)">
    <rect x="190" y="230" width="820" height="1060" rx="6" fill="url(#leather)"/>
    <rect x="214" y="254" width="772" height="1012" rx="4" fill="none" stroke="${C.gold}" stroke-opacity=".55" stroke-width="2" stroke-dasharray="7 6"/>
    <!-- closed folio -->
    <g filter="url(#drop)">
      <rect x="330" y="420" width="520" height="680" rx="8" fill="url(#folio)"/>
      <rect x="330" y="420" width="34" height="680" rx="6" fill="#e7dcc8"/>
      <circle cx="610" cy="700" r="46" fill="none" stroke="${C.gold}" stroke-width="1.6" opacity=".8"/>
      <text x="610" y="716" text-anchor="middle" font-family="Cormorant Garamond, Garamond, serif" font-size="44" letter-spacing="3" fill="${C.gold}" opacity=".9">AL</text>
    </g>
    <!-- fountain pen -->
    <g transform="rotate(32 860 1000)" filter="url(#drop)">
      <rect x="640" y="985" width="430" height="30" rx="15" fill="url(#pen)"/>
      <rect x="760" y="985" width="10" height="30" fill="${C.gold}"/>
      <rect x="1000" y="989" width="80" height="22" rx="10" fill="#0d141f"/>
      <path d="M640,1000 L586,994 L572,1000 L586,1006Z" fill="${C.goldLight}"/>
      <rect x="770" y="980" width="140" height="6" rx="3" fill="${C.gold}"/>
    </g>
  </g>
  <!-- crystal glass -->
  <g filter="url(#drop)"><circle cx="960" cy="300" r="92" fill="url(#glass)"/><circle cx="960" cy="300" r="92" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3"/><circle cx="960" cy="300" r="70" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2"/></g>
  <!-- window light with mullions + palm shadow -->
  <g opacity=".16" filter="url(#soft)">
    <path d="M-100,-40 L760,-40 L520,1540 L-340,1540Z" fill="#fff1d6"/>
  </g>
  <g fill="#0b1220" opacity=".28" filter="url(#soft)">
    <path d="M300,-40 L330,-40 L90,1540 L60,1540Z"/>
    <path d="M-140,700 L700,640 L700,672 L-140,732Z"/>
    <path d="${crown(77, 120, -260, 640, 7, 0.6, 2.6)}"/>
  </g>`, `
    <filter id="woodgrain"><feTurbulence type="fractalNoise" baseFrequency="0.004 0.12" numOctaves="3" seed="4"/><feColorMatrix values="0 0 0 0 0.1  0 0 0 0 0.06  0 0 0 0 0.03  0 0 0 .9 -.2"/></filter>
    <filter id="drop" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="-18" dy="26" stdDeviation="16" flood-color="#05080e" flood-opacity=".45"/></filter>
    <filter id="soft"><feGaussianBlur stdDeviation="9"/></filter>
    <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6b5341"/><stop offset="1" stop-color="#3c2c21"/></linearGradient>
    <linearGradient id="leather" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a3b52"/><stop offset="1" stop-color="#16212f"/></linearGradient>
    <linearGradient id="folio" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7f0e3"/><stop offset="1" stop-color="#e2d5bf"/></linearGradient>
    <linearGradient id="pen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b4b63"/><stop offset=".4" stop-color="#1b2738"/><stop offset="1" stop-color="#0b111b"/></linearGradient>
    <radialGradient id="glass" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fdf8ee" stop-opacity=".55"/><stop offset="1" stop-color="#c9d3d6" stop-opacity=".18"/></radialGradient>`);
}

// 3. Project & Real Estate Execution — fine-line elevation drawing (imaginary residence)
function sceneProject() {
  const g = C.goldLight; let grid = '';
  for (let x = 0; x <= SW; x += 40) grid += `<line x1="${x}" y1="0" x2="${x}" y2="${SH}" stroke="#fff" stroke-opacity="${x % 200 ? .03 : .06}"/>`;
  for (let y = 0; y <= SH; y += 40) grid += `<line x1="0" y1="${y}" x2="${SW}" y2="${y}" stroke="#fff" stroke-opacity="${y % 200 ? .03 : .06}"/>`;
  const base = 1060, L = 150, R = 1050;
  let arches = '', wins = '';
  for (let i = 0; i < 5; i++) { const x = 205 + i * 165; arches += `<path d="${arch(x, base - 300, 125, 300)}"/><line x1="${x - 20}" y1="${base}" x2="${x - 20}" y2="${base - 340}" stroke-opacity=".5"/>`; }
  for (let i = 0; i < 5; i++) { const x = 220 + i * 165; wins += `<rect x="${x}" y="${base - 560}" width="95" height="170"/><line x1="${x + 47.5}" y1="${base - 560}" x2="${x + 47.5}" y2="${base - 390}"/><line x1="${x}" y1="${base - 475}" x2="${x + 95}" y2="${base - 475}"/><rect x="${x - 30}" y="${base - 560}" width="26" height="170" stroke-opacity=".6"/><rect x="${x + 99}" y="${base - 560}" width="26" height="170" stroke-opacity=".6"/><line x1="${x - 8}" y1="${base - 378}" x2="${x + 103}" y2="${base - 378}"/>`; }
  let tiles = '';
  for (let x = L - 20; x < R + 20; x += 14) tiles += `<line x1="${x}" y1="${base - 640}" x2="${x + 6}" y2="${base - 628}" stroke-opacity=".5"/>`;
  return frame(`
  <rect width="100%" height="100%" fill="url(#paper)"/>
  ${grid}
  <g fill="none" stroke="${g}" stroke-width="1.6" stroke-linejoin="round">
    <line x1="80" y1="${base}" x2="${SW - 80}" y2="${base}" stroke-width="2.4"/>
    <rect x="${L}" y="${base - 640}" width="${R - L}" height="640"/>
    <path d="M${L - 40},${base - 640} L${(L + R) / 2},${base - 830} L${R + 40},${base - 640}Z"/>
    ${tiles}
    <rect x="${R - 210}" y="${base - 900}" width="70" height="170"/><rect x="${R - 222}" y="${base - 915}" width="94" height="18"/>
    <line x1="${L}" y1="${base - 340}" x2="${R}" y2="${base - 340}"/>
    <line x1="${L}" y1="${base - 352}" x2="${R}" y2="${base - 352}" stroke-opacity=".6"/>
    ${arches}${wins}
    <!-- dimension lines -->
    <g stroke-opacity=".7" stroke-width="1.1">
      <line x1="${L}" y1="${base + 90}" x2="${R}" y2="${base + 90}"/><line x1="${L}" y1="${base + 70}" x2="${L}" y2="${base + 110}"/><line x1="${R}" y1="${base + 70}" x2="${R}" y2="${base + 110}"/>
      <line x1="${L - 12}" y1="${base + 102}" x2="${L + 12}" y2="${base + 78}"/><line x1="${R - 12}" y1="${base + 102}" x2="${R + 12}" y2="${base + 78}"/>
      <line x1="${R + 80}" y1="${base}" x2="${R + 80}" y2="${base - 640}"/><line x1="${R + 60}" y1="${base}" x2="${R + 100}" y2="${base}"/><line x1="${R + 60}" y1="${base - 640}" x2="${R + 100}" y2="${base - 640}"/>
    </g>
  </g>
  <g font-family="Jost, Helvetica, sans-serif" font-size="17" letter-spacing="5" fill="${g}" opacity=".75">
    <text x="${(L + R) / 2}" y="${base + 140}" text-anchor="middle">SOUTH ELEVATION</text>
    <text x="80" y="${SH - 110}">SHEET A-201</text><text x="${SW - 80}" y="${SH - 110}" text-anchor="end">SCALE 1/8" = 1'-0"</text>
  </g>
  <line x1="80" y1="${SH - 150}" x2="${SW - 80}" y2="${SH - 150}" stroke="${g}" stroke-opacity=".4"/>
  `, `<linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22344b"/><stop offset="1" stop-color="#121c29"/></linearGradient>`, 0.06);
}

// 4. Principal Relationship Management — sealed correspondence on linen
function sceneRelations() {
  return frame(`
  <rect width="100%" height="100%" fill="url(#linen)"/>
  <rect width="100%" height="100%" filter="url(#weave)"/>
  <g transform="rotate(7 600 820)" filter="url(#drop)"><rect x="300" y="900" width="560" height="330" rx="3" fill="#fbf7ef"/>
    <line x1="380" y1="1060" x2="780" y2="1060" stroke="${C.gold}" stroke-opacity=".45"/></g>
  <g transform="rotate(-6 600 640)" filter="url(#drop)">
    <rect x="200" y="420" width="800" height="530" rx="4" fill="url(#env)"/>
    <path d="M200,424 L600,720 L1000,424" fill="none" stroke="#cdbfa6" stroke-width="2"/>
    <path d="M200,946 L520,690 M1000,946 L680,690" fill="none" stroke="#d9ccb5" stroke-width="1.6"/>
    <!-- wax seal -->
    <g transform="translate(600 712)">
      <path d="${sealPath(78)}" fill="url(#wax)"/>
      <circle r="52" fill="none" stroke="#0e1724" stroke-opacity=".5" stroke-width="3"/>
      <circle r="52" fill="none" stroke="#5b6f8b" stroke-opacity=".35" stroke-width="1" transform="translate(-1.5 -1.5)"/>
      <text y="15" text-anchor="middle" font-family="Cormorant Garamond, Garamond, serif" font-size="46" font-style="italic" letter-spacing="2" fill="${C.gold}" opacity=".95">AL</text>
    </g>
  </g>
  <g opacity=".22" fill="#2a2f38" filter="url(#soft)"><path d="${crown(13, 1300, 200, 700, 7, 1.9, 3.7)}"/></g>
  <rect width="100%" height="100%" fill="url(#rake)"/>
  `, `
    <filter id="weave"><feTurbulence type="fractalNoise" baseFrequency="0.9 0.04" numOctaves="2" seed="2"/><feColorMatrix values="0 0 0 0 .4  0 0 0 0 .36  0 0 0 0 .3  0 0 0 .5 -.12"/></filter>
    <filter id="drop" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="22" dy="28" stdDeviation="18" flood-color="#3a2c1c" flood-opacity=".28"/></filter>
    <filter id="soft"><feGaussianBlur stdDeviation="6"/></filter>
    <linearGradient id="linen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ece3d3"/><stop offset="1" stop-color="#d7c9b1"/></linearGradient>
    <linearGradient id="env" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbf6ec"/><stop offset="1" stop-color="#eee3d0"/></linearGradient>
    <radialGradient id="wax" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#3f5470"/><stop offset=".55" stop-color="#1e2d40"/><stop offset="1" stop-color="#0d1520"/></radialGradient>
    <linearGradient id="rake" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6e4" stop-opacity=".35"/><stop offset=".6" stop-color="#fff6e4" stop-opacity="0"/></linearGradient>`);
}
function sealPath(r) { const R = rng(99); let d = ''; const n = 40; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, rr = r * (0.94 + R() * 0.09); d += (i ? 'L' : 'M') + (Math.cos(a) * rr).toFixed(1) + ',' + (Math.sin(a) * rr).toFixed(1); } return d + 'Z'; }

// 5. Vendor & Partner Coordination — an arched iron garden gate in morning light
function sceneVendors() {
  const gx = 260, gy = 260, gw = 680, gh = 1140; let bars = '';
  for (let x = gx + 34; x < gx + gw - 20; x += 38) bars += `<rect x="${x}" y="${gy}" width="9" height="${gh}"/><path d="M${x + 4.5},${gy + gh * 0.05} l-9,22 h18z"/>`;
  return frame(`
  <rect width="100%" height="100%" fill="url(#garden)"/>
  <g filter="url(#bokeh)" opacity=".9">${bokeh()}</g>
  <rect x="0" y="1180" width="${SW}" height="320" fill="url(#path)"/>
  <!-- stone piers -->
  <rect x="0" y="0" width="${gx}" height="${SH}" fill="url(#pier)"/><rect x="${gx + gw}" y="0" width="${SW - gx - gw}" height="${SH}" fill="url(#pier2)"/>
  <rect x="0" y="0" width="${gx}" height="${SH}" filter="url(#stone)"/><rect x="${gx + gw}" y="0" width="${SW - gx - gw}" height="${SH}" filter="url(#stone)"/>
  <!-- gate -->
  <g fill="#18212c" clip-path="url(#gclip)">
    ${bars}
    <rect x="${gx}" y="${gy + gh * 0.38}" width="${gw}" height="10"/><rect x="${gx}" y="${gy + gh * 0.82}" width="${gw}" height="10"/>
    <rect x="${gx + gw / 2 - 6}" y="${gy}" width="12" height="${gh}"/>
  </g>
  <path d="${arch(gx, gy, gw, gh)}" fill="none" stroke="#18212c" stroke-width="16"/>
  <path d="${arch(gx + 40, gy + 40, gw - 80, gh)}" fill="none" stroke="#18212c" stroke-width="6" clip-path="url(#gclip)"/>
  <g fill="none" stroke="#18212c" stroke-width="6">${scroll(gx + gw / 2 - 110, gy + 230, 1)}${scroll(gx + gw / 2 + 110, gy + 230, -1)}</g>
  <circle cx="${gx + gw / 2}" cy="${gy + 140}" r="34" fill="none" stroke="${C.gold}" stroke-width="5"/>
  <!-- sun flare -->
  <circle cx="820" cy="420" r="320" fill="url(#flare)"/>
  `, `${stoneDef('stone', 33)}
    <clipPath id="gclip"><path d="${arch(gx, gy, gw, gh)}"/></clipPath>
    <filter id="bokeh"><feGaussianBlur stdDeviation="26"/></filter>
    <linearGradient id="garden" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4ecd6"/><stop offset=".45" stop-color="#9aa784"/><stop offset="1" stop-color="#4e5f46"/></linearGradient>
    <linearGradient id="path" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9cbb0" stop-opacity=".7"/><stop offset="1" stop-color="#b6a487"/></linearGradient>
    <linearGradient id="pier" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cdbfa8"/><stop offset="1" stop-color="#e8dfcf"/></linearGradient>
    <linearGradient id="pier2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b9aa91"/><stop offset="1" stop-color="#d6c9b3"/></linearGradient>
    <radialGradient id="flare"><stop offset="0" stop-color="#fff8e6" stop-opacity=".55"/><stop offset="1" stop-color="#fff8e6" stop-opacity="0"/></radialGradient>`);
}
function bokeh() { const r = rng(5); let s = ''; for (let i = 0; i < 46; i++) { const x = 200 + r() * 800, y = 350 + r() * 900, rr = 30 + r() * 90; const c = r() > 0.6 ? '#f7eed4' : (r() > 0.5 ? '#6f8058' : '#3e5136'); s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${rr.toFixed(0)}" fill="${c}" opacity="${(0.35 + r() * 0.5).toFixed(2)}"/>`; } return s; }
function scroll(x, y, dir) { return `<path d="M${x},${y} c${40 * dir},-60 ${110 * dir},-40 ${100 * dir},20 c${-6 * dir},40 ${-56 * dir},40 ${-60 * dir},8 c${-2 * dir},-22 ${26 * dir},-30 ${34 * dir},-12"/><path d="M${x},${y} c${-40 * dir},60 ${-110 * dir},40 ${-100 * dir},-20 c${6 * dir},-40 ${56 * dir},-40 ${60 * dir},-8"/>`; }

// 6. Seasonal & Travel Operations — arrival along a palm-lined drive at dusk
function sceneTravel() {
  const vx = 600, vy = 905; let palms = '';
  const r = rng(8);
  for (let i = 9; i >= 0; i--) {
    const t = Math.pow(0.72, i); // depth scale
    for (const side of [-1, 1]) {
      const x = vx + side * (90 + 900 * t), base = vy + 640 * t, h = 1150 * t, w = Math.max(3, 26 * t);
      palms += `<path d="M${x - w / 2},${base} Q${x - w * 0.3},${base - h * 0.5} ${x - w * 0.25},${base - h} L${x + w * 0.25},${base - h} Q${x + w * 0.3},${base - h * 0.5} ${x + w / 2},${base}Z"/>`;
      palms += `<path d="${crown(30 + i * 2 + (side > 0 ? 1 : 0), x, base - h, 260 * t, 11, -0.35, 3.5)}"/>`;
    }
  }
  return frame(`
  <rect width="100%" height="100%" fill="url(#dusk)"/>
  <circle cx="${vx}" cy="${vy}" r="420" fill="url(#glow)"/>
  <!-- residence glow at end of drive -->
  <rect x="${vx - 70}" y="${vy - 46}" width="140" height="46" fill="#0f1826"/>
  <path d="${arch(vx - 16, vy - 34, 32, 34)}" fill="#ffd9a0"/>
  <rect x="${vx - 56}" y="${vy - 30}" width="14" height="16" fill="#ffcf8a" opacity=".8"/><rect x="${vx + 42}" y="${vy - 30}" width="14" height="16" fill="#ffcf8a" opacity=".8"/>
  <!-- drive -->
  <path d="M${vx - 26},${vy} L${vx + 26},${vy} L${SW + 300},${SH} L${-300},${SH}Z" fill="url(#drive)"/>
  <path d="M${vx},${vy} L${vx},${SH}" stroke="#e7c897" stroke-opacity=".18" stroke-width="2"/>
  <!-- lawn edges -->
  <path d="M0,${vy + 20} L${vx - 26},${vy} L${-300},${SH} L0,${SH}Z" fill="#0d1622"/>
  <path d="M${SW},${vy + 20} L${vx + 26},${vy} L${SW + 300},${SH} L${SW},${SH}Z" fill="#0d1622"/>
  <g fill="#0a111b">${palms}</g>
  <!-- path lanterns -->
  ${[0, 1, 2, 3, 4, 5].map(i => { const t = Math.pow(0.68, i); return [-1, 1].map(s => `<circle cx="${vx + s * (40 + 640 * t)}" cy="${vy + 560 * t}" r="${Math.max(2, 9 * t)}" fill="#ffd9a0"/><circle cx="${vx + s * (40 + 640 * t)}" cy="${vy + 560 * t}" r="${Math.max(8, 40 * t)}" fill="url(#lamp)"/>`).join(''); }).join('')}
  `, `
    <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16233a"/><stop offset=".38" stop-color="#3b4a66"/><stop offset=".55" stop-color="#b68a7b"/><stop offset=".62" stop-color="#e7b98b"/><stop offset=".64" stop-color="#1a2536"/></linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="#ffd8a3" stop-opacity=".55"/><stop offset="1" stop-color="#ffd8a3" stop-opacity="0"/></radialGradient>
    <radialGradient id="lamp"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".5"/><stop offset="1" stop-color="#ffd9a0" stop-opacity="0"/></radialGradient>
    <linearGradient id="drive" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b7a68"/><stop offset=".25" stop-color="#3d4049"/><stop offset="1" stop-color="#1a202b"/></linearGradient>`, 0.07);
}


// ── WIDE PAGE OPENINGS (2400 x 1350) ──
const WW = 2400, WH = 1350;
function wide(sceneFn, extend, { cx = 0.68, dark = false } = {}) {
  BARE = true; const inner = sceneFn(); BARE = false;
  const k = WH / SH, w = SW * k, x = WW * cx - w / 2;
  const enc = Buffer.from(inner).toString('base64');
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${WW}" height="${WH}" viewBox="0 0 ${WW} ${WH}">
  <defs>${grainDef('grain', 0.07)}
    <linearGradient id="feather" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".16" stop-color="#fff"/><stop offset=".84" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <mask id="m"><rect x="${x}" y="0" width="${w}" height="${WH}" fill="url(#feather)"/></mask>
    <radialGradient id="vig" cx="${cx}" cy=".5" r=".9"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0b1220" stop-opacity="${dark ? .45 : .28}"/></radialGradient>
    ${extend.defs}</defs>
  ${extend.body}
  <image x="${x}" y="0" width="${w}" height="${WH}" href="data:image/svg+xml;base64,${enc}" mask="url(#m)"/>
  <rect width="100%" height="100%" fill="url(#vig)"/>
  <rect width="100%" height="100%" filter="url(#grain)"/>
</svg>`;
}
const EXT = {
  estate: { defs: `${stoneDef('xs', 21)}<linearGradient id="xw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6eee0"/><stop offset="1" stop-color="#e3d6c1"/></linearGradient>`,
            body: `<rect width="100%" height="100%" fill="url(#xw)"/><rect width="100%" height="100%" filter="url(#xs)"/><path d="${crown(17, -120, -200, 900, 8, -0.2, 1.8)}" fill="#55606d" opacity=".16"/>` },
  admin: { defs: `<filter id="xg"><feTurbulence type="fractalNoise" baseFrequency="0.002 0.06" numOctaves="3" seed="4"/><feColorMatrix values="0 0 0 0 0.1  0 0 0 0 0.06  0 0 0 0 0.03  0 0 0 .9 -.2"/></filter><linearGradient id="xw" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5e4838"/><stop offset="1" stop-color="#33261d"/></linearGradient>`,
           body: `<rect width="100%" height="100%" fill="url(#xw)"/><rect width="100%" height="100%" filter="url(#xg)" opacity=".5"/>` },
  projects: { defs: `<linearGradient id="xp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22344b"/><stop offset="1" stop-color="#121c29"/></linearGradient>`,
              body: (() => { let g = `<rect width="100%" height="100%" fill="url(#xp)"/>`; for (let x = 0; x <= WW; x += 36) g += `<line x1="${x}" y1="0" x2="${x}" y2="${WH}" stroke="#fff" stroke-opacity="${x % 180 ? .03 : .06}"/>`; for (let y = 0; y <= WH; y += 36) g += `<line x1="0" y1="${y}" x2="${WW}" y2="${y}" stroke="#fff" stroke-opacity="${y % 180 ? .03 : .06}"/>`; return g; })() },
  relations: { defs: `<filter id="xv"><feTurbulence type="fractalNoise" baseFrequency="0.9 0.04" numOctaves="2" seed="2"/><feColorMatrix values="0 0 0 0 .4  0 0 0 0 .36  0 0 0 0 .3  0 0 0 .5 -.12"/></filter><linearGradient id="xl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ece3d3"/><stop offset="1" stop-color="#d7c9b1"/></linearGradient>`,
               body: `<rect width="100%" height="100%" fill="url(#xl)"/><rect width="100%" height="100%" filter="url(#xv)"/>` },
  vendors: { defs: `${stoneDef('xs', 33)}<linearGradient id="xp2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e8dfcf"/><stop offset="1" stop-color="#cdbfa8"/></linearGradient>`,
             body: `<rect width="100%" height="100%" fill="url(#xp2)"/><rect width="100%" height="100%" filter="url(#xs)"/>` },
};
// About — morning light on the Intracoastal (native wide composition)
function wideIntracoastal() {
  const hz = WH * 0.56; const r = rng(12); let glints = '', shore = '';
  for (let i = 0; i < 140; i++) { const y = hz + 20 + Math.pow(r(), 1.6) * (WH - hz - 20), x = WW * 0.35 + (r() - 0.3) * WW * 0.7 * (1 - (y - hz) / (WH - hz) * 0.3); const w = 20 + r() * 120 * ((y - hz) / (WH - hz) + 0.2); glints += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${(1.5 + r() * 2.5).toFixed(1)}" rx="1" fill="#fff7e6" opacity="${(0.25 + r() * 0.5).toFixed(2)}"/>`; }
  for (let i = 0; i < 34; i++) { const x = r() * WW, h = 18 + r() * 40; shore += `<rect x="${x.toFixed(0)}" y="${(hz - h).toFixed(0)}" width="${(30 + r() * 120).toFixed(0)}" height="${h.toFixed(0)}"/>`; }
  let palms = ''; for (let i = 0; i < 16; i++) { const x = r() * WW, h = 50 + r() * 40; palms += `<rect x="${x.toFixed(0)}" y="${(hz - h).toFixed(0)}" width="3" height="${h.toFixed(0)}"/><path d="${crown(200 + i, x + 1.5, hz - h, 22, 8, -0.4, 3.5)}"/>`; }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WW}" height="${WH}" viewBox="0 0 ${WW} ${WH}">
  <defs>${grainDef('grain', 0.07)}
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9d6d9"/><stop offset=".55" stop-color="#efe6d6"/><stop offset="1" stop-color="#f8ecd6"/></linearGradient>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9c8c4"/><stop offset=".4" stop-color="#8fa9a8"/><stop offset="1" stop-color="#5e7e83"/></linearGradient>
    <radialGradient id="sun" cx=".72" cy=".5" r=".45"><stop offset="0" stop-color="#fff4dc" stop-opacity=".9"/><stop offset="1" stop-color="#fff4dc" stop-opacity="0"/></radialGradient>
    <filter id="haze"><feGaussianBlur stdDeviation="4.5"/></filter><filter id="soft"><feGaussianBlur stdDeviation="4"/></filter>
    <radialGradient id="vig" cx=".6" cy=".5" r=".9"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0b1220" stop-opacity=".25"/></radialGradient></defs>
  <rect width="100%" height="${hz}" fill="url(#sky)"/>
  <rect y="${hz}" width="100%" height="${WH - hz}" fill="url(#water)"/>
  <rect width="100%" height="100%" fill="url(#sun)"/>
  <g fill="#8e9a95" opacity=".42" filter="url(#haze)">${shore}${palms}</g>
  <rect y="${hz - 2}" width="100%" height="3" fill="#7f9290" opacity=".5"/>
  <g filter="url(#haze)">${glints}</g>
  <!-- foreground: dock pilings and a frond -->
  <g fill="#2f3a3a"><rect x="${WW * 0.84}" y="${hz + 120}" width="26" height="${WH}" rx="4"/><rect x="${WW * 0.9}" y="${hz + 60}" width="20" height="${WH}" rx="4"/></g>
  <rect x="${WW * 0.8}" y="${hz + 150}" width="${WW * 0.2}" height="16" fill="#3a4645"/>
  <path d="${crown(61, WW + 60, -120, 760, 9, 1.7, 3.6)}" fill="#263330" opacity=".92" filter="url(#soft)"/>
  <rect width="100%" height="100%" fill="url(#vig)"/>
  <rect width="100%" height="100%" filter="url(#grain)"/>
</svg>`;
}


// About — golden hour over Lake Worth beyond a limestone balustrade
function baluster(cx, y0, h, w) {
  const y = t => (y0 + h * t).toFixed(1), x = k => (cx + w * k).toFixed(1), xl = k => (cx - w * k).toFixed(1);
  return `M${xl(.46)},${y(0)}H${x(.46)}V${y(.07)}H${x(.2)}C${x(.18)},${y(.16)} ${x(.2)},${y(.26)} ${x(.3)},${y(.36)}C${x(.46)},${y(.5)} ${x(.44)},${y(.68)} ${x(.22)},${y(.8)}C${x(.17)},${y(.84)} ${x(.2)},${y(.88)} ${x(.3)},${y(.9)}H${x(.46)}V${y(1)}H${xl(.46)}V${y(.9)}H${xl(.3)}C${xl(.2)},${y(.88)} ${xl(.17)},${y(.84)} ${xl(.22)},${y(.8)}C${xl(.44)},${y(.68)} ${xl(.46)},${y(.5)} ${xl(.3)},${y(.36)}C${xl(.2)},${y(.26)} ${xl(.18)},${y(.16)} ${xl(.2)},${y(.07)}H${xl(.46)}Z`;
}
function wideAbout() {
  const hz = WH * 0.54, sunX = WW * 0.7, r = rng(31);
  let glints = ''; for (let i = 0; i < 170; i++) { const t = Math.pow(r(), 1.3), y = hz + 8 + t * (WH * 0.66 - hz), spread = 30 + t * 520; const x = sunX + (r() - 0.5) * spread * 2; glints += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${(14 + r() * 70 * (0.4 + t)).toFixed(0)}" height="${(1.5 + r() * 2.5 * (0.4 + t)).toFixed(1)}" rx="1" fill="#ffe9c4" opacity="${(0.35 + r() * 0.55).toFixed(2)}"/>`; }
  let shore = ''; for (let i = 0; i < 40; i++) { const x = r() * WW, h = 10 + r() * 26; shore += `<rect x="${x.toFixed(0)}" y="${(hz - h).toFixed(0)}" width="${(30 + r() * 110).toFixed(0)}" height="${h.toFixed(0)}"/>`; }
  for (let i = 0; i < 18; i++) { const x = r() * WW, h = 34 + r() * 30; shore += `<rect x="${x.toFixed(0)}" y="${(hz - h).toFixed(0)}" width="2.4" height="${h.toFixed(0)}"/><path d="${crown(300 + i, x + 1.2, hz - h, 16, 8, -0.4, 3.5)}"/>`; }
  const railY = WH * 0.66, balTop = railY + 46, balH = WH - 60 - balTop, bw = 92, gap = 128;
  let bals = ''; for (let x = 40; x < WW + bw; x += gap) bals += `<path d="${baluster(x, balTop, balH, bw)}"/>`;
  let rims = ''; for (let x = 40; x < WW + bw; x += gap) rims += `<path d="${baluster(x + 3, balTop, balH, bw)}" />`;
  const trunk = `M${WW * 0.93},${WH} C${WW * 0.925},${WH * 0.6} ${WW * 0.9},${WH * 0.3} ${WW * 0.86},${WH * 0.06}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WW}" height="${WH}" viewBox="0 0 ${WW} ${WH}">
  <defs>${grainDef('grain', 0.07)}${stoneDef('st', 44)}
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fa3b4"/><stop offset=".45" stop-color="#d9c2a8"/><stop offset=".85" stop-color="#f2d2a9"/><stop offset="1" stop-color="#f7dfba"/></linearGradient>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6b897"/><stop offset=".35" stop-color="#8f9a98"/><stop offset="1" stop-color="#4f6670"/></linearGradient>
    <radialGradient id="sun" cx="${sunX / WW}" cy="${(hz - 40) / WH}" r=".5"><stop offset="0" stop-color="#fff3d6" stop-opacity="1"/><stop offset=".08" stop-color="#ffe6b8" stop-opacity=".85"/><stop offset=".4" stop-color="#f6cf9c" stop-opacity=".25"/><stop offset="1" stop-color="#f6cf9c" stop-opacity="0"/></radialGradient>
    <linearGradient id="rail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6dfb8"/><stop offset=".2" stop-color="#a88f72"/><stop offset="1" stop-color="#5f5042"/></linearGradient>
    <linearGradient id="bal" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5f5042"/><stop offset=".55" stop-color="#7a6754"/><stop offset="1" stop-color="#4c4036"/></linearGradient>
    <linearGradient id="plinth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8d775f"/><stop offset="1" stop-color="#4f4237"/></linearGradient>
    <filter id="haze"><feGaussianBlur stdDeviation="4"/></filter><filter id="soft"><feGaussianBlur stdDeviation="3"/></filter><filter id="glow"><feGaussianBlur stdDeviation="9"/></filter>
    <radialGradient id="vig" cx=".6" cy=".45" r=".9"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1a1410" stop-opacity=".35"/></radialGradient></defs>
  <rect width="100%" height="${hz}" fill="url(#sky)"/>
  <rect y="${hz}" width="100%" height="${WH - hz}" fill="url(#water)"/>
  <rect width="100%" height="100%" fill="url(#sun)"/>
  <circle cx="${sunX}" cy="${hz - 46}" r="38" fill="#fff6e2" filter="url(#glow)"/>
  <g fill="#8a8580" opacity=".45" filter="url(#haze)">${shore}</g>
  <g filter="url(#soft)">${glints}</g>
  <!-- balustrade -->
  <g fill="url(#bal)">${bals}</g>
  <g fill="none" stroke="#ffe3b8" stroke-opacity=".45" stroke-width="2.2" filter="url(#soft)">${rims}</g>
  <rect x="0" y="${railY}" width="${WW}" height="46" fill="url(#rail)"/>
  <rect x="0" y="${railY}" width="${WW}" height="3" fill="#fff1d8" opacity=".8"/>
  <rect x="0" y="${railY + 46}" width="${WW}" height="10" fill="#5e4f40" opacity=".35"/>
  <rect x="0" y="${WH - 60}" width="${WW}" height="60" fill="url(#plinth)"/>
  <!-- palm framing the right edge -->
  <path d="${trunk}" stroke="#2c2721" stroke-width="30" fill="none" stroke-linecap="round"/>
  <path d="${crown(77, WW * 0.86, WH * 0.06, 520, 12, -0.6, 3.6)}" fill="#2c2721" opacity=".96" filter="url(#soft)"/>
  <rect width="100%" height="100%" fill="url(#vig)"/>
  <rect width="100%" height="100%" filter="url(#grain)"/>
</svg>`;
}

// The Platform — a lamplit wall of navy lacquer index drawers, one drawer open
function widePlatform() {
  const cols = 5, rows = 5, x0 = WW * 0.58, y0 = WH * -0.04, cw = (WW * 1.1 - x0) / cols, ch = (WH * 1.1) / rows;
  let drawers = '';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = x0 + c * cw, y = y0 + r * ch, open = (r === 2 && c === 1);
    const fx = x + 14, fy = y + 14, fw = cw - 28, fh = ch - 28;
    if (open) {
      drawers += `<rect x="${x + 4}" y="${y + 4}" width="${cw - 8}" height="${ch - 8}" fill="#070b12"/>`;
      const d = 46; // drawer pulled toward the viewer: front grows and drops
      drawers += `<path d="M${fx - d},${fy - 6} L${fx},${fy - 40} L${fx + fw},${fy - 40} L${fx + fw + d},${fy - 6}Z" fill="#0f1724"/>`;
      for (let k = 0; k < 7; k++) drawers += `<path d="M${fx - d + 18 + k * 4},${fy - 4 - k * 4.5} L${fx + fw + d - 18 - k * 4},${fy - 4 - k * 4.5} L${fx + fw + d - 22 - k * 4},${fy - 20 - k * 4.5} L${fx - d + 22 + k * 4},${fy - 20 - k * 4.5}Z" fill="${k % 2 ? '#efe4cf' : '#e2d3b8'}" opacity="${0.96 - k * 0.07}"/>`;
      drawers += `<rect x="${fx - d}" y="${fy - 6}" width="${fw + d * 2}" height="${fh + d * 0.8}" fill="url(#lacq)" filter="url(#drop)"/>`;
      drawers += `<rect x="${fx - d}" y="${fy - 6}" width="${fw + d * 2}" height="3" fill="#f6dcae" opacity=".35"/>`;
      drawers += pull(fx + fw / 2, fy + fh * 0.7 + 10, fw + d * 2) + label(fx + fw / 2, fy + fh * 0.34, fw + d * 2);
    } else {
      drawers += `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="url(#lacq)"/>`;
      drawers += `<rect x="${fx}" y="${fy}" width="${fw}" height="2" fill="#f6dcae" opacity=".16"/><rect x="${fx}" y="${fy + fh - 2}" width="${fw}" height="2" fill="#000" opacity=".35"/>`;
      drawers += pull(fx + fw / 2, fy + fh * 0.66, fw) + label(fx + fw / 2, fy + fh * 0.32, fw);
    }
  }
  function pull(cx, cy, fw) { const w = fw * 0.34; return `<path d="M${cx - w / 2},${cy - 6} h${w} v4 a${w / 2},${w * 0.32} 0 0 1 ${-w},0z" fill="url(#brass)"/><path d="M${cx - w / 2},${cy - 6} h${w}" stroke="#fff0c8" stroke-opacity=".5" stroke-width="1.5"/>`; }
  function label(cx, cy, fw) { const w = fw * 0.42, h = w * 0.42; return `<rect x="${cx - w / 2 - 4}" y="${cy - h / 2 - 4}" width="${w + 8}" height="${h + 8}" rx="2" fill="url(#brass)"/><rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" fill="#efe5d1"/><rect x="${cx - w * 0.3}" y="${cy - 1}" width="${w * 0.6}" height="1.4" fill="#b8976a" opacity=".55"/>`; }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WW}" height="${WH}" viewBox="0 0 ${WW} ${WH}">
  <defs>${grainDef('grain', 0.06)}
    <linearGradient id="wall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0d1420"/><stop offset=".5" stop-color="#16212f"/><stop offset="1" stop-color="#1b2738"/></linearGradient>
    <linearGradient id="lacq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3b52"/><stop offset=".5" stop-color="#1f2d40"/><stop offset="1" stop-color="#172232"/></linearGradient>
    <linearGradient id="brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0d49c"/><stop offset=".5" stop-color="#b8976a"/><stop offset="1" stop-color="#7d6440"/></linearGradient>
    <radialGradient id="lamp" cx=".6" cy=".22" r=".62"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".55"/><stop offset=".4" stop-color="#ffc98a" stop-opacity=".16"/><stop offset="1" stop-color="#ffc98a" stop-opacity="0"/></radialGradient>
    <filter id="drop" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="22" stdDeviation="14" flood-color="#000" flood-opacity=".55"/></filter>
    <filter id="soft"><feGaussianBlur stdDeviation="7"/></filter>
    <radialGradient id="vig" cx=".66" cy=".42" r=".85"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#05080d" stop-opacity=".6"/></radialGradient></defs>
  <rect width="100%" height="100%" fill="url(#wall)"/>
  <rect x="${x0 - 24}" y="${y0 - 24}" width="${WW}" height="${WH}" fill="#101925"/>
  <rect x="${x0 - 24}" y="${y0 - 24}" width="${WW}" height="3" fill="#b8976a" opacity=".5"/>
  ${drawers}
  <rect width="100%" height="100%" fill="url(#lamp)" style="mix-blend-mode:screen"/>
  <path d="${crown(88, WW * 0.98, -260, 900, 9, 1.7, 3.7)}" fill="#03060b" opacity=".42" filter="url(#soft)"/>
  <rect width="100%" height="100%" fill="url(#vig)"/>
  <rect width="100%" height="100%" filter="url(#grain)"/>
</svg>`;
}

// ── render pipeline ──
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  await page.setContent(`<html><head><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Jost:wght@300;400&display=swap" rel="stylesheet"></head><body style="margin:0"></body></html>`, { waitUntil: 'networkidle' });
  async function render(name, svg, w, h, { transparent = false, quality = 80, lossless = false } = {}) {
    await page.setViewportSize({ width: w, height: h });
    await page.evaluate(s => { document.body.style.background = 'transparent'; document.body.innerHTML = s; }, svg);
    await page.evaluate(() => document.fonts.ready);
    const png = path.join(OUT, name + '.png');
    await page.screenshot({ path: png, omitBackground: transparent, clip: { x: 0, y: 0, width: w, height: h } });
    execFileSync('python3', ['-c', `from PIL import Image; im=Image.open('${png}'); im.save('${path.join(OUT, name + '.webp')}', 'WEBP', quality=${quality}, method=6${lossless ? ', lossless=True' : ''})`]);
    fs.unlinkSync(png);
    console.log(name, (fs.statSync(path.join(OUT, name + '.webp')).size / 1024).toFixed(0) + 'K');
  }
  if (process.argv[3] !== 'wide-only') {
  // Hero, landscape 2400x1500 and portrait 1200x2000
  const L = { W: 2400, H: 1500, patches: [{ x: 1400, y: 150, w: 340, h: 1200, skew: -14 }, { x: 1850, y: 150, w: 340, h: 1200, skew: -14 }] };
  const P = { W: 1200, H: 2000, patches: [{ x: 430, y: 110, w: 320, h: 1100, skew: -12 }, { x: 840, y: 110, w: 320, h: 1100, skew: -12 }] };
  for (const [k, v] of [['l', L], ['p', P]]) {
    await render(`hero-wall-${k}`, heroWall(v.W, v.H), v.W, v.H, { quality: 74 });
    await render(`hero-sun-${k}`, heroPatches(v.W, v.H, v.patches, 'light'), v.W, v.H, { transparent: true, quality: 80 });
    await render(`hero-mask-${k}`, heroPatches(v.W, v.H, v.patches, 'mask'), v.W, v.H, { quality: 70 });
  }
  // palm shadow layers (shared; positioned over the sunlit area)
  await render('hero-fronds-far', heroShadows(1600, 1600, [{ seed: 2, x: 980, y: -80, size: 760, n: 10, a0: 0.1, a1: 3.2 }], 10, 0.55), 1600, 1600, { transparent: true, quality: 78 });
  await render('hero-fronds-near', heroShadows(1600, 1600, [{ seed: 9, x: 420, y: -160, size: 880, n: 9, a0: 0.2, a1: 2.9 }], 3.2, 0.7), 1600, 1600, { transparent: true, quality: 80 });
  }
  if (process.argv[3] !== 'wide-only') await render('grain', `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><defs>${grainDef('g', 0.16, 0.95)}</defs><rect width="256" height="256" filter="url(#g)"/></svg>`, 256, 256, { transparent: true, lossless: true });
  // oversight scenes
  const scenes = { 'oversee-estate': sceneEstate, 'oversee-administration': sceneAdmin, 'oversee-projects': sceneProject, 'oversee-relationships': sceneRelations, 'oversee-vendors': sceneVendors, 'oversee-travel': sceneTravel };
  if (process.argv[3] !== 'wide-only') for (const [n, f] of Object.entries(scenes)) await render(n, f(), SW, SH, { quality: 80 });
  // wide page openings
  const opens = { 'open-about': () => wideAbout(), 'open-engagements': () => wide(sceneEstate, EXT.estate),
    'open-advisors': () => wide(sceneAdmin, EXT.admin, { dark: true }), 'open-platform': () => widePlatform(),
    'open-contact': () => wide(sceneRelations, EXT.relations), 'open-privacy': () => wide(sceneVendors, EXT.vendors) };
  for (const [n, f] of Object.entries(opens)) await render(n, f(), WW, WH, { quality: 76 });
  await browser.close();
})();
