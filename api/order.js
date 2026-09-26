/**
 * Recibe un pedido del checkout y le manda un email de aviso a la artista.
 * Variables de entorno necesarias en Vercel:
 *   RESEND_API_KEY   - API key de Resend
 *   ARTIST_EMAIL     - email donde llegan los avisos de pedido
 *   ORDER_FROM_EMAIL - opcional, remitente (default: pedidos@eltanodesign.com.ar)
 */
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  var body = req.body || {};
  var obraTitle = body.obraTitle;
  var obraPrice = body.obraPrice;
  var zoneLabel = body.zoneLabel;
  var shippingCost = body.shippingCost;
  var total = body.total;
  var buyerName = body.buyerName;
  var buyerEmail = body.buyerEmail;
  var buyerPhone = body.buyerPhone;
  var notes = body.notes;

  if (!obraTitle || !zoneLabel || !buyerName || !buyerEmail) {
    res.status(400).json({ error: "Faltan datos obligatorios" });
    return;
  }

  var artistEmail = process.env.ARTIST_EMAIL;
  var resendKey = process.env.RESEND_API_KEY;
  var fromAddress = process.env.ORDER_FROM_EMAIL || "pedidos@eltanodesign.com.ar";

  if (!artistEmail || !resendKey) {
    res.status(500).json({ error: "Falta configurar el destino de notificaciones" });
    return;
  }

  var shippingText =
    shippingCost == null
      ? "A coordinar (envío internacional)"
      : "$" + shippingCost.toLocaleString("es-AR");

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
    "<p><strong>Envío:</strong> " + escapeHtml(zoneLabel) + " — " + shippingText + "</p>" +
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
