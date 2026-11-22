/* =====================================================================
   Procedural paper-craft art. Every sprite is painted with Canvas2D,
   given a cream "cut paper" edge, and turned into a texture.
   ===================================================================== */
export const INK = '#3a2a24';
const CREAM = '#fff6e3';

export function mk(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.lineJoin = 'round'; g.lineCap = 'round';
  return [c, g];
}

/* ---------- drawing helpers ---------- */
function fs(g, fill, lw = 5, stroke = INK) {
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (lw) { g.lineWidth = lw; g.strokeStyle = stroke; g.stroke(); }
}
export function ell(g, x, y, rx, ry, fill, lw = 5, rot = 0) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); fs(g, fill, lw); }
export function rr(g, x, y, w, h, r, fill, lw = 5) { g.beginPath(); g.roundRect(x, y, w, h, r); fs(g, fill, lw); }
export function poly(g, pts, fill, lw = 5, close = true) {
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); if (close) g.closePath(); fs(g, fill, lw);
}
export function curve(g, pts, lw = 5, color = INK) {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i + 1 < pts.length; i += 2) g.quadraticCurveTo(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
  g.lineWidth = lw; g.strokeStyle = color; g.stroke();
}
function grad(g, x0, y0, x1, y1, a, b) { const t = g.createLinearGradient(x0, y0, x1, y1); t.addColorStop(0, a); t.addColorStop(1, b); return t; }
function shine(g, x, y, rx, ry, rot = 0, a = 0.35) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); g.fillStyle = `rgba(255,255,255,${a})`; g.fill(); }
function shadeBottom(g, x, y, w, h, a = 0.18) { g.fillStyle = `rgba(40,20,10,${a})`; g.fillRect(x, y, w, h); }
function eye(g, x, y, r, look = [0, 0], hurt = false, happy = false) {
  if (hurt) { g.lineWidth = 5; g.strokeStyle = INK; g.beginPath(); g.moveTo(x - r, y - r * 0.7); g.lineTo(x + r, y + r * 0.7); g.moveTo(x + r, y - r * 0.7); g.lineTo(x - r, y + r * 0.7); g.stroke(); return; }
  if (happy) { g.lineWidth = 5; g.strokeStyle = INK; g.beginPath(); g.arc(x, y + r * 0.3, r, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); return; }
  ell(g, x, y, r, r * 1.25, '#fff', 4);
  ell(g, x + look[0] * r * 0.3, y + look[1] * r * 0.3 + r * 0.1, r * 0.52, r * 0.7, '#1c1412', 0);
  ell(g, x + look[0] * r * 0.3 - r * 0.15, y + look[1] * r * 0.3 - r * 0.15, r * 0.18, r * 0.2, '#fff', 0);
}

/** Wrap a painted canvas with a cream cut-paper edge and a little padding. */
export function paperEdge(src, edge = 9) {
  const pad = edge + 4, w = src.width + pad * 2, h = src.height + pad * 2;
  const [o, g] = mk(w, h);
  const [t, tg] = mk(w, h);
  for (let a = 0; a < 24; a++) { const ang = (a / 24) * Math.PI * 2; tg.drawImage(src, pad + Math.cos(ang) * edge, pad + Math.sin(ang) * edge); }
  tg.globalCompositeOperation = 'source-in'; tg.fillStyle = CREAM; tg.fillRect(0, 0, w, h);
  g.drawImage(t, 0, 0);
  g.globalAlpha = 0.5; g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#d8c7a8'; g.globalAlpha = 0.25; // subtle fibre tint on the edge
  g.fillRect(0, h * 0.6, w, h * 0.4); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  g.drawImage(src, pad, pad);
  return o;
}

/* =====================================================================
   CHARACTERS (front view, centred, feet at the bottom of the canvas)
   ===================================================================== */
export function drawHare(mood = 'normal') {
  const [c, g] = mk(300, 400); const hurt = mood === 'hurt', happy = mood === 'happy';
  const fur = grad(g, 0, 90, 0, 250, '#c2cad6', '#9aa4b5');
  // ears
  for (const s of [-1, 1]) {
    g.save(); g.translate(150 + s * 42, 78); g.rotate(s * 0.14 + (hurt ? s * 0.5 : 0));
    ell(g, 0, 0, 25, 78, fur, 5); ell(g, 0, 8, 12, 56, '#f5a5be', 0); shine(g, -8, -34, 6, 22, 0.1, 0.4); g.restore();
  }
  // legs + shoes
  for (const s of [-1, 1]) {
    rr(g, 150 + s * 28 - 20, 296, 40, 74, 14, grad(g, 0, 296, 0, 370, '#4a5f93', '#364775'), 5);
    ell(g, 150 + s * 28 + s * 3, 378, 31, 17, '#7a4a2c', 5); shine(g, 150 + s * 28 - 6, 372, 11, 5, 0, 0.35);
  }
  // body
  ell(g, 150, 262, 62, 70, grad(g, 0, 200, 0, 330, '#ff9446', '#e2692a'), 5); shine(g, 128, 232, 18, 30, 0.4, 0.3);
  poly(g, [[110, 208], [150, 232], [190, 208], [172, 196], [150, 212], [128, 196]], '#fff6e3', 4);
  for (let i = 0; i < 3; i++) ell(g, 150, 252 + i * 24, 5, 5, '#fff6e3', 3);
  rr(g, 90, 306, 120, 12, 5, '#4a2e1e', 4); rr(g, 140, 304, 20, 16, 3, '#f0c040', 3);
  // arms (hurt: flailing up)
  for (const s of [-1, 1]) {
    g.save(); g.translate(150 + s * 70, 238); g.rotate(s * (hurt ? -2.4 : 0.35));
    ell(g, 0, 28, 17, 40, fur, 5); ell(g, 0, 70, 19, 17, '#fff', 5); g.restore();
  }
  // head
  ell(g, 150, 176, 74, 64, fur, 5); shine(g, 118, 146, 28, 14, -0.4, 0.35);
  ell(g, 112, 202, 32, 24, '#fff', 0); ell(g, 188, 202, 32, 24, '#fff', 0);
  ell(g, 150, 208, 30, 22, '#fff', 4);
  eye(g, 118, 166, 17, [0.2, 0.1], hurt, happy); eye(g, 182, 166, 17, [-0.2, 0.1], hurt, happy);
  g.lineWidth = 5; g.strokeStyle = INK; g.beginPath(); g.moveTo(98, 140); g.lineTo(134, 146); g.moveTo(202, 140); g.lineTo(166, 146); g.stroke();
  ell(g, 150, 194, 10, 7, '#ff7f9f', 3);
  if (hurt) { g.beginPath(); g.arc(150, 226, 12, Math.PI, 0); g.lineWidth = 4; g.stroke(); }
  else { g.beginPath(); g.moveTo(150, 202); g.lineTo(150, 214); g.moveTo(132, 212); g.quadraticCurveTo(150, 226, 168, 212); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); rr(g, 143, 214, 8, 14, 2, '#fff', 3); rr(g, 151, 214, 8, 14, 2, '#fff', 3); }
  g.lineWidth = 2.5; g.strokeStyle = '#6a7384';
  for (const s of [-1, 1]) for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(150 + s * 36, 204 + k * 6); g.lineTo(150 + s * 76, 200 + k * 14); g.stroke(); }
  return paperEdge(c);
}

export function drawWolf(mood = 'normal') {
  const [c, g] = mk(340, 420); const hurt = mood === 'hurt', happy = mood === 'happy';
  const fur = grad(g, 0, 90, 0, 260, '#7e8aa5', '#566079'), light = '#a9b3c8';
  // tail
  g.save(); g.translate(250, 300); g.rotate(-0.4); poly(g, [[0, 0], [60, -40], [78, -110], [40, -70], [18, -20]], fur, 5); g.restore();
  // ears
  for (const s of [-1, 1]) { g.save(); g.translate(170 + s * 62, 74); g.rotate(s * 0.28); poly(g, [[-26, 48], [0, -46], [26, 48]], fur, 5); poly(g, [[-12, 42], [0, -20], [12, 42]], '#f5a5be', 0); g.restore(); }
  // legs (bell-bottoms)
  for (const s of [-1, 1]) {
    poly(g, [[170 + s * 14 - 20, 300], [170 + s * 14 + 20, 300], [170 + s * 38 + s * 26 + 16, 376], [170 + s * 38 + s * 26 - 34, 376]].map(([x, y], i) => [x + (i > 1 ? s * 6 : 0), y]), grad(g, 0, 300, 0, 376, '#a5493a', '#7a2f26'), 5);
    ell(g, 170 + s * 44, 386, 34, 16, '#2a1a14', 5);
  }
  // body
  ell(g, 170, 262, 76, 70, grad(g, 0, 200, 0, 330, '#ff9fb8', '#e86d94'), 5); shine(g, 140, 228, 20, 30, 0.4, 0.3);
  poly(g, [[116, 206], [170, 244], [224, 206], [200, 190], [170, 214], [140, 190]], '#ffd6e0', 4);
  ell(g, 170, 224, 22, 28, light, 0);
  rr(g, 100, 308, 140, 13, 5, '#3a2418', 4);
  for (const s of [-1, 1]) { g.save(); g.translate(170 + s * 88, 232); g.rotate(s * (hurt ? -2.5 : 0.3)); ell(g, 0, 30, 20, 44, fur, 5); ell(g, 0, 76, 22, 19, light, 5); g.restore(); }
  // head
  ell(g, 170, 166, 84, 66, fur, 5); shine(g, 134, 134, 30, 14, -0.4, 0.3);
  ell(g, 170, 202, 50, 36, light, 4); ell(g, 170, 188, 15, 11, '#1c1412', 0); shine(g, 166, 184, 5, 3, 0, 0.5);
  for (const s of [-1, 1]) {
    eye(g, 170 + s * 38, 150, 15, [-s * 0.2, 0.1], hurt, happy);
    g.lineWidth = 7; g.strokeStyle = INK; g.beginPath(); g.moveTo(170 + s * 58, 128 + (hurt ? -6 : 8)); g.lineTo(170 + s * 18, 140 + (hurt ? 4 : -2)); g.stroke();
    ell(g, 170 + s * 58, 178, 10, 8, '#7a859e', 0);
  }
  if (hurt) { g.beginPath(); g.arc(170, 224, 18, Math.PI, 0); g.lineWidth = 4; g.stroke(); ell(g, 170, 230, 9, 12, '#e86d94', 3); }
  else {
    poly(g, [[136, 212], [170, 226], [204, 212], [196, 232], [170, 240], [144, 232]], '#7a2f3c', 4);
    poly(g, [[150, 214], [158, 224], [166, 214]], '#fff', 2); poly(g, [[174, 214], [182, 224], [190, 214]], '#fff', 2);
    // cigarette
    g.save(); g.translate(204, 226); g.rotate(0.28); rr(g, 0, -4, 54, 9, 3, '#fff', 3); rr(g, 46, -4, 12, 9, 3, '#ff8a2a', 3); g.restore();
  }
  for (let i = -1; i <= 1; i++) poly(g, [[170 + i * 22 - 11, 104], [170 + i * 22, 78 + Math.abs(i) * 8], [170 + i * 22 + 11, 104]], fur, 3);
  return paperEdge(c);
}

