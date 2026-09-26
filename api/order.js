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

  // shippingCost también viene del cliente: se formatea solo si es un número
  // y el resultado pasa por escapeHtml igual que el resto.
  var shippingText =
    shippingCost == null
      ? "A coordinar (envío internacional)"
      : typeof shippingCost === "number"
        ? "$" + shippingCost.toLocaleString("es-AR")
        : String(shippingCost);

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
      // El detalle de Resend va al log de Vercel, no al navegador del
      // comprador (puede incluir info de la cuenta/dominio de Resend).
      var errText = await r.text().catch(function () { return ""; });
      console.error("[api/order] Resend devolvió error:", r.status, errText);
      res.status(502).json({ error: "No se pudo enviar la notificación" });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[api/order] Error enviando el aviso de pedido:", err);
    res.status(500).json({ error: "Error interno" });
  }
};
