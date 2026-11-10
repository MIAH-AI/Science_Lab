/* agric-kit4.js — real 3D model files for the Agricultural Science lab.
   AK.model(id, o) returns a group at once (showing o.fallback, a code-built stand-in) and swaps in the
   optimised .glb from assets/agric/models/ when it has loaded. If the file is missing or cannot be read,
   the stand-in simply stays, so no lesson depends on a download.
   Files, authors and licences are listed in assets/agric/models/index.json (written by tools/fetch_agric_models.py).
   o: { fallback, fit (largest dimension, scene units), h (height), scale, lay: "x"|"z" (turn the long side along that axis), flat (lay an upright object down, broad face up),
        rot: [x, y, z], ry, at: [x, y, z], onload(group) } */
(function () {
  "use strict";
  const MK = window.MK, AK = window.AK, BK = window.BK;
  if (!MK || !AK || !BK) return;
  const T = () => window.THREE, BASE = () => MK.base + "assets/agric/models/";
  let idx = null; const buf = {};
  AK.MODELS = {};
  AK.modelIndex = () => idx || (idx = fetch(BASE() + "index.json").then((r) => (r.ok ? r.json() : {})).then((j) => { Object.assign(AK.MODELS, j); return j; }).catch(() => ({})));
  /* A small .glb reader for static, textured models (triangles, float attributes, embedded WebP or JPEG textures).
     The lab's three.js bundle is trimmed and has no GLTFLoader, so this reads the binary directly. Skins and morph targets are ignored (rest pose). */
  const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }, TA = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array }, GET = { 5120: "getInt8", 5121: "getUint8", 5122: "getInt16", 5123: "getUint16", 5125: "getUint32", 5126: "getFloat32" };
  function parseGLB(ab, cutout) {
    const T3 = T(), dv = new DataView(ab); if (dv.getUint32(0, true) !== 0x46546c67) return Promise.reject(new Error("not glb"));
    let off = 12, J = null, bin = null;
    while (off < ab.byteLength) { const len = dv.getUint32(off, true), type = dv.getUint32(off + 4, true); if (type === 0x4e4f534a) J = JSON.parse(new TextDecoder().decode(new Uint8Array(ab, off + 8, len))); else if (type === 0x004e4942) bin = ab.slice(off + 8, off + 8 + len); off += 8 + len; }
    if (!J || !bin) return Promise.reject(new Error("empty glb"));
    const bdv = new DataView(bin);
    const acc = (i) => { const a = J.accessors[i], n = NC[a.type], C = TA[a.componentType], sz = C.BYTES_PER_ELEMENT, out = new C(a.count * n); if (a.bufferView == null) return out; const bv = J.bufferViews[a.bufferView], base = (bv.byteOffset || 0) + (a.byteOffset || 0), st = bv.byteStride || n * sz, g = GET[a.componentType]; for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++) out[k * n + c] = bdv[g](base + k * st + c * sz, true); return out; };
    const tcache = {};
    const tex = (ref, srgb) => { if (!ref) return Promise.resolve(null); const tt = ref.extensions && ref.extensions.KHR_texture_transform, key = ref.index + (srgb ? "s" : "l") + (tt ? JSON.stringify(tt) : ""); if (tcache[key]) return tcache[key]; const t = J.textures[ref.index], src = t.extensions && t.extensions.EXT_texture_webp ? t.extensions.EXT_texture_webp.source : t.source, im = J.images[src], bv = J.bufferViews[im.bufferView]; return (tcache[key] = createImageBitmap(new Blob([new Uint8Array(bin, bv.byteOffset || 0, bv.byteLength)], { type: im.mimeType || "image/webp" })).then((bm) => { const x = new T3.Texture(bm); x.flipY = false; x.wrapS = x.wrapT = T3.RepeatWrapping; x.colorSpace = srgb ? T3.SRGBColorSpace : T3.NoColorSpace; x.anisotropy = 4; if (tt) { if (tt.offset) x.offset.fromArray(tt.offset); if (tt.scale) x.repeat.fromArray(tt.scale); if (tt.rotation) x.rotation = tt.rotation; } x.needsUpdate = true; return x; }).catch(() => null)); };
    const mats = (J.materials || []).map((m) => { const p = m.pbrMetallicRoughness || {}; return Promise.all([tex(p.baseColorTexture, true), tex(m.normalTexture, false), tex(p.metallicRoughnessTexture, false)]).then(([map, nor, orm]) => { const col = p.baseColorFactor || [1, 1, 1, 1], glassy = m.extensions && m.extensions.KHR_materials_transmission; const M = new T3.MeshStandardMaterial({ map, normalMap: nor, roughnessMap: orm, metalnessMap: orm, roughness: p.roughnessFactor == null ? 1 : p.roughnessFactor, metalness: p.metallicFactor == null ? 1 : p.metallicFactor, side: m.doubleSided ? T3.DoubleSide : T3.FrontSide }); M.color.setRGB(col[0], col[1], col[2]); if (cutout && map && (m.alphaMode === "BLEND" || m.alphaMode === "MASK")) { M.alphaTest = 0.4; M.side = T3.DoubleSide; } else if (m.alphaMode === "BLEND" || glassy) { M.transparent = true; M.opacity = glassy ? 0.35 : col[3]; M.depthWrite = false; } else if (m.alphaMode === "MASK") M.alphaTest = m.alphaCutoff == null ? 0.5 : m.alphaCutoff; M.name = m.name || ""; return M; }); });
    return Promise.all(mats).then((MT) => {
      const node = (i) => { const n = J.nodes[i], g = new T3.Group(); g.name = n.name || "";
        if (n.matrix) { new T3.Matrix4().fromArray(n.matrix).decompose(g.position, g.quaternion, g.scale); } else { if (n.translation) g.position.fromArray(n.translation); if (n.rotation) g.quaternion.fromArray(n.rotation); if (n.scale) g.scale.fromArray(n.scale); }
        if (n.mesh != null) J.meshes[n.mesh].primitives.forEach((pr) => { if (pr.mode != null && pr.mode !== 4) return; const A = pr.attributes, geo = new T3.BufferGeometry(); if (A.POSITION == null) return; geo.setAttribute("position", new T3.BufferAttribute(new Float32Array(acc(A.POSITION)), 3)); if (A.NORMAL != null) geo.setAttribute("normal", new T3.BufferAttribute(new Float32Array(acc(A.NORMAL)), 3)); else geo.computeVertexNormals(); if (A.TEXCOORD_0 != null) geo.setAttribute("uv", new T3.BufferAttribute(new Float32Array(acc(A.TEXCOORD_0)), 2)); if (pr.indices != null) { const ix = acc(pr.indices); geo.setIndex(new T3.BufferAttribute(ix instanceof Uint8Array ? new Uint16Array(ix) : ix, 1)); } g.add(new T3.Mesh(geo, pr.material != null ? MT[pr.material] : new T3.MeshStandardMaterial({ color: 0x9aa0a6 }))); });
        (n.children || []).forEach((c) => g.add(node(c))); return g; };
      const root = new T3.Group(); ((J.scenes && J.scenes[J.scene || 0]) || { nodes: [] }).nodes.forEach((i) => root.add(node(i))); return root;
    });
  }
  const bytes = (f) => buf[f] || (buf[f] = fetch(BASE() + f).then((r) => { if (!r.ok) throw new Error(f); return r.arrayBuffer(); }));
  const live = (o) => { for (let q = o; q; q = q.parent) if (q.isScene) return true; return false; };

  AK.model = (id, o) => {
    o = o || {}; const T3 = T(), h = new T3.Group(); h.userData.dyn = true; h.userData.model = id;
    if (o.fallback) h.add(o.fallback);
    h.ready = AK.modelIndex().then((ix) => {
      if (!ix[id]) return false;
      return bytes(ix[id].file).then((ab) => parseGLB(ab, o.cutout)).catch(() => null).then((m) => {
        if (!m) return false;
        if (!live(h)) { BK.dispose(null, m); return false; }          // the scene was closed while the file was loading
        const flat = new T3.Group(), turn = new T3.Group(), piv = new T3.Group(); flat.add(m); turn.add(flat); piv.add(turn);
        if (o.rot) m.rotation.set(o.rot[0], o.rot[1], o.rot[2]);
        piv.updateMatrixWorld(true);
        let b = new T3.Box3().setFromObject(piv), sz = b.getSize(new T3.Vector3());
        if (o.flat && sz.y > Math.max(sz.x, sz.z)) { if (sz.x < sz.z) flat.rotation.y = Math.PI / 2; const tip = new T3.Group(); tip.rotation.x = -Math.PI / 2; turn.remove(flat); tip.add(flat); turn.add(tip); piv.updateMatrixWorld(true); b = new T3.Box3().setFromObject(piv); sz = b.getSize(new T3.Vector3()); }
        if (o.lay && (o.lay === "z") === (sz.x >= sz.z)) turn.rotation.y = Math.PI / 2;
        if (o.ry) turn.rotation.y += o.ry;
        piv.updateMatrixWorld(true); b = new T3.Box3().setFromObject(piv); sz = b.getSize(new T3.Vector3());
        const c = b.getCenter(new T3.Vector3()), k = o.fit ? o.fit / Math.max(sz.x, sz.y, sz.z, 1e-6) : o.h ? o.h / Math.max(sz.y, 1e-6) : o.scale || 1, at = o.at || [0, 0, 0];
        piv.scale.setScalar(k); piv.position.set(at[0] - c.x * k, at[1] - b.min.y * k, at[2] - c.z * k);
        m.traverse((q) => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } });
        if (o.fallback) BK.dispose(null, o.fallback);
        h.add(piv); h.userData.real = true; if (o.onload) o.onload(h);
        return true;
      });
    }).catch(() => false);
    return h;
  };

  /* AK.scatter(g, id, pts, o): many copies of one model as instanced meshes (one draw call per material).
     pts: [[x, y, z, scale, ry]]; o: { h (height of a scale-1 copy, scene units), fallback (object shown until the file loads), cutout (default true) } */
  AK.scatter = (g, id, pts, o) => {
    o = o || {}; const T3 = T(), h = new T3.Group(); h.userData.dyn = true; h.userData.model = id; if (o.fallback) h.add(o.fallback); g.add(h);
    h.ready = AK.modelIndex().then((ix) => {
      if (!ix[id] || !pts.length) return false;
      return bytes(ix[id].file).then((ab) => parseGLB(ab, o.cutout !== false)).catch(() => null).then((m) => {
        if (!m) return false; if (!live(h)) { BK.dispose(null, m); return false; }
        m.updateMatrixWorld(true); const b = new T3.Box3().setFromObject(m), sz = b.getSize(new T3.Vector3()), c = b.getCenter(new T3.Vector3()), k = (o.h || 1) / Math.max(sz.y, 1e-6);
        const N = new T3.Matrix4().makeScale(k, k, k).multiply(new T3.Matrix4().makeTranslation(-c.x, -b.min.y, -c.z)), I = new T3.Matrix4(), q = new T3.Quaternion(), up = new T3.Vector3(0, 1, 0), meshes = [];
        m.traverse((x) => { if (x.isMesh) meshes.push(x); });
        meshes.forEach((x) => { const im = new T3.InstancedMesh(x.geometry, x.material, pts.length), L = N.clone().multiply(x.matrixWorld); pts.forEach(([px, py, pz, s, ry], i) => { I.compose(new T3.Vector3(px, py, pz), q.setFromAxisAngle(up, ry || 0), new T3.Vector3(s || 1, s || 1, s || 1)).multiply(L); im.setMatrixAt(i, I); }); im.instanceMatrix.needsUpdate = true; im.castShadow = o.shadow !== false; im.receiveShadow = true; im.frustumCulled = false; h.add(im); });
        if (o.fallback) BK.dispose(null, o.fallback); h.userData.real = true; (AK._scat = AK._scat || []).push([id, pts.length, meshes.length, +sz.y.toFixed(2), +k.toFixed(3)]); return true;
      });
    }).catch((e) => { (AK._scat = AK._scat || []).push([id, 'ERR', String(e)]); return false; });
    return h;
  };

  /* a plain stand-in block of the right size, for objects that have no code-built version */
  AK.standin = (w, hgt, d, col, at) => { const m = AK.box(w, hgt, d, AK.std(col == null ? 0x7a8086 : col, { roughness: 0.6, metalness: 0.4 }), 0, hgt / 2, 0); if (at) m.position.set(at[0], at[1] + hgt / 2, at[2]); BK.shadow(m); return m; };

  /* credit lines for every model file present (shown in the lab's credits panel) */
  AK.modelCredits = () => AK.modelIndex().then((ix) => Object.keys(ix).sort().map((k) => ix[k].name + " — " + ix[k].author + ", " + ix[k].licence + " (" + ix[k].provider + ")"));
})();
