import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

type Props = {
  className?: string;
  style?: React.CSSProperties;
};

type Disposable = { dispose: () => void };

function makeTextPanelTexture(opts: {
  w?: number;
  h?: number;
  accent?: string;
  density?: number;
}) {
  const w = opts.w ?? 512;
  const h = opts.h ?? 512;
  const density = opts.density ?? 1.0;
  const accent = opts.accent ?? "#ffd7b6";

  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2D canvas context not available");

  // fully transparent background (glass panel will be the glass, this is only ink)
  ctx.clearRect(0, 0, w, h);

  // subtle header blocks
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(48, 56, w - 96, 18);
  ctx.fillRect(48, 82, (w - 96) * 0.62, 10);

  // accent tag
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = accent;
  ctx.fillRect(w - 160, 54, 112, 18);

  // text lines
  const lineCount = Math.floor(18 * density);
  let y = 140;
  for (let i = 0; i < lineCount; i++) {
    const ww = (w - 96) * (0.45 + Math.random() * 0.5);
    ctx.globalAlpha = 0.22 + Math.random() * 0.18;
    ctx.fillStyle = "rgba(255,255,255,1)";
    ctx.fillRect(48, y, ww, 6);
    y += 18 + Math.random() * 8;
  }

  // tiny code-like blocks
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 26; i++) {
    const bx = 48 + Math.random() * (w - 120);
    const by = 120 + Math.random() * (h - 200);
    const bw = 8 + Math.random() * 28;
    const bh = 4 + Math.random() * 10;
    ctx.fillRect(bx, by, bw, bh);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 4;
  return tex;
}