/* ---------------- enemies ---------------- */
export function drawHippo(mood = 'normal', boss = false) {
  const [c, g] = mk(360, 400); const hurt = mood === 'hurt';
  const skin = grad(g, 0, 100, 0, 300, '#b3a6bd', '#8b7e98'), uni = grad(g, 0, 200, 0, 340, '#4a63a8', '#33487f');
  for (const s of [-1, 1]) { rr(g, 180 + s * 50 - 28, 310, 56, 62, 14, '#2f3f6c', 5); ell(g, 180 + s * 52, 378, 38, 17, '#171a22', 5); }
  ell(g, 180, 262, 100, 84, uni, 5); ell(g, 180, 270, 62, 60, '#c9bcd2', 0); ell(g, 180, 270, 62, 60, null, 4);
  for (let i = 0; i < 3; i++) ell(g, 180, 232 + i * 26, 6, 6, '#ffd23f', 3);
  rr(g, 90, 304, 180, 16, 6, '#171a22', 4); rr(g, 164, 302, 32, 20, 4, '#ffd23f', 3);
  if (boss) { for (let i = 0; i < 4; i++) { ell(g, 118 + (i % 2) * 22, 236 + Math.floor(i / 2) * 26, 11, 11, i % 2 ? '#ffd23f' : '#d9363e', 3); } poly(g, [[230, 214], [262, 214], [246, 250]], '#d9363e', 3); }
  for (const s of [-1, 1]) { g.save(); g.translate(180 + s * 112, 246); g.rotate(s * (hurt ? -1.55 : 0.25)); ell(g, 0, 30, 24, 46, uni, 5); ell(g, 0, 78, 24, 20, skin, 5); g.restore(); }
  rr(g, 266, 230, 14, 100, 6, '#222', 4);
  ell(g, 180, 152, 96, 76, skin, 5); shine(g, 140, 112, 30, 12, -0.3, 0.3);
  ell(g, 180, 192, 66, 40, '#cdbfd6', 4); ell(g, 156, 184, 8, 6, '#5a4a66', 0); ell(g, 204, 184, 8, 6, '#5a4a66', 0);
  for (const s of [-1, 1]) { ell(g, 180 + s * 46, 134, 16, 19, '#fff', 4); ell(g, 180 + s * 44, 138, 8, 11, '#1c1412', 0); ell(g, 180 + s * 74, 92, 20, 26, skin, 5); ell(g, 180 + s * 74, 94, 10, 15, '#e0a0b4', 0); }
  g.lineWidth = 7; g.beginPath(); g.moveTo(112, 118); g.lineTo(150, 128); g.moveTo(248, 118); g.lineTo(210, 128); g.stroke();
  if (hurt) { g.beginPath(); g.arc(180, 214, 22, Math.PI, 0); g.lineWidth = 4; g.stroke(); } else { g.beginPath(); g.moveTo(140, 208); g.quadraticCurveTo(180, 226, 220, 208); g.lineWidth = 4; g.stroke(); rr(g, 170, 210, 10, 14, 2, '#fff', 3); rr(g, 182, 210, 10, 14, 2, '#fff', 3); }
  rr(g, 112, 64, 136, 34, 12, '#27345e', 5); rr(g, 128, 40, 104, 40, 14, '#33487f', 5); rr(g, 118, 88, 124, 14, 5, '#12151e', 4);
  ell(g, 180, 62, 12, 12, '#ffd23f', 3);
  return paperEdge(c);
}

export function drawPigeon(mood = 'normal', flap = 0) {
  const [c, g] = mk(300, 260); const hurt = mood === 'hurt';
  const wy = flap ? -60 : 10;
  for (const s of [-1, 1]) { g.save(); g.translate(150 + s * 50, 120); g.rotate(s * (flap ? -0.9 : 0.5)); ell(g, s * 40, wy * 0.4, 62, 26, grad(g, 0, 90, 0, 150, '#8e98a8', '#667184'), 5); g.restore(); }
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(150 + s * 24, 196); g.lineTo(150 + s * 28, 226); g.moveTo(150 + s * 28, 226); g.lineTo(150 + s * 14, 232); g.moveTo(150 + s * 28, 226); g.lineTo(150 + s * 42, 232); g.lineWidth = 5; g.strokeStyle = '#e0884a'; g.stroke(); }
  ell(g, 150, 150, 66, 56, grad(g, 0, 100, 0, 200, '#b7c0cf', '#8a95a8'), 5); ell(g, 150, 168, 38, 30, '#e8edf5', 0);
  ell(g, 150, 88, 42, 38, '#b7c0cf', 5); shine(g, 134, 74, 14, 8, -0.4, 0.4);
  ell(g, 150, 100, 34, 14, '#6a8fb8', 0);
  poly(g, [[134, 92], [150, 118], [166, 92]], '#f0a040', 4);
  for (const s of [-1, 1]) eye(g, 150 + s * 18, 80, 9, [0, 0], hurt);
  g.lineWidth = 6; g.beginPath(); g.moveTo(122, 66); g.lineTo(142, 72); g.moveTo(178, 66); g.lineTo(158, 72); g.stroke();
  return paperEdge(c);
}

export function drawBee(mood = 'normal', flap = 0) {
  const [c, g] = mk(260, 270); const hurt = mood === 'hurt'; g.translate(0, 34);
  for (const s of [-1, 1]) { g.save(); g.translate(130 + s * 20, 70); g.rotate(s * (flap ? -0.9 : -0.35)); ell(g, s * 36, -22, 40, 22, 'rgba(210,235,255,0.85)', 4); g.restore(); }
  ell(g, 130, 128, 64, 54, '#ffd23f', 5);
  for (const x of [108, 140, 168]) { g.save(); g.beginPath(); g.ellipse(130, 128, 64, 54, 0, 0, 7); g.clip(); g.fillStyle = '#2a1e16'; g.fillRect(x - 8, 60, 14, 140); g.restore(); }
  ell(g, 130, 128, 64, 54, null, 5);
  poly(g, [[190, 128], [226, 140], [190, 150]], '#3a2a24', 4);
  shine(g, 100, 106, 16, 8, -0.4, 0.5);
  ell(g, 88, 120, 28, 30, '#ffe27a', 4);
  eye(g, 82, 114, 11, [-0.2, 0.2], hurt); eye(g, 104, 114, 10, [-0.2, 0.2], hurt);
  g.lineWidth = 5; g.beginPath(); g.moveTo(80, 92); g.lineTo(66, 76); g.moveTo(96, 90); g.lineTo(96, 72); g.stroke(); ell(g, 66, 74, 5, 5, '#3a2a24', 0); ell(g, 96, 70, 5, 5, '#3a2a24', 0);
  g.beginPath(); g.moveTo(74, 138); g.quadraticCurveTo(88, 150, 102, 138); g.lineWidth = 4; g.stroke();
  return paperEdge(c);
}

export function drawMushroom(mood = 'normal') {
  const [c, g] = mk(280, 300); const hurt = mood === 'hurt';
  for (const s of [-1, 1]) ell(g, 140 + s * 36, 276, 32, 16, '#7a4a2c', 5);
  rr(g, 96, 150, 88, 120, 30, grad(g, 0, 150, 0, 270, '#f3e6c8', '#d6c4a0'), 5);
  ell(g, 140, 120, 118, 80, grad(g, 0, 50, 0, 190, '#ee4a52', '#b9232f'), 5);
  for (const [x, y, r] of [[80, 98, 20], [140, 74, 24], [200, 100, 18], [112, 140, 12], [176, 142, 13]]) ell(g, x, y, r, r * 0.8, '#fff6e3', 3);
  shine(g, 100, 76, 26, 10, -0.5, 0.3);
  for (const s of [-1, 1]) { eye(g, 140 + s * 24, 198, 13, [-s * 0.2, 0.1], hurt); }
  g.lineWidth = 7; g.strokeStyle = INK; g.beginPath(); g.moveTo(98, 170); g.lineTo(130, 184); g.moveTo(182, 170); g.lineTo(150, 184); g.stroke();
  if (hurt) { g.beginPath(); g.arc(140, 236, 14, Math.PI, 0); g.lineWidth = 4; g.stroke(); } else { g.beginPath(); g.moveTo(116, 232); g.quadraticCurveTo(140, 218, 164, 232); g.lineWidth = 4; g.stroke(); }
  return paperEdge(c);
}

export function drawRobotHare(mood = 'normal', scale = 1) {
  const [c, g] = mk(300, 400); const hurt = mood === 'hurt';
  const metal = grad(g, 0, 90, 0, 330, '#c9d2dc', '#8a95a3');
  for (const s of [-1, 1]) { g.save(); g.translate(150 + s * 42, 80); g.rotate(s * 0.12); rr(g, -20, -70, 40, 150, 14, metal, 5); rr(g, -9, -58, 18, 110, 8, '#e24a4a', 0); g.restore(); }
  g.lineWidth = 5; g.beginPath(); g.moveTo(150, 36); g.lineTo(150, 14); g.strokeStyle = INK; g.stroke(); ell(g, 150, 10, 9, 9, '#ff2a2a', 3);
  for (const s of [-1, 1]) { rr(g, 150 + s * 28 - 22, 298, 44, 72, 10, '#6f7a88', 5); rr(g, 150 + s * 28 - 30, 366, 60, 20, 8, '#3a424e', 5); }
  rr(g, 86, 200, 128, 112, 20, grad(g, 0, 200, 0, 310, '#a3adb9', '#6f7a88'), 5);
  rr(g, 112, 224, 76, 52, 8, '#2c3340', 4); for (let i = 0; i < 3; i++) ell(g, 128 + i * 22, 250, 7, 7, ['#ff4a4a', '#ffd23f', '#4aff7a'][i], 2);
  for (const s of [-1, 1]) { rr(g, 150 + s * 78 - 17, 210, 34, 80, 14, metal, 5); ell(g, 150 + s * 78, 300, 22, 20, '#566070', 5); }
  rr(g, 76, 108, 148, 104, 26, metal, 5); shine(g, 112, 128, 30, 10, -0.2, 0.35);
  rr(g, 98, 134, 104, 44, 16, '#1c2028', 4);
  if (hurt) { for (const s of [-1, 1]) { g.lineWidth = 5; g.strokeStyle = '#ff5a5a'; g.beginPath(); g.moveTo(150 + s * 28 - 9, 148); g.lineTo(150 + s * 28 + 9, 164); g.moveTo(150 + s * 28 + 9, 148); g.lineTo(150 + s * 28 - 9, 164); g.stroke(); } }
  else for (const s of [-1, 1]) { ell(g, 150 + s * 28, 156, 13, 13, '#ff2a2a', 3); shine(g, 150 + s * 28 - 4, 151, 4, 4, 0, 0.8); }
  for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(112 + i * 19, 192); g.lineTo(112 + i * 19, 204); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); }
  for (const [x, y] of [[92, 120], [208, 120], [92, 200], [208, 200]]) ell(g, x, y, 5, 5, '#4a5360', 2);
  return paperEdge(c);
}

