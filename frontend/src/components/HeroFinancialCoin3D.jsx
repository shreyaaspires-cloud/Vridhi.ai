"use client";

import { useEffect, useRef, useState } from "react";
import { Renderer, Camera, Transform, Cylinder, Torus, Program, Mesh } from "ogl";

/**
 * HeroFinancialCoin3D
 * Precise physical 3D recreation of the approved standing circular emerald-and-gold coin:
 * - Rich deep emerald green face with vivid metallic luster (#021B13 to #0B4633)
 * - Real 3D champagne-gold metallic beveled perimeter and milled sidewall
 * - Raised 3D Vridhi growth emblem (upright V with right ascending arrow)
 * - Three-quarter standing orientation facing the camera
 * - Continuous, smooth in-place rotation with realistic contact shadow
 */
export default function HeroFinancialCoin3D({ className = "" }) {
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

    let renderer, gl, animationFrameId;

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
      console.warn("WebGL unsupported for HeroFinancialCoin3D:", e);
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
    const camera = new Camera(gl, { fov: 32, near: 0.1, far: 100 });
    camera.position.set(0, 0.05, 5.6);

    // Root coin group for camera perspective
    const coinRoot = new Transform();
    coinRoot.setParent(scene);
    coinRoot.position.set(0, 0.05, 0);

    // Spin group rotating around vertical axis Y
    const spinGroup = new Transform();
    spinGroup.setParent(coinRoot);

    // Upright assembly: cylinder's axis is Y; tilting 90 deg around X makes its circular face face the camera Z
    const uprightAssembly = new Transform();
    uprightAssembly.setParent(spinGroup);
    uprightAssembly.rotation.x = Math.PI / 2;

    // ── Shaders ──────────────────────────────────────────────────────────

    // 1. Polished Metallic Champagne-Gold Shader
    const goldVertex = `
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
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vPosition = mvPos.xyz;
        gl_Position = projectionMatrix * mvPos;
      }
    `;

    const goldFragment = `
      precision highp float;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;

      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(-vPosition);

        // Key light (overhead left studio softbox)
        vec3 L1 = normalize(vec3(-0.6, 1.2, 0.9));
        // Fill light (warm ambient bounce from right)
        vec3 L2 = normalize(vec3(0.9, -0.2, 0.5));
        // Rim edge backlight
        vec3 L3 = normalize(vec3(0.1, 0.9, -1.0));

        float diff1 = max(dot(N, L1), 0.0);
        float diff2 = max(dot(N, L2), 0.0);

        vec3 H1 = normalize(L1 + V);
        float spec1 = pow(max(dot(N, H1), 0.0), 38.0);

        vec3 H3 = normalize(L3 + V);
        float spec3 = pow(max(dot(N, H3), 0.0), 22.0);

        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.2);

        // Warm, luminous metallic gold
        vec3 goldDeep   = vec3(0.38, 0.28, 0.12);
        vec3 goldBase   = vec3(0.72, 0.56, 0.28);
        vec3 goldMid    = vec3(0.92, 0.78, 0.46); // #EBC775
        vec3 goldBright = vec3(1.0, 0.96, 0.82);  // #FFF5D1

        // Milled reeding ridges along coin perimeter
        float ridges = sin(vUv.x * 320.0) * 0.045;
        diff1 += ridges;

        vec3 col = mix(goldDeep, goldMid, diff1 * 0.8 + 0.2);
        col += diff2 * goldBase * 0.35;
        col += spec1 * goldBright * 0.92;
        col += spec3 * goldMid * 0.5;
        col += fresnel * goldBright * 0.4;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    // 2. High-Luster Deep Emerald Face Shader with Embossed Chevron & Arrow
    const emeraldVertex = `
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
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vPosition = mvPos.xyz;
        gl_Position = projectionMatrix * mvPos;
      }
    `;

    const emeraldFragment = `
      precision highp float;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;

      float lineDist(vec2 p, vec2 a, vec2 b) {
        vec2 pa = p - a;
        vec2 ba = b - a;
        float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        return length(pa - ba * h);
      }

      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(-vPosition);

        vec3 L1 = normalize(vec3(-0.6, 1.1, 0.9));
        float diff1 = max(dot(N, L1), 0.0);

        vec3 H1 = normalize(L1 + V);
        float spec1 = pow(max(dot(N, H1), 0.0), 45.0);
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.5);

        // Center coordinates in UV space [-0.5, 0.5]
        vec2 p = vec2(vUv.y - 0.5, -(vUv.x - 0.5));
        float r = length(p);

        // Concentric circular gold borders
        float border1 = smoothstep(0.47, 0.46, r) * smoothstep(0.44, 0.45, r);
        float border2 = smoothstep(0.43, 0.42, r) * smoothstep(0.40, 0.41, r);

        // ── Vridhi Growth Chevron + Upward Arrow ──
        float dLeft = lineDist(p, vec2(-0.03, -0.22), vec2(-0.22, 0.08));
        float inLeftArm = smoothstep(0.048, 0.024, dLeft);

        float dRight = lineDist(p, vec2(-0.03, -0.22), vec2(0.18, 0.20));
        float inRightArm = smoothstep(0.052, 0.026, dRight);

        float dBarb1 = lineDist(p, vec2(0.24, 0.26), vec2(0.12, 0.23));
        float dBarb2 = lineDist(p, vec2(0.24, 0.26), vec2(0.21, 0.13));
        vec2 pArrow = p - vec2(0.22, 0.24);
        float inArrow = (p.y > 0.10 && p.x > 0.06 && length(pArrow) < 0.15) ?
          smoothstep(0.055, 0.02, min(dBarb1, dBarb2)) : 0.0;

        float inEmblem = clamp(inLeftArm + inRightArm + inArrow, 0.0, 1.0);

        // ── Vibrant, Deep Emerald Tone (matches reference image #021B13 to #0B4633) ──
        vec3 deepEmerald  = vec3(0.010, 0.095, 0.065); // Deepest shadows
        vec3 richEmerald  = vec3(0.025, 0.185, 0.125); // Mid emerald
        vec3 vividEmerald = vec3(0.050, 0.380, 0.250); // Vibrant jade luster

        // Rich Champagne Gold for emblem & bezel rings
        vec3 goldDark   = vec3(0.58, 0.44, 0.22);
        vec3 goldMid    = vec3(0.92, 0.78, 0.48); // #EBC77A
        vec3 goldBright = vec3(1.0, 0.96, 0.82);  // #FFF5D1

        // Radial depth & sheen across the emerald face
        vec3 col = mix(richEmerald, deepEmerald, r * 1.6);
        col = mix(col, vividEmerald, diff1 * 0.4 + fresnel * 0.3);

        // Inset gold borders
        col = mix(col, goldMid, (border1 + border2) * 0.95);

        // Raised 3D gold emblem with directional lighting & highlight
        vec3 emblemColor = mix(goldDark, goldMid, diff1 * 0.65 + 0.35);
        emblemColor += spec1 * goldBright * 0.9;
        col = mix(col, emblemColor, inEmblem * 0.98);

        // Polished crystal lacquer shine
        col += spec1 * vec3(0.95, 1.0, 0.98) * 0.35;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const goldProgram = new Program(gl, {
      vertex: goldVertex,
      fragment: goldFragment,
      cullFace: null,
    });

    const emeraldProgram = new Program(gl, {
      vertex: emeraldVertex,
      fragment: emeraldFragment,
      cullFace: null,
    });

    // ── Solid Coin Geometries ────────────────────────────────────────────

    const coinRadius = 1.55;
    const coinThickness = 0.26;

    // 1. Main Coin Body (Thick cylindrical gold rim and sidewall)
    const mainCoinGeom = new Cylinder(gl, {
      radiusTop: coinRadius,
      radiusBottom: coinRadius,
      height: coinThickness,
      radialSegments: 80,
      heightSegments: 2,
    });
    const mainCoinMesh = new Mesh(gl, { geometry: mainCoinGeom, program: goldProgram });
    mainCoinMesh.setParent(uprightAssembly);

    // 2. Beveled Gold Perimeter Rings (Toruses for rounded metallic rim)
    const bezelGeom = new Torus(gl, {
      radius: coinRadius - 0.038,
      tube: 0.042,
      radialSegments: 16,
      tubularSegments: 80,
    });
    const frontBezel = new Mesh(gl, { geometry: bezelGeom, program: goldProgram });
    frontBezel.position.y = coinThickness * 0.5;
    frontBezel.rotation.x = Math.PI / 2;
    frontBezel.setParent(uprightAssembly);

    const backBezel = new Mesh(gl, { geometry: bezelGeom, program: goldProgram });
    backBezel.position.y = -coinThickness * 0.5;
    backBezel.rotation.x = Math.PI / 2;
    backBezel.setParent(uprightAssembly);

    // 3. Front & Back Circular Emerald Face Discs
    const faceGeom = new Cylinder(gl, {
      radiusTop: coinRadius - 0.075,
      radiusBottom: coinRadius - 0.075,
      height: 0.015,
      radialSegments: 80,
    });

    const frontFace = new Mesh(gl, { geometry: faceGeom, program: emeraldProgram });
    frontFace.position.y = coinThickness * 0.5 + 0.006;
    frontFace.setParent(uprightAssembly);

    const backFace = new Mesh(gl, { geometry: faceGeom, program: emeraldProgram });
    backFace.position.y = -(coinThickness * 0.5 + 0.006);
    backFace.rotation.x = Math.PI; // Face outward on reverse side
    backFace.setParent(uprightAssembly);

    // Resize Handler
    function handleResize() {
      if (!container || !renderer) return;
      const width = container.clientWidth || 480;
      const height = container.clientHeight || 480;
      renderer.setSize(width, height);
      camera.perspective({ aspect: width / height });
    }
    window.addEventListener("resize", handleResize);
    handleResize();

    // ── Continuous, Beautiful In-Place Rotation ──────────────────────────
    // Initial three-quarter orientation (-0.35 rad = ~20 deg angled toward camera),
    // rotating continuously around vertical Y-axis so face is prominent for most of the turn.
    let lastTime = performance.now();
    let currentAngle = -0.35;

    function render(currentTime) {
      animationFrameId = requestAnimationFrame(render);
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // Steady, deliberate speed (approx 15 seconds per complete rotation)
      currentAngle += delta * 0.42;

      // In-place vertical spin
      spinGroup.rotation.y = currentAngle;

      // Subtle resting tilt (subtle 3-degree forward lean)
      coinRoot.rotation.x = 0.06;

      // Subtle breathing hover
      coinRoot.position.y = Math.sin(currentAngle * 1.4) * 0.03;

      renderer.render({ scene, camera });
    }

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      if (gl && gl.canvas && gl.canvas.parentNode === container) {
        container.removeChild(gl.canvas);
      }
    };
  }, [reducedMotion]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[460px] md:min-h-[540px] flex items-center justify-center ${className}`}
      style={{ overflow: "visible" }}
      aria-label="3D Standing Gold and Emerald Financial Coin"
    >
      {/* Grounding contact shadow underneath the standing coin */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "8%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "320px",
          height: "30px",
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(16, 44, 37, 0.32) 0%, rgba(16, 44, 37, 0.10) 45%, transparent 70%)",
          filter: "blur(12px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Graceful fallback if WebGL is unavailable or reduced motion is preferred */}
      {(!webglSupported || reducedMotion) && (
        <div
          style={{
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, #287657 0%, #163D32 55%, #102C25 100%)",
            border: "12px solid #B49A63",
            boxShadow: "0 24px 54px rgba(16, 44, 37, 0.28), inset 0 2px 10px rgba(216, 196, 150, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "220px",
              height: "220px",
              borderRadius: "50%",
              border: "2px solid rgba(180, 154, 99, 0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#B49A63",
              fontSize: "44px",
              fontWeight: 800,
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            V
          </div>
        </div>
      )}
    </div>
  );
}
