"use client";

import { useEffect, useRef, useState } from "react";
import { Renderer, Camera, Transform, Box, Cylinder, Program, Mesh } from "ogl";

/**
 * FinancialGrowthChart3D
 * 
 * Concept & Behavior:
 * - One compact, sculpted 3D financial growth chart anchored on a warm travertine/ivory plinth.
 * - 5 genuine 3D bars in deep forest-green/emerald lacquer arranged left-to-right (shortest to tallest).
 * - Each bar is strictly anchored to the baseline and grows vertically upward sequentially from shortest to tallest.
 * - An elegant brushed champagne-gold metallic 3D arrow travels along the rising trajectory simultaneously with the bars.
 * - Soft contact shadows, beveled bar caps in brushed gold, and subtle architectural depth.
 * - Fixed position in the hero right container (no whole-scene spinning/orbiting/floating).
 * - Smooth deterministic timeline:
 *     1. Pause at baseline (~350ms)
 *     2. Sequential upward bar rise + simultaneous rising gold arrow traversal (~2200ms)
 *     3. Proud hold of completed chart (~2200ms)
 *     4. Elegant soft contraction/reset to baseline (~600ms)
 *     5. Seamless loop.
 * - Respects prefers-reduced-motion by rendering the completed chart statically.
 */
export default function FinancialGrowthChart3D({ className = "" }) {
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
    if (!container) return;

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
      console.warn("WebGL unsupported for FinancialGrowthChart3D:", e);
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

    // Natural 3-quarter studio camera framing the chart with depth
    const camera = new Camera(gl, { fov: 32, near: 0.1, far: 100 });
    camera.position.set(0.65, 1.45, 6.2);
    camera.lookAt([0.1, 0.45, 0]);

    // Root chart group (fixed orientation, angled slightly to display 3D depth and thickness)
    const chartRoot = new Transform();
    chartRoot.setParent(scene);
    chartRoot.position.set(0, -0.28, 0);
    chartRoot.rotation.y = -0.28; // Subtle 16° three-quarter yaw for clear 3D bar extrusion
    chartRoot.rotation.x = 0.08;  // Gentle 4.5° tilt forward

    // ── Architectural Shaders ────────────────────────────────────────────

    const baseVertex = `
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

    // 1. Warm Travertine / Plinth Stone Shader
    const stoneFragment = `
      precision highp float;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(-vPosition);
        vec3 L1 = normalize(vec3(-0.7, 1.6, 1.2));  // Key softbox
        vec3 L2 = normalize(vec3(0.9, -0.3, 0.6));  // Warm fill

        float diff1 = max(dot(N, L1), 0.0);
        float diff2 = max(dot(N, L2), 0.0);
        vec3 H1 = normalize(L1 + V);
        float spec = pow(max(dot(N, H1), 0.0), 24.0);
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.2);

        vec3 cDark  = vec3(0.86, 0.84, 0.79);
        vec3 cMid   = vec3(0.96, 0.95, 0.91);
        vec3 cHigh  = vec3(1.0, 0.995, 0.97);

        float grain = fract(sin(dot(vUv * 80.0, vec2(12.9898, 78.233))) * 43758.5453) * 0.02;
        vec3 color = mix(cDark, cMid, diff1 * 0.75 + 0.25 + grain);
        color += diff2 * vec3(0.92, 0.88, 0.80) * 0.22;
        color += spec * cHigh * 0.25;
        color += fresnel * cHigh * 0.12;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // 2. Rich Deep Forest Green / Emerald Architectural Bar Finish
    const emeraldFragment = `
      precision highp float;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(-vPosition);

        vec3 L1 = normalize(vec3(-0.6, 1.5, 1.0));
        vec3 L2 = normalize(vec3(0.8, -0.2, 0.6));
        vec3 L3 = normalize(vec3(0.0, 1.0, -1.0));

        float diff1 = max(dot(N, L1), 0.0);
        float diff2 = max(dot(N, L2), 0.0);
        vec3 H1 = normalize(L1 + V);
        float spec = pow(max(dot(N, H1), 0.0), 38.0);
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.6);

        // Vridhi deep forest-green to emerald (#102C25 to #1E5E45)
        vec3 cDark  = vec3(0.04, 0.13, 0.10);
        vec3 cMid   = vec3(0.086, 0.25, 0.19); // #163D32
        vec3 cHigh  = vec3(0.18, 0.49, 0.36);  // #287657

        vec3 color = mix(cDark, cMid, diff1 * 0.82 + 0.18);
        color += diff2 * vec3(0.05, 0.18, 0.13) * 0.28;
        color += spec * vec3(0.75, 0.98, 0.88) * 0.55;
        color += fresnel * cHigh * 0.42;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // 3. Brushed Champagne Gold / Brass Metallic Shader (for Arrow & Accents)
    const goldFragment = `
      precision highp float;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(-vPosition);

        vec3 L1 = normalize(vec3(-0.6, 1.4, 0.9));
        vec3 L2 = normalize(vec3(0.9, -0.2, 0.5));
        vec3 L3 = normalize(vec3(0.0, 0.8, -1.0));

        float diff1 = max(dot(N, L1), 0.0);
        float diff2 = max(dot(N, L2), 0.0);
        vec3 H1 = normalize(L1 + V);
        vec3 H2 = normalize(L3 + V);

        float spec1 = pow(max(dot(N, H1), 0.0), 48.0);
        float spec2 = pow(max(dot(N, H2), 0.0), 32.0);
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.3);

        vec3 goldDark   = vec3(0.50, 0.39, 0.20);
        vec3 goldMid    = vec3(0.78, 0.65, 0.40); // #C2A063
        vec3 goldBright = vec3(1.0, 0.95, 0.80);  // #FFF1CC

        vec3 color = mix(goldDark, goldMid, diff1 * 0.75 + 0.25);
        color += diff2 * vec3(0.58, 0.46, 0.26) * 0.35;
        color += spec1 * goldBright * 1.25;
        color += spec2 * goldBright * 0.45;
        color += fresnel * goldBright * 0.60;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const stoneProg   = new Program(gl, { vertex: baseVertex, fragment: stoneFragment, cullFace: null });
    const emeraldProg = new Program(gl, { vertex: baseVertex, fragment: emeraldFragment, cullFace: null });
    const goldProg    = new Program(gl, { vertex: baseVertex, fragment: goldFragment, cullFace: null });

    // ── Architectural Plinth & Stage ─────────────────────────────────────
    // Grounding beveled stage
    const plinthGeom = new Box(gl, { width: 3.8, height: 0.14, depth: 2.2 });
    const plinthMesh = new Mesh(gl, { geometry: plinthGeom, program: stoneProg });
    plinthMesh.position.set(0, -0.07, 0);
    plinthMesh.setParent(chartRoot);

    // Inset champagne brass accent trim line
    const trimGeom = new Box(gl, { width: 3.72, height: 0.02, depth: 2.12 });
    const trimMesh = new Mesh(gl, { geometry: trimGeom, program: goldProg });
    trimMesh.position.set(0, 0.01, 0);
    trimMesh.setParent(chartRoot);

    // Subtle baseline guide line
    const baselineGeom = new Box(gl, { width: 3.2, height: 0.02, depth: 0.04 });
    const baselineMesh = new Mesh(gl, { geometry: baselineGeom, program: goldProg });
    baselineMesh.position.set(0, 0.025, 0.16);
    baselineMesh.setParent(chartRoot);

    // ── 5 Vertical Growing 3D Bars ───────────────────────────────────────
    // Progression from Left (MSME launch / shortest) to Right (Scaled enterprise / tallest)
    const BARS_CONFIG = [
      { id: 0, x: -1.24, maxH: 0.58, w: 0.40, d: 0.40 }, // Bar 1: Baseline inception
      { id: 1, x: -0.62, maxH: 0.98, w: 0.40, d: 0.40 }, // Bar 2: Early traction
      { id: 2, x:  0.00, maxH: 1.42, w: 0.40, d: 0.40 }, // Bar 3: Working capital acceleration
      { id: 3, x:  0.62, maxH: 1.90, w: 0.40, d: 0.40 }, // Bar 4: Institutional credit confidence
      { id: 4, x:  1.24, maxH: 2.44, w: 0.40, d: 0.40 }, // Bar 5: Scaled market leader
    ];

    const BASE_Y = 0.02; // Top surface of the plinth

    // Create bar nodes with baseline anchor
    // For each bar: A root transform anchored at [x, BASE_Y, 0].
    // Child meshes have vertical position offset by half the current height, so the bottom stays locked to the baseline.
    const barNodes = BARS_CONFIG.map((cfg) => {
      const anchor = new Transform();
      anchor.position.set(cfg.x, BASE_Y, 0);
      anchor.setParent(chartRoot);

      // Unit box geometry (width: w, depth: d, height: 1.0)
      // When anchor scale.y changes, the bar scales vertically from its anchor.
      const bodyGeom = new Box(gl, { width: cfg.w, height: 1.0, depth: cfg.d });
      const bodyMesh = new Mesh(gl, { geometry: bodyGeom, program: emeraldProg });
      bodyMesh.position.set(0, 0.5, 0); // Center at 0.5 so [0,0,0] in anchor is bottom of bar
      bodyMesh.setParent(anchor);

      // Polished champagne-gold top cap bevel
      const capGeom = new Box(gl, { width: cfg.w + 0.02, height: 0.035, depth: cfg.d + 0.02 });
      const capMesh = new Mesh(gl, { geometry: capGeom, program: goldProg });
      capMesh.position.set(0, 1.0, 0); // Positioned exactly at top of unit bar
      capMesh.setParent(anchor);

      // Initialize at near-zero height
      anchor.scale.set(1.0, 0.001, 1.0);

      return {
        anchor,
        bodyMesh,
        capMesh,
        maxH: cfg.maxH,
        x: cfg.x,
      };
    });

    // ── Genuine 3D Champagne-Gold Metallic Arrow ─────────────────────────
    // Composed of:
    // 1. Sleek metallic shaft (cylinder or beveled prism)
    // 2. Sculpted arrowhead (tapered cone / triangular prism)
    // The arrow is placed in an `arrowGroup` whose [x, y, z] is updated along the trajectory,
    // and rotated along the flight pitch angle.
    const arrowGroup = new Transform();
    arrowGroup.setParent(chartRoot);

    // Arrow Shaft
    const shaftGeom = new Cylinder(gl, { radiusTop: 0.042, radiusBottom: 0.042, height: 0.54, radialSegments: 18 });
    const shaftMesh = new Mesh(gl, { geometry: shaftGeom, program: goldProg });
    shaftMesh.position.set(0, -0.16, 0);
    shaftMesh.setParent(arrowGroup);

    // Arrow Head (Crisp metallic cone)
    const headGeom = new Cylinder(gl, { radiusTop: 0.005, radiusBottom: 0.11, height: 0.32, radialSegments: 18 });
    const headMesh = new Mesh(gl, { geometry: headGeom, program: goldProg });
    headMesh.position.set(0, 0.22, 0);
    headMesh.setParent(arrowGroup);

    // Subtle arrow collar ring
    const collarGeom = new Cylinder(gl, { radiusTop: 0.055, radiusBottom: 0.055, height: 0.03, radialSegments: 18 });
    const collarMesh = new Mesh(gl, { geometry: collarGeom, program: goldProg });
    collarMesh.position.set(0, 0.06, 0);
    collarMesh.setParent(arrowGroup);

    // Trajectory coordinates (from just before Bar 1 baseline to above Bar 5 summit)
    // Forward in Z by 0.28 so the arrow clearly floats in front of the bars as a prominent 3D hero piece
    const TRAJECTORY_START = { x: -1.58, y: 0.28, z: 0.28 };
    const TRAJECTORY_END   = { x:  1.42, y: 2.76, z: 0.28 };

    // Flight angle: pointing up and to the right
    const dx = TRAJECTORY_END.x - TRAJECTORY_START.x;
    const dy = TRAJECTORY_END.y - TRAJECTORY_START.y;
    // Cylinder by default stands vertically along Y.
    // To tilt it forward/right along trajectory slope:
    const slopeAngle = Math.atan2(dy, dx); // radians from horizontal
    // Rotation on Z axis: angle from vertical Y = (slopeAngle - pi/2)
    const arrowZRot = -(Math.PI / 2 - slopeAngle);
    arrowGroup.rotation.z = arrowZRot;
    arrowGroup.rotation.y = -0.12; // Slight face-toward-camera angle

    // Resize Handler
    function handleResize() {
      if (!container || !renderer) return;
      const width = container.clientWidth || 520;
      const height = container.clientHeight || 520;
      renderer.setSize(width, height);
      camera.perspective({ aspect: width / height });
    }
    window.addEventListener("resize", handleResize);
    handleResize();

    // ── Animation Timeline & Math ────────────────────────────────────────

    // Smooth cubic ease out
    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    // Smooth smoothstep
    function smoothstep(min, max, val) {
      const x = Math.max(0, Math.min(1, (val - min) / (max - min)));
      return x * x * (3 - 2 * x);
    }

    // Static display when reduced motion is preferred
    if (reducedMotion) {
      barNodes.forEach((node) => {
        node.anchor.scale.set(1.0, node.maxH, 1.0);
      });
      arrowGroup.position.set(TRAJECTORY_END.x, TRAJECTORY_END.y, TRAJECTORY_END.z);
      renderer.render({ scene, camera });
      return;
    }

    // Full Timeline Cycle:
    // 0ms   - 350ms   : Initial baseline pause
    // 350ms - 2550ms  : Sequential bar growth (2200ms duration) + simultaneous synchronized arrow rise
    // 2550ms - 4750ms : Proud hold of full chart (2200ms hold)
    // 4750ms - 5350ms : Soft contraction/reset to baseline (600ms)
    // Total cycle: 5350ms
    const CYCLE_DURATION = 5.35;
    const START_DELAY = 0.35;
    const GROWTH_DURATION = 2.20;
    const HOLD_DURATION = 2.20;
    const RESET_DURATION = 0.60;

    let startTime = performance.now();

    function render(currentTime) {
      animationFrameId = requestAnimationFrame(render);
      const elapsed = ((currentTime - startTime) / 1000) % CYCLE_DURATION;

      // PHASE 1: Initial baseline resting
      if (elapsed < START_DELAY) {
        barNodes.forEach((node) => {
          node.anchor.scale.set(1.0, 0.001, 1.0);
        });
        arrowGroup.position.set(TRAJECTORY_START.x, TRAJECTORY_START.y, TRAJECTORY_START.z);
      }
      // PHASE 2: Sequential Bar Rise + Synchronized Arrow Movement
      else if (elapsed < START_DELAY + GROWTH_DURATION) {
        const growthT = (elapsed - START_DELAY) / GROWTH_DURATION; // 0.0 -> 1.0

        // 1. Synchronized Arrow Progress
        // Travels continuously along the diagonal vector matching the growth of the chart
        const arrowProgress = easeOutCubic(growthT);
        const curArrowX = TRAJECTORY_START.x + (TRAJECTORY_END.x - TRAJECTORY_START.x) * arrowProgress;
        const curArrowY = TRAJECTORY_START.y + (TRAJECTORY_END.y - TRAJECTORY_START.y) * arrowProgress;
        const curArrowZ = TRAJECTORY_START.z + (TRAJECTORY_END.z - TRAJECTORY_START.z) * arrowProgress;
        arrowGroup.position.set(curArrowX, curArrowY, curArrowZ);

        // 2. Staggered Sequential Bar Growth
        // 5 bars staggered across the growth phase
        const numBars = barNodes.length;
        barNodes.forEach((node, i) => {
          // Each bar begins at staggered start window
          // Stagger starts from i=0 (shortest) to i=4 (tallest)
          const barStart = (i / numBars) * 0.55; // 0.0, 0.11, 0.22, 0.33, 0.44
          const barDuration = 0.45;              // Each bar rises over 45% of total growth duration
          const barT = smoothstep(barStart, barStart + barDuration, growthT);

          const curH = Math.max(0.001, node.maxH * easeOutCubic(barT));
          node.anchor.scale.set(1.0, curH, 1.0);
        });
      }
      // PHASE 3: Proud Hold of Completed Chart
      else if (elapsed < START_DELAY + GROWTH_DURATION + HOLD_DURATION) {
        barNodes.forEach((node) => {
          node.anchor.scale.set(1.0, node.maxH, 1.0);
        });
        arrowGroup.position.set(TRAJECTORY_END.x, TRAJECTORY_END.y, TRAJECTORY_END.z);
      }
      // PHASE 4: Soft Reset to Baseline
      else {
        const resetT = (elapsed - (START_DELAY + GROWTH_DURATION + HOLD_DURATION)) / RESET_DURATION;
        const easeReset = 1.0 - smoothstep(0.0, 1.0, resetT);

        barNodes.forEach((node) => {
          const curH = Math.max(0.001, node.maxH * easeReset);
          node.anchor.scale.set(1.0, curH, 1.0);
        });

        const curArrowX = TRAJECTORY_START.x + (TRAJECTORY_END.x - TRAJECTORY_START.x) * easeReset;
        const curArrowY = TRAJECTORY_START.y + (TRAJECTORY_END.y - TRAJECTORY_START.y) * easeReset;
        const curArrowZ = TRAJECTORY_START.z + (TRAJECTORY_END.z - TRAJECTORY_START.z) * easeReset;
        arrowGroup.position.set(curArrowX, curArrowY, curArrowZ);
      }

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
      className={`relative w-full h-full min-h-[480px] md:min-h-[560px] flex items-center justify-center ${className}`}
      style={{ overflow: "visible" }}
      aria-label="3D Animated Financial Growth Chart with Rising Emerald Bars and Metallic Gold Arrow"
    >
      {/* Grounding contact shadow underneath the architectural plinth */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "4%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "440px",
          height: "38px",
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(16, 44, 37, 0.28) 0%, rgba(16, 44, 37, 0.08) 50%, transparent 75%)",
          filter: "blur(14px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Graceful fallback if WebGL is unavailable or reduced motion is preferred */}
      {(!webglSupported || reducedMotion) && (
        <div
          style={{
            width: "340px",
            height: "340px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, #FFFFFF 0%, #F5F2E8 100%)",
            border: "1px solid rgba(180, 154, 99, 0.35)",
            boxShadow: "0 24px 54px rgba(16, 44, 37, 0.12)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "14px",
            padding: "24px",
          }}
        >
          <div
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "16px",
              background: "rgba(22, 61, 50, 0.08)",
              border: "1px solid rgba(22, 61, 50, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#163D32",
              fontSize: "30px",
            }}
          >
            📈
          </div>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#163D32", fontFamily: "'Space Grotesk', sans-serif" }}>
            MSME Financial Growth Intelligence
          </span>
        </div>
      )}
    </div>
  );
}
