import React, { useMemo } from "react";

export default function CosmicBackground() {
  // Generate deterministic stars to avoid shifting layout on every re-render
  const starsArray = useMemo(() => {
    return Array.from({ length: 45 }).map((_, i) => {
      // Create variations in position, sizing (approx 4-6px), and animation characteristics
      const size = i % 3 === 0 ? 6 : i % 2 === 0 ? 5 : 4; 
      const top = Math.floor((Math.sin(i * 452.12) + 1) * 50); // percentage 0-100
      const left = Math.floor((Math.cos(i * 732.89) + 1) * 50); // percentage 0-100
      
      // Floating / Twinkling speeds between 0.8s and 1.2s as requested
      const animationDurations = [0.8, 0.9, 1.0, 1.1, 1.2];
      const duration = animationDurations[i % animationDurations.length];
      const delay = (i % 7) * 0.15; // varying delays
      
      // Fine-grained parallax/floating offsets
      const driftX = (i % 2 === 0 ? 1 : -1) * (10 + (i % 15));
      const driftY = (i % 3 === 0 ? 1 : -1) * (10 + (i % 15));

      return {
        id: i,
        size,
        top: `${top}%`,
        left: `${left}%`,
        duration: `${duration}s`,
        delay: `${delay}s`,
        driftX: `${driftX}px`,
        driftY: `${driftY}px`
      };
    });
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden w-full h-full select-none">
      {/* 1. LAYER 1: Base Deep Cosmic Background Gradient (LexOps V2 Sovereign Radial Background) */}
      <div className="absolute inset-0 state-radial-v2" style={{ background: "radial-gradient(circle at center, #1a1a2e 0%, #050505 100%)" }} />

      {/* 2. LAYER 2: Cosmic Mist (Nebula & Radial Glows Layer) */}
      <div className="absolute inset-0 opacity-25">
        {/* Soft Gold Ambient Glow - Cosmic Mist Node A */}
        <div className="absolute top-[10%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-[#D4AF37]/5 to-transparent blur-[120px] animate-pulse" style={{ animationDuration: "12s" }} />
        
        {/* Soft Royal Blue Ambient Glow - Cosmic Mist Node B */}
        <div className="absolute bottom-[10%] right-[15%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tr from-[#002366]/20 to-transparent blur-[150px] animate-pulse" style={{ animationDuration: "18s" }} />

        {/* Soft Center Cosmic Cloud */}
        <div className="absolute top-[40%] left-[45%] w-[40vw] h-[40vw] rounded-full bg-radial from-[#001233]/30 to-transparent blur-[100px]" />
      </div>

      {/* 3. LAYER 3: Animated Star Layer (Gold #D4AF37 Stars with float + twinkle) */}
      <div className="absolute inset-0 opacity-[0.32]">
        {starsArray.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-[#D4AF37]"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              top: star.top,
              left: star.left,
              boxShadow: "0 0 8px rgba(212, 175, 55, 0.61)",
              animation: `cosmicStarPulse ${star.duration} infinite ease-in-out, cosmicStarDrift 15s infinite ease-in-out`,
              animationDelay: `${star.delay}, 0s`,
              // Inject Custom CSS Variables for float direction customizability
              // @ts-ignore
              "--drift-x": star.driftX,
              "--drift-y": star.driftY,
            }}
          />
        ))}
      </div>
    </div>
  );
}
