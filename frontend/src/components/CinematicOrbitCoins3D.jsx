"use client";

import { useEffect, useRef, useState } from "react";
import { Renderer, Camera, Transform, Cylinder, Program, Mesh } from "ogl";

export default function CinematicOrbitCoins3D({ className = "" }) {
  const containerRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || reducedMotion) return;

    let renderer;
    let gl;
    try {
      renderer = new Renderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        dpr: Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2),
      });
      gl = renderer.gl;
      gl.clearColor(0, 0, 0, 0);
    } catch (e) {
      console.warn("WebGL not supported for 3D Orbit Coins:", e);
      setWebglSupported(false);
      return;
    }

    container.appendChild(gl.canvas);
    gl.canvas.style.position = "absolute";
    gl.canvas.style.top = "0";
    gl.canvas.style.left = "0";
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    gl.canvas.style.pointerEvents = "none";

    const scene = new Transform();
    // Camera looking directly at origin (0, 0, 0)
    const camera = new Camera(gl, { fov: 42, near: 0.1, far: 100 });
    camera.position.set(0, 0, 12);

    // Realistic Brushed Metallic 24K Gold Coin Shaders
    const vertexShader = /* glsl */ `
      attribute vec3 position;
      attribute vec3 normal;
      attribute vec2 uv;

      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform mat3 normalMatrix;

      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vPosition = mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = /* glsl */ `
      precision highp float;

      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;

      uniform float uTime;
      uniform vec3 uCoinTint;
      uniform float uIsCenter;
      uniform float uSymbolType;

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(-vPosition);

        // Warm Key Light (top-right warm golden illumination)
        vec3 light1Dir = normalize(vec3(0.8, 1.3, 1.2));
        float diff1 = max(dot(normal, light1Dir), 0.0);

        // Fill Light (bottom-left champagne bronze glow)
        vec3 light2Dir = normalize(vec3(-0.9, -0.6, 0.7));
        float diff2 = max(dot(normal, light2Dir), 0.0);

        // Top specular glint / metallic sheen
        vec3 halfVec = normalize(light1Dir + viewDir);
        float spec = pow(max(dot(normal, halfVec), 0.0), 36.0);

        // Metallic Fresnel Rim Lighting (Warm Gold Glow)
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.5);

        // Face vs Edge Detection (Cylinder caps have normal.z facing front/back)
        bool isFace = abs(normal.z) > 0.4;

        // Concentric bevel detail rings on coin faces
        float distFromCenter = length(vUv - 0.5) * 2.0;
        float faceBevel = 0.0;
        float symbolEmboss = 0.0;

        if (isFace) {
          // Outer reeded coin border ring
          float outerRim = smoothstep(0.86, 0.92, distFromCenter) - smoothstep(0.92, 0.98, distFromCenter);
          // Inner grooved ring
          float innerGroove = smoothstep(0.70, 0.74, distFromCenter) - smoothstep(0.74, 0.78, distFromCenter);
          faceBevel = outerRim * 0.35 + innerGroove * 0.25;

          // Embossed finance symbol on face
          vec2 p = (vUv - 0.5) * 2.0;

          if (uSymbolType < 0.5) {
            // Vridhi V Emblem for central coin
            float v1 = smoothstep(0.08, 0.03, abs(p.x * 1.4 + p.y - 0.05)) * step(p.y, 0.38) * step(-0.45, p.y);
            float v2 = smoothstep(0.08, 0.03, abs(-p.x * 1.4 + p.y - 0.05)) * step(p.y, 0.38) * step(-0.45, p.y);
            float crossBar = smoothstep(0.05, 0.02, abs(p.y + 0.05)) * step(abs(p.x), 0.22);
            symbolEmboss = max(max(v1, v2), crossBar) * 0.6;
          } else if (uSymbolType < 1.5) {
            // Bank pillar symbol
            float roof = smoothstep(0.06, 0.02, abs(p.y - 0.28 + abs(p.x) * 0.6)) * step(abs(p.x), 0.35);
            float p1 = smoothstep(0.05, 0.02, abs(p.x + 0.20)) * step(abs(p.y), 0.18);
            float p2 = smoothstep(0.05, 0.02, abs(p.x)) * step(abs(p.y), 0.18);
            float p3 = smoothstep(0.05, 0.02, abs(p.x - 0.20)) * step(abs(p.y), 0.18);
            float base = smoothstep(0.05, 0.02, abs(p.y + 0.25)) * step(abs(p.x), 0.35);
            symbolEmboss = max(max(roof, base), max(p1, max(p2, p3))) * 0.5;
          } else {
            // Rupee / Growth symbol
            float rStem = smoothstep(0.06, 0.02, abs(p.x + 0.12)) * step(abs(p.y), 0.32);
            float rBar1 = smoothstep(0.05, 0.02, abs(p.y - 0.22)) * step(abs(p.x), 0.25);
            float rBar2 = smoothstep(0.05, 0.02, abs(p.y - 0.08)) * step(abs(p.x), 0.25);
            float rLoop = smoothstep(0.06, 0.02, abs(length(p - vec2(0.0, 0.07)) - 0.15)) * step(0.0, p.x);
            symbolEmboss = max(max(rStem, max(rBar1, rBar2)), rLoop) * 0.5;
          }
        }

        // Luxurious 24K Gold & Bronze Material Palette
        vec3 baseGold = uCoinTint;
        vec3 highlightGold = vec3(1.0, 0.95, 0.75);
        vec3 bronzeShadow = vec3(0.35, 0.22, 0.07);

        // Combine Lighting Passes
        vec3 color = baseGold * (0.28 + diff1 * 0.78 + diff2 * 0.30);
        color += bronzeShadow * (1.0 - diff1) * 0.35;
        color += highlightGold * spec * 1.45;
        color += highlightGold * fresnel * 0.75;
        color += vec3(0.98, 0.82, 0.38) * faceBevel;
        color += vec3(1.0, 0.94, 0.65) * symbolEmboss;

        if (uIsCenter > 0.5) {
          color += highlightGold * (fresnel * 0.35 + spec * 0.35);
        }

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // 1. Central Hero Coin
    const centerGeom = new Cylinder(gl, {
      radiusTop: 1.35,
      radiusBottom: 1.35,
      height: 0.18,
      radialSegments: 48,
      heightSegments: 1,
    });

    const centerProgram = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uCoinTint: { value: [0.96, 0.78, 0.32] }, // 24K Gold
        uIsCenter: { value: 1.0 },
        uSymbolType: { value: 0.0 }, // Vridhi Emblem
      },
      cullFace: null,
    });

    const centerMesh = new Mesh(gl, { geometry: centerGeom, program: centerProgram });
    centerMesh.position.set(0, 0, 0); // Fixed at center (0,0,0) of this container
    centerMesh.rotation.set(0.32, -0.40, 0.12);
    centerMesh.setParent(scene);

    // 2. Revolving Satellite Coins (Fixed mathematical circular/elliptical orbits around (0,0,0))
    const satelliteGeom = new Cylinder(gl, {
      radiusTop: 0.48,
      radiusBottom: 0.48,
      height: 0.08,
      radialSegments: 36,
      heightSegments: 1,
    });

    // 4 neatly spaced satellite coins revolving on a shared tilted circular/elliptical orbital ring
    // radiusX = 2.9, radiusY = 1.6, keeping max bounds within [-3.0, 3.0] so it NEVER escapes container
    const orbitConfigs = [
      {
        initialAngle: 0.0,
        angularSpeed: 0.45,
        radiusX: 2.85,
        radiusY: 1.55,
        tiltAngle: 0.38, // Tilt of orbital plane
        scale: 0.95,
        symbolType: 1.0, // Bank
        tint: [0.98, 0.82, 0.36],
      },
      {
        initialAngle: Math.PI * 0.5,
        angularSpeed: 0.45,
        radiusX: 2.85,
        radiusY: 1.55,
        tiltAngle: 0.38,
        scale: 0.88,
        symbolType: 2.0, // Rupee
        tint: [0.94, 0.76, 0.30],
      },
      {
        initialAngle: Math.PI * 1.0,
        angularSpeed: 0.45,
        radiusX: 2.85,
        radiusY: 1.55,
        tiltAngle: 0.38,
        scale: 1.02,
        symbolType: 1.0, // Bank
        tint: [1.0, 0.86, 0.42],
      },
      {
        initialAngle: Math.PI * 1.5,
        angularSpeed: 0.45,
        radiusX: 2.85,
        radiusY: 1.55,
        tiltAngle: 0.38,
        scale: 0.90,
        symbolType: 2.0, // Rupee
        tint: [0.92, 0.72, 0.28],
      },
    ];

    const orbitCoins = orbitConfigs.map((cfg) => {
      const program = new Program(gl, {
        vertex: vertexShader,
        fragment: fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uCoinTint: { value: cfg.tint },
          uIsCenter: { value: 0.0 },
          uSymbolType: { value: cfg.symbolType },
        },
        cullFace: null,
      });

      const mesh = new Mesh(gl, { geometry: satelliteGeom, program });
      mesh.scale.set(cfg.scale, cfg.scale, cfg.scale);
      mesh.setParent(scene);

      return { mesh, config: cfg, program };
    });

    // Resize handler ensures aspect ratio and camera remain perfectly fitted to this container
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;

      renderer.setSize(width, height);
      camera.perspective({ aspect: width / height });

      // Keep camera distance balanced so orbital system fills roughly 80-85% of this container
      if (width < 480) {
        camera.position.set(0, 0, 13.5);
      } else {
        camera.position.set(0, 0, 11.2);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    // Subtle mouse parallax (strictly within container)
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetMouseX = Math.max(-0.5, Math.min(0.5, x));
      targetMouseY = Math.max(-0.5, Math.min(0.5, y));
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Animation Loop: STRICT DETERMINISTIC CIRCULAR/ELLIPTICAL ORBITS
    let animationFrameId;
    let startTime = performance.now();

    const animate = (t) => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsed = (t - startTime) * 0.001;

      // Smooth mouse easing
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      // Update Center Focal Coin: gentle rotation around own axes
      centerMesh.rotation.y = -0.40 + Math.sin(elapsed * 0.5) * 0.25 + currentMouseX * 0.20;
      centerMesh.rotation.x = 0.32 + Math.cos(elapsed * 0.4) * 0.12 - currentMouseY * 0.15;
      centerMesh.position.y = Math.sin(elapsed * 0.8) * 0.08;

      centerProgram.uniforms.uTime.value = elapsed;

      // Deterministic Orbit Math:
      // angle = initialAngle + angularSpeed * elapsedTime
      // x = radiusX * cos(angle)
      // y = radiusY * sin(angle) * cos(tilt)
      // z = radiusY * sin(angle) * sin(tilt)
      orbitCoins.forEach(({ mesh, config, program }) => {
        const angle = config.initialAngle + config.angularSpeed * elapsed;

        const x = config.radiusX * Math.cos(angle);
        const yRaw = config.radiusY * Math.sin(angle);

        // 3D tilt of the orbit plane
        const y = yRaw * Math.cos(config.tiltAngle);
        const z = yRaw * Math.sin(config.tiltAngle) * 2.2;

        mesh.position.set(x, y, z);

        // Continuous smooth rotation around coin's own axis as it revolves
        mesh.rotation.y = angle * 1.8;
        mesh.rotation.x = config.tiltAngle + Math.sin(angle) * 0.25;
        mesh.rotation.z = Math.cos(angle) * 0.18;

        program.uniforms.uTime.value = elapsed;
      });

      // Render Scene
      renderer.render({ scene, camera });
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);

      if (gl && gl.canvas && gl.canvas.parentElement) {
        gl.canvas.parentElement.removeChild(gl.canvas);
      }
      try {
        const loseContext = gl?.getExtension("WEBGL_lose_context");
        if (loseContext) loseContext.loseContext();
      } catch (err) {
        // ignore
      }
    };
  }, [reducedMotion]);

  if (!webglSupported || reducedMotion) {
    return (
      <div
        className={`absolute inset-0 pointer-events-none flex items-center justify-center p-4 ${className}`}
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/gold-hero-coins.png"
          alt="Vridhi.ai Gold Coins"
          className="w-full max-w-md object-contain opacity-90 drop-shadow-[0_12px_40px_rgba(212,154,56,0.35)]"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    />
  );
}