export default function GlassDataCluster(props: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const disposables: Disposable[] = [];
    const textures: THREE.Texture[] = [];

    // Renderer (โปร่งใส เพื่อให้เห็น CSS gradient)
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
    renderer.toneMappingExposure = 1.1;
    renderer.domElement.style.background = "transparent";
    renderer.domElement.style.display = "block";

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mount.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();
    scene.background = null;

    // Environment reflection (ช่วยให้ glass ดูดีขึ้น)
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    scene.environment = envTex;
    disposables.push(envTex);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      40,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.set(4.8, 3.6, 6.0);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0.1, 1.15, 0);
    controls.maxPolarAngle = Math.PI * 0.52;
    controls.minDistance = 4.2;
    controls.maxDistance = 12;

    // Lights (นุ่ม + โทนอุ่น/เย็นแบบภาพ)
    const hemi = new THREE.HemisphereLight(0xffefe4, 0x6d4a53, 0.65);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffdfc6, 2.0);
    key.position.set(6, 8, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 30;
    key.shadow.camera.left = -8;
    key.shadow.camera.right = 8;
    key.shadow.camera.top = 8;
    key.shadow.camera.bottom = -8;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xccecff, 0.85);
    fill.position.set(-6, 3.5, -4);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffb1c8, 0.65);
    rim.position.set(-2, 6, 6);
    scene.add(rim);

    // Root
    const root = new THREE.Group();
    scene.add(root);

    // ---------- Platform base (2 layers) ----------
    const plate1Geo = new RoundedBoxGeometry(6.2, 0.28, 3.8, 6, 0.18);
    const plate1Mat = new THREE.MeshStandardMaterial({
      color: 0xf2efe9,
      roughness: 0.9,
      metalness: 0.0,
    });
    const plate1 = new THREE.Mesh(plate1Geo, plate1Mat);
    plate1.position.set(0, 0.14, 0.15);
    plate1.receiveShadow = true;
    plate1.castShadow = true;
    root.add(plate1);

    const plate2Geo = new RoundedBoxGeometry(5.8, 0.22, 3.4, 6, 0.16);
    const plate2Mat = new THREE.MeshStandardMaterial({
      color: 0xf6f2ee,
      roughness: 0.85,
      metalness: 0.0,
    });
    const plate2 = new THREE.Mesh(plate2Geo, plate2Mat);
    plate2.position.set(0.25, 0.29, 0.05);
    plate2.receiveShadow = true;
    plate2.castShadow = true;
    root.add(plate2);

    disposables.push(
      plate1Geo, plate1Mat,
      plate2Geo, plate2Mat
    );

    // Soft shadow plane (เพิ่มความนุ่มเหมือนภาพ)
    const shadowPlaneGeo = new THREE.PlaneGeometry(18, 18);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.25 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.001;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);
    disposables.push(shadowPlaneGeo, shadowPlaneMat);

    // ---------- Cluster cubes ----------
    const pastel = {
      peach: 0xffb38c,
      orange: 0xffa560,
      cream: 0xf6f2ee,
      teal: 0x9fe2e2,
      cyan: 0x8fd3ff,
      purple: 0x6a5a86,
      slate: 0x6b6f90,
    };

    const cubeGeo = new RoundedBoxGeometry(1.35, 1.35, 1.35, 7, 0.14);
    const cubeThinGeo = new RoundedBoxGeometry(1.35, 1.15, 1.35, 7, 0.14);

    const mkMat = (color: number, extra?: Partial<THREE.MeshStandardMaterial>) => {
      const m = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.55,
        metalness: 0.0,
        envMapIntensity: 0.55,
        ...extra,
      });
      return m;
    };

    const cluster = new THREE.Group();
    cluster.position.set(0.2, 1.25, 0.0);
    root.add(cluster);

    const cubes: THREE.Mesh[] = [];

    // left peach block
    const c1 = new THREE.Mesh(cubeThinGeo, mkMat(pastel.peach, { roughness: 0.65 }));
    c1.position.set(-1.25, 0.1, 0.25);
    c1.castShadow = true;
    cubes.push(c1); cluster.add(c1);

    // top bridge (white-ish)
    const c2 = new THREE.Mesh(cubeThinGeo, mkMat(pastel.cream, { roughness: 0.35 }));
    c2.position.set(-0.2, 0.65, 0.05);
    c2.scale.set(1.15, 1.0, 1.15);
    c2.castShadow = true;
    cubes.push(c2); cluster.add(c2);

    // center dark purple cube
    const c3 = new THREE.Mesh(cubeGeo, mkMat(pastel.purple, { roughness: 0.6 }));
    c3.position.set(-0.1, -0.15, 0.15);
    c3.castShadow = true;
    cubes.push(c3); cluster.add(c3);

    // right cyan cube (bigger)
    const c4 = new THREE.Mesh(cubeGeo, mkMat(pastel.cyan, { roughness: 0.45 }));
    c4.position.set(1.35, -0.05, 0.1);
    c4.scale.set(1.22, 1.05, 1.15);
    c4.castShadow = true;
    cubes.push(c4); cluster.add(c4);

    // bottom orange slab
    const c5 = new THREE.Mesh(
      new RoundedBoxGeometry(1.65, 0.95, 1.35, 7, 0.14),
      mkMat(pastel.orange, { roughness: 0.7 })
    );
    c5.position.set(0.95, -1.0, 0.45);
    c5.castShadow = true;
    cubes.push(c5); cluster.add(c5);
    disposables.push(c5.geometry as THREE.BufferGeometry, c5.material as THREE.Material);

    // small teal cube (floating top-right like image)
    const c6 = new THREE.Mesh(
      new RoundedBoxGeometry(0.95, 0.85, 0.95, 6, 0.12),
      mkMat(pastel.teal, { roughness: 0.35 })
    );
    c6.position.set(1.65, 1.55, -0.95);
    c6.castShadow = true;
    cubes.push(c6); root.add(c6);
    disposables.push(c6.geometry as THREE.BufferGeometry, c6.material as THREE.Material);

    disposables.push(
      cubeGeo, cubeThinGeo,
      c1.material as THREE.Material,
      c2.material as THREE.Material,
      c3.material as THREE.Material,
      c4.material as THREE.Material
    );

    // ---------- "Emboss-like" face icons (simulate etched symbols) ----------
    // ทำเป็นแผ่นบางๆ โปร่งใสวางชิดหน้ากล่อง แทนการแกะสลักจริง
    const iconPlaneGeo = new THREE.PlaneGeometry(0.9, 0.9);

    function makeIconTexture(symbol: "drop" | "window") {
      const c = document.createElement("canvas");
      c.width = c.height = 256;
      const ctx = c.getContext("2d");
      if (!ctx) throw new Error("2D canvas context not available");
      ctx.clearRect(0, 0, 256, 256);

      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = "rgba(255,255,255,0.65)";
      ctx.lineWidth = 10;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      if (symbol === "drop") {
        ctx.beginPath();
        ctx.moveTo(128, 44);
        ctx.bezierCurveTo(80, 110, 78, 132, 78, 160);
        ctx.bezierCurveTo(78, 204, 104, 220, 128, 220);
        ctx.bezierCurveTo(152, 220, 178, 204, 178, 160);
        ctx.bezierCurveTo(178, 132, 176, 110, 128, 44);
        ctx.closePath();
        ctx.stroke();
      } else {
        // window grid
        ctx.strokeRect(64, 64, 128, 128);
        ctx.beginPath();
        ctx.moveTo(128, 64); ctx.lineTo(128, 192);
        ctx.moveTo(64, 128); ctx.lineTo(192, 128);
        ctx.stroke();
      }

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      textures.push(tex);
      return tex;
    }

    const iconMat1 = new THREE.MeshBasicMaterial({
      map: makeIconTexture("drop"),
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const icon1 = new THREE.Mesh(iconPlaneGeo, iconMat1);
    icon1.position.copy(c3.position).add(new THREE.Vector3(0, 0.0, 0.69));
    cluster.add(icon1);

    const iconMat2 = new THREE.MeshBasicMaterial({
      map: makeIconTexture("window"),
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const icon2 = new THREE.Mesh(iconPlaneGeo, iconMat2);
    icon2.position.copy(c4.position).add(new THREE.Vector3(-0.72, -0.05, 0.55));
    icon2.rotation.y = Math.PI / 2;
    cluster.add(icon2);

    disposables.push(iconPlaneGeo, iconMat1, iconMat2);

    // ---------- Glass UI panels around (with text overlay) ----------
    const panels = new THREE.Group();
    panels.position.set(0.1, 1.25, 0);
    root.add(panels);

    const glassPanelMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.06,
      metalness: 0.0,
      transmission: 1.0,
      thickness: 0.12,
      ior: 1.45,
      transparent: true,
      opacity: 1.0,
      envMapIntensity: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.2,
    });

    // Panels are thin rounded boxes (acts like glass cards)
    const panelGeo = new RoundedBoxGeometry(2.8, 2.1, 0.05, 6, 0.16);

    const makePanel = (pos: THREE.Vector3, rotY: number, accent: string) => {
      const card = new THREE.Mesh(panelGeo, glassPanelMat);
      card.position.copy(pos);
      card.rotation.y = rotY;
      card.castShadow = false;
      panels.add(card);

      // ink overlay (text) on top of glass
      const inkTex = makeTextPanelTexture({ accent, density: 1.0 });
      textures.push(inkTex);

      const inkMat = new THREE.MeshBasicMaterial({
        map: inkTex,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const inkPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(2.6, 1.95),
        inkMat
      );
      inkPlane.position.set(0, 0, 0.031); // เลื่อนมาอยู่ด้านหน้า card นิดนึง
      card.add(inkPlane);

      disposables.push(inkPlane.geometry as THREE.BufferGeometry, inkMat);
      return card;
    };

    const p1 = makePanel(new THREE.Vector3(-2.4, 0.3, 0.1), 0.35, "#ffd2b1");
    const p2 = makePanel(new THREE.Vector3(0.4, 0.95, -2.0), -0.55, "#bfeaff");
    const p3 = makePanel(new THREE.Vector3(2.7, 0.25, -0.2), -0.20, "#ffe2b8");

    p1.scale.set(1.05, 1.1, 1);
    p2.scale.set(1.15, 1.05, 1);
    p3.scale.set(1.0, 1.18, 1);

    disposables.push(panelGeo, glassPanelMat);

    // ---------- Small chips / tags (floating mini blocks like UI markers) ----------
    const chips = new THREE.Group();
    root.add(chips);

    const chipGeo = new RoundedBoxGeometry(0.28, 0.22, 0.28, 4, 0.06);
    const chipMatA = new THREE.MeshStandardMaterial({
      color: 0x72d7ff,
      roughness: 0.35,
      metalness: 0.0,
      emissive: new THREE.Color(0x72d7ff),
      emissiveIntensity: 0.25,
    });
    const chipMatB = new THREE.MeshStandardMaterial({
      color: 0xffc06a,
      roughness: 0.45,
      metalness: 0.0,
      emissive: new THREE.Color(0xffc06a),
      emissiveIntensity: 0.18,
    });

    const chip1 = new THREE.Mesh(chipGeo, chipMatA);
    chip1.position.set(-0.65, 2.65, -0.15);
    chip1.castShadow = true;
    chips.add(chip1);

    const chip2 = new THREE.Mesh(chipGeo, chipMatB);
    chip2.position.set(2.55, 1.55, 0.95);
    chip2.castShadow = true;
    chips.add(chip2);

    const chip3 = new THREE.Mesh(chipGeo, chipMatA);
    chip3.scale.setScalar(0.85);
    chip3.position.set(-2.65, 1.65, -0.85);
    chip3.castShadow = true;
    chips.add(chip3);

    disposables.push(chipGeo, chipMatA, chipMatB);

    // ---------- Connectors (thin tubes linking panels/cubes) ----------
    const connectors = new THREE.Group();
    root.add(connectors);

    const connectorMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.35,
      metalness: 0.0,
      transparent: true,
      opacity: 0.35,
      emissive: new THREE.Color(0xffe6d3),
      emissiveIntensity: 0.15,
    });

    const connectorGeos: THREE.BufferGeometry[] = [];
    const makeConnector = (a: THREE.Vector3, b: THREE.Vector3, lift = 0.8) => {
      const mid = a.clone().lerp(b, 0.5);
      mid.y += lift;

      const curve = new THREE.CatmullRomCurve3([a, mid, b]);
      const geo = new THREE.TubeGeometry(curve, 48, 0.028, 10, false);
      connectorGeos.push(geo);
      const mesh = new THREE.Mesh(geo, connectorMat);
      mesh.castShadow = true;
      connectors.add(mesh);
      return mesh;
    };

    // connect to panels
    makeConnector(
      cluster.localToWorld(c4.position.clone().add(new THREE.Vector3(0.6, 0.25, -0.2))),
      panels.localToWorld(p2.position.clone().add(new THREE.Vector3(0.6, 0.2, 0.0))),
      0.55
    );

    makeConnector(
      cluster.localToWorld(c1.position.clone().add(new THREE.Vector3(-0.6, 0.3, 0.2))),
      panels.localToWorld(p1.position.clone().add(new THREE.Vector3(0.6, -0.1, 0.0))),
      0.65
    );

    makeConnector(
      cluster.localToWorld(c3.position.clone().add(new THREE.Vector3(0.25, -0.25, 0.6))),
      panels.localToWorld(p3.position.clone().add(new THREE.Vector3(-0.7, 0.2, 0.0))),
      0.75
    );

    // connect chips
    makeConnector(
      chip1.getWorldPosition(new THREE.Vector3()),
      cluster.localToWorld(c2.position.clone().add(new THREE.Vector3(0.1, 0.45, 0.15))),
      0.35
    );

    disposables.push(connectorMat);
    connectorGeos.forEach((g) => disposables.push(g));

    // ---------- Bloom (offscreen + overlay, keeps canvas alpha transparent) ----------
    // Reason: making UnrealBloomPass the final screen output can force opaque alpha (black rectangle).
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
      0.62, // radius
      0.24 // threshold
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

    // ---------- Animation ----------
    const clock = new THREE.Clock();
    let raf = 0;

    const animate = () => {
      const t = clock.getElapsedTime();

      // slow floating + gentle rotation (เหมือน shot render)
      root.rotation.y = t * 0.12;
      root.rotation.x = Math.sin(t * 0.32) * 0.04;

      c6.position.y = 2.8 + Math.sin(t * 1.0) * 0.06;

      chips.children.forEach((m, i) => {
        m.position.y += Math.sin(t * 1.2 + i) * 0.0009;
        m.rotation.y += 0.003;
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