"use client";

import { useEffect, useRef, useState } from "react";
import { Renderer, Camera, Transform, Sphere, Program, Mesh } from "ogl";

export default function AnimatedNetworkGlobe({ className = "" }) {
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
      console.warn("WebGL not supported for Animated Network Globe:", e);
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
    const camera = new Camera(gl, { fov: 45, near: 0.1, far: 100 });
    camera.position.set(0, 0.2, 5.2);

    // Globe Shader with procedural landmass/grid coordinates and golden network connections
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

      // Simple procedural hash for pseudo-random continents / nodes
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(-vPosition);

        // Atmosphere Fresnel rim glow (warm gold)
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.2);

        // Rotated longitude UV
        vec2 uv = vUv;
        uv.x = fract(uv.x + uTime * 0.035);

        // Latitude & Longitude grid lines
        float latLines = step(0.96, sin(uv.y * 3.14159 * 18.0) * 0.5 + 0.5);
        float lonLines = step(0.96, sin(uv.x * 3.14159 * 36.0) * 0.5 + 0.5);
        float grid = max(latLines, lonLines) * 0.25;

        // Continents / landmass approximation
        float land = noise(uv * vec2(8.0, 4.0)) + 0.5 * noise(uv * vec2(16.0, 8.0));
        float isContinent = smoothstep(0.48, 0.54, land);

        // Network connection nodes (golden dots pulsating)
        vec2 nodeGrid = fract(uv * vec2(24.0, 12.0)) - 0.5;
        float nodeDist = length(nodeGrid);
        float isNode = smoothstep(0.18, 0.05, nodeDist) * isContinent;
        float pulse = sin(uTime * 3.0 + uv.x * 20.0) * 0.5 + 0.5;

        // Base dark oceanic sphere
        vec3 oceanColor = vec3(0.04, 0.04, 0.06);
        vec3 landColor = vec3(0.12, 0.10, 0.08);
        vec3 goldHighlight = vec3(0.98, 0.82, 0.38);
        vec3 goldRim = vec3(1.0, 0.90, 0.60);

        // Lighting from top-right
        vec3 lightDir = normalize(vec3(0.9, 1.2, 1.4));
        float diff = max(dot(normal, lightDir), 0.0);

        vec3 color = mix(oceanColor, landColor, isContinent);
        color += goldHighlight * grid * (0.4 + diff * 0.6);
        color += goldHighlight * isNode * (1.2 + pulse * 0.8);
        color += goldRim * fresnel * 0.85;

        // Subtle specular highlight on land
        vec3 halfVec = normalize(lightDir + viewDir);
        float spec = pow(max(dot(normal, halfVec), 0.0), 30.0) * isContinent;
        color += goldRim * spec * 0.7;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const globeGeom = new Sphere(gl, {
      radius: 2.15,
      widthSegments: 64,
      heightSegments: 64,
    });

    const globeProgram = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
      },
      cullFace: null,
    });

    const globeMesh = new Mesh(gl, { geometry: globeGeom, program: globeProgram });
    globeMesh.rotation.set(0.35, 0, 0.15); // Tilted forward like Earth's axis
    globeMesh.setParent(scene);

    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;

      renderer.setSize(width, height);
      camera.perspective({ aspect: width / height });
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    let animationFrameId;
    let startTime = performance.now();

    const animate = (t) => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = (t - startTime) * 0.001;

      globeMesh.rotation.y = elapsed * 0.12;
      globeProgram.uniforms.uTime.value = elapsed;

      renderer.render({ scene, camera });
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);

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
      <div className={`relative w-full h-full flex items-center justify-center ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/network-globe.png"
          alt="Vridhi.ai MSME Financial Network"
          className="w-full h-full object-cover rounded-3xl opacity-90"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[440px] md:min-h-[520px] overflow-hidden rounded-3xl ${className}`}
    >
      {/* Background radial glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(229,178,93,0.18) 0%, rgba(198,138,46,0.06) 45%, transparent 70%)",
          filter: "blur(30px)",
        }}
      />

      {/* Interactive floating badges positioned around the full globe */}
      <div className="absolute top-6 left-6 z-20 p-3 rounded-2xl bg-[#09090B]/85 border border-[#E5B25D]/40 backdrop-blur-md flex items-center gap-2.5 shadow-xl">
        <div className="p-2 rounded-xl bg-[#E5B25D]/20 text-[#FDE08B]">
          <span className="text-base font-bold">⚡</span>
        </div>
        <div>
          <span className="text-xs font-bold text-[#FFFDF8] block">MSME Borrowers</span>
          <span className="text-[10px] text-[#C7BEAF]">Alternative data access</span>
        </div>
      </div>

      <div className="absolute bottom-8 right-6 z-20 p-3 rounded-2xl bg-[#09090B]/85 border border-[#E5B25D]/40 backdrop-blur-md flex items-center gap-2.5 shadow-xl">
        <div className="p-2 rounded-xl bg-[#E5B25D]/20 text-[#FDE08B]">
          <span className="text-base font-bold">🏛️</span>
        </div>
        <div>
          <span className="text-xs font-bold text-[#FFFDF8] block">Institutional Lenders</span>
          <span className="text-[10px] text-[#C7BEAF]">Lower risk & explainable AI</span>
        </div>
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 right-4 z-20 hidden sm:flex p-2.5 rounded-xl bg-[#09090B]/80 border border-[#E5B25D]/30 backdrop-blur-md items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[11px] font-semibold text-[#FFFDF8]">Real-time Network Sync</span>
      </div>
    </div>
  );
}

