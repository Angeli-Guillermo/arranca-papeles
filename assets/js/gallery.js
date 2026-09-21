/* Renderiza la galería desde window.CUADROS y maneja el lightbox. */
(function () {
  "use strict";

  var ROTATIONS = ["-2.2deg", "1.6deg", "-1.1deg", "2.4deg", "-1.8deg", "0.9deg"];

  function formatPrice(cuadro) {
    if (cuadro.priceLabel === "Vendido") return "Vendido";
    var usd = "US$ " + cuadro.price;
    if (cuadro.priceLabel) return cuadro.priceLabel + " " + usd;
    return usd;
  }

  function buildCard(cuadro, index) {
    var sold = cuadro.priceLabel === "Vendido";
    var article = document.createElement("article");
    article.className = "cuadro" + (sold ? " cuadro--sold" : "");
    article.style.setProperty("--rot", ROTATIONS[index % ROTATIONS.length]);

    var btn = document.createElement("button");
    btn.className = "cuadro-frame";
    btn.type = "button";
    btn.setAttribute(
      "aria-label",
      "Ampliar " + cuadro.title + (sold ? " (vendido)" : "")
    );

    var img = document.createElement("img");
    img.src = cuadro.img;
    img.alt = cuadro.title + " — " + (cuadro.desc || "cuadro collage");
    img.loading = "lazy";
    btn.appendChild(img);

    if (cuadro.tag) {
      var tag = document.createElement("span");
      tag.className = "cuadro-tag";
      tag.textContent = cuadro.tag;
      btn.appendChild(tag);
    }
    if (sold) {
      var stamp = document.createElement("span");
      stamp.className = "cuadro-stamp";
      stamp.textContent = "Vendido";
      btn.appendChild(stamp);
    }

    btn.addEventListener("click", function () {
      openLightbox(cuadro);
    });

    var meta = document.createElement("div");
    meta.className = "cuadro-meta";
    meta.innerHTML =
      '<h3>' + cuadro.title + "</h3>" +
      '<p class="cuadro-size">' + (cuadro.size || "") + "</p>" +
      '<p class="cuadro-price">' + formatPrice(cuadro) + "</p>";

    if (!sold) {
      var buyBtn = document.createElement("button");
      buyBtn.type = "button";
      buyBtn.className = "btn-buy";
      buyBtn.textContent = "Comprar";
      buyBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (window.ArrancaCheckout) window.ArrancaCheckout.open(cuadro);
      });
      meta.appendChild(buyBtn);
    }

    article.appendChild(btn);
    article.appendChild(meta);
    return article;
  }

  function groupByYear(cuadros) {
    var byYear = {};
    cuadros.forEach(function (c) {
      var y = c.year || "Sin fecha";
      if (!byYear[y]) byYear[y] = [];
      byYear[y].push(c);
    });
    return Object.keys(byYear)
      .sort(function (a, b) { return b.localeCompare(a); })
      .map(function (y) { return { year: y, items: byYear[y] }; });
  }

  function buildYearJump(groups) {
    var nav = document.createElement("nav");
    nav.className = "year-jump";
    nav.setAttribute("aria-label", "Saltar a un año");
    groups.forEach(function (group, i) {
      if (i > 0) {
        var sep = document.createElement("span");
        sep.className = "year-jump-sep";
        sep.setAttribute("aria-hidden", "true");
        sep.textContent = "/";
        nav.appendChild(sep);
      }
      var a = document.createElement("a");
      a.href = "#anio-" + group.year;
      a.textContent = group.year;
      nav.appendChild(a);
    });
    return nav;
  }

  function renderGallery() {
    var container = document.getElementById("galleryGrid");
    if (!container || !window.CUADROS) return;
    var groups = groupByYear(window.CUADROS);
    var frag = document.createDocumentFragment();
    if (groups.length > 1) frag.appendChild(buildYearJump(groups));
    groups.forEach(function (group) {
      var block = document.createElement("div");
      block.className = "year-block";
      block.id = "anio-" + group.year;

      var title = document.createElement("h3");
      title.className = "year-title";
      title.innerHTML =
        group.year +
        ' <span class="year-count">(' + group.items.length + " pieza" +
        (group.items.length === 1 ? "" : "s") + ")</span>";
      block.appendChild(title);

      var grid = document.createElement("div");
      grid.className = "gallery-grid";
      group.items.forEach(function (c, i) {
        grid.appendChild(buildCard(c, i));
      });
      block.appendChild(grid);

      frag.appendChild(block);
    });
    container.appendChild(frag);
  }

  /* ── Lightbox ── */
  var lightbox = document.getElementById("lightbox");
  var lbImg = document.getElementById("lightboxImg");
  var lbCaption = document.getElementById("lightboxCaption");
  var lbClose = document.getElementById("lightboxClose");
  var lastFocused = null;

  function openLightbox(cuadro) {
    if (!lightbox) return;
    lastFocused = document.activeElement;
    lbImg.src = cuadro.img;
    lbImg.alt = cuadro.title;
    var price =
      cuadro.priceLabel === "Vendido"
        ? "Vendido"
        : "US$ " + cuadro.price;
    lbCaption.innerHTML =
      "<strong>" + cuadro.title + "</strong> · " +
      (cuadro.size ? cuadro.size + " · " : "") + price +
      "<br><span>" + (cuadro.desc || "") + "</span>";
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    lbClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  if (lightbox) {
    lbClose.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (lightbox.hidden) return;
      if (e.key === "Escape") {
        closeLightbox();
        return;
      }
      // Focus trap: mientras el modal está abierto, mantené el foco adentro.
      if (e.key === "Tab") {
        var focusables = lightbox.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ── Reveal on scroll (respeta reduced-motion) ── */
  function setupReveal() {
    var els = document.querySelectorAll(".reveal");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach(function (el) {
      io.observe(el);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderGallery();
    setupReveal();
    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
  });
})();