export function drawBear(mood = 'normal') {
  const [c, g] = mk(400, 460); const hurt = mood === 'hurt';
  const fur = grad(g, 0, 90, 0, 400, '#9a6a3e', '#6e4727');
  for (const s of [-1, 1]) { rr(g, 200 + s * 62 - 36, 350, 72, 70, 18, fur, 5); ell(g, 200 + s * 62, 424, 46, 20, '#c9a070', 5); }
  ell(g, 200, 290, 118, 106, fur, 5); ell(g, 200, 296, 74, 78, '#d7b184', 0);
  rr(g, 100, 340, 200, 60, 16, '#2a58b8', 5); rr(g, 100, 340, 200, 14, 6, '#fff6e3', 4);
  for (const s of [-1, 1]) { g.save(); g.translate(200 + s * 128, 250); g.rotate(s * (hurt ? -1.6 : 0.5)); ell(g, 0, 34, 32, 56, fur, 5); ell(g, 0, 98, 44, 40, '#d9363e', 5); shine(g, -12, 88, 12, 16, 0.3, 0.4); g.restore(); }
  ell(g, 200, 160, 98, 84, fur, 5); shine(g, 156, 120, 32, 14, -0.3, 0.3);
  for (const s of [-1, 1]) { ell(g, 200 + s * 76, 82, 32, 32, fur, 5); ell(g, 200 + s * 76, 84, 16, 16, '#d7b184', 0); }
  ell(g, 200, 196, 52, 38, '#d7b184', 4); ell(g, 200, 184, 18, 13, '#1c1412', 0); shine(g, 195, 180, 6, 4, 0, 0.5);
  for (const s of [-1, 1]) { eye(g, 200 + s * 40, 148, 12, [-s * 0.2, 0.2], hurt); g.lineWidth = 9; g.strokeStyle = INK; g.beginPath(); g.moveTo(200 + s * 62, 122 + 10); g.lineTo(200 + s * 22, 138); g.stroke(); }
  if (hurt) { g.beginPath(); g.arc(200, 226, 20, Math.PI, 0); g.lineWidth = 4; g.stroke(); } else { g.beginPath(); g.moveTo(170, 216); g.quadraticCurveTo(200, 232, 230, 216); g.lineWidth = 4; g.stroke(); }
  rr(g, 108, 112, 184, 20, 8, '#d9363e', 4); ell(g, 200, 122, 14, 14, '#ffd23f', 3);
  return paperEdge(c);
}

export function drawWitch(mood = 'normal') {
  const [c, g] = mk(420, 450); const hurt = mood === 'hurt'; g.translate(0, 28);
  // mortar
  g.beginPath(); g.moveTo(90, 270); g.quadraticCurveTo(210, 440, 330, 270); g.closePath(); fs(g, grad(g, 0, 270, 0, 400, '#8a8f9a', '#575c68'), 5);
  rr(g, 76, 256, 268, 28, 12, '#a3a8b4', 5);
  g.save(); g.translate(330, 190); g.rotate(0.4); rr(g, -12, -90, 24, 180, 10, '#8a5a2a', 5); ell(g, 0, 96, 28, 16, '#d9b26f', 4); g.restore();
  // body
  poly(g, [[130, 270], [160, 170], [260, 170], [290, 270]], grad(g, 0, 170, 0, 270, '#5a3a7a', '#3a2450'), 5);
  poly(g, [[170, 176], [210, 220], [250, 176]], '#9a4adb', 4);
  for (const s of [-1, 1]) { g.save(); g.translate(210 + s * 66, 200); g.rotate(s * (hurt ? -1.8 : 0.7)); ell(g, 0, 22, 14, 34, '#5a3a7a', 4); ell(g, 0, 56, 14, 14, '#9ac28a', 4); g.restore(); }
  // head
  for (const s of [-1, 1]) { g.save(); g.translate(210 + s * 56, 140); g.rotate(s * 0.3); poly(g, [[0, 0], [s * 8, 80], [s * 28, 54]], '#d4d4de', 3); g.restore(); }
  ell(g, 210, 130, 52, 56, grad(g, 0, 80, 0, 190, '#a9d29a', '#7aa86a'), 5);
  poly(g, [[200, 130], [262, 150], [204, 158]], '#8abc78', 4); ell(g, 240, 150, 5, 5, '#4a6a3a', 0);
  for (const s of [-1, 1]) { eye(g, 210 + s * 22, 112, 11, [0.2, 0.1], hurt); g.lineWidth = 6; g.strokeStyle = INK; g.beginPath(); g.moveTo(210 + s * 38, 94 + (s < 0 ? 4 : 0)); g.lineTo(210 + s * 10, 102); g.stroke(); }
  g.beginPath(); g.moveTo(190, 166); g.quadraticCurveTo(208, hurt ? 160 : 178, 226, 168); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
  ell(g, 210, 92, 82, 16, '#2a1a3a', 5);
  poly(g, [[160, 88], [246, 88], [232, 10], [200, -6]], '#3a2450', 5); rr(g, 156, 72, 96, 20, 5, '#9a4adb', 4);
  poly(g, [[232, 14], [262, 24], [236, 40]], '#3a2450', 4);
  return paperEdge(c);
}

export function drawMegaRobot(mood = 'normal') {
  const [c, g] = mk(520, 600); const hurt = mood === 'hurt';
  const metal = grad(g, 0, 150, 0, 520, '#cdd6e0', '#7d8896');
  for (const s of [-1, 1]) { g.save(); g.translate(260 + s * 70, 130); g.rotate(s * 0.1); rr(g, -34, -120, 68, 240, 24, metal, 6); rr(g, -16, -96, 28, 180, 12, '#e24a4a', 0); g.restore(); }
  g.lineWidth = 8; g.strokeStyle = INK; g.beginPath(); g.moveTo(260, 40); g.lineTo(260, 8); g.stroke(); ell(g, 260, 8, 14, 14, '#ff2a2a', 4);
  for (const s of [-1, 1]) { rr(g, 260 + s * 56 - 40, 470, 80, 100, 18, '#6f7a88', 6); rr(g, 260 + s * 56 - 54, 560, 108, 30, 12, '#3a424e', 6); }
  rr(g, 130, 300, 260, 190, 30, grad(g, 0, 300, 0, 490, '#a3adb9', '#6a7482'), 6);
  rr(g, 180, 336, 160, 90, 14, '#232933', 5); for (let i = 0; i < 4; i++) ell(g, 206 + i * 36, 380, 11, 11, ['#ff4a4a', '#ffd23f', '#4aff7a', '#4ab8ff'][i], 3);
  for (const s of [-1, 1]) { rr(g, 260 + s * 140 - 30, 310, 60, 150, 24, metal, 6); ell(g, 260 + s * 140, 470, 40, 36, '#566070', 6); }
  g.save(); g.translate(120, 470); g.rotate(-0.6); rr(g, -8, -150, 16, 170, 6, '#aaa', 4); poly(g, [[-10, -150], [10, -150], [0, -190]], '#ff7a1a', 4); g.restore();
  rr(g, 120, 170, 280, 150, 40, metal, 6); shine(g, 190, 200, 54, 16, -0.2, 0.35);
  rr(g, 160, 206, 200, 72, 24, '#161a22', 5);
  if (hurt) { for (const s of [-1, 1]) { g.lineWidth = 8; g.strokeStyle = '#ff5a5a'; g.beginPath(); g.moveTo(260 + s * 48 - 16, 224); g.lineTo(260 + s * 48 + 16, 258); g.moveTo(260 + s * 48 + 16, 224); g.lineTo(260 + s * 48 - 16, 258); g.stroke(); } }
  else for (const s of [-1, 1]) { ell(g, 260 + s * 48, 242, 22, 22, '#ff2a2a', 4); shine(g, 260 + s * 48 - 6, 234, 7, 7, 0, 0.8); }
  for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(178 + i * 27, 300); g.lineTo(178 + i * 27, 318); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); }
  for (const [x, y] of [[138, 186], [382, 186], [140, 310], [380, 310]]) ell(g, x, y, 8, 8, '#4a5360', 3);
  return paperEdge(c);
}

/* ---------------- NPCs ---------------- */
export function drawOwl() {
  const [c, g] = mk(280, 340); const fur = grad(g, 0, 60, 0, 300, '#a8774a', '#7a5230');
  for (const s of [-1, 1]) ell(g, 140 + s * 34, 318, 30, 14, '#e0a040', 5);
  ell(g, 140, 210, 92, 108, fur, 5); ell(g, 140, 232, 56, 70, '#f1dcb8', 3);
  for (let i = 0; i < 3; i++) for (let k = -1; k <= 1; k++) { g.beginPath(); g.arc(140 + k * 22, 214 + i * 24, 8, 0, Math.PI); g.lineWidth = 3; g.strokeStyle = '#a8774a'; g.stroke(); }
  for (const s of [-1, 1]) { g.save(); g.translate(140 + s * 84, 216); g.rotate(s * 0.35); ell(g, 0, 30, 24, 64, '#8a5e38', 5); g.restore(); }
  for (const s of [-1, 1]) poly(g, [[140 + s * 56, 118], [140 + s * 78, 76], [140 + s * 36, 98]], fur, 5);
  ell(g, 140, 124, 86, 70, fur, 5);
  for (const s of [-1, 1]) { ell(g, 140 + s * 38, 126, 32, 32, '#fff', 4); ell(g, 140 + s * 38, 128, 13, 16, '#1c1412', 0); shine(g, 140 + s * 38 - 4, 122, 4, 4, 0, 0.9); ell(g, 140 + s * 38, 126, 38, 38, null, 5); }
  g.lineWidth = 5; g.beginPath(); g.moveTo(140 - 6, 126); g.lineTo(140 + 6, 126); g.stroke();
  poly(g, [[126, 144], [140, 176], [154, 144]], '#f0a040', 4);
  rr(g, 38, 250, 70, 56, 6, '#d9363e', 4); rr(g, 44, 256, 58, 44, 3, '#fff6e3', 0); g.lineWidth = 3; g.beginPath(); g.moveTo(52, 270); g.lineTo(94, 270); g.moveTo(52, 282); g.lineTo(88, 282); g.stroke();
  return paperEdge(c);
}

