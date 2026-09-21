/**
 * Zonas y costos de envío — AJUSTAR precios reales antes de publicar.
 * price en pesos argentinos (ARS), null = "a coordinar" (sin monto fijo).
 */
window.SHIPPING = {
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
