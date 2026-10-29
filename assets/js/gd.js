// Gradient descent playground: click the loss surface to drop a ball; it follows
// the negative gradient (optionally with momentum) until it converges.
(function () {
  var wrap = document.getElementById("gd");
  if (!wrap) return;
  var cv = wrap.querySelector("canvas");
  var ctx = cv.getContext("2d");
  var hint = wrap.querySelector(".gd-hint");
  var lrIn = document.getElementById("gd-lr"), lrOut = document.getElementById("gd-lr-out");
  var momIn = document.getElementById("gd-mom");
  var stepsOut = document.getElementById("gd-steps"), lossOut = document.getElementById("gd-loss");
  var clearBtn = document.getElementById("gd-clear");
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  var XR = [-3.2, 3.2], YR = [-1.8, 1.8];
  function g(x, y, cx, cy, s) { var dx = x - cx, dy = y - cy; return Math.exp(-(dx * dx + dy * dy) / s); }
  function f(x, y) {
    return 1.25
      - 1.15 * g(x, y, 1.25, -0.35, 0.7)
      - 0.72 * g(x, y, -1.45, 0.75, 0.5)
      - 0.55 * g(x, y, -0.35, -1.15, 0.28)
      + 0.05 * (x * x + 1.6 * y * y)
      + 0.06 * Math.sin(2.1 * x) * Math.cos(1.7 * y);
  }
  function grad(x, y) {
    var h = 1e-4;
    return [(f(x + h, y) - f(x - h, y)) / (2 * h), (f(x, y + h) - f(x, y - h)) / (2 * h)];
  }

  var W = 0, H = 0, dpr = 1, bg = null, balls = [], raf = 0;
  var colors = {};
  function hex(c) {
    c = c.replace("#", "");
    if (c.length === 3) c = c.split("").map(function (k) { return k + k; }).join("");
    return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
  }
  function readColors() {
    colors.base = hex(ZZ.css("--paper-2") || "#ebe4d5");
    colors.acc = hex(ZZ.css("--accent") || "#295a8c");
    colors.ink = ZZ.css("--ink") || "#1c2431";
    colors.accent = ZZ.css("--accent") || "#295a8c";
    colors.paper = ZZ.css("--paper") || "#f4efe4";
    colors.warn = ZZ.css("--warn") || "#b5562f";
    colors.dark = ZZ.isDark();
  }

  function toPx(x, y) { return [(x - XR[0]) / (XR[1] - XR[0]) * W, (YR[1] - y) / (YR[1] - YR[0]) * H]; }
  function toXY(px, py) { return [XR[0] + px / W * (XR[1] - XR[0]), YR[1] - py / H * (YR[1] - YR[0])]; }

  function buildBg() {
    var s = 2, w = Math.max(2, Math.round(W / s)), h = Math.max(2, Math.round(H / s));
    var vals = new Float32Array(w * h), lo = Infinity, hi = -Infinity, i, j;
    for (j = 0; j < h; j++) for (i = 0; i < w; i++) {
      var p = toXY((i + 0.5) * s, (j + 0.5) * s), v = f(p[0], p[1]);
      vals[j * w + i] = v; if (v < lo) lo = v; if (v > hi) hi = v;
    }
    var N = 13, band = new Uint8Array(w * h);
    for (i = 0; i < w * h; i++) band[i] = Math.min(N - 1, Math.floor((vals[i] - lo) / (hi - lo) * N));
    var img = ctx.createImageData(w, h), d = img.data, b = colors.base, a = colors.acc;
    for (j = 0; j < h; j++) for (i = 0; i < w; i++) {
      var k = j * w + i, t = 1 - band[k] / (N - 1); // low loss -> more accent
      var m = Math.pow(t, 1.6) * (colors.dark ? 0.55 : 0.5);
      var edge = (i + 1 < w && band[k + 1] !== band[k]) || (j + 1 < h && band[k + w] !== band[k]);
      var r = b[0] + (a[0] - b[0]) * m, gg = b[1] + (a[1] - b[1]) * m, bb = b[2] + (a[2] - b[2]) * m;
      if (edge) { var e = colors.dark ? 1.25 : 0.86; r *= e; gg *= e; bb *= e; }
      d[k * 4] = r; d[k * 4 + 1] = gg; d[k * 4 + 2] = bb; d[k * 4 + 3] = 255;
    }
    var off = document.createElement("canvas"); off.width = w; off.height = h;
    off.getContext("2d").putImageData(img, 0, 0);
    bg = off;
  }

  function resize() {
    var r = cv.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height;
    if (!W || !H) return;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    readColors(); buildBg(); draw();
  }

  function draw() {
    if (!bg) return;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(bg, 0, 0, W, H);
    // global minimum marker
    var gm = toPx(1.25, -0.35);
    ctx.strokeStyle = colors.ink; ctx.globalAlpha = 0.45; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(gm[0] - 5, gm[1]); ctx.lineTo(gm[0] + 5, gm[1]); ctx.moveTo(gm[0], gm[1] - 5); ctx.lineTo(gm[0], gm[1] + 5); ctx.stroke();
    ctx.globalAlpha = 1;
    balls.forEach(function (bl) {
      ctx.strokeStyle = bl.diverged ? colors.warn : colors.accent; ctx.lineWidth = 1.6; ctx.lineJoin = "round";
      ctx.beginPath();
      bl.path.forEach(function (p, n) { var q = toPx(p[0], p[1]); n ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); });
      ctx.stroke();
      ctx.fillStyle = colors.accent;
      bl.path.forEach(function (p, n) { if (n % 4) return; var q = toPx(p[0], p[1]); ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.arc(q[0], q[1], 1.6, 0, 7); ctx.fill(); });
      ctx.globalAlpha = 1;
      var e = toPx(bl.x, bl.y);
      ctx.beginPath(); ctx.arc(e[0], e[1], 6, 0, 7);
      ctx.fillStyle = bl.done ? colors.ink : colors.paper; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = bl.diverged ? colors.warn : colors.ink; ctx.stroke();
    });
  }

  function step(bl) {
    var lr = parseFloat(lrIn.value), mu = momIn.checked ? 0.9 : 0;
    var gr = grad(bl.x, bl.y);
    bl.vx = mu * bl.vx - lr * gr[0]; bl.vy = mu * bl.vy - lr * gr[1];
    bl.x += bl.vx; bl.y += bl.vy; bl.n++;
    bl.path.push([bl.x, bl.y]);
    var gn = Math.hypot(gr[0], gr[1]), vn = Math.hypot(bl.vx, bl.vy);
    if (Math.abs(bl.x) > 6 || Math.abs(bl.y) > 4) { bl.done = true; bl.diverged = true; }
    else if ((gn < 2e-3 && vn < 2e-3) || bl.n > 900) bl.done = true;
  }

  function report(bl) {
    stepsOut.textContent = bl.n;
    lossOut.textContent = bl.diverged ? "diverged" : f(bl.x, bl.y).toFixed(4);
  }

  function loop() {
    var active = false;
    balls.forEach(function (bl) { if (!bl.done) { for (var k = 0; k < 2; k++) if (!bl.done) step(bl); active = true; } });
    if (balls.length) report(balls[balls.length - 1]);
    draw();
    raf = active ? requestAnimationFrame(loop) : 0;
  }

  function drop(x, y, instant) {
    var bl = { x: x, y: y, vx: 0, vy: 0, n: 0, path: [[x, y]], done: false };
    balls.push(bl); if (balls.length > 8) balls.shift();
    if (instant || reduce) { while (!bl.done) step(bl); report(bl); draw(); return; }
    if (!raf) raf = requestAnimationFrame(loop);
  }

  cv.addEventListener("click", function (e) {
    var r = cv.getBoundingClientRect(), p = toXY(e.clientX - r.left, e.clientY - r.top);
    if (hint) hint.style.opacity = 0;
    drop(p[0], p[1]);
  });
  lrIn.addEventListener("input", function () { lrOut.textContent = parseFloat(lrIn.value).toFixed(2); });
  clearBtn.addEventListener("click", function () { balls = []; stepsOut.textContent = "0"; lossOut.textContent = "–"; draw(); });
  document.addEventListener("themechange", function () { readColors(); buildBg(); draw(); });
  if (window.ResizeObserver) new ResizeObserver(resize).observe(cv); else window.addEventListener("resize", resize);

  lrOut.textContent = parseFloat(lrIn.value).toFixed(2);
  resize();
  // Start with two finished runs so the plot reads at a glance.
  drop(-2.6, 1.45, true); drop(2.7, 1.5, true);
})();