export function drawMole() {
  const [c, g] = mk(260, 300); const fur = grad(g, 0, 80, 0, 280, '#7a6a76', '#574b57');
  rr(g, 130, 170, 110, 110, 18, '#8a5a2a', 5); rr(g, 142, 182, 86, 20, 6, '#c9a070', 3);
  ell(g, 120, 220, 76, 62, fur, 5);
  for (const s of [-1, 1]) ell(g, 120 + s * 40, 280, 28, 14, '#d89a8a', 5);
  ell(g, 120, 130, 70, 62, fur, 5); shine(g, 92, 104, 20, 10, -0.4, 0.3);
  ell(g, 120, 158, 40, 30, '#d89a8a', 4); ell(g, 120, 146, 13, 11, '#e66a8a', 3);
  for (const s of [-1, 1]) { ell(g, 120 + s * 34, 112, 24, 24, '#6fd0e8', 5); ell(g, 120 + s * 34, 112, 10, 10, '#1c1412', 0); ell(g, 120 + s * 34, 112, 24, 24, null, 5); }
  g.lineWidth = 6; g.beginPath(); g.moveTo(40, 100); g.quadraticCurveTo(120, 74, 200, 100); g.stroke();
  ell(g, 100, 170, 5, 5, '#fff', 0); rr(g, 110, 168, 7, 12, 2, '#fff', 3); rr(g, 122, 168, 7, 12, 2, '#fff', 3);
  for (const s of [-1, 1]) { ell(g, 120 + s * 82, 214, 18, 34, fur, 5, s * 0.25); ell(g, 120 + s * 84, 244, 18, 16, '#d89a8a', 4); }
  return paperEdge(c);
}

/* ---------------- audience ---------------- */
export function drawAudience(kind = 0) {
  const [c, g] = mk(140, 150); const cols = ['#9fa8b5', '#b3a6bd', '#c9a070', '#e8dcc0', '#8aa0c8'][kind % 5];
  if (kind % 3 === 0) { for (const s of [-1, 1]) ell(g, 70 + s * 22, 30, 12, 34, cols, 4); }
  if (kind % 3 === 1) { for (const s of [-1, 1]) ell(g, 70 + s * 36, 50, 16, 16, cols, 4); }
  if (kind % 3 === 2) poly(g, [[40, 50], [60, 8], [78, 50]], cols, 4);
  ell(g, 70, 104, 50, 46, cols, 5); ell(g, 70, 84, 44, 40, cols, 5);
  for (const s of [-1, 1]) { ell(g, 70 + s * 17, 80, 9, 11, '#fff', 3); ell(g, 70 + s * 17, 82, 4, 6, '#1c1412', 0); }
  g.beginPath(); g.arc(70, 100, 12, 0.1, Math.PI - 0.1); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
  return paperEdge(c, 6);
}

/* =====================================================================
   ITEMS, PROPS, TILES
   ===================================================================== */
export function drawCoin() { const [c, g] = mk(80, 80); ell(g, 40, 40, 30, 30, grad(g, 0, 10, 0, 70, '#ffe27a', '#f0a820'), 5); ell(g, 40, 40, 19, 19, null, 3); g.fillStyle = INK; g.font = 'bold 26px Georgia'; g.textAlign = 'center'; g.fillText('K', 40, 50); shine(g, 30, 28, 8, 5, -0.5, 0.6); return paperEdge(c, 5); }
export function drawCarrot() {
  const [c, g] = mk(100, 150);
  for (let i = 0; i < 3; i++) { g.save(); g.translate(50, 30); g.rotate((i - 1) * 0.5); ell(g, 0, -18, 8, 26, '#3dbb5a', 4); g.restore(); }
  poly(g, [[22, 40], [78, 40], [52, 144]], grad(g, 0, 40, 0, 144, '#ffb23a', '#f07a14'), 5);
  g.lineWidth = 3; g.strokeStyle = '#c85a0a'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(30 + i * 3, 58 + i * 22); g.lineTo(60 - i * 3, 58 + i * 22); g.stroke(); }
  shine(g, 38, 66, 6, 18, 0.15, 0.5);
  return paperEdge(c, 6);
}
export function drawBlock(kind = 'q') {
  if (kind === 'crack') return drawCrate();
  if (kind === 'beam') return drawBeam();
  const [c, g] = mk(120, 120);
  const col = kind === 'q' ? ['#ffd23f', '#e89a14'] : kind === 'brick' ? ['#d98a5a', '#b05a34'] : kind === 'crack' ? ['#b8b0a4', '#8e867a'] : kind === 'save' ? ['#6fb8ff', '#3a7ad0'] : ['#9a9a9a', '#6a6a6a'];
  rr(g, 8, 8, 104, 104, 12, grad(g, 0, 8, 0, 112, col[0], col[1]), 6);
  g.save(); g.fillStyle = INK; g.textAlign = 'center'; g.font = 'bold 66px Georgia';
  if (kind === 'q') { g.fillText('?', 60, 86); }
  if (kind === 'brick') { g.lineWidth = 4; g.strokeStyle = INK; g.beginPath(); g.moveTo(8, 60); g.lineTo(112, 60); g.moveTo(60, 8); g.lineTo(60, 60); g.moveTo(34, 60); g.lineTo(34, 112); g.moveTo(86, 60); g.lineTo(86, 112); g.stroke(); }
  if (kind === 'crack') { g.lineWidth = 5; g.beginPath(); g.moveTo(40, 8); g.lineTo(56, 44); g.lineTo(34, 66); g.lineTo(70, 92); g.lineTo(60, 112); g.moveTo(56, 44); g.lineTo(88, 54); g.stroke(); }
  if (kind === 'save') { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(60, 24); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 16 : 38; g.lineTo(60 + Math.cos(a) * r, 62 + Math.sin(a) * r); } g.closePath(); g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); }
  if (kind === 'used') { g.fillStyle = '#555'; g.fillText('·', 60, 80); }
  g.restore(); shine(g, 30, 28, 14, 7, -0.3, 0.45);
  return paperEdge(c, 5);
}
export function drawHeart() { const [c, g] = mk(80, 76); g.beginPath(); g.moveTo(40, 68); g.bezierCurveTo(-10, 34, 14, 2, 40, 22); g.bezierCurveTo(66, 2, 90, 34, 40, 68); fs(g, grad(g, 0, 8, 0, 68, '#ff6a7a', '#d9293f'), 4); shine(g, 26, 26, 7, 4, -0.6, 0.6); return paperEdge(c, 4); }

