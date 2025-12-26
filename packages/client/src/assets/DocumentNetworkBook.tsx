import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

type Props = {
  className?: string;
  style?: React.CSSProperties;
};

type Disposable = { dispose: () => void };

function makeTextPageTexture(opts: {
  w?: number;
  h?: number;
  density?: number;
  header?: boolean;
  stamps?: boolean;
}) {
  const w = opts.w ?? 1024;
  const h = opts.h ?? 1024;
  const density = opts.density ?? 1.0;

  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2D canvas context not available");

  // paper base (pastel + subtle gradient; still "paper" but less pure white)
  const pg = ctx.createLinearGradient(0, 0, w, h);
  pg.addColorStop(0, "#fff3f7");  // soft pink
  pg.addColorStop(0.55, "#f3fbff"); // airy blue
  pg.addColorStop(1, "#f4fff6");  // mint
  ctx.fillStyle = pg;
  ctx.fillRect(0, 0, w, h);

  // header
  if (opts.header) {
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#2b3b57"; // cooler ink
    ctx.fillRect(100, 110, w - 200, 10);
    ctx.fillRect(100, 138, (w - 200) * 0.6, 8);
    ctx.globalAlpha = 1;
  }

  // text lines
  ctx.globalAlpha = 0.20;
  ctx.fillStyle = "#22314a";
  const top = 190;
  const bottom = h - 130;
  const lines = Math.floor(46 * density);
  let y = top;

  for (let i = 0; i < lines && y < bottom; i++) {
    const left = 110 + (i % 7 === 0 ? 18 : 0);
    const width = (w - 220) * (0.52 + Math.random() * 0.45);
    const height = 5 + Math.random() * 1.5;
    ctx.fillRect(left, y, width, height);
    y += 18 + Math.random() * 7;
  }

  // stamps/icons on the center standing pack (like green/red marks)
  if (opts.stamps) {
    ctx.globalAlpha = 1;
    // small red circle
    ctx.fillStyle = "#ff5c7a";
    ctx.beginPath();
    ctx.arc(w * 0.58, h * 0.32, 22, 0, Math.PI * 2);
    ctx.fill();
    // small green circle
    ctx.fillStyle = "#35d6b3";
    ctx.beginPath();
    ctx.arc(w * 0.58, h * 0.42, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(w * 0.56, h * 0.315, 52, 6);
    ctx.fillRect(w * 0.56, h * 0.415, 52, 6);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function bendPlaneY(geo: THREE.PlaneGeometry, amount: number) {
  // amount > 0 : curl up at outer edge
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    // v.x ∈ [-w/2, w/2] (plane created centered)
    const t = (v.x / (geo.parameters.width / 2)) * 0.5 + 0.5; // 0..1
    const curl = Math.pow(t, 2.2) * amount;

    v.y += curl * 0.65;
    v.z += Math.sin(t * Math.PI) * curl * 0.35;

    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

function makeChipTexture(label: string) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2D canvas context not available");

  // bg (colorful gradients, but consistent per label)
  const palettes: Array<[string, string]> = [
    ["#ff76c6", "#6a5cff"], // pink -> violet
    ["#4de3ff", "#2f8dff"], // cyan -> blue
    ["#ffb35c", "#ff5c7a"], // orange -> pink
    ["#35d6b3", "#4de3ff"], // mint -> cyan
    ["#bba6ff", "#ff76c6"], // lavender -> pink
  ];
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) | 0;
  const [c0, c1] = palettes[Math.abs(hash) % palettes.length];

  const g = ctx.createLinearGradient(0, 0, 512, 256);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 256);

  // gloss
  const rg = ctx.createRadialGradient(170, 80, 10, 170, 80, 220);
  rg.addColorStop(0, "rgba(255,255,255,0.35)");
  rg.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, 512, 256);

  // label
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "700 64px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 256, 128);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export default function DocumentNetworkBook(props: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const disposables: Disposable[] = [];
    const textures: THREE.Texture[] = [];

    // Renderer (โปร่งใส เพื่อเห็น CSS gradient)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      premultipliedAlpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.setClearAlpha(0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.style.background = "transparent";
    renderer.domElement.style.display = "block";

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mount.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();
    scene.background = null;

    // Environment reflections (ช่วยวัสดุ paper/glass)
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    scene.environment = envTex;
    disposables.push(envTex);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      42,
      mount.clientWidth / mount.clientHeight,
      0.1,
      120
    );
    camera.position.set(6.2, 4.3, 6.5);

    // Controls (คุมมุมเหมือน product render)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0.2, 1.1, 0);
    controls.maxPolarAngle = Math.PI * 0.52;
    controls.minDistance = 5.2;
    controls.maxDistance = 16;

    // Lights (studio soft)
    scene.add(new THREE.AmbientLight(0xffffff, 0.32));

    const key = new THREE.DirectionalLight(0xfff0e2, 2.1);
    key.position.set(7, 10, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 35;
    key.shadow.camera.left = -10;
    key.shadow.camera.right = 10;
    key.shadow.camera.top = 10;
    key.shadow.camera.bottom = -10;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xcfe7ff, 1.05);
    fill.position.set(-8, 3.5, -6);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffc6a0, 0.85);
    rim.position.set(2, 4, 10);
    scene.add(rim);

    // Shadow catcher plane
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.ShadowMaterial({ opacity: 0.18 })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.02;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);
    disposables.push(shadowPlane.geometry as THREE.BufferGeometry, shadowPlane.material as THREE.Material);

    // Root
    const root = new THREE.Group();
    scene.add(root);

    // ===== Materials =====
    const paperMat = new THREE.MeshStandardMaterial({
      color: 0xf6fbff, // airy blue-white
      roughness: 0.85,
      metalness: 0.0,
      envMapIntensity: 0.25,
    });

    const paperEdgeMat = new THREE.MeshStandardMaterial({
      color: 0xf7f0ff, // soft lavender edge tint
      roughness: 0.95,
      metalness: 0.0,
    });

    const glassLineMat = new THREE.MeshStandardMaterial({
      color: 0xf6fbff,
      roughness: 0.08,
      metalness: 0.0,
      transparent: true,
      opacity: 0.22,
      emissive: new THREE.Color(0x8fd3ff),
      emissiveIntensity: 0.16,
    });

    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0xfaf6ff,
      roughness: 0.25,
      metalness: 0.0,
      transparent: true,
      opacity: 0.55,
      emissive: new THREE.Color(0xff76c6),
      emissiveIntensity: 0.10,
    });

    disposables.push(paperMat, paperEdgeMat, glassLineMat, nodeMat);

    // ===== Book base (open book) =====
    const book = new THREE.Group();
    book.position.set(0.2, 0.6, 0.2);
    root.add(book);

    // base slab (like book cover)
    const coverGeo = new RoundedBoxGeometry(6.2, 0.38, 4.4, 7, 0.22);
    const coverMat = new THREE.MeshStandardMaterial({
      // "table/base" — make it more colorful (pastel violet with a hint of glow)
      color: 0xcbb4ff,
      roughness: 0.75,
      metalness: 0.0,
      emissive: new THREE.Color(0x7a5cff),
      emissiveIntensity: 0.07,
    });
    const cover = new THREE.Mesh(coverGeo, coverMat);
    cover.position.y = -0.19;
    cover.castShadow = true;
    cover.receiveShadow = true;
    book.add(cover);
    disposables.push(coverGeo, coverMat);

    // left & right open pages (curved planes)
    const pageTexL = makeTextPageTexture({ header: true, density: 1.05 });
    const pageTexR = makeTextPageTexture({ header: true, density: 1.1 });
    textures.push(pageTexL, pageTexR);

    const pageMatL = new THREE.MeshStandardMaterial({
      color: 0xfffbff,
      roughness: 0.9,
      metalness: 0.0,
      map: pageTexL,
    });
    const pageMatR = new THREE.MeshStandardMaterial({
      color: 0xf4fdff,
      roughness: 0.9,
      metalness: 0.0,
      map: pageTexR,
    });

    const pageW = 2.85;
    const pageH = 3.65;
    const pageGeoL = new THREE.PlaneGeometry(pageW, pageH, 40, 40);
    const pageGeoR = new THREE.PlaneGeometry(pageW, pageH, 40, 40);
    bendPlaneY(pageGeoL, 0.22);
    bendPlaneY(pageGeoR, 0.16);

    const leftPage = new THREE.Mesh(pageGeoL, pageMatL);
    leftPage.rotation.x = -Math.PI / 2;
    leftPage.rotation.z = THREE.MathUtils.degToRad(8);
    leftPage.position.set(-1.45, 0.02, 0.1);
    leftPage.receiveShadow = true;
    book.add(leftPage);

    const rightPage = new THREE.Mesh(pageGeoR, pageMatR);
    rightPage.rotation.x = -Math.PI / 2;
    rightPage.rotation.z = THREE.MathUtils.degToRad(-6);
    rightPage.position.set(1.45, 0.03, 0.05);
    rightPage.receiveShadow = true;
    book.add(rightPage);

    disposables.push(pageGeoL, pageGeoR, pageMatL, pageMatR);

    // center seam strip
    const seam = new THREE.Mesh(
      new RoundedBoxGeometry(0.32, 0.06, 3.5, 5, 0.06),
      new THREE.MeshStandardMaterial({
        color: 0xffb6c8, // coral/pink accent
        roughness: 0.95,
      })
    );
    seam.position.set(0.02, 0.03, 0.05);
    seam.castShadow = true;
    book.add(seam);
    disposables.push(seam.geometry as THREE.BufferGeometry, seam.material as THREE.Material);

    // ===== Standing document pack (center stack) =====
    const pack = new THREE.Group();
    pack.position.set(0.55, 1.05, 0.2);
    pack.rotation.y = THREE.MathUtils.degToRad(-12);
    root.add(pack);

    // outer “block” for thickness/rounded edges
    const packBlockGeo = new RoundedBoxGeometry(1.9, 2.75, 1.25, 7, 0.16);
    const packBlockMat = new THREE.MeshStandardMaterial({
      // center standing pack — more colorful (mint/teal)
      color: 0x7fe7d1,
      roughness: 0.75,
      metalness: 0.0,
      emissive: new THREE.Color(0x35d6b3),
      emissiveIntensity: 0.06,
    });
    const packBlock = new THREE.Mesh(packBlockGeo, packBlockMat);
    packBlock.castShadow = true;
    packBlock.receiveShadow = true;
    pack.add(packBlock);
    disposables.push(packBlockGeo, packBlockMat);

    // front sheet texture (with stamps)
    const packFrontTex = makeTextPageTexture({ header: true, density: 0.95, stamps: true });
    textures.push(packFrontTex);

    const packFrontMat = new THREE.MeshStandardMaterial({
      color: 0xfffbff,
      roughness: 0.9,
      metalness: 0.0,
      map: packFrontTex,
    });

    const packFrontGeo = new THREE.PlaneGeometry(1.55, 2.35, 20, 30);
    bendPlaneY(packFrontGeo, 0.08);

    const packFront = new THREE.Mesh(packFrontGeo, packFrontMat);
    packFront.position.set(0.02, 0.02, 0.64);
    packFront.castShadow = true;
    pack.add(packFront);

    disposables.push(packFrontGeo, packFrontMat);

    // visible “page edges” on the right (simulate layered sheets)
    const edgeGroup = new THREE.Group();
    edgeGroup.position.set(0.95, 0, 0.05);
    pack.add(edgeGroup);

    const sheetGeo = new RoundedBoxGeometry(0.06, 2.55, 1.18, 3, 0.03);
    disposables.push(sheetGeo);

    const sheetCount = 26;
    for (let i = 0; i < sheetCount; i++) {
      const m = new THREE.Mesh(sheetGeo, paperEdgeMat);
      m.position.x = i * 0.028;
      m.position.y = THREE.MathUtils.randFloatSpread(0.02);
      m.rotation.z = THREE.MathUtils.degToRad(2) * Math.sin(i * 0.35);
      m.castShadow = true;
      edgeGroup.add(m);
    }

    // “top curled pages” (thin curved strips on top)
    const topCurl = new THREE.Group();
    topCurl.position.set(0.25, 1.33, 0.0);
    pack.add(topCurl);

    for (let i = 0; i < 6; i++) {
      const g = new THREE.PlaneGeometry(1.5, 0.22, 30, 4);
      bendPlaneY(g, 0.10 + i * 0.03);
      const m = new THREE.Mesh(
        g,
        new THREE.MeshStandardMaterial({
          color: 0xf6fbff,
          roughness: 0.95,
          metalness: 0.0,
          transparent: true,
          opacity: 0.95,
        })
      );
      m.rotation.x = -Math.PI / 2;
      m.rotation.z = THREE.MathUtils.degToRad(-8);
      m.position.set(0.2, i * 0.018, -0.12 - i * 0.03);
      m.castShadow = true;
      topCurl.add(m);

      disposables.push(g, m.material as THREE.Material);
    }

    // ===== Floating extra documents around =====
    const extras = new THREE.Group();
    root.add(extras);

    const smallDocTex = makeTextPageTexture({ header: true, density: 0.75 });
    textures.push(smallDocTex);

    const smallDocMat = new THREE.MeshStandardMaterial({
      color: 0xfffbff,
      roughness: 0.9,
      metalness: 0.0,
      map: smallDocTex,
    });

    function spawnSheet(pos: THREE.Vector3, rot: THREE.Euler, scale = 1) {
      const g = new THREE.PlaneGeometry(1.6 * scale, 1.15 * scale, 28, 18);
      bendPlaneY(g, 0.10 * scale);
      const m = new THREE.Mesh(g, smallDocMat);
      m.position.copy(pos);
      m.rotation.copy(rot);
      m.castShadow = true;
      m.receiveShadow = true;
      extras.add(m);
      disposables.push(g);
      return m;
    }

    const sheetA = spawnSheet(
      new THREE.Vector3(-3.1, 1.95, -1.1),
      new THREE.Euler(THREE.MathUtils.degToRad(-20), THREE.MathUtils.degToRad(18), THREE.MathUtils.degToRad(8)),
      1.05
    );

    const sheetB = spawnSheet(
      new THREE.Vector3(-2.7, 0.35, 2.2),
      new THREE.Euler(-Math.PI / 2, THREE.MathUtils.degToRad(18), THREE.MathUtils.degToRad(0)),
      0.85
    );

    const sheetC = spawnSheet(
      new THREE.Vector3(3.2, 0.55, 2.0),
      new THREE.Euler(-Math.PI / 2, THREE.MathUtils.degToRad(-20), THREE.MathUtils.degToRad(0)),
      0.85
    );

    disposables.push(smallDocMat);

    // ===== Network connectors (transparent tubes + nodes) =====
    const network = new THREE.Group();
    root.add(network);

    const nodeGeo = new THREE.SphereGeometry(0.08, 20, 20);
    disposables.push(nodeGeo);

    const tubeGeos: THREE.BufferGeometry[] = [];
    const nodes: THREE.Mesh[] = [];
    const tubes: THREE.Mesh[] = [];

    function addNode(p: THREE.Vector3) {
      const n = new THREE.Mesh(nodeGeo, nodeMat);
      n.position.copy(p);
      n.castShadow = true;
      network.add(n);
      nodes.push(n);
      return n;
    }

    function addTube(points: THREE.Vector3[], radius = 0.03) {
      const curve = new THREE.CatmullRomCurve3(points);
      const g = new THREE.TubeGeometry(curve, 60, radius, 10, false);
      tubeGeos.push(g);
      const m = new THREE.Mesh(g, glassLineMat);
      m.castShadow = false;
      network.add(m);
      tubes.push(m);
      return m;
    }

    // anchor points near book/pack/chips
    const P_BOOK_L = new THREE.Vector3(-2.2, 0.9, 0.2);
    const P_BOOK_R = new THREE.Vector3(2.3, 0.95, 0.2);
    const P_PACK_T = new THREE.Vector3(0.9, 2.65, 0.2);
    const P_PACK_M = new THREE.Vector3(1.25, 1.25, 0.9);

    addNode(P_BOOK_L);
    addNode(P_BOOK_R);
    addNode(P_PACK_T);
    addNode(P_PACK_M);

    // tubes (soft path like the image “glass wires”)
    addTube([P_BOOK_L, new THREE.Vector3(-1.2, 1.4, -0.4), new THREE.Vector3(-0.2, 1.8, 0.1), P_PACK_T], 0.028);
    addTube([P_BOOK_R, new THREE.Vector3(1.8, 1.35, -0.6), new THREE.Vector3(1.35, 1.9, 0.0), P_PACK_T], 0.028);
    addTube([P_BOOK_R, new THREE.Vector3(2.8, 1.1, 1.1), new THREE.Vector3(1.9, 1.2, 1.1), P_PACK_M], 0.026);
    addTube([P_BOOK_L, new THREE.Vector3(-3.4, 1.2, -0.6), new THREE.Vector3(-3.0, 2.0, -1.1)], 0.022);

    // extra faint “paths” around
    for (let i = 0; i < 10; i++) {
      const a = new THREE.Vector3(
        THREE.MathUtils.randFloat(-4.0, 4.0),
        THREE.MathUtils.randFloat(0.4, 2.8),
        THREE.MathUtils.randFloat(-3.0, 3.0)
      );
      const b = new THREE.Vector3(
        THREE.MathUtils.randFloat(-4.0, 4.0),
        THREE.MathUtils.randFloat(0.4, 2.8),
        THREE.MathUtils.randFloat(-3.0, 3.0)
      );
      addTube([a, a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 0.6, 0)), b], 0.016);
      addNode(a);
      addNode(b);
    }

    tubeGeos.forEach((g) => disposables.push(g));

    // ===== Blue UI chips (floating labels) =====
    const chips = new THREE.Group();
    root.add(chips);

    const chipTex1 = makeChipTexture("username");
    const chipTex2 = makeChipTexture("doc");
    const chipTex3 = makeChipTexture("sync");
    textures.push(chipTex1, chipTex2, chipTex3);

    const chipGeo = new RoundedBoxGeometry(1.25, 0.52, 0.08, 6, 0.18);
    disposables.push(chipGeo);

    function addChip(tex: THREE.Texture, pos: THREE.Vector3, rotY: number) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.25,
        metalness: 0.0,
        map: tex,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: 0.06,
      });
      disposables.push(mat);

      const m = new THREE.Mesh(chipGeo, mat);
      m.position.copy(pos);
      m.rotation.y = rotY;
      m.castShadow = true;
      m.userData = { phase: Math.random() * Math.PI * 2 };
      chips.add(m);
      return m;
    }

    addChip(chipTex1, new THREE.Vector3(3.2, 2.4, -0.3), THREE.MathUtils.degToRad(-12));
    addChip(chipTex2, new THREE.Vector3(-2.4, 1.8, -0.1), THREE.MathUtils.degToRad(18));
    addChip(chipTex3, new THREE.Vector3(2.6, 1.45, 1.4), THREE.MathUtils.degToRad(-26));

    // ===== Bloom (offscreen + overlay, keeps canvas alpha transparent) =====
    // Reason: letting postprocessing be the final screen output can force opaque alpha (black rectangle).
    const getRenderSize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      return {
        w: Math.max(1, Math.floor(mount.clientWidth * dpr)),
        h: Math.max(1, Math.floor(mount.clientHeight * dpr)),
        dpr,
      };
    };

    const { w: rtW, h: rtH } = getRenderSize();
    const bloomRT = new THREE.WebGLRenderTarget(rtW, rtH, {
      format: THREE.RGBAFormat,
      depthBuffer: false,
      stencilBuffer: false,
    });
    bloomRT.texture.colorSpace = THREE.SRGBColorSpace;

    const bloom = new UnrealBloomPass(
      new THREE.Vector2(rtW, rtH),
      0.55, // strength
      0.65, // radius
      0.28 // threshold
    );
    bloom.renderToScreen = false;

    const postScene = new THREE.Scene();
    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const postMat = new THREE.ShaderMaterial({
      uniforms: {
        tBloom: { value: bloom.renderTargetsHorizontal[0].texture },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D tBloom;
        varying vec2 vUv;
        void main() {
          vec3 bloomRGB = texture2D(tBloom, vUv).rgb;
          // alpha=0 so we don't make the canvas opaque; additive blending will only affect RGB
          gl_FragColor = vec4(bloomRGB, 0.0);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
    });
    const postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat);
    postScene.add(postQuad);

    // ===== Animation =====
    const clock = new THREE.Clock();
    let raf = 0;

    const animate = () => {
      const t = clock.getElapsedTime();

      // gentle product render motion
      root.rotation.y = t * 0.10;
      root.rotation.x = Math.sin(t * 0.25) * 0.035;
      root.position.y = Math.sin(t * 0.9) * 0.05;

      // float chips
      chips.children.forEach((o, i) => {
        const m = o as THREE.Mesh;
        const phase = (m.userData?.phase as number) ?? 0;
        m.position.y += Math.sin(t * 1.2 + phase + i * 0.2) * 0.0009;
        m.rotation.y += 0.001;
      });

      // small subtle flutter of floating sheets
      sheetA.rotation.z += Math.sin(t * 0.8) * 0.00025;
      sheetB.rotation.y += 0.00045;
      sheetC.rotation.y -= 0.00035;

      // shimmer nodes a bit
      nodes.forEach((n, i) => {
        n.material = nodeMat;
        n.scale.setScalar(1 + Math.sin(t * 1.6 + i * 0.15) * 0.04);
      });

      controls.update();

      // 1) Render base scene directly to screen with transparent clear.
      renderer.setRenderTarget(null);
      renderer.setClearColor(0x000000, 0);
      renderer.clear(true, true, true);
      renderer.render(scene, camera);

      // 2) Render scene to offscreen RT and run bloom on it.
      renderer.setRenderTarget(bloomRT);
      renderer.setClearColor(0x000000, 0);
      renderer.clear(true, true, true);
      renderer.render(scene, camera);
      bloom.render(renderer, bloomRT, bloomRT, 0, false);

      // 3) Overlay bloom on top of the already-rendered base scene.
      renderer.setRenderTarget(null);
      renderer.autoClear = false;
      renderer.render(postScene, postCamera);
      renderer.autoClear = true;

      raf = window.requestAnimationFrame(animate);
    };
    animate();

    // Resize
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w <= 0 || h <= 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      const { w: newW, h: newH } = getRenderSize();
      bloomRT.setSize(newW, newH);
      bloom.setSize(newW, newH);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    // Cleanup
    return () => {
      window.cancelAnimationFrame(raf);
      ro.disconnect();

      controls.dispose();
      bloom.dispose();
      bloomRT.dispose();
      postMat.dispose();
      postQuad.geometry.dispose();

      textures.forEach((t) => t.dispose());
      disposables.forEach((d) => d.dispose());

      renderer.dispose();
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={props.className}
      style={{
        width: "20vw",
        height: "20vh",
        background: "transparent",
        // Feather edges so the canvas blends into the card/background (no hard cut)
        WebkitMaskImage:
          "radial-gradient(ellipse at center, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 100%)",
        maskImage:
          "radial-gradient(ellipse at center, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 100%)",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "100% 100%",
        maskSize: "100% 100%",
        ...props.style,
      }}
    />
  );
}