// Shared behaviour: theme toggle, name card, photo placeholders, YouTube embeds.
(function () {
  var root = document.documentElement;
  var KEY = "zz-theme";

  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(v) { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch (e) {} }
  function systemDark() { return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches; }
  function isDark() {
    var t = root.getAttribute("data-theme");
    return t ? t === "dark" : systemDark();
  }

  var s = stored();
  if (s === "dark" || s === "light") root.setAttribute("data-theme", s);

  var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';

  function paintBtn() {
    document.querySelectorAll(".theme-btn").forEach(function (b) {
      b.innerHTML = isDark() ? SUN : MOON;
      b.setAttribute("aria-label", isDark() ? "Switch to light theme" : "Switch to dark theme");
      b.title = b.getAttribute("aria-label");
    });
  }

  function onTheme() { document.dispatchEvent(new CustomEvent("themechange")); }

  document.addEventListener("DOMContentLoaded", function () {
    paintBtn();
    document.querySelectorAll(".theme-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        var next = isDark() ? "light" : "dark";
        // If the choice matches the system, go back to following the system.
        if ((next === "dark") === systemDark()) { root.removeAttribute("data-theme"); store(null); }
        else { root.setAttribute("data-theme", next); store(next); }
        paintBtn(); onTheme();
      });
    });
    if (window.matchMedia) {
      var mq = matchMedia("(prefers-color-scheme: dark)");
      var h = function () { paintBtn(); onTheme(); };
      mq.addEventListener ? mq.addEventListener("change", h) : mq.addListener(h);
    }

    // Name card
    var dlg = document.getElementById("namecard");
    document.querySelectorAll("[data-open-name]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (!dlg) return;
        if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
      });
    });
    if (dlg) {
      dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
      dlg.querySelectorAll("[data-close]").forEach(function (b) { b.addEventListener("click", function () { dlg.close(); }); });
    }

    // Photos: if a file is missing, remove the <img> so the placeholder behind it shows.
    document.querySelectorAll("img[data-photo]").forEach(function (img) {
      function gone() { img.remove(); }
      if (img.complete && img.naturalWidth === 0) gone();
      else img.addEventListener("error", gone);
    });

    // YouTube: put the video ID in data-youtube and the embed appears.
    document.querySelectorAll("[data-youtube]").forEach(function (el) {
      var id = (el.getAttribute("data-youtube") || "").trim();
      if (!id) return;
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id);
      f.title = el.getAttribute("data-title") || "Video";
      f.loading = "lazy";
      f.allow = "accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen";
      f.allowFullscreen = true;
      el.innerHTML = ""; el.appendChild(f);
    });

    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  });

  window.ZZ = { isDark: isDark, css: function (name) { return getComputedStyle(root).getPropertyValue(name).trim(); } };
})();
