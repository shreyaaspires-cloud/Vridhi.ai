"use client";

import { useEffect, useState } from "react";

export default function CreditCoin3D() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  /* 
    Video-inspired polished 3D coin trail:
    - 5 separate metallic coins fanning out gracefully along an s-curved path
    - Bright silver/pearl faces, glossy dark-blue coin edges (coin thickness), crisp bevel rims
    - Fluid, staggered Y & X axis rotation with gentle floating wave
    - Blank clean faces (NO text, NO logos, NO symbols)
  */
  const coins = [
    { id: 1, size: 130, x: -45, y: -90, z: 30, tiltX: 22, tiltY: -15, delay: "0s", speed: "7s" },
    { id: 2, size: 160, x: 10,  y: -35, z: 75, tiltX: 16, tiltY: -28, delay: "-1.4s", speed: "8s" },
    { id: 3, size: 190, x: -20, y: 25,  z: 125, tiltX: 26, tiltY: -18, delay: "-2.8s", speed: "9s" },
    { id: 4, size: 150, x: 65,  y: 85,  z: 65, tiltX: 20, tiltY: -35, delay: "-4.2s", speed: "7.5s" },
    { id: 5, size: 120, x: 125, y: 140, z: 20, tiltX: 30, tiltY: -10, delay: "-2.1s", speed: "8.5s" },
  ];

  return (
    <div className="relative flex items-center justify-center p-2 w-full max-w-lg min-h-[380px] md:min-h-[440px]">
      {/* Subtle blue ambient backlighting */}
      <div
        aria-hidden="true"
        className="absolute w-80 h-80 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(22,139,255,0.22) 0%, rgba(14,108,212,0.06) 55%, transparent 75%)",
          filter: "blur(40px)",
        }}
      />

      {/* 3D Coin Stage */}
      <div
        className="relative w-full h-[380px] md:h-[440px] flex items-center justify-center"
        style={{
          perspective: "1200px",
          transformStyle: "preserve-3d",
        }}
      >
        {coins.map((coin) => (
          <div
            key={coin.id}
            className="absolute transition-transform duration-500"
            style={{
              width: coin.size,
              height: coin.size,
              transform: `translate3d(${coin.x}px, ${coin.y}px, ${coin.z}px)`,
              zIndex: Math.round(coin.z),
            }}
          >
            {/* 3D Coin Body with Thick Edge Construction */}
            <div
              className={`w-full h-full relative rounded-full ${
                reducedMotion ? "" : "animate-video-coin-float"
              }`}
              style={{
                transformStyle: "preserve-3d",
                animationDelay: coin.delay,
                animationDuration: coin.speed,
                transform: reducedMotion
                  ? `rotateX(${coin.tiltX}deg) rotateY(${coin.tiltY}deg)`
                  : undefined,
              }}
            >
              {/* Front Face — Bright Polished Pearl/Silver Metal */}
              <div
                className="absolute inset-0 rounded-full overflow-hidden"
                style={{
                  background:
                    "radial-gradient(circle at 35% 30%, #FFFFFF 0%, #E6F0FA 35%, #9BBCE3 70%, #40628C 100%)",
                  boxShadow:
                    "0 18px 45px rgba(0,0,0,0.85), 0 0 20px rgba(180,225,255,0.45), inset 0 0 10px rgba(255,255,255,0.9)",
                  border: "2px solid rgba(255,255,255,0.9)",
                  backfaceVisibility: "hidden",
                  transform: "translateZ(4px)",
                }}
              >
                {/* Crisp Metallic Bevel Ring */}
                <div
                  className="absolute inset-2 rounded-full pointer-events-none"
                  style={{
                    border: "1.5px solid rgba(255,255,255,0.7)",
                    boxShadow: "inset 0 0 6px rgba(14,108,212,0.35)",
                  }}
                />

                {/* Concentric Rim Texture */}
                <div className="absolute inset-4 rounded-full border border-dashed border-[#168BFF]/35 pointer-events-none" />
                <div className="absolute inset-7 rounded-full border border-[#168BFF]/20 pointer-events-none" />

                {/* Abstract Pearl Center */}
                <div
                  className="absolute inset-0 m-auto w-1/3 h-1/3 rounded-full pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle at 35% 35%, #FFFFFF 0%, #D8E8FA 60%, #7DA8DB 100%)",
                    boxShadow:
                      "0 0 12px rgba(255,255,255,0.75), inset 0 0 5px rgba(255,255,255,0.95)",
                    border: "1.5px solid rgba(255,255,255,0.75)",
                  }}
                />

                {/* Moving Specular Highlight Sweep */}
                <div
                  className={`absolute inset-0 pointer-events-none ${
                    reducedMotion ? "" : "animate-shine-sweep"
                  }`}
                  style={{
                    background:
                      "linear-gradient(120deg, transparent 25%, rgba(255,255,255,0.7) 50%, transparent 75%)",
                    animationDelay: coin.delay,
                  }}
                />
              </div>

              {/* Glossy Dark-Blue Coin Edge Thickness Layer (Simulated 3D Edge Rim) */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background:
                    "linear-gradient(180deg, #0B1425 0%, #168BFF 50%, #070910 100%)",
                  transform: "translateZ(0px)",
                  boxShadow: "0 0 8px rgba(0,0,0,0.9)",
                }}
              />

              {/* Back Face — Polished Silver Metal */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle at 40% 40%, #EBF4FC 0%, #87ADDA 60%, #2A486E 100%)",
                  boxShadow: "inset 0 0 10px rgba(0,0,0,0.6)",
                  border: "2px solid rgba(200,225,255,0.75)",
                  transform: "rotateY(180deg) translateZ(4px)",
                  backfaceVisibility: "hidden",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
