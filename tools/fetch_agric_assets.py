#!/usr/bin/env python3
"""Fetch the Agricultural Science lab's photographic asset bundle.

Textures, HDRIs and models come from Poly Haven / ambientCG (CC0) using the same code as the
Geography fetcher. Specimen photos come from iNaturalist (research-grade observations with
CC0 / CC BY / CC BY-SA photos), Openverse (CC0 / CC BY / CC BY-SA / public-domain images,
mostly research-centre Flickr libraries) and NASA (public domain). Every file is recorded in
assets/agric/manifest.json and ATTRIBUTION.md; photos are indexed per subtopic in photos/index.json.

Needs network access to: api.polyhaven.com, dl.polyhaven.org, ambientcg.com, api.inaturalist.org,
inaturalist-open-data.s3.amazonaws.com, api.openverse.org, live.staticflickr.com, images-api.nasa.gov,
images-assets.nasa.gov (and upload.wikimedia.org for Openverse results hosted there).

Usage:
  python3 tools/fetch_agric_assets.py --only textures,hdris,ambientcg,models
  python3 tools/fetch_agric_assets.py --only photos [--skip-existing]
"""
import argparse, json, os, re, sys, time, urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fetch_geo_assets as G  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "labs", "assets", "agric")
G.ROOT = ROOT
SPEC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "agric_photos.json")
OK_LIC = {"cc0": "CC0 1.0", "by": "CC BY", "by-sa": "CC BY-SA", "pdm": "Public domain", "cc-by": "CC BY", "cc-by-sa": "CC BY-SA"}
LIC_URL = {"cc0": "https://creativecommons.org/publicdomain/zero/1.0/", "by": "https://creativecommons.org/licenses/by/{v}/", "by-sa": "https://creativecommons.org/licenses/by-sa/{v}/",
           "pdm": "https://creativecommons.org/publicdomain/mark/1.0/", "cc-by": "https://creativecommons.org/licenses/by/4.0/", "cc-by-sa": "https://creativecommons.org/licenses/by-sa/4.0/"}


def slug(s):
    return re.sub(r"[^a-z0-9]+", "_", s.lower()).strip("_")[:50]


def web_jpg(path, w=900):
    """Resize in place to at most w px wide, quality 80."""
    try:
        import cv2
    except ImportError:
        return
    im = cv2.imread(path)
    if im is None:
        return
    h0, w0 = im.shape[:2]
    if w0 > w:
        im = cv2.resize(im, (w, int(h0 * w / w0)), interpolation=cv2.INTER_AREA)
    cv2.imwrite(path, im, [cv2.IMWRITE_JPEG_QUALITY, 80])


def inat(taxon, n):
    q = urllib.parse.urlencode({"taxon_name": taxon, "photo_license": "cc0,cc-by,cc-by-sa", "quality_grade": "research", "per_page": 12, "order_by": "votes"})
    d = G.get("https://api.inaturalist.org/v1/observations?" + q) or {}
    time.sleep(1.1)
    out = []
    for r in d.get("results", []):
        for p in r.get("photos", [])[:1]:
            lic = (p.get("license_code") or "").lower()
            if lic not in OK_LIC:
                continue
            w = (p.get("original_dimensions") or {}).get("width", 1000)
            if w < 600:
                continue
            out.append({"url": p["url"].replace("square", "large"), "page": r.get("uri"), "author": re.sub(r"^\(c\)\s*", "", (p.get("attribution") or "").split(",")[0]).strip(),
                        "licence": OK_LIC[lic], "licence_url": LIC_URL[lic], "provider": "iNaturalist"})
        if len(out) >= n:
            break
    return out


def openverse(query, n):
    q = urllib.parse.urlencode({"q": query, "license": "cc0,by,by-sa,pdm", "page_size": 12, "mature": "false"})
    d = G.get("https://api.openverse.org/v1/images/?" + q) or {}
    time.sleep(3.5)
    out = []
    for r in d.get("results", []):
        lic = (r.get("license") or "").lower()
        if lic not in OK_LIC or (r.get("width") or 0) < 700:
            continue
        v = r.get("license_version") or "4.0"
        out.append({"url": r["url"], "page": r.get("foreign_landing_url"), "author": (r.get("creator") or "Unknown").strip(),
                    "licence": OK_LIC[lic] + ("" if lic in ("cc0", "pdm") else " " + v), "licence_url": r.get("license_url") or LIC_URL[lic].format(v=v), "provider": "Openverse / " + (r.get("source") or "").title()})
        if len(out) >= n:
            break
    return out


def nasa(query, n):
    d = G.get("https://images-api.nasa.gov/search?" + urllib.parse.urlencode({"q": query, "media_type": "image"})) or {}
    out = []
    for it in (d.get("collection") or {}).get("items", [])[: n * 3]:
        links = it.get("links") or []
        if not links:
            continue
        href = links[0]["href"].replace("~thumb", "~medium")
        nid = (it.get("data") or [{}])[0].get("nasa_id", "")
        out.append({"url": href, "page": "https://images.nasa.gov/details/" + nid, "author": "NASA", "licence": "Public domain", "licence_url": "https://www.nasa.gov/nasa-brand-center/images-and-media/", "provider": "NASA"})
        if len(out) >= n:
            break
    return out


