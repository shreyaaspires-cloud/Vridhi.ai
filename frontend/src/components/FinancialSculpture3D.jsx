"use client";

import { useEffect, useRef, useState } from "react";
import { Renderer, Camera, Transform, Cylinder, Torus, Sphere, Program, Mesh, Color } from "ogl";

/**
 * FinancialSculpture3D
 * Distinctive, physical-feeling financial growth sculpture:
 * - Substantial emerald-tinted translucent glass/polished resin core
 * - Dual precision satin brass gimbal rings rotating on deliberate axes
 * - Embossed upward trajectory arc with soft warm reflections
 * - Grounding pedestal shadow for physical weight
 * - Smooth, deterministic, quiet rotation respecting prefers-reduced-motion
 */
export default function FinancialSculpture3D({ className = "" }) {
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
      console.warn("WebGL not supported for FinancialSculpture3D:", e);
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
    const camera = new Camera(gl, { fov: 38, near: 0.1, far: 100 });
    camera.position.set(0, 0.4, 5.0);

    // Master sculpture group
    const sculptureGroup = new Transform();
    sculptureGroup.setParent(scene);
    sculptureGroup.position.set(0, 0.05, 0);

    // ── Shaders ──────────────────────────────────────────────────────────

    // 1. Translucent Emerald Core Shader (Fresnel, internal scattering, subtle facets)
    const emeraldVertex = `
      attribute vec3 position;
      attribute vec3 normal;
      attribute vec2 uv;
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform mat3 normalMatrix;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec3 vEye;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vPosition = mvPos.xyz;
        vEye = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `;

    const emeraldFragment = `
      precision highp float;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec3 vEye;
      varying vec2 vUv;
      uniform float uTime;

      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vEye);

        // Key light (warm golden top-left)
        vec3 L1 = normalize(vec3(-0.6, 1.2, 0.9));
        // Fill light (cool soft sage bottom-right)
        vec3 L2 = normalize(vec3(0.9, -0.5, -0.6));
        // Rim light (sharp back edge)
        vec3 L3 = normalize(vec3(0.0, 0.8, -1.0));

        float diff1 = max(dot(N, L1), 0.0);
        float diff2 = max(dot(N, L2), 0.0);
        
        // Specular highlights
        vec3 H1 = normalize(L1 + V);
        float spec1 = pow(max(dot(N, H1), 0.0), 38.0);
        
        vec3 H3 = normalize(L3 + V);
        float spec3 = pow(max(dot(N, H3), 0.0), 24.0);

        // Deep rich emerald palette
        vec3 baseEmerald = vec3(0.063, 0.239, 0.196);   // #103D32
        vec3 brightEmerald = vec3(0.157, 0.463, 0.341); // #287657
        vec3 deepJade = vec3(0.039, 0.129, 0.106);      // #0A211B
        vec3 warmGlint = vec3(0.85, 0.76, 0.55);        // Muted brass glint

        // Fresnel (translucent resin/glass edge glow)
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.8);

        // Subtle internal growth trajectory gradient along Y and angular
        float internalGlow = smoothstep(-0.8, 0.8, vPosition.y) * 0.4;

        vec3 col = mix(deepJade, baseEmerald, diff1 * 0.7 + 0.3);
        col = mix(col, brightEmerald, fresnel * 0.65 + internalGlow);
        col += spec1 * warmGlint * 0.85;
        col += spec3 * vec3(0.6, 0.9, 0.7) * 0.45;
        col += diff2 * vec3(0.1, 0.25, 0.2) * 0.3;

        gl_FragColor = vec4(col, 0.94);
      }
    `;

    // 2. Satin Brass Gimbal Shader
    const brassVertex = `
      attribute vec3 position;
      attribute vec3 normal;
      uniform mat4 modelViewMatrix;
      uniform mat4 projectionMatrix;
      uniform mat3 normalMatrix;
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vPosition = mvPos.xyz;
        gl_Position = projectionMatrix * mvPos;
      }
    `;

    const brassFragment = `
      precision highp float;
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(-vPosition);
        vec3 L1 = normalize(vec3(-0.7, 1.0, 0.8));
        vec3 L2 = normalize(vec3(0.8, -0.6, 0.4));

        float diff1 = max(dot(N, L1), 0.0);
        vec3 H1 = normalize(L1 + V);
        float spec1 = pow(max(dot(N, H1), 0.0), 28.0);
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.2);

        // Satin brass/champagne
        vec3 brassDark = vec3(0.38, 0.30, 0.16);
        vec3 brassMid = vec3(0.706, 0.604, 0.388);   // #B49A63
        vec3 brassBright = vec3(0.95, 0.88, 0.68);

        vec3 col = mix(brassDark, brassMid, diff1);
        col += spec1 * brassBright * 0.75;
        col += fresnel * brassBright * 0.35;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const emeraldProgram = new Program(gl, {
      vertex: emeraldVertex,
      fragment: emeraldFragment,
      transparent: true,
      cullFace: null,
      uniforms: { uTime: { value: 0 } },
    });

    const brassProgram = new Program(gl, {
      vertex: brassVertex,
      fragment: brassFragment,
      cullFace: null,
    });

    // ── Geometries ────────────────────────────────────────────────────────
    // 1. Central Emerald Prism (faceted cylinder with bevelled edge)
    const prismGeom = new Cylinder(gl, {
      radiusTop: 0.92,
      radiusBottom: 0.92,
      height: 0.42,
      radialSegments: 36,
      heightSegments: 2,
    });
    const prismMesh = new Mesh(gl, { geometry: prismGeom, program: emeraldProgram });
    prismMesh.setParent(sculptureGroup);

    // Inner core gem sphere for deep light refractions
    const coreSphereGeom = new Sphere(gl, { radius: 0.52, widthSegments: 24, heightSegments: 16 });
    const coreMesh = new Mesh(gl, { geometry: coreSphereGeom, program: emeraldProgram });
    coreMesh.scale.set(1.0, 0.6, 1.0);
    coreMesh.setParent(sculptureGroup);

    // 2. Primary Outer Gimbal Ring (Precision satin brass)
    const outerRingGeom = new Torus(gl, {
      radius: 1.48,
      tube: 0.038,
      radialSegments: 24,
      tubularSegments: 64,
    });
    const outerRingGroup = new Transform();
    outerRingGroup.setParent(sculptureGroup);
    const outerRingMesh = new Mesh(gl, { geometry: outerRingGeom, program: brassProgram });
    outerRingMesh.setParent(outerRingGroup);

    // 3. Secondary Inner Gimbal Ring (Tilted at complementary angle)
    const innerRingGeom = new Torus(gl, {
      radius: 1.24,
      tube: 0.028,
      radialSegments: 20,
      tubularSegments: 56,
    });
    const innerRingGroup = new Transform();
    innerRingGroup.setParent(sculptureGroup);
    const innerRingMesh = new Mesh(gl, { geometry: innerRingGeom, program: brassProgram });
    innerRingMesh.setParent(innerRingGroup);

    // 4. Upward Trajectory Arc / Growth Meridian Accent
    const arcGeom = new Torus(gl, {
      radius: 0.96,
      tube: 0.024,
      radialSegments: 16,
      tubularSegments: 48,
    });
    const arcMesh = new Mesh(gl, { geometry: arcGeom, program: brassProgram });
    arcMesh.scale.set(1.02, 1.02, 1.02);
    arcMesh.rotation.x = Math.PI / 4;
    arcMesh.setParent(sculptureGroup);

    // Initial composition tilts
    sculptureGroup.rotation.x = 0.28;
    sculptureGroup.rotation.z = -0.12;

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

    // Deterministic, elegant animation loop
    let lastTime = performance.now();
    let angle = 0;

    function render(currentTime) {
      animationFrameId = requestAnimationFrame(render);
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      angle += delta * 0.42; // Quiet, deliberate pace

      // Smooth primary rotation around vertical axis
      prismMesh.rotation.y = angle * 0.85;
      coreMesh.rotation.y = -angle * 0.5;

      // Outer gimbal rotates slowly on primary axis
      outerRingGroup.rotation.y = angle * 0.45;
      outerRingGroup.rotation.x = Math.sin(angle * 0.3) * 0.18 + 0.32;

      // Inner gimbal counter-rotates on inclined axis
      innerRingGroup.rotation.x = Math.cos(angle * 0.35) * 0.22 - 0.25;
      innerRingGroup.rotation.z = angle * -0.55;

      // Subtle upward floating breath
      sculptureGroup.position.y = Math.sin(angle * 0.8) * 0.06 + 0.02;

      // Pass time to emerald shader for light motion
      emeraldProgram.uniforms.uTime.value = angle;

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
      className={`relative w-full h-full min-h-[420px] md:min-h-[500px] flex items-center justify-center ${className}`}
      style={{ overflow: "visible" }}
      aria-label="3D Financial Growth Sculpture"
    >
      {/* Grounding contact shadow under sculpture */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "12%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "280px",
          height: "28px",
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(16,61,50,0.28) 0%, rgba(16,61,50,0.08) 45%, transparent 70%)",
          filter: "blur(12px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Fallback for WebGL unsupported or reduced motion */}
      {(!webglSupported || reducedMotion) && (
        <div
          style={{
            width: "320px",
            height: "320px",
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, #287657 0%, #163D32 50%, #102C25 100%)",
            boxShadow: "0 24px 60px rgba(16,61,50,0.35), inset 0 2px 6px rgba(180,154,99,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid #B49A63",
          }}
        >
          <div
            style={{
              width: "220px",
              height: "220px",
              borderRadius: "50%",
              border: "2px dashed rgba(223,232,222,0.4)",
            }}
          />
        </div>
      )}
    </div>
  );
}

