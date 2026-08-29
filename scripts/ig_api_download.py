"""
Descarga las fotos de @arrancapapeles usando la API interna de Instagram
con la sesion del usuario (cookies). Mas robusto que instaloader GraphQL.
"""
import json
import os
import pathlib
import time
import urllib.request
import urllib.error
import ssl

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "_ig_raw" / "arrancapapeles"
OUT.mkdir(parents=True, exist_ok=True)

SESSIONID = (HERE / ".ig_session").read_text(encoding="utf-8").strip()
CSRF = "3NPDyCHCwFjughRpxPFVywjj6R2EKFE2"
DS_USER = "40712969"
MID = "ajB0zgALAAFvUAZN7ZYdg9QyUSpm"
IG_DID = "63CED7E8-ACB1-43EA-931D-4C00EA1C51DA"
TARGET = "arrancapapeles"
APP_ID = "936619743392459"

COOKIE = (
    f"sessionid={SESSIONID}; csrftoken={CSRF}; ds_user_id={DS_USER}; "
    f"mid={MID}; ig_did={IG_DID}"
)
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")

# Avast intercepta TLS -> no verificar (red local del usuario)
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE


def api_get(url: str, retries: int = 6) -> dict:
    backoff = 30
    for attempt in range(retries):
        req = urllib.request.Request(url, headers={
            "User-Agent": UA,
            "x-ig-app-id": APP_ID,
            "x-csrftoken": CSRF,
            "x-requested-with": "XMLHttpRequest",
            "Referer": f"https://www.instagram.com/{TARGET}/",
            "Accept": "*/*",
            "Accept-Language": "es-AR,es;q=0.9",
            "Cookie": COOKIE,
        })
        try:
            with urllib.request.urlopen(req, context=CTX, timeout=40) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < retries - 1:
                print(f"  429 rate-limit, espero {backoff}s (intento {attempt+1})")
                time.sleep(backoff)
                backoff = min(backoff * 2, 240)
                continue
            raise
    raise RuntimeError("agotados los reintentos")


def download(url: str, dest: pathlib.Path) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, context=CTX, timeout=60) as r:
        dest.write_bytes(r.read())


def caption_of(node: dict) -> str:
    cap = node.get("caption")
    if isinstance(cap, dict):
        return cap.get("text", "")
    edges = node.get("edge_media_to_caption", {}).get("edges", [])
    return edges[0]["node"]["text"] if edges else ""


def best_image(node: dict) -> str:
    # API v1 -> image_versions2; web -> display_url
    iv = node.get("image_versions2", {}).get("candidates")
    if iv:
        return iv[0]["url"]
    return node.get("display_url", "")


def main() -> None:
    # pk conocido del perfil (evita la llamada rate-limiteada a web_profile_info)
    pk = "70628663756"
    print(f"@{TARGET} | pk={pk}")

    # 2) feed paginado (API privada v1)
    saved, idx, max_id = 0, 0, None
    while True:
        url = f"https://www.instagram.com/api/v1/feed/user/{pk}/?count=33"
        if max_id:
            url += f"&max_id={max_id}"
        data = api_get(url)
        items = data.get("items", [])
        if not items:
            break
        for it in items:
            idx += 1
            shortcode = it.get("code", f"item{idx}")
            cap = caption_of(it)
            # carrusel?
            if it.get("carousel_media"):
                for ci, child in enumerate(it["carousel_media"], 1):
                    u = best_image(child)
                    if u:
                        download(u, OUT / f"{idx:03d}_{shortcode}_{ci}.jpg")
                        saved += 1
            else:
                u = best_image(it)
                if u:
                    download(u, OUT / f"{idx:03d}_{shortcode}.jpg")
                    saved += 1
            (OUT / f"{idx:03d}_{shortcode}.txt").write_text(cap, encoding="utf-8")
        print(f"  ... {idx} posts procesados, {saved} imagenes")
        if not data.get("more_available"):
            break
        max_id = data.get("next_max_id")
        time.sleep(1.5)

    print(f"LISTO: {saved} imagenes en {OUT}")


if __name__ == "__main__":
    main()
