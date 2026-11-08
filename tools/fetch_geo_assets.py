#!/usr/bin/env python3
"""Fetch the Geography lab's photographic asset bundle from catalogue.json.

Downloads CC0 textures, models and HDRIs (Poly Haven, ambientCG) and licence-checked
reference photos (Wikimedia Commons), makes web-sized copies, and records every file's
source, author and licence in manifest.json and ATTRIBUTION.md.

Needs network access to: api.polyhaven.com, dl.polyhaven.org, ambientcg.com,
commons.wikimedia.org, upload.wikimedia.org.

Usage:
  python3 tools/fetch_geo_assets.py                      # everything
  python3 tools/fetch_geo_assets.py --only textures,hdris
  python3 tools/fetch_geo_assets.py --res 1k --photos 2  # photos per search
Requires: pip install opencv-python-headless (for WebP/resizing). Optional: npx @gltf-transform/cli.
"""
import argparse, io, json, os, re, shutil, subprocess, sys, time, urllib.parse, urllib.request, zipfile

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "labs", "assets", "geo")
UA = "LearnWithNehy-asset-fetch/1.0 (educational WAEC simulations)"
PHOTO_LICENCES = re.compile(r"^(CC0|Public domain|PD|CC BY(-SA)? [0-9.]+|CC BY(-SA)?)", re.I)


def get(url, binary=False, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=90) as r:
                data = r.read()
                return data if binary else json.loads(data.decode("utf-8"))
        except Exception as e:  # noqa: BLE001
            if i == tries - 1:
                print("  ! failed", url, e)
                return None
            time.sleep(2 * (i + 1))


