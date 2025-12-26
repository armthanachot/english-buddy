import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

export default function GlassCube() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Renderer (transparent)
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      // keep default premultiplied alpha behavior to avoid black fringing/opaque clears with postprocessing
      premultipliedAlpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.setClearAlpha(0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.domElement.style.background = "transparent";
    renderer.domElement.style.display = "block";
    mount.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();
    scene.background = null;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      42,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );
    camera.position.set(3.2, 2.1, 3.5);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0.2, 0);

    // Root
    const root = new THREE.Group();
    scene.add(root);

    // Main glass cube (UNLIT)
    const glassSize = 2.3;
    const glassGeo = new RoundedBoxGeometry(glassSize, glassSize, glassSize, 8, 0.1);
    const glassMat = new THREE.MeshBasicMaterial({
      color: 0xdff0ff,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    root.add(glass);

    const edgeGeo = new THREE.EdgesGeometry(glassGeo, 25);
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0xeaf2ff,
      transparent: true,
      opacity: 0.55,
    });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    root.add(edges);

    // helper: icon texture
    const madeTextures: THREE.CanvasTexture[] = [];
    function iconTexture(hex: number, glyph: string): THREE.CanvasTexture {
      const c = document.createElement("canvas");
      c.width = c.height = 256;
      const ctx = c.getContext("2d");
      if (!ctx) {
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        madeTextures.push(tex);
        return tex;
      }

      const base = new THREE.Color(hex);
      const a = base.clone().offsetHSL(0.02, 0.1, 0.14);
      const b = base.clone().offsetHSL(-0.02, 0.12, -0.18);

      const g = ctx.createLinearGradient(0, 0, 256, 256);
      g.addColorStop(0, `#${a.getHexString()}`);
      g.addColorStop(1, `#${b.getHexString()}`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);

      const rg = ctx.createRadialGradient(80, 70, 10, 80, 70, 160);
      rg.addColorStop(0, "rgba(255,255,255,0.38)");
      rg.addColorStop(1, "rgba(255,255,255,0.0)");
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, 256, 256);

      // White glowing glyph (so bloom can pick it up nicely)
      ctx.font = "bold 120px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.save();
      ctx.shadowColor = "rgba(255,255,255,0.85)";
      ctx.shadowBlur = 28;
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fillText(glyph, 128, 138);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,1)";
      ctx.fillText(glyph, 128, 138);
      ctx.restore();

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      madeTextures.push(tex);
      return tex;
    }

    const palette = [0x2de2ff, 0x3a7bff, 0xff4fd8, 0xff8a2b, 0x7a5cff, 0x33f2c2];
    const glyphs = ["⌁", "◻", "⟲", "⇢", "⟐", "⌂", "⚙", "◎", "◈", "▦", "⤴", "⟡"];

    // Inner tiles
    const tiles = new THREE.Group();
    root.add(tiles);

    const inner = glassSize * 0.44;
    const tileMeshes: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>[] = [];
    for (let i = 0; i < 30; i++) {
      const s = THREE.MathUtils.lerp(0.28, 0.5, Math.random());
      const r = s * 0.28;

      const color = palette[(Math.random() * palette.length) | 0];
      const glyph = glyphs[i % glyphs.length];

      const geo = new RoundedBoxGeometry(s, s, s, 6, r);
      const mat = new THREE.MeshBasicMaterial({
        color,
        map: iconTexture(color, glyph),
        transparent: true,
        opacity: 0.98,
      });

      const m = new THREE.Mesh(geo, mat);
      m.position.set(
        THREE.MathUtils.randFloatSpread(inner * 2),
        THREE.MathUtils.randFloatSpread(inner * 2) + 0.15,
        THREE.MathUtils.randFloatSpread(inner * 2)
      );
      m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      m.userData.spin = new THREE.Vector3(
        THREE.MathUtils.randFloat(-0.6, 0.6),
        THREE.MathUtils.randFloat(-0.9, 0.9),
        THREE.MathUtils.randFloat(-0.6, 0.6)
      );
      m.userData.bob = Math.random() * Math.PI * 2;

      tiles.add(m);
      tileMeshes.push(m);
    }

    // Scattered cubes around
    const debris = new THREE.Group();
    scene.add(debris);

    const debrisMeshes: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>[] = [];
    const debrisCount = 90;
    for (let i = 0; i < debrisCount; i++) {
      const s = THREE.MathUtils.lerp(0.06, 0.18, Math.random());
      const r = s * 0.35;
      const geo = new RoundedBoxGeometry(s, s, s, 4, r);

      const color = palette[(Math.random() * palette.length) | 0];
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const m = new THREE.Mesh(geo, mat);

      const radius = THREE.MathUtils.lerp(1.7, 3.8, Math.random());
      const dir = new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(1),
        THREE.MathUtils.randFloatSpread(1),
        THREE.MathUtils.randFloatSpread(1)
      ).normalize();

      m.position.copy(dir.multiplyScalar(radius));
      m.position.y *= 0.6;
      m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

      m.userData.spin = new THREE.Vector3(
        THREE.MathUtils.randFloat(-1.0, 1.0),
        THREE.MathUtils.randFloat(-1.0, 1.0),
        THREE.MathUtils.randFloat(-1.0, 1.0)
      );
      m.userData.drift = dir.clone().multiplyScalar(THREE.MathUtils.lerp(0.05, 0.18, Math.random()));
      m.userData.phase = Math.random() * Math.PI * 2;

      debris.add(m);
      debrisMeshes.push(m);
    }

    // Bloom (rendered offscreen, then overlaid on top of the main scene)
    // Reason: making UnrealBloomPass the final screen output can force opaque alpha (black rectangle),
    // since it draws the input with an opaque material before blending bloom.
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

    const bloom = new UnrealBloomPass(new THREE.Vector2(rtW, rtH), 0.55, 0.55, 0.22);
    bloom.renderToScreen = false;

    // Fullscreen quad to add bloom over the already-rendered (transparent) scene.
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

    // Resize
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);

      const { w: newW, h: newH } = getRenderSize();
      bloomRT.setSize(newW, newH);
      bloom.setSize(newW, newH);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    // Animate
    const clock = new THREE.Clock();
    let raf = 0;

    const animate = () => {
      const t = clock.getElapsedTime();

      root.rotation.y = t * 0.18;
      root.rotation.x = Math.sin(t * 0.35) * 0.05;

      tileMeshes.forEach((m, idx) => {
        const w = m.userData.spin;
        m.rotation.x += w.x * 0.003;
        m.rotation.y += w.y * 0.003;
        m.rotation.z += w.z * 0.003;
        m.position.y += Math.sin(t * 0.9 + m.userData.bob + idx * 0.2) * 0.0008;
      });

      debrisMeshes.forEach((m, idx) => {
        const w = m.userData.spin;
        m.rotation.x += w.x * 0.0025;
        m.rotation.y += w.y * 0.0025;
        m.rotation.z += w.z * 0.0025;

        const p = m.userData.phase + idx * 0.03;
        m.position.addScaledVector(m.userData.drift, Math.sin(t * 0.6 + p) * 0.0008);
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
      // Run bloom; it uses bloomRT.texture as input and updates bloom.renderTargetsHorizontal[0].texture.
      bloom.render(renderer, bloomRT, bloomRT, 0, false);

      // 3) Overlay bloom on top of the already-rendered base scene.
      renderer.setRenderTarget(null);
      renderer.autoClear = false;
      renderer.render(postScene, postCamera);
      renderer.autoClear = true;

      raf = requestAnimationFrame(animate);
    };
    animate();

    // Cleanup (สำคัญใน React)
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      bloom.dispose();
      bloomRT.dispose();
      postMat.dispose();
      postQuad.geometry.dispose();

      // dispose geometries/materials/textures
      glassGeo.dispose();
      edgeGeo.dispose();
      glassMat.dispose();
      edgeMat.dispose();

      tileMeshes.forEach((m) => {
        m.geometry.dispose();
        m.material.map?.dispose();
        m.material.dispose();
      });
      debrisMeshes.forEach((m) => {
        m.geometry.dispose();
        m.material.dispose();
      });
      madeTextures.forEach((t) => t.dispose());

      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
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
      }}
    />
  );
}