export function drawTree(variant = 0) {
  const [c, g] = mk(300, 420); const greens = [['#4fc26a', '#2f8a46'], ['#7ac24f', '#4f8a2f'], ['#8a68c2', '#5a3f8a']][variant % 3];
  rr(g, 128, 230, 44, 170, 12, grad(g, 0, 230, 0, 400, '#9a6a3a', '#6a4424'), 5);
  for (const [x, y, r] of [[150, 150, 94], [90, 200, 64], [210, 200, 64], [150, 90, 70]]) ell(g, x, y, r, r * 0.9, grad(g, 0, y - r, 0, y + r, greens[0], greens[1]), 5);
  shine(g, 120, 90, 26, 14, -0.5, 0.3);
  return paperEdge(c, 7);
}
export function drawBush() { const [c, g] = mk(260, 150); for (const [x, y, r] of [[70, 90, 52], [130, 70, 64], [192, 92, 50]]) ell(g, x, y, r, r * 0.85, grad(g, 0, y - r, 0, y + r, '#5ad06e', '#2f8a46'), 5); shine(g, 110, 50, 22, 10, -0.4, 0.3); return paperEdge(c, 6); }
export function drawHouse(color = '#d98a5a') {
  const [c, g] = mk(400, 360);
  rr(g, 40, 140, 320, 200, 8, grad(g, 0, 140, 0, 340, color, '#a8643a'), 5);
  poly(g, [[16, 150], [200, 20], [384, 150]], grad(g, 0, 20, 0, 150, '#c0453a', '#8a2a24'), 5);
  rr(g, 164, 220, 72, 120, 8, '#6a4424', 5); ell(g, 222, 282, 5, 5, '#ffd23f', 2);
  for (const x of [76, 276]) { rr(g, x, 180, 54, 54, 6, '#9fdcff', 5); g.lineWidth = 4; g.strokeStyle = INK; g.beginPath(); g.moveTo(x + 27, 180); g.lineTo(x + 27, 234); g.moveTo(x, 207); g.lineTo(x + 54, 207); g.stroke(); }
  return paperEdge(c, 7);
}
export function drawTent(a = '#d9363e', b = '#fff6e3') {
  const [c, g] = mk(420, 360);
  for (let i = 0; i < 6; i++) { poly(g, [[210, 30], [40 + i * 56, 300], [96 + i * 56, 300]], i % 2 ? b : a, 4); }
  rr(g, 34, 296, 352, 46, 8, '#8a2a24', 5); poly(g, [[170, 340], [210, 230], [250, 340]], '#2a1a14', 4);
  poly(g, [[210, 30], [210, 4], [250, 14], [210, 22]], '#ffd23f', 3);
  return paperEdge(c, 7);
}
export function drawFerris() {
  const [c, g] = mk(460, 520); g.lineWidth = 8; g.strokeStyle = '#8a95a8';
  g.beginPath(); g.moveTo(230, 270); g.lineTo(110, 500); g.moveTo(230, 270); g.lineTo(350, 500); g.stroke();
  ell(g, 230, 250, 190, 190, null, 9); g.strokeStyle = '#d9363e'; ell(g, 230, 250, 190, 190, null, 8);
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.beginPath(); g.moveTo(230, 250); g.lineTo(230 + Math.cos(a) * 190, 250 + Math.sin(a) * 190); g.lineWidth = 5; g.strokeStyle = '#e8dcc0'; g.stroke(); rr(g, 230 + Math.cos(a) * 190 - 22, 250 + Math.sin(a) * 190 - 4, 44, 36, 8, ['#ffd23f', '#6fb8ff', '#6fe08a', '#ff7aa8'][i % 4], 4); }
  ell(g, 230, 250, 20, 20, '#ffd23f', 5);
  return paperEdge(c, 7);
}
export function drawFence() { const [c, g] = mk(200, 120); for (let i = 0; i < 4; i++) { poly(g, [[14 + i * 46, 110], [14 + i * 46, 30], [32 + i * 46, 10], [50 + i * 46, 30], [50 + i * 46, 110]], '#f3e6c8', 4); } g.lineWidth = 5; g.strokeStyle = INK; g.beginPath(); g.moveTo(8, 56); g.lineTo(190, 56); g.moveTo(8, 88); g.lineTo(190, 88); g.stroke(); return paperEdge(c, 5); }
export function drawSign(txt = '') { const [c, g] = mk(180, 200); rr(g, 80, 90, 20, 100, 5, '#8a5a2a', 5); rr(g, 14, 20, 152, 84, 12, '#e8c070', 5); g.fillStyle = INK; g.font = 'bold 38px Georgia'; g.textAlign = 'center'; g.fillText(txt || '!', 90, 78); return paperEdge(c, 6); }
export function drawDoor() { const [c, g] = mk(180, 280); rr(g, 14, 14, 152, 262, 70, grad(g, 0, 14, 0, 276, '#7a4a8a', '#4a2a5a'), 6); ell(g, 90, 140, 54, 54, 'rgba(255,230,140,0.9)', 4); g.fillStyle = '#fff6e3'; g.font = 'bold 44px Georgia'; g.textAlign = 'center'; g.fillText('→', 90, 156); return paperEdge(c, 6); }
export function drawWell() { const [c, g] = mk(240, 260); rr(g, 30, 120, 180, 120, 12, grad(g, 0, 120, 0, 240, '#c0b8a8', '#8e867a'), 5); for (let i = 0; i < 4; i++) { g.lineWidth = 3; g.strokeStyle = INK; g.beginPath(); g.moveTo(30, 150 + i * 22); g.lineTo(210, 150 + i * 22); g.stroke(); } for (const s of [-1, 1]) rr(g, 120 + s * 86 - 7, 20, 14, 120, 4, '#8a5a2a', 4); poly(g, [[20, 40], [120, 0], [220, 40]], '#c0453a', 5); ell(g, 120, 124, 90, 20, '#5fb0ff', 5); return paperEdge(c, 6); }
export function drawMushroomProp(col = '#ee4a52') { const [c, g] = mk(200, 220); rr(g, 70, 100, 60, 100, 20, '#f3e6c8', 5); ell(g, 100, 90, 90, 64, grad(g, 0, 30, 0, 150, col, '#9a2a34'), 5); for (const [x, y, r] of [[60, 80, 14], [110, 56, 16], [144, 92, 12]]) ell(g, x, y, r, r * 0.8, '#fff6e3', 3); return paperEdge(c, 6); }
export function drawBalloonProp() { const [c, g] = mk(180, 300); ell(g, 90, 100, 70, 88, grad(g, 0, 20, 0, 190, '#ff7aa8', '#d9363e'), 5); shine(g, 62, 70, 14, 24, 0.4, 0.5); g.lineWidth = 3; g.strokeStyle = INK; g.beginPath(); g.moveTo(90, 188); g.quadraticCurveTo(70, 240, 90, 290); g.stroke(); return paperEdge(c, 6); }

/* ---------------- ground / platform tiles ---------------- */
export function drawGroundTile(theme) {
  const [c, g] = mk(256, 256);
  g.fillStyle = grad(g, 0, 40, 0, 256, theme.dirA, theme.dirB); g.fillRect(0, 40, 256, 216);
  g.fillStyle = 'rgba(0,0,0,0.08)'; for (let i = 0; i < 18; i++) { g.beginPath(); g.ellipse((i * 97) % 256, 70 + ((i * 53) % 170), 10 + (i % 4) * 4, 6, 0, 0, 7); g.fill(); }
  g.fillStyle = theme.top; g.beginPath(); g.moveTo(0, 0); g.lineTo(256, 0); g.lineTo(256, 34);
  for (let x = 256; x >= 0; x -= 32) { g.lineTo(x, 34); g.lineTo(x - 16, 56); }
  g.closePath(); g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(0, 4, 256, 8);
  return c;
}
export function drawPlatformTile(theme) {
  const [c, g] = mk(256, 96);
  rr(g, 4, 6, 248, 84, 14, grad(g, 0, 6, 0, 90, theme.platA, theme.platB), 5);
  g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(14, 12, 228, 8);
  g.lineWidth = 3; g.strokeStyle = 'rgba(58,42,36,0.45)'; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(i * 64, 20); g.lineTo(i * 64, 84); g.stroke(); }
  return c;
}


/* ---------------- winter additions ---------------- */
export function drawSnowman(mood = 'normal', king = false) {
  const [c, g] = mk(320, 420); const hurt = mood === 'hurt';
  const snow = (y, rx, ry) => { g.beginPath(); g.ellipse(160, y, rx, ry, 0, 0, 7); g.fillStyle = grad(g, 0, y - ry, 0, y + ry, '#ffffff', '#cfe0f2'); g.fill(); g.lineWidth = 5; g.strokeStyle = INK; g.stroke(); };
  for (const s of [-1, 1]) { g.save(); g.translate(160 + s * 78, 215); g.rotate(s * (hurt ? -1.7 : 0.9)); g.lineWidth = 9; g.strokeStyle = '#6a4424'; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 70); g.moveTo(0, 40); g.lineTo(14, 62); g.stroke(); g.restore(); }
  snow(320, 98, 90); snow(214, 74, 70); snow(128, 58, 56);
  for (let i = 0; i < 3; i++) ell(g, 160, 196 + i * 30, 7, 7, '#2a2a30', 3);
  rr(g, 100, 168, 120, 26, 12, '#d9363e', 4); rr(g, 190, 180, 24, 62, 8, '#d9363e', 4);
  for (const s of [-1, 1]) { eye(g, 160 + s * 24, 118, 11, [0, 0], hurt); g.lineWidth = 7; g.strokeStyle = INK; g.beginPath(); g.moveTo(160 + s * 38, 96 + (hurt ? 0 : 6)); g.lineTo(160 + s * 12, 104); g.stroke(); }
  poly(g, [[152, 134], [214, 148], [152, 158]], '#ff9446', 4);
  if (hurt) { g.beginPath(); g.arc(160, 176, 12, Math.PI, 0); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); } else for (let i = -2; i <= 2; i++) ell(g, 160 + i * 12, 172 + Math.abs(i) * 3, 4, 4, '#2a2a30', 0);
  if (king) { poly(g, [[104, 82], [118, 24], [140, 62], [160, 14], [180, 62], [202, 24], [216, 82]], grad(g, 0, 14, 0, 82, '#ffe27a', '#f0a820'), 5); for (const x of [118, 160, 202]) ell(g, x, x === 160 ? 22 : 30, 7, 7, '#d9363e', 3); }
  else { rr(g, 98, 74, 124, 14, 6, '#222', 4); rr(g, 116, 22, 88, 60, 8, '#2a2a30', 4); rr(g, 116, 62, 88, 12, 2, '#d9363e', 0); }
  return paperEdge(c);
}
export function drawSnowTree() {
  const [c, g] = mk(300, 420); rr(g, 130, 280, 40, 120, 8, '#6a4424', 5);
  for (let i = 0; i < 4; i++) { const w = 132 - i * 26, y = 300 - i * 70; poly(g, [[150 - w, y], [150, y - 100], [150 + w, y]], grad(g, 0, y - 100, 0, y, '#3f9a6a', '#1f6a46'), 5); poly(g, [[150 - w * 0.62, y - 38], [150, y - 100], [150 + w * 0.62, y - 38], [150 + w * 0.3, y - 26], [150, y - 44], [150 - w * 0.3, y - 26]], '#ffffff', 3); }
  return paperEdge(c, 7);
}
export function drawIgloo() {
  const [c, g] = mk(400, 300); g.beginPath(); g.moveTo(40, 270); g.bezierCurveTo(40, 40, 360, 40, 360, 270); g.closePath(); fs(g, grad(g, 0, 60, 0, 270, '#ffffff', '#cfe0f2'), 6);
  g.lineWidth = 4; g.strokeStyle = 'rgba(58,42,36,0.5)'; for (let r = 0; r < 4; r++) { g.beginPath(); g.moveTo(60 + r * 8, 90 + r * 45); g.quadraticCurveTo(200, 20 + r * 45, 340 - r * 8, 90 + r * 45); g.stroke(); }
  rr(g, 150, 170, 100, 100, 46, '#3a2a5a', 5); rr(g, 125, 250, 150, 30, 10, '#e8f2ff', 5);
  return paperEdge(c, 7);
}

/* =====================================================================
   BACKDROPS (big, painterly, drawn once per chapter)
   ===================================================================== */
function clouds(g, w, h, n, seed = 1) {
  g.save(); for (let i = 0; i < n; i++) { const x = ((i * 397 + seed * 131) % w), y = 30 + ((i * 83 + seed * 29) % (h * 0.35)), s = 0.7 + (i % 3) * 0.35; g.fillStyle = 'rgba(255,255,255,0.9)'; for (const [dx, dy, r] of [[0, 0, 38], [38, -10, 46], [84, 2, 36], [44, 14, 40]]) { g.beginPath(); g.arc(x + dx * s, y + dy * s, r * s, 0, 7); g.fill(); } } g.restore();
}
function hills(g, w, h, y0, color, amp, seed) { g.fillStyle = color; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 20) g.lineTo(x, y0 + Math.sin(x / 190 + seed) * amp + Math.sin(x / 71 + seed * 2) * amp * 0.3); g.lineTo(w, h); g.closePath(); g.fill(); g.lineWidth = 4; g.strokeStyle = 'rgba(58,42,36,0.5)'; g.stroke(); }
function paperGrain(g, w, h) { g.save(); g.globalAlpha = 0.05; for (let i = 0; i < 1400; i++) { g.fillStyle = i % 2 ? '#fff' : '#000'; g.fillRect((i * 733) % w, (i * 389) % h, 2, 2); } g.restore(); }

