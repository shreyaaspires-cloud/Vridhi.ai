"use client";

import { useEffect, useRef, useState } from "react";
import { Renderer, Camera, Transform, Cylinder, Program, Mesh } from "ogl";

/**
 * Single large 3D coin rotating in place around its own Y-axis.
 * No orbit. No travel. No multiple coins.
 * Premium metallic finish with cinematic purple/indigo lighting.
 */
export default function HeroCoin3D({ className = "" }) {
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
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      });
      gl = renderer.gl;
      gl.clearColor(0, 0, 0, 0);
    } catch (e) {
      setWebglSupported(false);
      return;
    }

    container.appendChild(gl.canvas);
    Object.assign(gl.canvas.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
    });

    const scene = new Transform();
    const camera = new Camera(gl, { fov: 38, near: 0.1, far: 100 });
    camera.position.set(0, 0, 7);
    camera.lookAt([0, 0, 0]);

    /* ── GLSL Shaders: Premium Metallic Coin with Purple/Indigo Fintech Lighting ── */
    const vertexShader = /* glsl */ `
      attribute vec3 position;
      attribute vec3 normal;
      attribute vec2 uv;

      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform mat3 normalMatrix;

      varying vec3 vNormal;
      varying vec3 vViewPos;
      varying vec2 vUv;

      void main() {
        vUv = uv;
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewPos = -mvPos.xyz;
        gl_Position = projectionMatrix * mvPos;
      }
    `;

    const fragmentShader = /* glsl */ `
      precision highp float;

      varying vec3 vNormal;
      varying vec3 vViewPos;
      varying vec2 vUv;

      uniform float uTime;

      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewPos);

        // ── Lights ──────────────────────────────────────────────────────────
        // Primary: warm silver-white key light from upper-right
        vec3 L1 = normalize(vec3(1.2, 1.6, 2.0));
        float d1 = max(dot(N, L1), 0.0);

        // Secondary: cool lavender fill from left
        vec3 L2 = normalize(vec3(-1.4, 0.4, 0.8));
        float d2 = max(dot(N, L2), 0.0);

        // Rim: deep purple backlight
        vec3 L3 = normalize(vec3(0.0, -1.0, -1.5));
        float d3 = max(dot(N, L3), 0.0);

        // Specular highlight
        vec3 H1 = normalize(L1 + V);
        float spec = pow(max(dot(N, H1), 0.0), 55.0);

        // Fresnel rim glow (lavender/violet)
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.8);

        // ── Material ─────────────────────────────────────────────────────────
        // Distinguish face vs edge by z-component of normal
        bool isFace = abs(N.z) > 0.35;

        vec3 faceBase   = vec3(0.82, 0.80, 0.90);   // platinum/silver face
        vec3 edgeBase   = vec3(0.55, 0.52, 0.64);   // darker edge
        vec3 lavender   = vec3(0.62, 0.50, 0.95);   // lavender highlight
        vec3 violet     = vec3(0.48, 0.25, 0.88);   // deep violet rim
        vec3 specColor  = vec3(0.98, 0.98, 1.00);   // near-white specular
        vec3 rimColor   = vec3(0.55, 0.35, 1.00);   // violet rim glow

        vec3 base = isFace ? faceBase : edgeBase;

        // Face bevel rings
        float dist = length(vUv - 0.5) * 2.0;
        float outerRing  = smoothstep(0.85, 0.90, dist) - smoothstep(0.90, 0.96, dist);
        float middleRing = smoothstep(0.68, 0.72, dist) - smoothstep(0.72, 0.76, dist);
        float bevel = (outerRing * 0.30 + middleRing * 0.20) * float(isFace);

        // Vridhi.ai V emblem emboss
        float emboss = 0.0;
        if (isFace) {
          vec2 p = (vUv - 0.5) * 2.0;
          float arm1 = smoothstep(0.07, 0.02, abs(p.x * 1.3 + p.y)) * step(p.y, 0.35) * step(-0.40, p.y);
          float arm2 = smoothstep(0.07, 0.02, abs(-p.x * 1.3 + p.y)) * step(p.y, 0.35) * step(-0.40, p.y);
          emboss = max(arm1, arm2) * 0.55;
        }

        // Combine
        vec3 color = base * (0.22 + d1 * 0.72 + d2 * 0.28);
        color += lavender * d2 * 0.18;
        color += specColor * spec * 1.6;
        color += rimColor  * fresnel * 0.80;
        color += vec3(0.88, 0.85, 1.00) * bevel;
        color += vec3(0.95, 0.93, 1.00) * emboss;

        // Subtle pulse from the purple rim light over time
        float pulse = 0.5 + 0.5 * sin(uTime * 1.8);
        color += violet * d3 * 0.12 * pulse;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    /* ── Coin Geometry: thick cylinder with many radial segments for smooth edge ── */
    const coinGeom = new Cylinder(gl, {
      radiusTop: 1.55,
      radiusBottom: 1.55,
      height: 0.22,
      radialSegments: 72,
      heightSegments: 1,
    });

    const coinProgram = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: { uTime: { value: 0 } },
      cullFace: null,
    });

    const coin = new Mesh(gl, { geometry: coinGeom, program: coinProgram });
    // Slight initial tilt so the coin face is visible immediately (not edge-on)
    coin.rotation.x = 0.18;
    coin.position.set(0, 0, 0);
    coin.setParent(scene);

    /* ── Resize ─────────────────────────────────────────────────────────────── */
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.perspective({ aspect: w / h });
    };
    window.addEventListener("resize", onResize);
    onResize();

    /* ── Animation loop: coin rotates in place only ──────────────────────────── */
    const startTime = performance.now();
    const animate = (t) => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = (t - startTime) * 0.001;

      // Continuous Y-axis rotation (in-place, constant speed)
      coin.rotation.y = elapsed * 0.65;
      // Very slight x-axis oscillation adds perceived depth
      coin.rotation.x = 0.18 + Math.sin(elapsed * 0.4) * 0.06;

      coinProgram.uniforms.uTime.value = elapsed;
      renderer.render({ scene, camera });
    };
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", onResize);
      if (gl.canvas.parentElement) gl.canvas.parentElement.removeChild(gl.canvas);
      try { gl.getExtension("WEBGL_lose_context")?.loseContext(); } catch (_) {}
    };
  }, [reducedMotion]);

  /* ── Reduced-motion / no-WebGL fallback ─────────────────────────────────── */
  if (!webglSupported || reducedMotion) {
    return (
      <div className={`flex items-center justify-center ${className}`} aria-hidden="true">
        <div
          className="w-52 h-52 rounded-full"
          style={{
            background: "radial-gradient(circle at 38% 32%, #d4cfff 0%, #8b7cf8 35%, #4c35a8 70%, #1e1040 100%)",
            boxShadow: "0 0 60px rgba(139,124,248,0.5), 0 20px 60px rgba(0,0,0,0.7)",
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden ${className}`}
      aria-hidden="true"
    />
  );
}

