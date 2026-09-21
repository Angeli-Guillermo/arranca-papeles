/* Modal de compra: arma el pedido y lo manda a /api/order. */
(function () {
  "use strict";

  var modal = document.getElementById("checkoutModal");
  if (!modal) return;

  var closeBtn = document.getElementById("checkoutClose");
  var imgEl = document.getElementById("checkoutImg");
  var titleEl = document.getElementById("checkoutTitle");
  var priceEl = document.getElementById("checkoutPrice");
  var zoneSelect = document.getElementById("checkoutZone");
  var zoneNote = document.getElementById("checkoutZoneNote");
  var totalEl = document.getElementById("checkoutTotal");
  var form = document.getElementById("checkoutForm");
  var submitBtn = document.getElementById("checkoutSubmit");
  var statusEl = document.getElementById("checkoutStatus");
  var current = null;
  var lastFocused = null;

  function zones() {
    return (window.SHIPPING && window.SHIPPING.zones) || [];
  }

  function currentZone() {
    var id = zoneSelect.value;
    var list = zones();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function populateZones() {
    zoneSelect.innerHTML = "";
    zones().forEach(function (zone) {
      var opt = document.createElement("option");
      opt.value = zone.id;
      opt.textContent =
        zone.price != null
          ? zone.label + " — $" + zone.price.toLocaleString("es-AR")
          : zone.label + " — a coordinar";
      zoneSelect.appendChild(opt);
    });
  }

  function updateTotals() {
    var zone = currentZone();
    if (!zone || !current) return;
    zoneNote.textContent = zone.note || "";
    if (zone.price == null) {
      totalEl.textContent = "US$ " + current.price + " + envío a coordinar";
    } else {
      totalEl.textContent =
        "US$ " + current.price + " + $" + zone.price.toLocaleString("es-AR") + " de envío";
    }
  }

  function resetForm() {
    form.hidden = false;
    form.reset();
    statusEl.hidden = true;
    statusEl.textContent = "";
    submitBtn.disabled = false;
    submitBtn.textContent = "Confirmar pedido";
  }

  function openCheckout(cuadro) {
    current = cuadro;
    lastFocused = document.activeElement;
    imgEl.src = cuadro.img;
    imgEl.alt = cuadro.title;
    titleEl.textContent = cuadro.title;
    priceEl.textContent = "US$ " + cuadro.price;
    populateZones();
    updateTotals();
    resetForm();
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    var nameInput = document.getElementById("checkoutName");
    if (nameInput) nameInput.focus();
  }

  function closeCheckout() {
    modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  zoneSelect.addEventListener("change", updateTotals);
  closeBtn.addEventListener("click", closeCheckout);
  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeCheckout();
  });
  document.addEventListener("keydown", function (e) {
    if (!modal.hidden && e.key === "Escape") closeCheckout();
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var zone = currentZone();
    if (!zone || !current) return;

    var payload = {
      obraTitle: current.title,
      obraImg: current.img,
      obraPrice: current.price,
      zone: zone.id,
      zoneLabel: zone.label,
      shippingCost: zone.price,
      total: totalEl.textContent,
      buyerName: document.getElementById("checkoutName").value,
      buyerEmail: document.getElementById("checkoutEmail").value,
      buyerPhone: document.getElementById("checkoutPhone").value,
      notes: document.getElementById("checkoutNotes").value,
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";

    fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        return r.json().then(function (data) {
          return { ok: r.ok, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok) throw new Error((result.data && result.data.error) || "Error");
        form.hidden = true;
        statusEl.hidden = false;
        statusEl.textContent =
          "¡Pedido recibido! Te vamos a escribir por email o WhatsApp para coordinar el pago en dólares" +
          (zone.price == null ? " y el costo de envío internacional." : " y confirmar el envío.");
      })
      .catch(function () {
        statusEl.hidden = false;
        statusEl.textContent =
          "No pudimos enviar el pedido. Escribinos directo por WhatsApp o Instagram, por favor.";
        submitBtn.disabled = false;
        submitBtn.textContent = "Confirmar pedido";
      });
  });

  window.ArrancaCheckout = { open: openCheckout };
})();