export function drawBackdrop(kind) {
  if (['street', 'beach', 'site', 'desk'].includes(kind)) return drawBackdrop2(kind);
  const w = 2048, h = 768, [c, g] = mk(w, h);
  if (kind === 'park') {
    g.fillStyle = grad(g, 0, 0, 0, h, '#8fd0ff', '#fff2cc'); g.fillRect(0, 0, w, h); clouds(g, w, h, 9, 2);
    hills(g, w, h, 500, '#9ee0a0', 40, 1); hills(g, w, h, 560, '#6fc77a', 30, 3);
    for (let i = 0; i < 6; i++) { const x = 120 + i * 340; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(x + 100, 300); g.lineTo(x + k * 33 - 8, 520); g.lineTo(x + k * 33 + 25, 520); g.closePath(); g.fillStyle = k % 2 ? '#fff6e3' : (i % 2 ? '#ff7a8a' : '#6fb8ff'); g.fill(); g.lineWidth = 3; g.strokeStyle = 'rgba(58,42,36,0.55)'; g.stroke(); } }
    hills(g, w, h, 610, '#4fb86a', 24, 5);
  } else if (kind === 'forest') {
    g.fillStyle = grad(g, 0, 0, 0, h, '#2a1a4a', '#6a4a9a'); g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff3b0'; g.beginPath(); g.arc(1500, 170, 90, 0, 7); g.fill(); g.fillStyle = 'rgba(255,243,176,0.2)'; g.beginPath(); g.arc(1500, 170, 150, 0, 7); g.fill();
    for (let i = 0; i < 70; i++) { g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect((i * 313) % w, (i * 97) % 330, 4, 4); }
    hills(g, w, h, 470, '#3a2a6a', 40, 2);
    for (let i = 0; i < 14; i++) { const x = i * 160 + 30; g.fillStyle = i % 2 ? '#1f1840' : '#2a2058'; g.fillRect(x, 180, 56, 620); g.beginPath(); g.ellipse(x + 28, 190, 150, 90, 0, 0, 7); g.fill(); }
    hills(g, w, h, 640, '#241a4a', 30, 6);
  } else if (kind === 'circus') {
    g.fillStyle = grad(g, 0, 0, 0, h, '#7a1f3a', '#d9604a'); g.fillRect(0, 0, w, h);
    for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? 'rgba(255,246,227,0.14)' : 'rgba(0,0,0,0.1)'; g.beginPath(); g.moveTo(w / 2, -80); g.lineTo(i * 128, h); g.lineTo(i * 128 + 128, h); g.closePath(); g.fill(); }
    g.fillStyle = 'rgba(255,240,170,0.2)'; for (const x of [500, 1000, 1550]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x - 180, h); g.lineTo(x + 180, h); g.closePath(); g.fill(); }
    for (let i = 0; i < 40; i++) { g.beginPath(); g.moveTo(i * 52, 0); g.lineTo(i * 52 + 26, 70); g.lineTo(i * 52 + 52, 0); g.closePath(); g.fillStyle = ['#ffd23f', '#6fb8ff', '#ff7aa8', '#6fe08a'][i % 4]; g.fill(); }
    g.fillStyle = '#3a1020'; g.fillRect(0, 600, w, 200);
  } else if (kind === 'dacha') {
    g.fillStyle = grad(g, 0, 0, 0, h, '#ff8a4a', '#ffd6a0'); g.fillRect(0, 0, w, h); clouds(g, w, h, 6, 5);
    g.fillStyle = 'rgba(80,20,40,0.55)'; g.beginPath(); g.ellipse(1480, 110, 420, 120, 0, 0, 7); g.fill(); for (let i = 0; i < 24; i++) { g.fillStyle = '#ff2a2a'; g.beginPath(); g.arc(1180 + (i * 53) % 640, 80 + (i * 29) % 60, 5, 0, 7); g.fill(); }
    hills(g, w, h, 500, '#c07a5a', 36, 2); hills(g, w, h, 570, '#7aa04a', 30, 4);
    for (let i = 0; i < 5; i++) { const x = 140 + i * 400; g.fillStyle = '#6a3a2a'; g.fillRect(x, 430, 130, 110); g.fillStyle = '#8a2a24'; g.beginPath(); g.moveTo(x - 12, 436); g.lineTo(x + 65, 370); g.lineTo(x + 142, 436); g.closePath(); g.fill(); }
    hills(g, w, h, 630, '#5a8a3a', 22, 7);
  } else if (kind === 'winter') {
    g.fillStyle = grad(g, 0, 0, 0, h, '#5a7ac8', '#f0f6ff'); g.fillRect(0, 0, w, h);
    for (let i = 0; i < 5; i++) { g.fillStyle = `rgba(${90 + i * 20},255,${200 - i * 15},0.10)`; g.beginPath(); g.ellipse(300 + i * 360, 110 + (i % 2) * 40, 330, 70, 0.1 * i, 0, 7); g.fill(); }
    for (let i = 0; i < 90; i++) { g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect((i * 313) % w, (i * 97) % 520, 4, 4); }
    hills(g, w, h, 480, '#dfeaf8', 36, 2); hills(g, w, h, 560, '#c8daf0', 30, 4);
    for (let i = 0; i < 12; i++) { const x = 90 + i * 170; g.fillStyle = '#6a8ab0'; g.beginPath(); g.moveTo(x, 560); g.lineTo(x + 40, 400 - (i % 3) * 30); g.lineTo(x + 80, 560); g.closePath(); g.fill(); }
    hills(g, w, h, 650, '#eef5ff', 24, 7);
  } else if (kind === 'library') {
    g.fillStyle = grad(g, 0, 0, 0, h, '#5a3a2a', '#8a5a3a'); g.fillRect(0, 0, w, h);
    for (let r = 0; r < 4; r++) { g.fillStyle = '#3a2418'; g.fillRect(0, 60 + r * 170, w, 16); for (let i = 0; i < 70; i++) { g.fillStyle = ['#d9363e', '#2a58b8', '#e8a020', '#3a8a46', '#8a3a9a', '#f0e6c8'][(i * 7 + r) % 6]; const bh = 80 + ((i * 37) % 50); g.fillRect(i * 30 + 4, 60 + r * 170 - bh, 24, bh); } }
    g.fillStyle = 'rgba(255,230,160,0.22)'; for (const x of [400, 1100, 1700]) { g.beginPath(); g.ellipse(x, 300, 240, 340, 0, 0, 7); g.fill(); }
  }
  paperGrain(g, w, h);
  return c;
}

/* =====================================================================
   PAPER WOLF additions
   ===================================================================== */
