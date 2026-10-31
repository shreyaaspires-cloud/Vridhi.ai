"use client";

import { useEffect, useRef, useState } from "react";
import { Renderer, Camera, Transform, Box, Cylinder, Sphere, Program, Mesh } from "ogl";

/**
 * BankBusinessSculpture3D — Ultra-Refined Miniature Architectural Model
 * 
 * Composition:
 * 1. Monolithic Sculpted Podium:
 *    - Dual-tiered beveled warm travertine/ivory plinth with brushed brass chamfers.
 * 
 * 2. Institutional Classical-Modern Bank Pavilion:
 *    - Quad-stepped stylobate base.
 *    - Portico with 6 fluted columns featuring Corinthian/Doric styled tiered capitals & bases.
 *    - Triangular pediment with recessed tympanum, relief medallion, and stepped dentil cornices.
 *    - Deep recessed facade with warm-lit multi-pane architectural windows and dark emerald mullions.
 *    - Arched grand entrance with brass-framed glazed portal and canopy.
 * 
 * 3. Modern MSME Business Tower:
 *    - Dynamic stepped cantilevered volumes expressing enterprise agility.
 *    - Multi-layered horizontal champagne-gold brise-soleil (louvers) and deep emerald spandrels.
 *    - Recessed smoked glass curtain wall panels with warm interior luminosity.
 *    - Architectural rooftop pergola / terrace structure with miniature geometric rooftop garden.
 * 
 * 4. Harmonic Growth & Convergence Element:
 *    - Sleek ascending helical ribbon in brushed champagne brass bridging the two buildings,
 *      symbolizing seamless credit flow from institution to enterprise.
 * 
 * 5. Lighting & Atmosphere:
 *    - Multi-source studio key, warm fill, crisp specular highlight, and contact shadow.
 *    - Procedural shaders for fine limestone grain, brushed anisotropic brass, and reflective smoked glass.
 */