def photos(spec, per, skip, manifest):
    idx_path = os.path.join(ROOT, "photos", "index.json")
    index = json.load(open(idx_path)) if os.path.exists(idx_path) else {}
    used = {e["page"] for L in index.values() for e in L if e.get("page")}
    for key, queries in spec.items():
        if skip and index.get(key):
            continue
        got = []
        for src, query, cap in queries:
            print(key, src, query)
            try:
                res = {"inat": inat, "ov": openverse, "nasa": nasa}[src](query, per + 2)
            except Exception as e:  # noqa: BLE001
                print("  ! skipped", e)
                continue
            k = 0
            for r in res:
                if r["page"] in used:
                    continue
                url = r["url"]
                if re.search(r"\.(tiff?|svg|gif)$", url, re.I):
                    continue
                m = re.match(r"https://upload\.wikimedia\.org/wikipedia/commons/(?!thumb/)(\w/\w\w)/([^/]+)$", url)
                if m:  # Wikimedia asks bulk clients to use its standard thumbnail sizes (w.wiki/GHai)
                    url = f"https://upload.wikimedia.org/wikipedia/commons/thumb/{m.group(1)}/{m.group(2)}/960px-{m.group(2)}"
                    time.sleep(2)
                fn = f"web/{slug(key + '_' + query)}_{k}.jpg"
                path = os.path.join(ROOT, "photos", fn)
                data = G.get(url, True)
                if not data or len(data) < 8000:
                    continue
                G.save(path, data)
                web_jpg(path)
                used.add(r["page"])
                ent = {"src": "photos/" + fn, "cap": cap, "author": r["author"][:80], "licence": r["licence"], "licence_url": r["licence_url"], "url": r["page"], "via": r["provider"]}
                got.append(ent)
                manifest[G.rel(path)] = {"source": r["page"], "licence": r["licence"], "licence_url": r["licence_url"], "author": r["author"], "provider": r["provider"], "query": query}
                k += 1
                if k >= per:
                    break
        if got:
            index[key] = got
        os.makedirs(os.path.dirname(idx_path), exist_ok=True)
        json.dump(index, open(idx_path, "w"), indent=0)
    return index


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", default="hdris,textures,models,ambientcg,photos")
    ap.add_argument("--res", default="1k")
    ap.add_argument("--per", type=int, default=1, help="photos per query")
    ap.add_argument("--skip-existing", action="store_true")
    a = ap.parse_args()
    only = set(a.only.split(","))
    mpath = os.path.join(ROOT, "manifest.json")
    manifest = json.load(open(mpath)) if os.path.exists(mpath) else {}
    cat = json.load(open(os.path.join(ROOT, "catalogue.json")))
    seen = set()
    for el in cat["elements"]:
        fx = el.get("fetch", {})
        for kind, key in (("hdris", "polyhaven_hdris"), ("textures", "polyhaven_textures"), ("models", "polyhaven_models")):
            if kind not in only:
                continue
            for asset in fx.get(key, []):
                if (kind, asset) in seen:
                    continue
                seen.add((kind, asset))
                print("polyhaven", kind, asset)
                try:
                    G.polyhaven(kind, asset, a.res, manifest)
                except Exception as e:  # noqa: BLE001
                    print("  ! skipped", asset, e)
        if "ambientcg" in only:
            for asset in fx.get("ambientcg", []):
                if ("acg", asset) in seen:
                    continue
                seen.add(("acg", asset))
                print("ambientcg", asset)
                try:
                    G.ambientcg(asset, a.res, manifest)
                except Exception as e:  # noqa: BLE001
                    print("  ! skipped", asset, e)
        json.dump(manifest, open(mpath, "w"), indent=1)
    if "photos" in only:
        photos(json.load(open(SPEC)), a.per, a.skip_existing, manifest)
    json.dump(manifest, open(mpath, "w"), indent=1)
    G.write_attribution(manifest)
    att = os.path.join(ROOT, "ATTRIBUTION.md")
    txt = open(att).read()
    head, _, rest = txt.partition("## Poly Haven") if "## Poly Haven" in txt else (txt, "", "")
    lines = ["# Agricultural Science asset credits", "", "CC0 and public-domain items need no credit, but we credit them anyway.", "",
             "## Credit lines shown in the lab", "",
             "- Skies, textures and 3D models: Poly Haven (polyhaven.com) and ambientCG (ambientcg.com), CC0.",
             "- Specimen photos: iNaturalist observers, Openverse (Flickr / Wikimedia Commons creators) and NASA, credited under each photo.", ""]
    open(att, "w").write("\n".join(lines) + ("## Poly Haven" + rest if rest else "\n".join(txt.split("\n")[9:])))
    print("done:", len(manifest), "files")


if __name__ == "__main__":
    sys.exit(main())