export function drawHedgehog(mood = 'normal') {
  const [c, g] = mk(280, 260); const hurt = mood === 'hurt';
  for (let i = 0; i < 15; i++) { const a = Math.PI + (i / 14) * Math.PI; g.save(); g.translate(140, 150); g.rotate(a + Math.PI / 2); poly(g, [[-16, -80], [0, -128 - (i % 2) * 14], [16, -80]], '#5a3a28', 4); g.restore(); }
  ell(g, 140, 160, 96, 78, grad(g, 0, 90, 0, 240, '#8a5e3a', '#5a3a28'), 5);
  ell(g, 140, 172, 70, 58, grad(g, 0, 130, 0, 230, '#f0d8b0', '#e0bf8a'), 3);
  for (const s of [-1, 1]) { ell(g, 140 + s * 44, 236, 26, 14, '#d89a8a', 5); ell(g, 140 + s * 66, 176, 18, 12, '#f0d8b0', 4, s * 0.3); }
  ell(g, 140, 124, 52, 40, '#f0d8b0', 4); for (const s of [-1, 1]) ell(g, 140 + s * 50, 92, 17, 18, '#5a3a28', 4);
  for (const s of [-1, 1]) eye(g, 140 + s * 24, 118, 11, [-s * 0.2, 0.1], hurt);
  ell(g, 140, 140, 11, 9, '#1c1412', 0); shine(g, 137, 137, 3, 2, 0, 0.7);
  if (hurt) { g.beginPath(); g.arc(140, 160, 10, Math.PI, 0); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); } else { g.beginPath(); g.moveTo(120, 154); g.quadraticCurveTo(140, 170, 160, 154); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); }
  return paperEdge(c);
}
export function drawFox(mood = 'normal') {
  const [c, g] = mk(320, 400); const hurt = mood === 'hurt', fur = grad(g, 0, 90, 0, 330, '#ff9a4a', '#e0661e');
  g.save(); g.translate(250, 300); g.rotate(-0.5); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(70, -40, 90, -150, 30, -190); g.bezierCurveTo(30, -110, 0, -60, -30, -10); g.closePath(); fs(g, fur, 5); g.beginPath(); g.moveTo(30, -190); g.bezierCurveTo(52, -176, 66, -158, 62, -136); g.bezierCurveTo(50, -150, 40, -166, 30, -190); fs(g, '#fff6e3', 3); g.restore();
  for (const s of [-1, 1]) { rr(g, 160 + s * 24 - 16, 300, 32, 70, 12, '#7a3a2a', 5); ell(g, 160 + s * 26, 378, 28, 14, '#2a1a14', 5); }
  ell(g, 160, 262, 62, 66, grad(g, 0, 200, 0, 330, '#9a4adb', '#6a2a9a'), 5); poly(g, [[116, 220], [160, 252], [204, 220], [184, 206], [160, 226], [136, 206]], '#fff6e3', 4);
  ell(g, 160, 226, 24, 26, '#fff6e3', 0);
  for (const s of [-1, 1]) { g.save(); g.translate(160 + s * 72, 232); g.rotate(s * (hurt ? -1.8 : 0.4)); ell(g, 0, 28, 14, 38, fur, 5); ell(g, 0, 68, 15, 14, '#fff6e3', 4); g.restore(); }
  for (const s of [-1, 1]) { g.save(); g.translate(160 + s * 52, 78); g.rotate(s * 0.3); poly(g, [[-24, 44], [0, -42], [24, 44]], fur, 5); poly(g, [[-11, 40], [0, -16], [11, 40]], '#2a1a14', 0); g.restore(); }
  ell(g, 160, 156, 70, 58, fur, 5); poly(g, [[110, 176], [160, 226], [210, 176], [160, 190]], '#fff6e3', 3); ell(g, 160, 196, 38, 28, '#fff6e3', 4); ell(g, 160, 186, 11, 8, '#1c1412', 0);
  for (const s of [-1, 1]) { eye(g, 160 + s * 30, 148, 13, [-s * 0.2, 0.1], hurt); g.lineWidth = 4; g.strokeStyle = INK; g.beginPath(); g.moveTo(160 + s * 40, 130); g.lineTo(160 + s * 52, 124); g.moveTo(160 + s * 36, 130); g.lineTo(160 + s * 42, 120); g.stroke(); }
  g.save(); g.translate(204, 98); g.rotate(0.4); poly(g, [[0, 0], [30, -16], [30, 16]], '#d9363e', 4); poly(g, [[0, 0], [-30, -16], [-30, 16]], '#d9363e', 4); ell(g, 0, 0, 7, 7, '#ffd23f', 3); g.restore();
  if (hurt) { g.beginPath(); g.arc(160, 214, 10, Math.PI, 0); g.lineWidth = 4; g.stroke(); } else { g.beginPath(); g.moveTo(146, 206); g.quadraticCurveTo(160, 218, 174, 206); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); }
  return paperEdge(c);
}
export function drawLifeguard(mood = 'normal') {
  const [c, g] = mk(360, 400); const hurt = mood === 'hurt';
  const skin = grad(g, 0, 100, 0, 300, '#8fb0c9', '#6a8ca6');
  for (const s of [-1, 1]) { rr(g, 180 + s * 50 - 28, 316, 56, 56, 14, skin, 5); ell(g, 180 + s * 52, 380, 38, 16, '#6a4424', 5); }
  ell(g, 180, 262, 100, 82, skin, 5); ell(g, 180, 274, 62, 56, '#c5d8e6', 0); ell(g, 180, 274, 62, 56, null, 4);
  rr(g, 96, 300, 168, 40, 14, '#d9363e', 5); rr(g, 96, 312, 168, 8, 3, '#fff6e3', 0);
  g.beginPath(); g.arc(180, 262, 108, 0, Math.PI * 2); g.lineWidth = 22; g.strokeStyle = '#fff6e3'; g.stroke(); for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(180, 262, 108, i * Math.PI / 2 + 0.2, i * Math.PI / 2 + 0.9); g.lineWidth = 22; g.strokeStyle = '#d9363e'; g.stroke(); } g.beginPath(); g.arc(180, 262, 119, 0, 7); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); g.beginPath(); g.arc(180, 262, 97, 0, 7); g.stroke();
  for (const s of [-1, 1]) { g.save(); g.translate(180 + s * 112, 240); g.rotate(s * (hurt ? -1.5 : 0.25)); ell(g, 0, 30, 24, 46, skin, 5); ell(g, 0, 78, 24, 20, skin, 5); g.restore(); }
  ell(g, 180, 152, 96, 76, skin, 5); shine(g, 140, 112, 30, 12, -0.3, 0.3); ell(g, 180, 192, 66, 40, '#c5d8e6', 4); ell(g, 156, 184, 8, 6, '#4a5a66', 0); ell(g, 204, 184, 8, 6, '#4a5a66', 0);
  for (const s of [-1, 1]) { ell(g, 180 + s * 46, 134, 16, 19, '#fff', 4); ell(g, 180 + s * 44, 138, 8, 11, '#1c1412', 0); ell(g, 180 + s * 74, 92, 20, 26, skin, 5); }
  g.lineWidth = 7; g.strokeStyle = INK; g.beginPath(); g.moveTo(116, 120); g.lineTo(152, 130); g.moveTo(244, 120); g.lineTo(208, 130); g.stroke();
  if (hurt) { g.beginPath(); g.arc(180, 214, 22, Math.PI, 0); g.lineWidth = 4; g.stroke(); } else { g.beginPath(); g.moveTo(140, 208); g.quadraticCurveTo(180, 224, 220, 208); g.lineWidth = 4; g.stroke(); rr(g, 170, 210, 10, 14, 2, '#fff', 3); rr(g, 182, 210, 10, 14, 2, '#fff', 3); }
  rr(g, 120, 62, 120, 34, 12, '#d9363e', 5); poly(g, [[130, 66], [180, 20], [230, 66]], '#d9363e', 5); rr(g, 164, 40, 32, 32, 6, '#fff6e3', 3); rr(g, 176, 44, 8, 24, 1, '#d9363e', 0); rr(g, 168, 52, 24, 8, 1, '#d9363e', 0);
  ell(g, 150, 240, 8, 8, '#fff', 3); g.beginPath(); g.moveTo(150, 232); g.lineTo(150, 204); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
  return paperEdge(c);
}
export function drawInkBlot(mood = 'normal') {
  const [c, g] = mk(260, 230); const hurt = mood === 'hurt';
  g.beginPath(); g.moveTo(40, 200); g.bezierCurveTo(10, 120, 50, 40, 130, 40); g.bezierCurveTo(210, 40, 250, 120, 220, 200); for (let i = 0; i < 5; i++) { const x = 220 - i * 45; g.quadraticCurveTo(x - 10, 230 + (i % 2) * 6, x - 22, 204); } g.closePath(); fs(g, grad(g, 0, 40, 0, 220, '#3a3a52', '#14141f'), 5);
  shine(g, 90, 80, 30, 12, -0.4, 0.25);
  for (const s of [-1, 1]) { ell(g, 130 + s * 40, 120, 20, 24, '#fff', 4); ell(g, 130 + s * 40 + (hurt ? 0 : -s * 3), 124, 9, 12, '#14141f', 0); }
  g.lineWidth = 8; g.strokeStyle = '#fff'; g.beginPath(); g.moveTo(80, 90); g.lineTo(116, 100); g.moveTo(180, 90); g.lineTo(144, 100); g.stroke();
  if (hurt) { g.beginPath(); g.arc(130, 176, 14, Math.PI, 0); g.lineWidth = 5; g.strokeStyle = '#fff'; g.stroke(); } else { g.beginPath(); g.moveTo(100, 170); g.quadraticCurveTo(130, 190, 160, 170); g.lineWidth = 5; g.strokeStyle = '#fff'; g.stroke(); }
  return paperEdge(c);
}
export function drawCrab(mood = 'normal') {
  const [c, g] = mk(300, 220); const hurt = mood === 'hurt', red = grad(g, 0, 60, 0, 190, '#ff6a52', '#c0392b');
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(150 + s * 70, 160 + i * 10); g.lineTo(150 + s * (110 + i * 6), 176 + i * 14); g.lineWidth = 7; g.strokeStyle = '#a82f20'; g.stroke(); }
  for (const s of [-1, 1]) { g.save(); g.translate(150 + s * 96, 90); g.rotate(s * (hurt ? 0.9 : -0.4)); ell(g, 0, 0, 34, 28, red, 5); poly(g, [[s * 8, -24], [s * 36, -46], [s * 30, -8]], '#a82f20', 4); g.restore(); }
  ell(g, 150, 140, 80, 56, red, 5); shine(g, 120, 118, 26, 10, -0.3, 0.35);
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(150 + s * 26, 98); g.lineTo(150 + s * 28, 70); g.lineWidth = 6; g.strokeStyle = '#a82f20'; g.stroke(); eye(g, 150 + s * 28, 62, 12, [0, 0.2], hurt); }
  if (hurt) { g.beginPath(); g.arc(150, 164, 12, Math.PI, 0); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); } else { g.beginPath(); g.moveTo(128, 158); g.quadraticCurveTo(150, 172, 172, 158); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); }
  return paperEdge(c);
}
export function drawCat(mood = 'normal') {
  const [c, g] = mk(340, 430); const hurt = mood === 'hurt', fur = grad(g, 0, 90, 0, 340, '#b8bcc8', '#8a90a0');
  poly(g, [[60, 420], [110, 220], [230, 220], [280, 420]], grad(g, 0, 220, 0, 420, '#5a1a8a', '#2a0a4a'), 5); poly(g, [[110, 224], [170, 300], [230, 224], [200, 210], [170, 240], [140, 210]], '#d9363e', 4);
  for (const s of [-1, 1]) { rr(g, 170 + s * 34 - 16, 340, 32, 70, 12, '#2a2a30', 5); ell(g, 170 + s * 36, 416, 26, 12, '#1a1a20', 4); }
  ell(g, 170, 282, 54, 64, grad(g, 0, 220, 0, 340, '#fff6e3', '#e0d4b8'), 4); rr(g, 150, 232, 40, 22, 4, '#d9363e', 3); ell(g, 170, 243, 6, 6, '#ffd23f', 2);
  for (const s of [-1, 1]) { g.save(); g.translate(170 + s * 74, 250); g.rotate(s * (hurt ? -1.8 : 0.5)); ell(g, 0, 26, 13, 36, '#fff6e3', 4); ell(g, 0, 64, 14, 12, '#fff', 4); g.restore(); }
  g.save(); g.translate(262, 240); g.rotate(0.6); rr(g, -4, -50, 8, 100, 3, '#2a2a30', 3); rr(g, -4, -50, 8, 16, 2, '#fff', 2); g.restore();
  for (const s of [-1, 1]) poly(g, [[170 + s * 66, 150], [170 + s * 84, 92], [170 + s * 36, 124]], fur, 5);
  ell(g, 170, 168, 76, 62, fur, 5); ell(g, 170, 188, 40, 30, '#e8ecf4', 4); poly(g, [[158, 178], [170, 192], [182, 178]], '#ff8aa8', 3);
  ell(g, 214, 170, 14, 14, '#aaa', 4); ell(g, 214, 170, 5, 5, '#555', 0);
  for (const s of [-1, 1]) { eye(g, 170 + s * 30, 156, 13, [-s * 0.2, 0.1], hurt); g.lineWidth = 3; g.strokeStyle = INK; for (let k = -1; k <= 1; k += 2) { g.beginPath(); g.moveTo(170 + s * 22, 192 + k * 4); g.lineTo(170 + s * 70, 188 + k * 12); g.stroke(); } }
  if (hurt) { g.beginPath(); g.arc(170, 206, 11, Math.PI, 0); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); } else { g.beginPath(); g.moveTo(150, 200); g.quadraticCurveTo(170, 216, 190, 200); g.lineWidth = 4; g.strokeStyle = INK; g.stroke(); }
  rr(g, 90, 108, 160, 18, 6, '#2a2a30', 5); rr(g, 114, 20, 112, 92, 10, '#2a2a30', 5); rr(g, 114, 88, 112, 14, 2, '#d9363e', 0);
  return paperEdge(c);
}
export function drawEraser() {
  const [c, g] = mk(420, 480); rr(g, 60, 70, 300, 360, 26, grad(g, 0, 70, 0, 430, '#ff9ab8', '#e05a86'), 7); rr(g, 60, 70, 300, 110, 20, '#e8e8ee', 7); for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(80 + i * 48, 74); g.lineTo(80 + i * 48, 178); g.lineWidth = 3; g.strokeStyle = 'rgba(58,42,36,0.35)'; g.stroke(); }
  shine(g, 120, 240, 28, 60, 0.2, 0.3);
  for (const s of [-1, 1]) { eye(g, 210 + s * 70, 270, 28, [0, 0.2], false); g.lineWidth = 12; g.strokeStyle = INK; g.beginPath(); g.moveTo(210 + s * 100, 226); g.lineTo(210 + s * 40, 244); g.stroke(); }
  g.beginPath(); g.moveTo(150, 370); g.quadraticCurveTo(210, 340, 270, 370); g.lineWidth = 9; g.strokeStyle = INK; g.stroke();
  for (let i = 0; i < 10; i++) ell(g, 90 + i * 28, 436 + (i % 2) * 6, 11, 8, '#f6b6c8', 3);
  return paperEdge(c);
}
export function drawPig() {
  const [c, g] = mk(260, 260); ell(g, 130, 190, 82, 62, grad(g, 0, 130, 0, 250, '#ffb8c8', '#ee8aa4'), 5); for (const s of [-1, 1]) ell(g, 130 + s * 44, 248, 24, 12, '#ee8aa4', 5);
  for (const s of [-1, 1]) poly(g, [[130 + s * 50, 96], [130 + s * 70, 48], [130 + s * 22, 74]], '#ee8aa4', 5);
  ell(g, 130, 128, 70, 60, grad(g, 0, 70, 0, 190, '#ffc6d4', '#ee8aa4'), 5); ell(g, 130, 148, 30, 22, '#ff9ab4', 4); ell(g, 120, 148, 5, 8, '#8a3a4a', 0); ell(g, 140, 148, 5, 8, '#8a3a4a', 0);
  for (const s of [-1, 1]) eye(g, 130 + s * 28, 114, 10, [0, 0], false, true);
  rr(g, 76, 66, 108, 12, 6, '#f0d8a0', 5); poly(g, [[92, 70], [168, 70], [150, 30], [110, 30]], '#f0d8a0', 5); rr(g, 96, 56, 68, 10, 3, '#d9363e', 3);
  return paperEdge(c);
}
export function drawFastener() {
  const [c, g] = mk(200, 220); for (const s of [-1, 1]) { g.save(); g.translate(100, 130); g.rotate(s * 0.5); rr(g, -9, 0, 18, 84, 6, grad(g, 0, 0, 0, 84, '#f0d070', '#c09a30'), 4); g.restore(); }
  ell(g, 100, 96, 66, 66, grad(g, 0, 30, 0, 160, '#ffe27a', '#d9a020'), 6); ell(g, 100, 96, 42, 42, null, 4); shine(g, 80, 74, 20, 10, -0.5, 0.55); ell(g, 100, 96, 14, 14, '#c08a18', 4);
  return paperEdge(c, 6);
}
export function drawBall() { const [c, g] = mk(200, 320); g.lineWidth = 8; g.strokeStyle = '#555'; g.beginPath(); g.moveTo(100, 0); g.lineTo(100, 150); g.stroke(); for (let i = 0; i < 6; i++) ell(g, 100, 20 + i * 24, 9, 12, '#888', 3); ell(g, 100, 232, 70, 70, grad(g, 0, 160, 0, 300, '#6a707c', '#2a2e38'), 6); shine(g, 78, 206, 20, 12, -0.5, 0.35); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; poly(g, [[100 + Math.cos(a - 0.2) * 66, 232 + Math.sin(a - 0.2) * 66], [100 + Math.cos(a) * 88, 232 + Math.sin(a) * 88], [100 + Math.cos(a + 0.2) * 66, 232 + Math.sin(a + 0.2) * 66]], '#8a909c', 4); } return paperEdge(c, 6); }
export function drawCrate() { const [c, g] = mk(120, 120); rr(g, 8, 8, 104, 104, 8, grad(g, 0, 8, 0, 112, '#d9a066', '#a8703e'), 6); g.lineWidth = 6; g.strokeStyle = INK; g.beginPath(); g.moveTo(8, 8); g.lineTo(112, 112); g.moveTo(112, 8); g.lineTo(8, 112); g.stroke(); rr(g, 22, 22, 76, 76, 4, null, 4); return paperEdge(c, 5); }
export function drawBeam() { const [c, g] = mk(120, 120); rr(g, 8, 24, 104, 72, 6, grad(g, 0, 24, 0, 96, '#ffd27a', '#e0961e'), 6); for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(14 + i * 18, 24); g.lineTo(2 + i * 18 + 18, 96); g.lineWidth = 9; g.strokeStyle = 'rgba(58,42,36,0.55)'; g.stroke(); } rr(g, 8, 24, 104, 72, 6, null, 6); return paperEdge(c, 5); }

