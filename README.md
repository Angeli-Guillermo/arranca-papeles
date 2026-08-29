# Arranca Papeles — Landing

Galería / página de ventas para los cuadros collage de
[@arrancapapeles](https://www.instagram.com/arrancapapeles/).

Sitio **100% estático** (HTML + CSS + JS). No necesita build ni servidor.

## Cómo agregar tus cuadros reales

1. Poné las fotos de los cuadros en `assets/img/cuadros/`
   (ideal: formato vertical, ~800×1000 px o más, `.jpg`/`.webp`).
2. Abrí `assets/js/cuadros.js` y editá la lista. Cada cuadro es un bloque:

   ```js
   {
     img: "assets/img/cuadros/mi-foto.jpg",
     title: "Nombre del cuadro",
     desc: "Descripción corta.",
     size: "30 × 40 cm",
     price: 110,            // dólares (USD)
     tag: "Original",       // opcional: "Encargo", "Serie retratos"...
     // priceLabel: "Vendido",  // opcional, para marcarlo vendido
   },
   ```

3. Listo. La galería y el lightbox se arman solos.

> Los placeholders `placeholder-1.svg` … `placeholder-6.svg` son temporales.
> Reemplazalos por tus fotos.

## Pendientes antes de publicar

- [ ] Reemplazar los 6 placeholders por fotos reales.
- [ ] Poner el **WhatsApp real** en `index.html` (buscá `wa.me/549XXXXXXXXXX`).
- [ ] Revisar los **precios** (hoy son figurativos en USD).
- [ ] Opcional: imagen `og` real para compartir en redes.

## Probar localmente

```bash
# desde la carpeta del proyecto
npx serve .
# o
python -m http.server 8000
```

## Publicar (Vercel)

```bash
npx vercel --prod
```

O arrastrar la carpeta en https://vercel.com (deploy estático, sin configuración).
