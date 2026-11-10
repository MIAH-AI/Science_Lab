#!/usr/bin/env python3
"""Fetch the Agricultural Science lab's 3D model bundle (farm tools, workshop machines and garage props).

Poly Haven models (CC0) are downloaded as glTF, packed into one optimised .glb each (WebP textures,
512 px for hand tools and 1024 px for machines) and recorded in assets/agric/manifest.json and
assets/agric/models/index.json. The raw glTF and JPG files are not kept.

Sketchfab models (CC BY, credit required) are listed in SKETCHFAB below. They need the owner's free
Sketchfab API token:  SKETCHFAB_TOKEN=... python3 tools/fetch_agric_models.py --only sketchfab
Each is decimated and written to models/<slot>.glb; agric-kit4.js swaps it in for the code-built machine.

Needs network access to api.polyhaven.com, dl.polyhaven.org (and api.sketchfab.com for --only sketchfab) and npx.
"""
import argparse, json, os, shutil, subprocess, sys, tempfile, zipfile, io

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fetch_geo_assets as G  # noqa: E402

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "labs", "assets", "agric")
G.ROOT = ROOT
MODELS = os.path.join(ROOT, "models")

# id: (display name, texture size)
POLYHAVEN = {
    "machete": ("Cutlass (machete)", 512), "wooden_axe": ("Axe", 512), "picke_dirty_01": ("Pickaxe", 512),
    "rusted_spade_01": ("Spade", 512), "trowel_01": ("Hand trowel", 512), "watering_can_metal_01": ("Watering can", 512),
    "hatchet": ("Hatchet", 512), "sledgehammer_01": ("Sledgehammer", 512), "handsaw_wood": ("Hand saw", 512),
    "garden_sprinkler_01": ("Garden sprinkler", 512), "measuring_tape_01": ("Measuring tape", 512),
    "adjustable_wrench": ("Adjustable spanner", 512), "combination_wrench": ("Combination spanner", 512),
    "pipe_wrench": ("Pipe wrench", 512), "ratchet_wrench": ("Ratchet spanner", 512), "pliers": ("Pliers", 512),
    "cross_pein_hammer": ("Hammer", 512), "flathead_screwdriver": ("Screwdriver", 512), "rusted_hacksaw": ("Hacksaw", 512),
    "tire_pump": ("Tyre pump", 512), "old_tyre": ("Tyre", 512), "rusted_wheel_rim_01": ("Wheel rim", 512),
    "metal_jerrycan": ("Fuel jerrycan", 512), "plastic_jerrycan": ("Plastic jerrycan", 512), "oil_tin": ("Engine oil tin", 512),
    "small_oil_can_01": ("Oil can", 512), "lubricant_spray": ("Lubricant spray", 512), "metal_toolbox": ("Toolbox", 512),
    "Barrel_01": ("Fuel drum", 512), "wicker_basket_01": ("Basket", 512), "wooden_bucket_01": ("Bucket", 512),
    "portable_generator": ("Petrol generator", 1024), "old_military_compressor": ("Air compressor", 1024),
    "drill_press_01": ("Pillar drill", 1024), "portable_welding_cart": ("Welding set", 1024), "bench_vice_01": ("Bench vice", 512),
    "tool_cart": ("Tool trolley", 1024), "hand_truck": ("Hand truck", 512),
}

# slot: (Sketchfab uid, title, author, licence, target triangles). Licence and download flag were checked on each model's record in November 2026.
SKETCHFAB = {
    "tractor_mf135": ("94d25834e3c549cda58503ca4d1d5cac", "Massey Ferguson 135", "christophemerkle1", "CC BY 4.0", 60000),
    "tractor_te20": ("604cb70b362846ba8a3e835bff65ae7b", "Old tractor - Ferguson TE20", "kird3rf", "CC BY 4.0", 60000),
    "rotary_cultivator": ("e67093cfa4834f9cbda11a85ed54c10a", "Rotary cultivator", "JarviceOne", "CC BY 4.0", 30000),
    "disc_harrow": ("06751e78958e4b6887d4938f0076b9da", "Disk Harrow BDFP-2.4 (Rusty)", "JarviceOne", "CC BY 4.0", 30000),
    "boom_sprayer": ("c5a6ba8e2e8d45d7bf9f33b477552d34", "Breakaway boom sprayer", "TheFailedArchitect", "CC BY 4.0", 14000),
    "combine": ("9edb72613ddf4a2cafe82cf844824d49", "John Deere CTS Combine", "OwenNielsen", "CC BY 4.0", 34000),
    "power_tiller": ("65e907157dfa4d16af2d46dea967d627", "Rotavator Pasquali", "iliedom", "CC BY 4.0", 50000),
    "farm_trailer": ("e4cdf59e867a4e3ca1cd49cf19ca19c2", "tractor trailer_farm trailer_21_MB", "ahmagh2e", "CC BY 4.0", 40000),
    "water_pump": ("293315f6b5834985bdcf844d40891a97", "Water Motor Pump", "topfrank2013", "CC BY 4.0", 29000),
    "hand_pump": ("e037d394875c49e3ac423a045cfcdad4", "Water hand pump", "sandeep7", "CC BY 4.0", 26000),
    "engine_4cyl": ("e14ebe68273d49a3becda6802270b4b0", "Rigged 4-Cylinder Engine (FREE)", "david.gnzlv", "CC BY 4.0", 79000),
    "chainsaw": ("052d0c1d5e6f48358dc89d6cefe45a38", "Chainsaw", "thesidekick", "CC BY 4.0", 40000),
}


