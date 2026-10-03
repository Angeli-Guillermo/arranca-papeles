/**
 * Recibe un pedido del checkout y le manda un email de aviso a la artista.
 * Variables de entorno necesarias en Vercel:
 *   RESEND_API_KEY   - API key de Resend
 *   ARTIST_EMAIL     - email donde llegan los avisos de pedido
 *   ORDER_FROM_EMAIL - opcional, remitente (default: pedidos@eltanodesign.com.ar)
 */
var CUADROS = require("../assets/js/cuadros.js");
var SHIPPING = require("../assets/js/shipping.js");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  var body = req.body || {};
  var obraTitle = body.obraTitle;
  var zoneId = body.zone;
  var buyerName = body.buyerName;
  var buyerEmail = body.buyerEmail;
  var buyerPhone = body.buyerPhone;
  var notes = body.notes;

  if (!obraTitle || !zoneId || !buyerName || !buyerEmail) {
    res.status(400).json({ error: "Faltan datos obligatorios" });
    return;
  }

  // Auditoría extrema (03-oct-2026, Codex): obraPrice/zoneLabel/shippingCost/
  // total venían directo del cliente y se mandaban tal cual al email de
  // aviso -- cualquiera que le pegue al endpoint puede anunciar una obra
  // inexistente, un precio falso o un total que no coincide con nada.
  // Nunca hubo demostrado un cobro fraudulento (el pago se coordina aparte,
  // esto es solo un aviso), pero no hay razón para confiar en datos
  // comerciales que el servidor puede validar él mismo contra el catálogo
  // real. obraTitle y zone (el id de la zona) siguen viniendo del cliente
  // para IDENTIFICAR qué pidió, pero el precio/envío/total que termina en el
  // email se arma siempre desde CUADROS/SHIPPING, nunca desde el body.
  var obra = CUADROS.filter(function (c) { return c.title === obraTitle; })[0];
  if (!obra) {
    res.status(400).json({ error: "Obra no encontrada en el catálogo" });
    return;
  }
  var zone = SHIPPING.zones.filter(function (z) { return z.id === zoneId; })[0];
  if (!zone) {
    res.status(400).json({ error: "Zona de envío no encontrada" });
    return;
  }

  var artistEmail = process.env.ARTIST_EMAIL;
  var resendKey = process.env.RESEND_API_KEY;
  var fromAddress = process.env.ORDER_FROM_EMAIL || "pedidos@eltanodesign.com.ar";

  if (!artistEmail || !resendKey) {
    res.status(500).json({ error: "Falta configurar el destino de notificaciones" });
    return;
  }

  var obraPrice = obra.price;
  var zoneLabel = zone.label;
  var shippingText =
    zone.price == null
      ? "A coordinar (envío internacional)"
      : "$" + zone.price.toLocaleString("es-AR");
  var total =
    zone.price == null
      ? "US$ " + obraPrice + " + envío a coordinar"
      : "US$ " + obraPrice + " + $" + zone.price.toLocaleString("es-AR") + " de envío";

  // El body es JSON crudo enviado por el cliente (o por cualquiera que le
  // pegue al endpoint), así que todo campo se escapa antes de ir a HTML.
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  var html =
    "<h2>Nuevo pedido — Arranca Papeles</h2>" +
    "<p><strong>Obra:</strong> " + escapeHtml(obraTitle) + " (US$ " + escapeHtml(obraPrice) + ")</p>" +
    "<p><strong>Envío:</strong> " + escapeHtml(zoneLabel) + " — " + escapeHtml(shippingText) + "</p>" +
    "<p><strong>Total:</strong> " + escapeHtml(total) + "</p>" +
    "<hr/>" +
    "<p><strong>Comprador/a:</strong> " + escapeHtml(buyerName) + "</p>" +
    "<p><strong>Email:</strong> " + escapeHtml(buyerEmail) + "</p>" +
    "<p><strong>WhatsApp:</strong> " + escapeHtml(buyerPhone || "-") + "</p>" +
    "<p><strong>Notas:</strong> " + escapeHtml(notes || "-") + "</p>";

  try {
    var r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + resendKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: artistEmail,
        reply_to: buyerEmail,
        subject: "Nuevo pedido: " + obraTitle,
        html: html,
      }),
    });

    if (!r.ok) {
      var errText = await r.text();
      res.status(502).json({ error: "No se pudo enviar la notificación", detail: errText });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error interno" });
  }
};