export function drawBackdrop2(kind) {
  const w = 2048, h = 768, [c, g] = mk(w, h);
  if (kind === 'street') {
    g.fillStyle = grad(g, 0, 0, 0, h, '#8fd0ff', '#ffeccc'); g.fillRect(0, 0, w, h); clouds(g, w, h, 8, 3);
    const cols = ['#e8b0a0', '#f0d8a0', '#a8c8e0', '#c8e0a8'];
    for (let i = 0; i < 12; i++) { const x = i * 190 - 20, bh = 220 + (i * 61) % 160; g.fillStyle = cols[i % 4]; g.fillRect(x, 560 - bh, 170, bh); g.lineWidth = 4; g.strokeStyle = 'rgba(58,42,36,0.55)'; g.strokeRect(x, 560 - bh, 170, bh); g.fillStyle = '#6a8ab0'; for (let r = 0; r < Math.floor(bh / 70); r++) for (let k = 0; k < 3; k++) g.fillRect(x + 20 + k * 50, 560 - bh + 20 + r * 70, 30, 40); }
    for (const x of [420, 1180, 1760]) { g.fillStyle = '#3a8a8a'; g.fillRect(x, 330, 70, 230); g.beginPath(); g.ellipse(x + 35, 330, 55, 70, 0, Math.PI, 0); g.fillStyle = '#ffd23f'; g.fill(); g.lineWidth = 4; g.strokeStyle = 'rgba(58,42,36,0.6)'; g.stroke(); }
    hills(g, w, h, 640, '#6a8a6a', 12, 3);
  } else if (kind === 'beach') {
    g.fillStyle = grad(g, 0, 0, 0, h, '#6fc8ff', '#d8f0ff'); g.fillRect(0, 0, w, h); g.fillStyle = '#fff3a0'; g.beginPath(); g.arc(1560, 140, 90, 0, 7); g.fill(); clouds(g, w, h, 7, 6);
    for (let i = 0; i < 5; i++) { g.fillStyle = ['#3aa0e0', '#2a8ad0', '#4ab0f0', '#2a7ac0', '#3a98d8'][i]; g.beginPath(); g.moveTo(0, 420 + i * 36); for (let x = 0; x <= w; x += 40) g.lineTo(x, 420 + i * 36 + Math.sin(x / 60 + i) * 12); g.lineTo(w, 600); g.lineTo(0, 600); g.closePath(); g.fill(); g.lineWidth = 3; g.strokeStyle = 'rgba(58,42,36,0.35)'; g.stroke(); }
    hills(g, w, h, 600, '#f3dfa8', 18, 2);
  } else if (kind === 'site') {
    g.fillStyle = '#2a5a98'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 2; for (let x = 0; x < w; x += 48) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 48) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 5; for (let i = 0; i < 7; i++) { const x = 100 + i * 290; g.strokeRect(x, 200 + (i % 3) * 50, 160, 380 - (i % 3) * 50); for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(x, 200 + (i % 3) * 50 + k * 60); g.lineTo(x + 160, 200 + (i % 3) * 50 + k * 60 - 40); g.stroke(); } }
    g.fillStyle = '#ffd23f'; for (let i = 0; i < 4; i++) { g.fillRect(200 + i * 500, 90, 10, 480); g.fillRect(200 + i * 500, 90, 300, 12); }
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.font = 'bold 40px monospace'; for (let i = 0; i < 6; i++) g.fillText(['1:100', 'A-A', '±0.00', '3.5m', 'SEC. B', 'RD-5'][i], 80 + i * 340, 70);
    hills(g, w, h, 650, '#b8d0e8', 8, 1);
  } else { // desk
    g.fillStyle = grad(g, 0, 0, 0, h, '#e8e2d2', '#cfc6b0'); g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(70,70,80,0.5)'; g.lineWidth = 3; for (let i = 0; i < 30; i++) { g.beginPath(); g.moveTo((i * 211) % w, (i * 97) % 500); g.bezierCurveTo((i * 211) % w + 80, 100 + (i * 53) % 400, (i * 211) % w + 160, (i * 29) % 400, (i * 211) % w + 240, (i * 71) % 500 + 40); g.stroke(); }
    for (let i = 0; i < 5; i++) { const x = 120 + i * 400; g.fillStyle = ['#ffb0a0', '#a0d0ff', '#fff0a0', '#b0f0b8', '#e0b0ff'][i]; g.globalAlpha = 0.55; g.beginPath(); g.ellipse(x, 300 + (i % 2) * 70, 120, 90, 0.3 * i, 0, 7); g.fill(); g.globalAlpha = 1; g.lineWidth = 4; g.strokeStyle = 'rgba(58,42,36,0.5)'; g.stroke(); }
    g.save(); g.translate(1500, 360); g.rotate(-0.5); g.fillStyle = '#ffd23f'; g.fillRect(-20, -260, 40, 520); g.fillStyle = '#ffb0b0'; g.fillRect(-20, 260, 40, 40); g.beginPath(); g.moveTo(-20, -260); g.lineTo(0, -330); g.lineTo(20, -260); g.fillStyle = '#e8c090'; g.fill(); g.restore();
    g.fillStyle = '#8a5a3a'; g.fillRect(0, 640, w, 140); g.lineWidth = 5; g.strokeStyle = 'rgba(58,42,36,0.6)'; g.strokeRect(0, 640, w, 140);
  }
  paperGrain(g, w, h);
  return c;
}
