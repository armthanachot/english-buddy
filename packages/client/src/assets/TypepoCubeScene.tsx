import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { FontLoader, type Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import helvetikerUrl from "three/examples/fonts/helvetiker_regular.typeface.json?url";

type Props = {
  className?: string;
  style?: React.CSSProperties;

  // ปรับตัวอักษรที่เห็นในช่อง
  leftChars?: [string, string];  // default ["A","5"]
  rightChars?: [string, string]; // default ["N","D"]
};

type Disposable = { dispose: () => void };

function roundedRectShape(w: number, h: number, r: number) {
  const x = -w / 2;
  const y = -h / 2;
  const s = new THREE.Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function makeFaceFrame(opts: {
  outerW: number;
  outerH: number;
  holeW: number;
  holeH: number;
  radius: number;
  thickness: number;
  bevel: number;
}) {
  const outer = roundedRectShape(opts.outerW, opts.outerH, opts.radius);
  const hole = roundedRectShape(opts.holeW, opts.holeH, Math.max(0.001, opts.radius * 0.6));
  outer.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(outer, {
    depth: opts.thickness,
    bevelEnabled: true,
    bevelThickness: opts.bevel,
    bevelSize: opts.bevel,
    bevelSegments: 3,
    curveSegments: 12,
    steps: 1,
  });
  geo.computeVertexNormals();
  geo.center();
  return geo;
}

function makeIconTexture(glyph: string, accent = "rgba(255,170,120,0.9)") {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2D canvas context not available");
  ctx.clearRect(0, 0, 256, 256);

  // soft plate
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "white";
  ctx.fillRect(28, 28, 200, 200);

  // glyph
  ctx.globalAlpha = 1;
  ctx.fillStyle = accent;
  ctx.font = "bold 120px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(glyph, 128, 138);

  // tiny UI lines
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "white";
  ctx.fillRect(50, 190, 156, 8);
  ctx.fillRect(50, 208, 110, 6);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

async function loadHelvetiker(): Promise<Font> {
  // Load from local dependency (no external network); Vite resolves `?url` to an asset URL.
  const json = await fetch(helvetikerUrl).then((r) => r.json());
  return new FontLoader().parse(json);
}

export default function TypoCubeScene({
  className,
  style,
  leftChars = ["A", "5"],
  rightChars = ["N", "D"],
}: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const disposables: Disposable[] = [];
    const textures: THREE.Texture[] = [];

    // Renderer
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
    scene.fog = new THREE.Fog(0xe9edf0, 10, 34);

    // Env (ช่วยให้วัสดุนุ่ม/มีมิติ)
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
      80
    );
    camera.position.set(6.2, 3.8, 6.8);

    // Controls (ล็อกมุมให้ใกล้ภาพ)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.target.set(0, 0.6, 0);
    controls.maxPolarAngle = Math.PI * 0.52;
    controls.minDistance = 5.2;
    controls.maxDistance = 14;

    // Lights (soft studio)
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));

    const hemi = new THREE.HemisphereLight(0xffffff, 0x96a0b6, 0.75);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffead7, 2.0);
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
    fill.position.set(-8, 3, -6);
    scene.add(fill);

    const warm = new THREE.DirectionalLight(0xffb07a, 0.9);
    warm.position.set(2, 2, 9);
    scene.add(warm);

    // Ground shadow catcher
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.ShadowMaterial({ opacity: 0.22 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2.2;
    ground.receiveShadow = true;
    scene.add(ground);
    disposables.push(ground.geometry as THREE.BufferGeometry, ground.material as THREE.Material);

    // Root
    const root = new THREE.Group();
    scene.add(root);

    // ===== Main Typo Cube (6 face frames) =====
    const cube = new THREE.Group();
    root.add(cube);

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xf5f7fb,
      roughness: 0.55,
      metalness: 0.0,
      envMapIntensity: 0.35,
    });

    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xf1b089, // warm peach interior hint
      roughness: 0.75,
      metalness: 0.0,
    });

    // face frame geometry
    const faceGeo = makeFaceFrame({
      outerW: 3.4,
      outerH: 3.4,
      holeW: 2.35,
      holeH: 2.6,
      radius: 0.22,
      thickness: 0.45,
      bevel: 0.06,
    });
    disposables.push(faceGeo, frameMat, innerMat);

    // Build 6 frames, butให้ 2 ด้านเด่นเหมือนภาพ (ซ้าย/ขวา)
    const faces: THREE.Mesh[] = [];
    const makeFace = () => {
      const m = new THREE.Mesh(faceGeo, frameMat);
      m.castShadow = true;
      m.receiveShadow = true;
      cube.add(m);
      faces.push(m);
      return m;
    };

    // +Z (front)
    const fFront = makeFace();
    fFront.position.z = 1.7;

    // -Z (back)
    const fBack = makeFace();
    fBack.rotation.y = Math.PI;
    fBack.position.z = -1.7;

    // +X (right)
    const fRight = makeFace();
    fRight.rotation.y = -Math.PI / 2;
    fRight.position.x = 1.7;

    // -X (left)
    const fLeft = makeFace();
    fLeft.rotation.y = Math.PI / 2;
    fLeft.position.x = -1.7;

    // +Y (top)
    const fTop = makeFace();
    fTop.rotation.x = -Math.PI / 2;
    fTop.position.y = 1.7;

    // -Y (bottom)
    const fBottom = makeFace();
    fBottom.rotation.x = Math.PI / 2;
    fBottom.position.y = -1.7;

    // Inner soft block (gives “filled” volume like render)
    const inner = new THREE.Mesh(
      new RoundedBoxGeometry(2.9, 2.9, 2.9, 6, 0.22),
      innerMat
    );
    inner.castShadow = true;
    inner.receiveShadow = true;
    cube.add(inner);
    disposables.push(inner.geometry as THREE.BufferGeometry);

    // ===== Letters inside (TextGeometry) =====
    const letters = new THREE.Group();
    cube.add(letters);

    let letterMeshes: THREE.Mesh[] = [];
    let font: Font | null = null;

    const letterMatCool = new THREE.MeshStandardMaterial({
      color: 0xd7e6ff,
      roughness: 0.35,
      metalness: 0.0,
      envMapIntensity: 0.6,
    });
    const letterMatWarm = new THREE.MeshStandardMaterial({
      color: 0xffc9a2,
      roughness: 0.45,
      metalness: 0.0,
      envMapIntensity: 0.5,
    });
    disposables.push(letterMatCool, letterMatWarm);

    const makeLetter = (ch: string, size: number, depth: number, mat: THREE.Material) => {
      if (!font) return null;
      const geo = new TextGeometry(ch, {
        font,
        size,
        depth,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.06,
        bevelSize: 0.035,
        bevelSegments: 3,
      });
      geo.computeBoundingBox();
      geo.center();
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      letters.add(mesh);
      letterMeshes.push(mesh);
      disposables.push(geo);
      return mesh;
    };

    // โหลดฟอนต์ async
    let cancelled = false;
    loadHelvetiker().then((f) => {
      if (cancelled) return;
      font = f;

      // left window: A + 5 (warm-ish)
      const A = makeLetter(leftChars[0], 1.35, 0.38, letterMatWarm);
      const five = makeLetter(leftChars[1], 1.20, 0.38, letterMatWarm);

      if (A) {
        A.position.set(-0.92, 0.30, 1.05);
        A.rotation.y = Math.PI / 2; // face left
      }
      if (five) {
        five.position.set(-0.92, -0.80, 1.00);
        five.rotation.y = Math.PI / 2;
      }

      // right window: N + D (cool-ish)
      const N = makeLetter(rightChars[0], 1.25, 0.38, letterMatCool);
      const D = makeLetter(rightChars[1], 1.20, 0.38, letterMatCool);

      if (N) {
        N.position.set(0.95, 0.25, 1.00);
        N.rotation.y = -Math.PI / 2;
      }
      if (D) {
        D.position.set(0.95, -0.80, 1.00);
        D.rotation.y = -Math.PI / 2;
      }

      // inner dense bits (เหมือนมีของแน่น ๆ อยู่กลางคิวบ์)
      for (let i = 0; i < 18; i++) {
        const g = new RoundedBoxGeometry(
          THREE.MathUtils.lerp(0.22, 0.55, Math.random()),
          THREE.MathUtils.lerp(0.18, 0.50, Math.random()),
          THREE.MathUtils.lerp(0.22, 0.55, Math.random()),
          4,
          0.08
        );
        const m = new THREE.Mesh(
          g,
          Math.random() < 0.5 ? letterMatWarm : letterMatCool
        );
        m.position.set(
          THREE.MathUtils.randFloatSpread(1.4),
          THREE.MathUtils.randFloatSpread(1.4),
          THREE.MathUtils.randFloatSpread(1.4)
        );
        m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        m.castShadow = true;
        letters.add(m);
        disposables.push(g);
        letterMeshes.push(m);
      }
    });

    // ===== Debris / Icons around (like scattered UI objects) =====
    const debris = new THREE.Group();
    root.add(debris);

    const debrisMatWarm = new THREE.MeshStandardMaterial({
      color: 0xf2a477,
      roughness: 0.55,
      metalness: 0.0,
    });
    const debrisMatCool = new THREE.MeshStandardMaterial({
      color: 0xcfe6ff,
      roughness: 0.55,
      metalness: 0.0,
    });
    disposables.push(debrisMatWarm, debrisMatCool);

    // mixed shapes
    const decoGeos: THREE.BufferGeometry[] = [];
    const spawnDebris = (count: number) => {
      for (let i = 0; i < count; i++) {
        const pick = Math.random();
        let geo: THREE.BufferGeometry;

        if (pick < 0.55) geo = new RoundedBoxGeometry(0.24, 0.24, 0.24, 3, 0.07);
        else if (pick < 0.78) geo = new THREE.CylinderGeometry(0.09, 0.12, 0.32, 20);
        else geo = new THREE.TorusGeometry(0.15, 0.045, 12, 22);

        decoGeos.push(geo);

        const mat = Math.random() < 0.5 ? debrisMatWarm : debrisMatCool;
        const m = new THREE.Mesh(geo, mat);
        const r = THREE.MathUtils.lerp(2.2, 4.2, Math.random());
        const dir = new THREE.Vector3(
          THREE.MathUtils.randFloatSpread(1),
          THREE.MathUtils.randFloatSpread(0.8),
          THREE.MathUtils.randFloatSpread(1)
        ).normalize();

        m.position.copy(dir.multiplyScalar(r));
        m.position.y += THREE.MathUtils.lerp(-0.6, 1.2, Math.random());
        m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

        m.castShadow = true;
        m.userData = {
          spin: new THREE.Vector3(
            THREE.MathUtils.randFloat(-0.8, 0.8),
            THREE.MathUtils.randFloat(-1.2, 1.2),
            THREE.MathUtils.randFloat(-0.8, 0.8)
          ),
          phase: Math.random() * Math.PI * 2,
          drift: THREE.MathUtils.lerp(0.6, 1.2, Math.random()),
        };

        debris.add(m);
      }
    };
    spawnDebris(120);

    decoGeos.forEach((g) => disposables.push(g));

    // icon planes
    const iconPlaneGeo = new RoundedBoxGeometry(0.55, 0.55, 0.04, 4, 0.12);
    disposables.push(iconPlaneGeo);

    const iconGlyphs = ["⌁", "△", "◻", "⟲", "↗", "◈", "✶"];
    for (let i = 0; i < 18; i++) {
      const glyph = iconGlyphs[i % iconGlyphs.length];
      const tex = makeIconTexture(glyph, i % 2 ? "rgba(130,190,255,0.95)" : "rgba(255,160,110,0.95)");
      textures.push(tex);

      const mat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.35,
        metalness: 0.0,
        map: tex,
        transparent: true,
      });
      disposables.push(mat);

      const m = new THREE.Mesh(iconPlaneGeo, mat);
      const r = THREE.MathUtils.lerp(2.6, 4.8, Math.random());
      const ang = Math.random() * Math.PI * 2;

      m.position.set(Math.cos(ang) * r, THREE.MathUtils.lerp(-0.2, 2.0, Math.random()), Math.sin(ang) * r);
      m.rotation.set(0, Math.random() * Math.PI * 2, 0);
      m.castShadow = true;
      debris.add(m);

      m.userData = { phase: Math.random() * Math.PI * 2 };
    }

    // top clutter strip (เหมือนมีของกองบนคิวบ์)
    const topClutter = new THREE.Group();
    topClutter.position.set(0.0, 2.05, 0.0);
    cube.add(topClutter);

    const clutterGeo = new RoundedBoxGeometry(0.55, 0.22, 0.55, 4, 0.08);
    disposables.push(clutterGeo);
    for (let i = 0; i < 18; i++) {
      const m = new THREE.Mesh(clutterGeo, Math.random() < 0.6 ? debrisMatWarm : debrisMatCool);
      m.position.set(
        THREE.MathUtils.randFloatSpread(2.6),
        THREE.MathUtils.lerp(0.05, 0.55, Math.random()),
        THREE.MathUtils.randFloatSpread(2.2)
      );
      m.rotation.y = Math.random() * Math.PI * 2;
      m.castShadow = true;
      topClutter.add(m);
    }

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

      // gentle rotation/float like product render
      root.rotation.y = t * 0.12;
      root.rotation.x = Math.sin(t * 0.25) * 0.04;
      root.position.y = Math.sin(t * 0.9) * 0.05;

      debris.children.forEach((obj, i) => {
        const m = obj as THREE.Mesh;
        const ud = m.userData as any;
        if (ud?.spin) {
          m.rotation.x += ud.spin.x * 0.002;
          m.rotation.y += ud.spin.y * 0.002;
          m.rotation.z += ud.spin.z * 0.002;
          m.position.y += Math.sin(t * 1.1 + (ud.phase ?? 0) + i * 0.02) * 0.0009;
        } else if (ud?.phase != null) {
          m.position.y += Math.sin(t * 1.2 + ud.phase) * 0.0009;
        }
      });

      // micro wobble inside letters cluster
      letters.rotation.y = Math.sin(t * 0.3) * 0.03;

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
      cancelled = true;
      window.cancelAnimationFrame(raf);
      ro.disconnect();

      controls.dispose();
      bloom.dispose();
      bloomRT.dispose();
      postMat.dispose();
      postQuad.geometry.dispose();
      textures.forEach((t) => t.dispose());
      disposables.forEach((d) => d.dispose());

      // also dispose materials/geometries of dynamically added meshes that weren't tracked
      faces.forEach((m) => {
        (m.geometry as THREE.BufferGeometry).dispose?.();
        (m.material as THREE.Material).dispose?.();
      });

      renderer.dispose();
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
    };
  }, [leftChars, rightChars]);

  return (
    <div
      ref={mountRef}
      className={className}
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
        ...style,
      }}
    />
  );
}