/**
 * Zonas y costos de envío — AJUSTAR precios reales antes de publicar.
 * price en pesos argentinos (ARS), null = "a coordinar" (sin monto fijo).
 */
var SHIPPING = {
  zones: [
    {
      id: "caba-gba",
      label: "CABA / GBA",
      price: 6000,
      note: "Envío en moto o coordinamos retiro sin cargo.",
    },
    {
      id: "interior",
      label: "Interior de Argentina",
      price: 9500,
      note: "Correo Argentino o Andreani, a domicilio.",
    },
    {
      id: "internacional",
      label: "Internacional",
      price: null,
      note: "Consultar costos de envío — el trámite de exportación de la obra (Ley 24.633) se coordina caso por caso.",
    },
  ],
};

// Auditoría extrema (03-oct-2026, Codex): api/order.js necesita las zonas
// reales para validar zoneLabel/shippingCost en vez de confiar en lo que
// mande el cliente. `window` no existe en el runtime Node de la función
// serverless (ni `module` existe en el navegador), así que cada asignación
// se guarda detrás del chequeo del entorno que SÍ aplica -- no cambia nada
// para el navegador ni para Node.
if (typeof window !== "undefined") window.SHIPPING = SHIPPING;
if (typeof module !== "undefined" && module.exports) module.exports = SHIPPING;
