"""
Descarga las fotos de @arrancapapeles usando tu cookie de sesion de Instagram.

Uso:
  1. Pegá tu sessionid en el archivo  scripts/.ig_session  (una sola linea)
  2. python scripts/ig_download.py

Las imagenes quedan en  scripts/_ig_raw/arrancapapeles/  y despues las
seleccionamos y movemos a  assets/img/cuadros/.

La cookie es un secreto: el archivo .ig_session NO se sube a ningun lado.
"""
import os
import sys
import pathlib
import instaloader

TARGET = "arrancapapeles"
HERE = pathlib.Path(__file__).resolve().parent
SESSION_FILE = HERE / ".ig_session"
OUT_DIR = HERE / "_ig_raw"


def read_sessionid() -> str:
    sid = os.environ.get("IG_SESSIONID", "").strip()
    if not sid and SESSION_FILE.exists():
        sid = SESSION_FILE.read_text(encoding="utf-8").strip()
    if not sid:
        sys.exit(
            "No encontre la cookie. Pega tu sessionid en scripts/.ig_session "
            "o exporta IG_SESSIONID."
        )
    return sid


def main() -> None:
    sid = read_sessionid()
    OUT_DIR.mkdir(exist_ok=True)

    L = instaloader.Instaloader(
        dirname_pattern=str(OUT_DIR / "{target}"),
        download_videos=False,
        download_video_thumbnails=False,
        save_metadata=True,        # guarda el caption en .txt -> sirve para titulos
        post_metadata_txt_pattern="{caption}",
        compress_json=False,
        filename_pattern="{date_utc:%Y-%m-%d}_{shortcode}",
    )

    # Cargar sesion desde la cookie sessionid
    L.context._session.cookies.set("sessionid", sid, domain=".instagram.com")
    try:
        username = L.test_login()
    except Exception as exc:  # noqa: BLE001
        sys.exit(f"Fallo al validar la cookie: {exc}")
    if not username:
        sys.exit("La cookie no es valida o expiro. Volve a copiarla logueado.")
    L.context.username = username
    print(f"Logueado como: {username}")

    print(f"Descargando posts de @{TARGET} ...")
    profile = instaloader.Profile.from_username(L.context, TARGET)
    n = 0
    for post in profile.get_posts():
        L.download_post(post, target=TARGET)
        n += 1
    print(f"Listo: {n} posts descargados en {OUT_DIR / TARGET}")


if __name__ == "__main__":
    main()
