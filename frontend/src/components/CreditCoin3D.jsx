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

  return (
    <div className="relative flex items-center justify-center p-2 w-full max-w-lg min-h-[380px] md:min-h-[460px]">
      {/* Warm Gold Ambient Backlight Glow Matching Reference */}
      <div
        aria-hidden="true"
        className="absolute w-96 h-96 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(229,178,93,0.22) 0%, rgba(198,138,46,0.08) 50%, transparent 75%)",
          filter: "blur(50px)",
        }}
      />

      {/* Warm Golden Circular Floor Reflector Ring */}
      <div
        aria-hidden="true"
        className="absolute bottom-6 w-80 h-24 rounded-[100%] pointer-events-none opacity-60"
        style={{
          background: "radial-gradient(ellipse at center, rgba(253,224,139,0.3) 0%, rgba(198,138,46,0.12) 45%, transparent 70%)",
          transform: "rotateX(75deg)",
          filter: "blur(8px)",
        }}
      />

      {/* Atmospheric Golden Orbit Dust / Halo Ring */}
      <div
        aria-hidden="true"
        className="absolute w-[440px] h-[220px] rounded-[100%] pointer-events-none border border-[#E5B25D]/25"
        style={{
          transform: "rotateX(68deg) rotateZ(-18deg)",
          boxShadow: "0 0 25px rgba(229,178,93,0.18), inset 0 0 25px rgba(229,178,93,0.18)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute w-[360px] h-[180px] rounded-[100%] pointer-events-none border border-dashed border-[#FDE08B]/20"
        style={{
          transform: "rotateX(72deg) rotateZ(12deg)",
        }}
      />
    </div>
  );
}