export default function BankBusinessSculpture3D({ className = "" }) {
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
      console.warn("WebGL unsupported for BankBusinessSculpture3D:", e);
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
    // Perspective camera with natural 30° focal length for architectural model presentation
    const camera = new Camera(gl, { fov: 30, near: 0.1, far: 100 });
    camera.position.set(0, 1.6, 6.8);
    camera.lookAt([0, 0.35, 0]);

    // Turntable Root Group
    const turntable = new Transform();
    turntable.setParent(scene);
    turntable.position.set(0, -0.22, 0);

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

    // 1. Tactile Warm Ivory Limestone / Travertine Shader
    const stoneFragment = `
      precision highp float;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(-vPosition);

        // Three-point architectural lighting setup
        vec3 L1 = normalize(vec3(-0.7, 1.6, 1.1));  // Key softbox
        vec3 L2 = normalize(vec3(1.0, -0.2, 0.7));   // Warm floor fill
        vec3 L3 = normalize(vec3(0.0, 1.2, -1.2));   // Back rim accent

        float diff1 = max(dot(N, L1), 0.0);
        float diff2 = max(dot(N, L2), 0.0);
        float rim   = max(dot(N, L3), 0.0);

        vec3 H1 = normalize(L1 + V);
        float spec = pow(max(dot(N, H1), 0.0), 28.0);
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.2);

        // Warm travertine tones
        vec3 cDark  = vec3(0.85, 0.83, 0.78);
        vec3 cMid   = vec3(0.97, 0.96, 0.92);
        vec3 cHigh  = vec3(1.0, 0.995, 0.97);

        // Micro-surface stone grain
        float grain = fract(sin(dot(vUv * 85.0, vec2(12.9898, 78.233))) * 43758.5453) * 0.025;

        vec3 color = mix(cDark, cMid, diff1 * 0.72 + 0.28 + grain);
        color += diff2 * vec3(0.92, 0.88, 0.80) * 0.22;
        color += rim * vec3(0.98, 0.97, 0.94) * 0.15;
        color += spec * cHigh * 0.30;
        color += fresnel * cHigh * 0.12;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // 2. Rich Institutional Forest Green Finish (Deep, Satiny Lacquer)
    const greenFragment = `
      precision highp float;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(-vPosition);

        vec3 L1 = normalize(vec3(-0.7, 1.6, 1.1));
        vec3 L2 = normalize(vec3(0.8, -0.3, 0.6));

        float diff1 = max(dot(N, L1), 0.0);
        float diff2 = max(dot(N, L2), 0.0);
        vec3 H1 = normalize(L1 + V);
        float spec = pow(max(dot(N, H1), 0.0), 36.0);
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.8);

        vec3 cDark  = vec3(0.045, 0.14, 0.11);
        vec3 cMid   = vec3(0.086, 0.24, 0.19); // #163D32
        vec3 cHigh  = vec3(0.18, 0.48, 0.36);  // #287657

        vec3 color = mix(cDark, cMid, diff1 * 0.80 + 0.20);
        color += diff2 * vec3(0.05, 0.18, 0.13) * 0.25;
        color += spec * vec3(0.7, 0.95, 0.82) * 0.50;
        color += fresnel * cHigh * 0.40;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // 3. Brushed Champagne Gold / Brass Architectural Metal Shader
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

        float spec1 = pow(max(dot(N, H1), 0.0), 45.0);
        float spec2 = pow(max(dot(N, H2), 0.0), 30.0);
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.4);

        // Champagne gold palette
        vec3 goldDark   = vec3(0.48, 0.38, 0.20);
        vec3 goldMid    = vec3(0.76, 0.63, 0.39); // #C2A063
        vec3 goldBright = vec3(0.99, 0.94, 0.78); // #FDF0C7

        vec3 color = mix(goldDark, goldMid, diff1 * 0.75 + 0.25);
        color += diff2 * vec3(0.55, 0.44, 0.24) * 0.35;
        color += spec1 * goldBright * 1.1;
        color += spec2 * goldBright * 0.4;
        color += fresnel * goldBright * 0.55;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // 4. Smoked Architectural Glazing with Interior Ambient Glow
    const glassFragment = `
      precision highp float;
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(-vPosition);
        vec3 L1 = normalize(vec3(-0.6, 1.4, 0.9));
        vec3 H1 = normalize(L1 + V);
        float spec = pow(max(dot(N, H1), 0.0), 55.0);
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.2);

        // Smoked green-tinted glass with slight warm interior illumination
        vec3 glassBase = vec3(0.10, 0.22, 0.18);
        vec3 warmGlow  = vec3(0.24, 0.20, 0.14);
        vec3 col = mix(glassBase, warmGlow, 0.35) + spec * vec3(0.95, 0.98, 0.96) * 0.90 + fresnel * vec3(0.35, 0.65, 0.55) * 0.45;
        gl_FragColor = vec4(col, 0.94);
      }
    `;

    const stoneProg = new Program(gl, { vertex: baseVertex, fragment: stoneFragment, cullFace: null });
    const greenProg = new Program(gl, { vertex: baseVertex, fragment: greenFragment, cullFace: null });
    const goldProg  = new Program(gl, { vertex: baseVertex, fragment: goldFragment, cullFace: null });
    const glassProg = new Program(gl, { vertex: baseVertex, fragment: glassFragment, cullFace: null, transparent: true });

    // ── Physical Architectural Model Assembly ────────────────────────────

    // A. Master Architectural Plinth (Layered Pedestal)
    // Level 0: Bottom base
    const p0 = new Mesh(gl, { geometry: new Box(gl, { width: 3.5, height: 0.12, depth: 2.7 }), program: stoneProg });
    p0.position.set(0, -0.06, 0);
    p0.setParent(turntable);

    // Gold reveal gap
    const pTrim = new Mesh(gl, { geometry: new Box(gl, { width: 3.42, height: 0.02, depth: 2.62 }), program: goldProg });
    pTrim.position.set(0, 0.01, 0);
    pTrim.setParent(turntable);

    // Level 1: Upper beveled gallery platform
    const p1 = new Mesh(gl, { geometry: new Box(gl, { width: 3.36, height: 0.08, depth: 2.56 }), program: stoneProg });
    p1.position.set(0, 0.06, 0);
    p1.setParent(turntable);

    // ──────────────────────────────────────────────────────────────────────
    // B. Miniature Institutional Bank Pavilion
    // Classical symmetry meets refined contemporary architecture
    const bank = new Transform();
    bank.position.set(-0.54, 0.10, 0.08);
    bank.setParent(turntable);

    // 1. Bank Stylobate (Stepped Marble Foundation)
    const step1 = new Mesh(gl, { geometry: new Box(gl, { width: 1.76, height: 0.05, depth: 1.52 }), program: stoneProg });
    step1.position.set(0, 0.025, 0);
    step1.setParent(bank);

    const step2 = new Mesh(gl, { geometry: new Box(gl, { width: 1.68, height: 0.05, depth: 1.44 }), program: stoneProg });
    step2.position.set(0, 0.075, 0);
    step2.setParent(bank);

    const step3 = new Mesh(gl, { geometry: new Box(gl, { width: 1.60, height: 0.05, depth: 1.36 }), program: stoneProg });
    step3.position.set(0, 0.125, 0);
    step3.setParent(bank);

    // 2. Main Cella / Banking Hall Core
    const cella = new Mesh(gl, { geometry: new Box(gl, { width: 1.48, height: 1.15, depth: 1.05 }), program: stoneProg });
    cella.position.set(0, 0.725, -0.12);
    cella.setParent(bank);

    // Recessed side window reveals on the bank cella
    [-0.75, 0.75].forEach((sideX) => {
      // 2 tall vertical recessed windows on each side
      [-0.28, 0.08].forEach((winZ) => {
        const win = new Mesh(gl, { geometry: new Box(gl, { width: 0.04, height: 0.65, depth: 0.22 }), program: glassProg });
        win.position.set(sideX, 0.74, winZ);
        win.setParent(bank);

        const winTrim = new Mesh(gl, { geometry: new Box(gl, { width: 0.045, height: 0.02, depth: 0.24 }), program: goldProg });
        winTrim.position.set(sideX, 1.075, winZ);
        winTrim.setParent(bank);
      });
    });

    // 3. Classical Portico Colonnade (6 Refined Fluted Columns)
    // 4 front facade columns + 2 corner depth columns
    const colGeom = new Cylinder(gl, { radiusTop: 0.048, radiusBottom: 0.056, height: 0.98, radialSegments: 24 });
    const colCapGeom = new Box(gl, { width: 0.14, height: 0.04, depth: 0.14 });
    const colBaseGeom = new Box(gl, { width: 0.14, height: 0.035, depth: 0.14 });

    const columnCoords = [
      [-0.60, 0.48], // Left outer
      [-0.20, 0.48], // Left center
      [ 0.20, 0.48], // Right center
      [ 0.60, 0.48], // Right outer
      [-0.60, 0.18], // Left return
      [ 0.60, 0.18], // Right return
    ];

    columnCoords.forEach(([cx, cz]) => {
      // Column shaft (limestone)
      const shaft = new Mesh(gl, { geometry: colGeom, program: stoneProg });
      shaft.position.set(cx, 0.64, cz);
      shaft.setParent(bank);

      // Gold-accented capital
      const cap = new Mesh(gl, { geometry: colCapGeom, program: goldProg });
      cap.position.set(cx, 1.14, cz);
      cap.setParent(bank);

      // Stone & gold base plinth
      const base = new Mesh(gl, { geometry: colBaseGeom, program: stoneProg });
      base.position.set(cx, 0.165, cz);
      base.setParent(bank);
    });

    // 4. Entablature & Architrave (Above Columns)
    const architrave = new Mesh(gl, { geometry: new Box(gl, { width: 1.62, height: 0.08, depth: 1.34 }), program: stoneProg });
    architrave.position.set(0, 1.20, -0.01);
    architrave.setParent(bank);

    // Deep Forest Green Frieze Band
    const frieze = new Mesh(gl, { geometry: new Box(gl, { width: 1.64, height: 0.16, depth: 1.36 }), program: greenProg });
    frieze.position.set(0, 1.32, -0.01);
    frieze.setParent(bank);

    // Gold Dentil Moulding Band
    const dentil = new Mesh(gl, { geometry: new Box(gl, { width: 1.68, height: 0.035, depth: 1.40 }), program: goldProg });
    dentil.position.set(0, 1.42, -0.01);
    dentil.setParent(bank);

    // Cornice
    const cornice = new Mesh(gl, { geometry: new Box(gl, { width: 1.74, height: 0.06, depth: 1.46 }), program: stoneProg });
    cornice.position.set(0, 1.47, -0.01);
    cornice.setParent(bank);

    // 5. Triangular Classical Pediment (Front Tympanum)
    // Stepped layered geometry forming a crisp, elegant pediment
    const pedimentLayers = [
      { w: 1.60, h: 0.05, d: 0.35, y: 1.525, z: 0.44 },
      { w: 1.36, h: 0.05, d: 0.34, y: 1.575, z: 0.44 },
      { w: 1.10, h: 0.05, d: 0.33, y: 1.625, z: 0.44 },
      { w: 0.82, h: 0.05, d: 0.32, y: 1.675, z: 0.44 },
      { w: 0.52, h: 0.05, d: 0.31, y: 1.725, z: 0.44 },
      { w: 0.22, h: 0.04, d: 0.30, y: 1.770, z: 0.44 },
    ];

    pedimentLayers.forEach((layer) => {
      const pl = new Mesh(gl, { geometry: new Box(gl, { width: layer.w, height: layer.h, depth: layer.d }), program: stoneProg });
      pl.position.set(0, layer.y, layer.z);
      pl.setParent(bank);
    });

    // Pediment Tympanum Crest Medallion (Center Gold Emblem)
    const crest = new Mesh(gl, { geometry: new Cylinder(gl, { radiusTop: 0.08, radiusBottom: 0.08, height: 0.02, radialSegments: 20 }), program: goldProg });
    crest.rotation.x = Math.PI / 2;
    crest.position.set(0, 1.62, 0.62);
    crest.setParent(bank);

    // Gold Apex Acroterion (Ornament at the very top point of the pediment)
    const apex = new Mesh(gl, { geometry: new Sphere(gl, { radius: 0.04, widthSegments: 16, heightSegments: 12 }), program: goldProg });
    apex.position.set(0, 1.82, 0.44);
    apex.setParent(bank);

    // 6. Recessed Grand Entrance Portal
    // Recessed dark emerald door with champagne brass trim & multi-pane glazing
    const doorFrame = new Mesh(gl, { geometry: new Box(gl, { width: 0.46, height: 0.68, depth: 0.06 }), program: greenProg });
    doorFrame.position.set(0, 0.49, 0.41);
    doorFrame.setParent(bank);

    const doorGlass = new Mesh(gl, { geometry: new Box(gl, { width: 0.36, height: 0.58, depth: 0.08 }), program: glassProg });
    doorGlass.position.set(0, 0.49, 0.42);
    doorGlass.setParent(bank);

    const doorMullionH = new Mesh(gl, { geometry: new Box(gl, { width: 0.38, height: 0.02, depth: 0.09 }), program: goldProg });
    doorMullionH.position.set(0, 0.52, 0.42);
    doorMullionH.setParent(bank);

    const doorMullionV = new Mesh(gl, { geometry: new Box(gl, { width: 0.02, height: 0.60, depth: 0.09 }), program: goldProg });
    doorMullionV.position.set(0, 0.49, 0.42);
    doorMullionV.setParent(bank);

    // Entrance Portal Canopy / Header in Gold
    const doorCanopy = new Mesh(gl, { geometry: new Box(gl, { width: 0.54, height: 0.035, depth: 0.12 }), program: goldProg });
    doorCanopy.position.set(0, 0.84, 0.44);
    doorCanopy.setParent(bank);

    // ──────────────────────────────────────────────────────────────────────
    // C. Modern Commercial MSME Business Tower (Adjacent Agility & Enterprise)
    // Stepped, modular, warm-lit modern mid-rise
    const msme = new Transform();
    msme.position.set(0.92, 0.10, -0.16);
    msme.setParent(turntable);

    // 1. Lower Podium Volume (Warm Stone & Glazing)
    const msmePodium = new Mesh(gl, { geometry: new Box(gl, { width: 1.05, height: 0.58, depth: 1.05 }), program: stoneProg });
    msmePodium.position.set(0, 0.29, 0);
    msmePodium.setParent(msme);

    // Ground Floor Double-Height Showroom / Lobby Glazing
    const lobbyGlass = new Mesh(gl, { geometry: new Box(gl, { width: 0.72, height: 0.38, depth: 0.06 }), program: glassProg });
    lobbyGlass.position.set(0, 0.24, 0.53);
    lobbyGlass.setParent(msme);

    // Gold lobby awning
    const lobbyAwning = new Mesh(gl, { geometry: new Box(gl, { width: 0.82, height: 0.025, depth: 0.18 }), program: goldProg });
    lobbyAwning.position.set(0, 0.44, 0.58);
    lobbyAwning.setParent(msme);

    // 2. Middle Office Volume (Deep Forest Green with Brass Fins)
    const msmeMid = new Mesh(gl, { geometry: new Box(gl, { width: 0.94, height: 0.56, depth: 0.94 }), program: greenProg });
    msmeMid.position.set(0, 0.86, 0);
    msmeMid.setParent(msme);

    // Horizontal Louver Fins (Brise-Soleil)
    const finHeights = [0.68, 0.84, 1.00];
    finHeights.forEach((fy) => {
      const fin = new Mesh(gl, { geometry: new Box(gl, { width: 1.02, height: 0.02, depth: 1.02 }), program: goldProg });
      fin.position.set(0, fy, 0);
      fin.setParent(msme);
    });

    // Middle ribbon windows (front & sides)
    const ribbonWinFront = new Mesh(gl, { geometry: new Box(gl, { width: 0.78, height: 0.16, depth: 0.04 }), program: glassProg });
    ribbonWinFront.position.set(0, 0.92, 0.48);
    ribbonWinFront.setParent(msme);

    // 3. Upper Penthouse / Innovation Loft (Stepped Back)
    const msmeTop = new Mesh(gl, { geometry: new Box(gl, { width: 0.78, height: 0.42, depth: 0.78 }), program: stoneProg });
    msmeTop.position.set(-0.06, 1.35, -0.06);
    msmeTop.setParent(msme);

    const msmeTopGlass = new Mesh(gl, { geometry: new Box(gl, { width: 0.62, height: 0.24, depth: 0.04 }), program: glassProg });
    msmeTopGlass.position.set(-0.06, 1.35, 0.34);
    msmeTopGlass.setParent(msme);

    // 4. Rooftop Architectural Pergola / Trellis
    const roofP1 = new Mesh(gl, { geometry: new Box(gl, { width: 0.72, height: 0.025, depth: 0.04 }), program: goldProg });
    roofP1.position.set(-0.06, 1.60, 0.20);
    roofP1.setParent(msme);

    const roofP2 = new Mesh(gl, { geometry: new Box(gl, { width: 0.72, height: 0.025, depth: 0.04 }), program: goldProg });
    roofP2.position.set(-0.06, 1.60, 0.0);
    roofP2.setParent(msme);

    const roofP3 = new Mesh(gl, { geometry: new Box(gl, { width: 0.72, height: 0.025, depth: 0.04 }), program: goldProg });
    roofP3.position.set(-0.06, 1.60, -0.20);
    roofP3.setParent(msme);

    // Pergola structural columns (brass)
    [-0.38, 0.26].forEach((rx) => {
      const rc = new Mesh(gl, { geometry: new Cylinder(gl, { radiusTop: 0.015, radiusBottom: 0.015, height: 0.16, radialSegments: 12 }), program: goldProg });
      rc.position.set(rx, 1.54, 0.10);
      rc.setParent(msme);
    });

    // ──────────────────────────────────────────────────────────────────────
    // D. Harmonizing Credit Convergence Ribbon (The Growth Trajectory)
    // Sculpted brass ribbon rising diagonally from Bank to MSME
    // Symbolizing institutional underwriting unlocking business expansion
    const ribbonSegments = [
      { x: -0.15, y: 0.45, z: 0.42, rx: 0.2, ry: -0.4, rz: 0.3, w: 0.06, h: 0.02, d: 0.25 },
      { x:  0.05, y: 0.62, z: 0.34, rx: 0.2, ry: -0.4, rz: 0.3, w: 0.06, h: 0.02, d: 0.30 },
      { x:  0.25, y: 0.80, z: 0.25, rx: 0.2, ry: -0.4, rz: 0.3, w: 0.06, h: 0.02, d: 0.30 },
      { x:  0.42, y: 0.98, z: 0.15, rx: 0.1, ry: -0.4, rz: 0.2, w: 0.06, h: 0.02, d: 0.25 },
    ];

    ribbonSegments.forEach((seg) => {
      const rMesh = new Mesh(gl, { geometry: new Box(gl, { width: seg.w, height: seg.h, depth: seg.d }), program: goldProg });
      rMesh.position.set(seg.x, seg.y, seg.z);
      rMesh.rotation.set(seg.rx, seg.ry, seg.rz);
      rMesh.setParent(turntable);
    });

    // Sculptural Growth Metric Stelae (3 slender stepped indicators on the podium)
    const stelaeData = [
      { x: 0.24, y: 0.24, z: 0.85, h: 0.24 },
      { x: 0.38, y: 0.32, z: 0.82, h: 0.40 },
      { x: 0.52, y: 0.41, z: 0.79, h: 0.58 },
    ];

    stelaeData.forEach((st) => {
      const body = new Mesh(gl, { geometry: new Box(gl, { width: 0.07, height: st.h, depth: 0.07 }), program: greenProg });
      body.position.set(st.x, st.y, st.z);
      body.setParent(turntable);

      const cap = new Mesh(gl, { geometry: new Box(gl, { width: 0.08, height: 0.02, depth: 0.08 }), program: goldProg });
      cap.position.set(st.x, st.y + st.h / 2 + 0.01, st.z);
      cap.setParent(turntable);
    });

    // ──────────────────────────────────────────────────────────────────────
    // Initial Three-Quarter Showcase Angle
    // Angled to showcase depth, the colonnade, the MSME stepped volumes & the gold growth motif
    let currentAngle = -0.42;
    turntable.rotation.y = currentAngle;
    turntable.rotation.x = 0.06; // Gentle 3.5° forward tilt for architectural model clarity

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

    // ── Continuous, Smooth Turntable Rotation ────────────────────────────
    let lastTime = performance.now();

    function render(currentTime) {
      animationFrameId = requestAnimationFrame(render);
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // Smooth, continuous rotation (approx 24s per revolution)
      currentAngle += delta * 0.26;
      turntable.rotation.y = currentAngle;

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
      aria-label="3D Miniature Institutional Bank and MSME Architectural Sculpture"
    >
      {/* Grounding contact shadow underneath the architectural plinth */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "4%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "420px",
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
            🏛️
          </div>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#163D32", fontFamily: "'Space Grotesk', sans-serif" }}>
            Institutional Credit &amp; MSME Architecture
          </span>
        </div>
      )}
    </div>
  );
}