def save(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(data)
    return path


def webp_copies(path, sizes=(1024, 512), quality=82, normal=False):
    """Write <name>_<size>.webp next to path; normal maps get higher quality."""
    try:
        import cv2
    except ImportError:
        return []
    im = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if im is None:
        return []
    out = []
    for s in sizes:
        h, w = im.shape[:2]
        k = s / max(h, w)
        r = cv2.resize(im, (max(1, int(w * k)), max(1, int(h * k))), interpolation=cv2.INTER_AREA) if k < 1 else im
        p = re.sub(r"\.(jpg|jpeg|png)$", f"_{s}.webp", path, flags=re.I)
        cv2.imwrite(p, r, [cv2.IMWRITE_WEBP_QUALITY, 95 if normal else quality])
        out.append(p)
    return out


def rel(p):
    return os.path.relpath(p, ROOT).replace(os.sep, "/")


def polyhaven(kind, asset, res, manifest):
    info = get(f"https://api.polyhaven.com/info/{asset}") or {}
    files = get(f"https://api.polyhaven.com/files/{asset}")
    if not files:
        return
    authors = ", ".join((info.get("authors") or {}).keys()) or "Poly Haven"
    base = {"source": f"https://polyhaven.com/a/{asset}", "licence": "CC0 1.0", "author": authors, "provider": "Poly Haven"}
    if kind == "hdris":
        f = files.get("hdri", {}).get(res, {}).get("hdr")
        if f:
            p = save(os.path.join(ROOT, "hdri", f"{asset}_{res}.hdr"), get(f["url"], True))
            manifest[rel(p)] = base
            try:  # low tier: 512 x 256 copy for phones
                import cv2
                im = cv2.imread(p, cv2.IMREAD_UNCHANGED)
                low = os.path.join(ROOT, "hdri-low", f"{asset}_512.hdr")
                os.makedirs(os.path.dirname(low), exist_ok=True)
                cv2.imwrite(low, cv2.resize(im, (512, 256), interpolation=cv2.INTER_AREA))
                manifest[rel(low)] = base
            except Exception:  # noqa: BLE001
                pass
    elif kind == "textures":
        # arm = AO (R) + roughness (G) + metalness (B) packed, so separate Rough/AO maps are not needed
        want = {"Diffuse": "color", "nor_gl": "normal", "arm": "arm", "Displacement": "disp"}
        for key, short in want.items():
            f = files.get(key, {}).get(res, {}).get("jpg") or files.get(key, {}).get(res, {}).get("png")
            if not f:
                continue
            ext = f["url"].rsplit(".", 1)[-1]
            p = save(os.path.join(ROOT, "textures", asset, f"{asset}_{short}_{res}.{ext}"), get(f["url"], True))
            manifest[rel(p)] = base
            for w in webp_copies(p, normal=(short == "normal")):
                manifest[rel(w)] = base
    elif kind == "models":
        g = files.get("gltf", {}).get(res, {}).get("gltf")
        if not g:
            return
        d = os.path.join(ROOT, "models", asset)
        p = save(os.path.join(d, f"{asset}_{res}.gltf"), get(g["url"], True))
        for sub, inc in (g.get("include") or {}).items():
            save(os.path.join(d, sub), get(inc["url"], True))
        manifest[rel(p)] = base
        if shutil.which("npx"):
            glb = os.path.join(d, f"{asset}_{res}.glb")
            subprocess.run(["npx", "-y", "@gltf-transform/cli", "optimize", p, glb, "--texture-compress", "webp",
                            "--texture-size", "1024", "--simplify-ratio", "0.25"], check=False)
            if os.path.exists(glb):
                manifest[rel(glb)] = base


def ambientcg(asset, res, manifest):
    z = get(f"https://ambientcg.com/get?file={asset}_{res.upper()}-JPG.zip", True)
    if not z:
        return
    base = {"source": f"https://ambientcg.com/view?id={asset}", "licence": "CC0 1.0", "author": "ambientCG (Lennart Demes)", "provider": "ambientCG"}
    with zipfile.ZipFile(io.BytesIO(z)) as zf:
        for n in zf.namelist():
            m = re.search(r"_(Color|NormalGL|Roughness|AmbientOcclusion|Displacement|Emission)\.(jpg|png)$", n)
            if not m:
                continue
            short = {"Color": "color", "NormalGL": "normal", "Roughness": "rough", "AmbientOcclusion": "ao", "Displacement": "disp", "Emission": "emissive"}[m.group(1)]
            p = save(os.path.join(ROOT, "textures", asset, f"{asset}_{short}_{res}.{m.group(2)}"), zf.read(n))
            manifest[rel(p)] = base
            for w in webp_copies(p, normal=(short == "normal")):
                manifest[rel(w)] = base


def commons_photos(element_id, query, n, manifest):
    q = urllib.parse.urlencode({"action": "query", "format": "json", "generator": "search", "gsrnamespace": 6, "gsrlimit": 12,
                                "gsrsearch": f"{query} filetype:bitmap", "prop": "imageinfo", "iiprop": "url|size|extmetadata",
                                "iiextmetadatafilter": "LicenseShortName|LicenseUrl|Artist|ImageDescription", "iiurlwidth": 1280})
    d = get(f"https://commons.wikimedia.org/w/api.php?{q}")
    pages = sorted(((d or {}).get("query") or {}).get("pages", {}).values(), key=lambda p: p.get("index", 99))
    got = 0
    for pg in pages:
        ii = (pg.get("imageinfo") or [{}])[0]
        meta = ii.get("extmetadata", {})
        lic = (meta.get("LicenseShortName") or {}).get("value", "")
        if not PHOTO_LICENCES.match(lic) or re.search(r"NC|ND", lic):
            continue
        if ii.get("width", 0) < 900:
            continue
        artist = re.sub("<[^>]+>", "", (meta.get("Artist") or {}).get("value", "")).strip() or "Unknown"
        url = ii.get("thumburl") or ii.get("url")
        slug = re.sub(r"[^a-z0-9]+", "_", pg["title"].lower().replace("file:", ""))[:60]
        p = save(os.path.join(ROOT, "photos", element_id, f"{slug}.jpg"), get(url, True))
        manifest[rel(p)] = {"source": ii.get("descriptionurl"), "licence": lic, "licence_url": (meta.get("LicenseUrl") or {}).get("value", ""),
                            "author": artist, "provider": "Wikimedia Commons", "query": query}
        got += 1
        if got >= n:
            break


def write_attribution(manifest):
    lines = ["# Geography asset credits", "", "CC0 and public-domain items need no credit, but we credit them anyway.", ""]
    by = {}
    for f, m in sorted(manifest.items()):
        by.setdefault(m.get("provider", "Other"), []).append((f, m))
    for prov, items in by.items():
        lines.append(f"## {prov}")
        seen = set()
        for f, m in items:
            key = (m.get("source"), m.get("author"), m.get("licence"))
            if key in seen:
                continue
            seen.add(key)
            lic = m.get("licence", "")
            lu = m.get("licence_url")
            lines.append(f"- [{m.get('source')}]({m.get('source')}) — {m.get('author')} — {f'[{lic}]({lu})' if lu else lic}")
        lines.append("")
    open(os.path.join(ROOT, "ATTRIBUTION.md"), "w").write("\n".join(lines))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="hdris,textures,models,ambientcg,photos")
    ap.add_argument("--res", default="1k")
    ap.add_argument("--photos", type=int, default=2)
    a = ap.parse_args()
    only = set(a.only.split(","))
    cat = json.load(open(os.path.join(ROOT, "catalogue.json")))
    mpath = os.path.join(ROOT, "manifest.json")
    manifest = json.load(open(mpath)) if os.path.exists(mpath) else {}
    for el in cat["elements"]:
        fx = el.get("fetch", {})
        print("==", el["id"])
        for kind, key in (("hdris", "polyhaven_hdris"), ("textures", "polyhaven_textures"), ("models", "polyhaven_models")):
            if kind in only:
                for asset in fx.get(key, []):
                    print("  polyhaven", kind, asset)
                    polyhaven(kind, asset, a.res, manifest)
        if "ambientcg" in only:
            for asset in fx.get("ambientcg", []):
                print("  ambientcg", asset)
                ambientcg(asset, a.res, manifest)
        if "photos" in only:
            for q in el.get("photos", []):
                print("  photos", q)
                commons_photos(el["id"], q, a.photos, manifest)
        json.dump(manifest, open(mpath, "w"), indent=1)
    write_attribution(manifest)
    print("done:", len(manifest), "files in manifest")


if __name__ == "__main__":
    sys.exit(main())
