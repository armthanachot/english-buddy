import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

type Props = {
  className?: string;
  style?: React.CSSProperties;
};

export default function WarmBlockCity(props: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      premultipliedAlpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setClearColor(0x000000, 0);
    renderer.setClearAlpha(0);
    renderer.domElement.style.background = "transparent";
    renderer.domElement.style.display = "block";

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    mount.appendChild(renderer.domElement);

    // Scene + fog + background
    const scene = new THREE.Scene();
    // Transparent background (no solid scene background)
    scene.background = null;
    // Optional: if you want atmospheric depth, keep fog. It won't fill empty pixels, only affects geometry.
    scene.fog = new THREE.FogExp2(0x2a1d33, 0.075);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      0.1,
      120
    );
    camera.position.set(9, 8, 10);

    // Controls (คุมมุมคล้ายภาพ: มุมกดลง)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0.9, 0);
    controls.minDistance = 6;
    controls.maxDistance = 22;
    controls.maxPolarAngle = Math.PI * 0.48;

    // Lights (more colorful studio mix)
    const hemi = new THREE.HemisphereLight(0xbfeaff, 0x3a1a18, 0.85);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xffd0b2, 2.2);
    key.position.set(8, 12, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 40;
    key.shadow.camera.left = -14;
    key.shadow.camera.right = 14;
    key.shadow.camera.top = 14;
    key.shadow.camera.bottom = -14;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x8fd3ff, 0.85);
    fill.position.set(-10, 6, -8);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xff4fd8, 0.55);
    rim.position.set(2, 5, 10);
    scene.add(rim);

    // Root (rotate the whole scene as one piece, similar to TypoCubeScene)
    const root = new THREE.Group();
    scene.add(root);

    // Color palette (pastel neon)
    const palette = [
      0x2de2ff, // cyan
      0xff4fd8, // magenta
      0xffb35c, // orange
      0x35d6b3, // mint
      0xbba6ff, // lavender
      0x7a5cff, // violet
    ];

    // Shared materials (เมืองบล็อก)
    const cityMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.95,
      metalness: 0.0,
      envMapIntensity: 0.25,
    });
    // Per-block gradient (top/bottom) via instanced attributes + small shader patch.
    cityMat.onBeforeCompile = (shader) => {
      // Add instanced gradient colors
      shader.vertexShader =
        `
        attribute vec3 instanceColorA;
        attribute vec3 instanceColorB;
        varying vec3 vInstColorA;
        varying vec3 vInstColorB;
        varying float vGradT;
        ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        `
        #include <begin_vertex>
        vInstColorA = instanceColorA;
        vInstColorB = instanceColorB;
        // Geometry is height=1, centered. Use local Y as 0..1 gradient factor.
        vGradT = clamp(position.y + 0.5, 0.0, 1.0);
        `
      );

      shader.fragmentShader =
        `
        varying vec3 vInstColorA;
        varying vec3 vInstColorB;
        varying float vGradT;
        ` + shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        `
        vec3 gradColor = mix(vInstColorA, vInstColorB, vGradT);
        vec4 diffuseColor = vec4( gradColor, opacity );
        `
      );
    };

    const pipeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.65,
      metalness: 0.05,
      emissive: new THREE.Color(0x2de2ff),
      emissiveIntensity: 0.14,
    });

    // --- City blocks (Instanced) ---
    const blocks = new THREE.Group();
    root.add(blocks);

    const grid = 9;              // ความหนาแน่น
    const spacing = 1.8;
    const count = grid * grid;

    const blockGeo = new RoundedBoxGeometry(1.05, 1.0, 1.05, 5, 0.18);
    const inst = new THREE.InstancedMesh(blockGeo, cityMat, count);
    inst.castShadow = true;
    inst.receiveShadow = true;

    const dummy = new THREE.Object3D();
    let idx = 0;
    for (let z = 0; z < grid; z++) {
      for (let x = 0; x < grid; x++) {
        const isCenter = x === (grid >> 1) && z === (grid >> 1);
        const h = isCenter ? 1.0 : THREE.MathUtils.lerp(0.7, 2.8, Math.random());

        dummy.position.set(
          (x - (grid - 1) / 2) * spacing + THREE.MathUtils.randFloatSpread(0.35),
          h / 2,
          (z - (grid - 1) / 2) * spacing + THREE.MathUtils.randFloatSpread(0.35)
        );
        dummy.scale.set(1, h, 1);
        dummy.rotation.y = THREE.MathUtils.randFloat(0, Math.PI);
        dummy.updateMatrix();
        inst.setMatrixAt(idx++, dummy.matrix);
      }
    }
    // Assign per-instance gradient colors (bottom/top)
    const colA = new Float32Array(count * 3);
    const colB = new Float32Array(count * 3);
    const cA = new THREE.Color();
    const cB = new THREE.Color();
    const white = new THREE.Color(0xffffff);
    for (let i = 0; i < count; i++) {
      const aHex = palette[(Math.random() * palette.length) | 0];
      const bHex = palette[(Math.random() * palette.length) | 0];
      cA.setHex(aHex).lerp(white, 0.25);
      cB.setHex(bHex).lerp(white, 0.25);
      const o = i * 3;
      colA[o] = cA.r; colA[o + 1] = cA.g; colA[o + 2] = cA.b;
      colB[o] = cB.r; colB[o + 1] = cB.g; colB[o + 2] = cB.b;
    }
    blockGeo.setAttribute("instanceColorA", new THREE.InstancedBufferAttribute(colA, 3));
    blockGeo.setAttribute("instanceColorB", new THREE.InstancedBufferAttribute(colB, 3));
    blocks.add(inst);

    // --- Central glowing cube ---
    const core = new THREE.Group();
    core.position.set(0, 0.55, 0);
    root.add(core);

    const coreGeo = new RoundedBoxGeometry(1.7, 1.7, 1.7, 6, 0.16);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xfffbff,
      roughness: 0.3,
      metalness: 0.0,
      emissive: new THREE.Color(0xff4fd8),
      emissiveIntensity: 2.0, // ตัวหลักของ glow
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.castShadow = true;
    core.add(coreMesh);

    // outline
    const coreEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(coreGeo, 20),
      new THREE.LineBasicMaterial({ color: 0xfff0d8, transparent: true, opacity: 0.55 })
    );
    core.add(coreEdges);

    // icon lines on faces (เส้นง่าย ๆ ให้คล้ายภาพ)
    function addFaceIcon() {
      const lineMat = new THREE.LineBasicMaterial({ color: 0xfff0df, transparent: true, opacity: 0.55 });

      // front face: a "window grid"
      const front = new THREE.Group();
      front.position.z = 0.86;
      front.position.y = -0.05;

      const pts: THREE.Vector3[] = [];
      // outer square
      pts.push(new THREE.Vector3(-0.45, -0.45, 0), new THREE.Vector3(0.45, -0.45, 0));
      pts.push(new THREE.Vector3(0.45, -0.45, 0), new THREE.Vector3(0.45, 0.45, 0));
      pts.push(new THREE.Vector3(0.45, 0.45, 0), new THREE.Vector3(-0.45, 0.45, 0));
      pts.push(new THREE.Vector3(-0.45, 0.45, 0), new THREE.Vector3(-0.45, -0.45, 0));
      // grid
      pts.push(new THREE.Vector3(0, -0.45, 0), new THREE.Vector3(0, 0.45, 0));
      pts.push(new THREE.Vector3(-0.45, 0, 0), new THREE.Vector3(0.45, 0, 0));

      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const lines = new THREE.LineSegments(geo, lineMat);
      front.add(lines);
      core.add(front);

      // right face: simple rectangle icon
      const right = new THREE.Group();
      right.rotation.y = -Math.PI / 2;
      right.position.x = 0.86;
      right.position.y = -0.08;

      const pts2: THREE.Vector3[] = [];
      pts2.push(new THREE.Vector3(-0.5, -0.35, 0), new THREE.Vector3(0.5, -0.35, 0));
      pts2.push(new THREE.Vector3(0.5, -0.35, 0), new THREE.Vector3(0.5, 0.35, 0));
      pts2.push(new THREE.Vector3(0.5, 0.35, 0), new THREE.Vector3(-0.5, 0.35, 0));
      pts2.push(new THREE.Vector3(-0.5, 0.35, 0), new THREE.Vector3(-0.5, -0.35, 0));

      const geo2 = new THREE.BufferGeometry().setFromPoints(pts2);
      const lines2 = new THREE.LineSegments(geo2, lineMat);
      right.add(lines2);
      core.add(right);

      return { lineGeos: [geo, geo2], lineMat };
    }
    const icons = addFaceIcon();

    // Glow light at core (ช่วยให้บล็อกรอบๆ สว่างนิด ๆ)
    const coreLight = new THREE.PointLight(0x2de2ff, 6, 10, 2);
    coreLight.position.set(0, 0.7, 0);
    coreLight.castShadow = true;
    core.add(coreLight);

    // --- Pipes (tube curves) ---
    const pipes = new THREE.Group();
    root.add(pipes);

    const pipeGeos: THREE.TubeGeometry[] = [];
    const makePipe = (a: THREE.Vector3, b: THREE.Vector3) => {
      const mid = a.clone().lerp(b, 0.5);
      mid.y += THREE.MathUtils.lerp(0.2, 1.4, Math.random());

      const curve = new THREE.CatmullRomCurve3([
        a,
        mid,
        b,
      ]);

      const geo = new THREE.TubeGeometry(curve, 40, 0.05, 10, false);
      pipeGeos.push(geo);
      const mesh = new THREE.Mesh(geo, pipeMat);
      mesh.castShadow = true;
      pipes.add(mesh);
    };

    // เลือกจุดเชื่อมแบบสุ่มบนกริด
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < 28; i++) {
      const gx = THREE.MathUtils.randInt(-(grid >> 1), grid >> 1);
      const gz = THREE.MathUtils.randInt(-(grid >> 1), grid >> 1);
      points.push(new THREE.Vector3(gx * spacing, THREE.MathUtils.lerp(0.2, 1.8, Math.random()), gz * spacing));
    }
    // เชื่อมเป็นเส้นๆ
    for (let i = 0; i < points.length - 1; i++) {
      if (Math.random() < 0.75) makePipe(points[i], points[i + 1]);
    }
    // เส้นเด่นจาก core ไปบางจุด
    for (let i = 0; i < 8; i++) {
      makePipe(new THREE.Vector3(0, 1.6, 0), points[(Math.random() * points.length) | 0]);
    }

    // --- Floating fragments (เล็ก ๆ ลอยบนอากาศ) ---
    const fragments: THREE.Mesh[] = [];
    const fragGeo = new RoundedBoxGeometry(0.25, 0.12, 0.25, 3, 0.06);
    const fragMats = [
      new THREE.MeshStandardMaterial({
        color: 0xffb35c,
        roughness: 0.55,
        metalness: 0.0,
        emissive: new THREE.Color(0xffb35c),
        emissiveIntensity: 0.06,
      }),
      new THREE.MeshStandardMaterial({
        color: 0x35d6b3,
        roughness: 0.55,
        metalness: 0.0,
        emissive: new THREE.Color(0x35d6b3),
        emissiveIntensity: 0.06,
      }),
      new THREE.MeshStandardMaterial({
        color: 0xbba6ff,
        roughness: 0.55,
        metalness: 0.0,
        emissive: new THREE.Color(0xbba6ff),
        emissiveIntensity: 0.06,
      }),
    ];
    for (let i = 0; i < 22; i++) {
      const m = new THREE.Mesh(fragGeo, fragMats[i % fragMats.length]);
      m.position.set(
        THREE.MathUtils.randFloatSpread(10),
        THREE.MathUtils.lerp(2.2, 4.8, Math.random()),
        THREE.MathUtils.randFloatSpread(10)
      );
      m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      m.castShadow = true;
      m.userData = { phase: Math.random() * Math.PI * 2 };
      root.add(m);
      fragments.push(m);
    }

    // Bloom (rendered offscreen, then overlaid on top of the main scene)
    // Reason: letting UnrealBloomPass be the final output can force opaque alpha (black rectangle).
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
      1.05, // strength (เพิ่ม/ลด glow หลัก)
      0.55, // radius
      0.20 // threshold
    );
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

    // Animate
    const clock = new THREE.Clock();
    let raf = 0;

    const animate = () => {
      const t = clock.getElapsedTime();

      // Rotate/float the entire scene block (like TypoCubeScene)
      root.rotation.y = t * 0.12;
      root.rotation.x = Math.sin(t * 0.25) * 0.04;
      root.position.y = Math.sin(t * 0.9) * 0.05;

      core.rotation.y = t * 0.35;
      core.position.y = 0.55 + Math.sin(t * 1.3) * 0.03;

      fragments.forEach((m, i) => {
        const p = (m.userData.phase as number) + i * 0.2;
        m.position.y += Math.sin(t * 1.2 + p) * 0.0012;
        m.rotation.y += 0.002;
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

    // Cleanup
    return () => {
      window.cancelAnimationFrame(raf);
      ro.disconnect();

      controls.dispose();
      bloom.dispose();
      bloomRT.dispose();
      postMat.dispose();
      postQuad.geometry.dispose();

      // dispose
      blockGeo.dispose();
      cityMat.dispose();
      inst.dispose();

      coreGeo.dispose();
      coreMat.dispose();

      (coreEdges.material as THREE.Material).dispose();
      (coreEdges.geometry as THREE.BufferGeometry).dispose();

      icons.lineGeos.forEach((g) => g.dispose());
      icons.lineMat.dispose();

      pipeGeos.forEach((g) => g.dispose());
      pipeMat.dispose();

      fragGeo.dispose();
      fragMats.forEach((m) => m.dispose());

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