def optimise(src, dst, tex, ratio=None):
    cmd = ["npx", "-y", "@gltf-transform/cli@4", "optimize", src, dst, "--texture-compress", "webp", "--texture-size", str(tex), "--compress", "false"]
    cmd += ["--simplify", "true", "--simplify-ratio", str(ratio)] if ratio else ["--simplify", "false"]
    subprocess.run(cmd, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return os.path.exists(dst)


def polyhaven(index, manifest):
    for asset, (name, tex) in POLYHAVEN.items():
        dst = os.path.join(MODELS, asset + ".glb")
        if os.path.exists(dst):
            continue
        info = G.get(f"https://api.polyhaven.com/info/{asset}") or {}
        files = G.get(f"https://api.polyhaven.com/files/{asset}") or {}
        g = files.get("gltf", {}).get("1k", {}).get("gltf")
        if not g:
            print("no gltf:", asset); continue
        with tempfile.TemporaryDirectory() as d:
            p = G.save(os.path.join(d, asset + ".gltf"), G.get(g["url"], True))
            for sub, inc in (g.get("include") or {}).items():
                G.save(os.path.join(d, sub), G.get(inc["url"], True))
            os.makedirs(MODELS, exist_ok=True)
            if not optimise(p, dst, tex):
                print("optimise failed:", asset); continue
        authors = ", ".join((info.get("authors") or {}).keys()) or "Poly Haven"
        rec = {"source": f"https://polyhaven.com/a/{asset}", "licence": "CC0 1.0", "author": authors, "provider": "Poly Haven"}
        manifest["models/" + asset + ".glb"] = rec
        index[asset] = dict(rec, name=name, file=asset + ".glb", kb=round(os.path.getsize(dst) / 1024))
        print("ok", asset, index[asset]["kb"], "kB")


def sketchfab(index, manifest):
    tok = os.environ.get("SKETCHFAB_TOKEN")
    if not tok:
        print("SKETCHFAB_TOKEN is not set: skipping Sketchfab models."); return
    import urllib.request
    for slot, (uid, title, author, lic, tris) in SKETCHFAB.items():
        dst = os.path.join(MODELS, slot + ".glb")
        if os.path.exists(dst):
            continue
        rec = json.load(urllib.request.urlopen(urllib.request.Request(f"https://api.sketchfab.com/v3/models/{uid}", headers={"User-Agent": "Mozilla/5.0"}), timeout=60))
        if (rec.get("license") or {}).get("slug") not in ("by", "cc0") or not rec.get("isDownloadable"):
            print("licence changed, skipped:", slot); continue
        dl = json.load(urllib.request.urlopen(urllib.request.Request(f"https://api.sketchfab.com/v3/models/{uid}/download", headers={"Authorization": "Token " + tok}), timeout=60))
        url = (dl.get("glb") or dl.get("gltf") or {}).get("url")
        if not url:
            print("no download:", slot); continue
        data = urllib.request.urlopen(url, timeout=600).read()
        with tempfile.TemporaryDirectory() as d:
            if dl.get("glb"):
                src = os.path.join(d, "m.glb"); open(src, "wb").write(data)
            else:
                zipfile.ZipFile(io.BytesIO(data)).extractall(d); src = os.path.join(d, "scene.gltf")
            faces = rec.get("faceCount") or tris
            os.makedirs(MODELS, exist_ok=True)
            if not optimise(src, dst, 1024, min(1, round(tris / max(faces, 1), 3)) if faces > tris else None):
                print("optimise failed:", slot); continue
        r = {"source": f"https://sketchfab.com/3d-models/{uid}", "licence": lic, "author": author, "provider": "Sketchfab", "title": title}
        manifest["models/" + slot + ".glb"] = r
        index[slot] = dict(r, name=title, file=slot + ".glb", kb=round(os.path.getsize(dst) / 1024))
        print("ok", slot)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--only", default="polyhaven,sketchfab"); a = ap.parse_args()
    mp, ip = os.path.join(ROOT, "manifest.json"), os.path.join(MODELS, "index.json")
    manifest = json.load(open(mp)) if os.path.exists(mp) else {}
    index = json.load(open(ip)) if os.path.exists(ip) else {}
    if "polyhaven" in a.only: polyhaven(index, manifest)
    if "sketchfab" in a.only: sketchfab(index, manifest)
    os.makedirs(MODELS, exist_ok=True)
    json.dump(index, open(ip, "w"), indent=1, sort_keys=True); json.dump(manifest, open(mp, "w"), indent=1)


if __name__ == "__main__":
    main()
