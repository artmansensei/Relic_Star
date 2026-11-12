import React, { useEffect, useRef } from 'react';

interface CelestialSceneProps {
  className?: string;
  focusTarget?: 'system' | 'mars' | 'moon';
}

export const CelestialScene: React.FC<CelestialSceneProps> = ({
  className = '',
  focusTarget = 'system',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate static stars with various magnitudes & color temperatures
    const starCount = 280;
    const stars: {
      x: number;
      y: number;
      size: number;
      baseAlpha: number;
      twinkleSpeed: number;
      twinklePhase: number;
      color: string;
    }[] = [];

    const colors = ['#ffffff', '#e0f2fe', '#fed7aa', '#bae6fd', '#fef08a'];

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.8 + 0.4,
        baseAlpha: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let t = 0;

    const render = () => {
      t += 0.016;
      ctx.clearRect(0, 0, width, height);

      // Deep void cosmic background gradient
      const bgGrad = ctx.createRadialGradient(
        width * 0.65,
        height * 0.45,
        width * 0.1,
        width * 0.5,
        height * 0.5,
        width * 0.95
      );
      bgGrad.addColorStop(0, '#0d131f');
      bgGrad.addColorStop(0.4, '#070a12');
      bgGrad.addColorStop(0.85, '#040609');
      bgGrad.addColorStop(1, '#020305');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle cosmic dust nebula haze
      const nebulaGrad = ctx.createRadialGradient(
        width * 0.75,
        height * 0.35,
        10,
        width * 0.75,
        height * 0.35,
        width * 0.5
      );
      nebulaGrad.addColorStop(0, 'rgba(194, 65, 12, 0.07)');
      nebulaGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.04)');
      nebulaGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = nebulaGrad;
      ctx.fillRect(0, 0, width, height);

      // Render twinkling stars
      for (const s of stars) {
        const alpha = s.baseAlpha + Math.sin(t * s.twinkleSpeed * 60 + s.twinklePhase) * 0.25;
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0.1, Math.min(1, alpha));
        ctx.beginPath();
        ctx.arc(s.x * width, s.y * height, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Orbital Grid Circles & Telemetry Vectors
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.07)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 9]);

      // Orbital Ellipse around Sun/Origin
      ctx.beginPath();
      ctx.ellipse(width * 0.35, height * 0.7, width * 0.65, height * 0.38, -0.15, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(width * 0.35, height * 0.7, width * 0.45, height * 0.26, -0.15, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // CELESTIAL BODY 1: Realistic Planet Mars (Right quadrant)
      const marsRadius = Math.min(width, height) * (focusTarget === 'mars' ? 0.32 : 0.23);
      const marsX = width * (focusTarget === 'mars' ? 0.65 : 0.76);
      const marsY = height * (focusTarget === 'mars' ? 0.5 : 0.48);

      // Mars Atmospheric Limb Glow (Thin pinkish/cyan haze)
      const atmoGrad = ctx.createRadialGradient(
        marsX,
        marsY,
        marsRadius * 0.96,
        marsX,
        marsY,
        marsRadius * 1.15
      );
      atmoGrad.addColorStop(0, 'rgba(239, 68, 68, 0.28)');
      atmoGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.12)');
      atmoGrad.addColorStop(0.85, 'rgba(56, 189, 248, 0.08)');
      atmoGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = atmoGrad;
      ctx.beginPath();
      ctx.arc(marsX, marsY, marsRadius * 1.15, 0, Math.PI * 2);
      ctx.fill();

      // Mars Body Base
      ctx.save();
      ctx.beginPath();
      ctx.arc(marsX, marsY, marsRadius, 0, Math.PI * 2);
      ctx.clip();

      // Mars Surface Gradient (Sunlight from upper-left)
      const sunAngle = -Math.PI / 4;
      const sunX = marsX + Math.cos(sunAngle) * marsRadius * 0.55;
      const sunY = marsY + Math.sin(sunAngle) * marsRadius * 0.55;

      const marsSurface = ctx.createRadialGradient(
        sunX,
        sunY,
        marsRadius * 0.1,
        marsX,
        marsY,
        marsRadius * 1.05
      );
      marsSurface.addColorStop(0, '#f97316');
      marsSurface.addColorStop(0.35, '#c2410c');
      marsSurface.addColorStop(0.7, '#7c2d12');
      marsSurface.addColorStop(0.92, '#3b1208');
      marsSurface.addColorStop(1, '#180603');
      ctx.fillStyle = marsSurface;
      ctx.fillRect(marsX - marsRadius, marsY - marsRadius, marsRadius * 2, marsRadius * 2);

      // Mars Continental Dark Albedo Markings (Syrtis Major, Sinus Sabaeus)
      ctx.fillStyle = 'rgba(45, 15, 8, 0.55)';
      ctx.beginPath();
      ctx.ellipse(marsX - marsRadius * 0.12, marsY + marsRadius * 0.05, marsRadius * 0.42, marsRadius * 0.26, 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(30, 10, 5, 0.65)';
      ctx.beginPath();
      ctx.ellipse(marsX + marsRadius * 0.18, marsY + marsRadius * 0.15, marsRadius * 0.35, marsRadius * 0.2, -0.4, 0, Math.PI * 2);
      ctx.fill();

      // Mars Polar Ice Cap (Bright white/cyan ice at pole)
      const iceGrad = ctx.createRadialGradient(
        marsX - marsRadius * 0.1,
        marsY - marsRadius * 0.78,
        0,
        marsX - marsRadius * 0.1,
        marsY - marsRadius * 0.78,
        marsRadius * 0.28
      );
      iceGrad.addColorStop(0, '#ffffff');
      iceGrad.addColorStop(0.6, 'rgba(224, 242, 254, 0.85)');
      iceGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = iceGrad;
      ctx.beginPath();
      ctx.ellipse(marsX - marsRadius * 0.08, marsY - marsRadius * 0.78, marsRadius * 0.28, marsRadius * 0.12, -0.1, 0, Math.PI * 2);
      ctx.fill();

      // Mars Terminator Shadow overlay
      const shadowGrad = ctx.createLinearGradient(
        marsX - marsRadius * 0.4,
        marsY - marsRadius * 0.4,
        marsX + marsRadius * 0.7,
        marsY + marsRadius * 0.7
      );
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
      shadowGrad.addColorStop(0.85, 'rgba(2, 2, 4, 0.88)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.98)');
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(marsX - marsRadius, marsY - marsRadius, marsRadius * 2, marsRadius * 2);
      ctx.restore();

      // CELESTIAL BODY 2: The Moon (Upper-left / middle background)
      const moonRadius = Math.min(width, height) * (focusTarget === 'moon' ? 0.26 : 0.085);
      const moonX = width * (focusTarget === 'moon' ? 0.65 : 0.38);
      const moonY = height * (focusTarget === 'moon' ? 0.48 : 0.24);

      // Moon subtle rim glow
      const moonGlow = ctx.createRadialGradient(
        moonX,
        moonY,
        moonRadius * 0.94,
        moonX,
        moonY,
        moonRadius * 1.18
      );
      moonGlow.addColorStop(0, 'rgba(226, 232, 240, 0.18)');
      moonGlow.addColorStop(0.5, 'rgba(148, 163, 184, 0.06)');
      moonGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonRadius * 1.18, 0, Math.PI * 2);
      ctx.fill();

      // Moon Body
      ctx.save();
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
      ctx.clip();

      const moonSurface = ctx.createRadialGradient(
        moonX - moonRadius * 0.4,
        moonY - moonRadius * 0.4,
        moonRadius * 0.1,
        moonX,
        moonY,
        moonRadius * 1.05
      );
      moonSurface.addColorStop(0, '#f1f5f9');
      moonSurface.addColorStop(0.35, '#cbd5e1');
      moonSurface.addColorStop(0.7, '#64748b');
      moonSurface.addColorStop(0.9, '#334155');
      moonSurface.addColorStop(1, '#0f172a');
      ctx.fillStyle = moonSurface;
      ctx.fillRect(moonX - moonRadius, moonY - moonRadius, moonRadius * 2, moonRadius * 2);

      // Lunar Mare (Dark basaltic plains: Mare Tranquillitatis, Mare Imbrium)
      ctx.fillStyle = 'rgba(30, 41, 59, 0.65)';
      ctx.beginPath();
      ctx.ellipse(moonX - moonRadius * 0.15, moonY - moonRadius * 0.1, moonRadius * 0.38, moonRadius * 0.24, 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(moonX + moonRadius * 0.1, moonY + moonRadius * 0.18, moonRadius * 0.32, moonRadius * 0.22, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Moon Terminator Shadow
      const moonShadow = ctx.createLinearGradient(
        moonX - moonRadius * 0.3,
        moonY - moonRadius * 0.3,
        moonX + moonRadius * 0.65,
        moonY + moonRadius * 0.65
      );
      moonShadow.addColorStop(0, 'rgba(0, 0, 0, 0)');
      moonShadow.addColorStop(0.48, 'rgba(0, 0, 0, 0.2)');
      moonShadow.addColorStop(0.85, 'rgba(0, 0, 0, 0.9)');
      moonShadow.addColorStop(1, 'rgba(0, 0, 0, 0.99)');
      ctx.fillStyle = moonShadow;
      ctx.fillRect(moonX - moonRadius, moonY - moonRadius, moonRadius * 2, moonRadius * 2);
      ctx.restore();

      // CELESTIAL BODY 3: Distant Earth Crescent (Lower-left horizon)
      const earthRadius = Math.min(width, height) * 0.055;
      const earthX = width * 0.18;
      const earthY = height * 0.72;

      // Earth blue atmosphere halo
      const earthGlow = ctx.createRadialGradient(
        earthX,
        earthY,
        earthRadius * 0.9,
        earthX,
        earthY,
        earthRadius * 1.35
      );
      earthGlow.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
      earthGlow.addColorStop(0.6, 'rgba(14, 165, 233, 0.1)');
      earthGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = earthGlow;
      ctx.beginPath();
      ctx.arc(earthX, earthY, earthRadius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(earthX, earthY, earthRadius, 0, Math.PI * 2);
      ctx.clip();

      const earthSurface = ctx.createRadialGradient(
        earthX - earthRadius * 0.3,
        earthY - earthRadius * 0.3,
        earthRadius * 0.05,
        earthX,
        earthY,
        earthRadius
      );
      earthSurface.addColorStop(0, '#38bdf8');
      earthSurface.addColorStop(0.4, '#0284c7');
      earthSurface.addColorStop(0.75, '#0369a1');
      earthSurface.addColorStop(0.95, '#070a14');
      ctx.fillStyle = earthSurface;
      ctx.fillRect(earthX - earthRadius, earthY - earthRadius, earthRadius * 2, earthRadius * 2);

      // Earth cloud swirls
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.ellipse(earthX - earthRadius * 0.1, earthY - earthRadius * 0.1, earthRadius * 0.45, earthRadius * 0.18, -0.4, 0, Math.PI * 2);
      ctx.fill();

      // Earth shadow
      const earthShadow = ctx.createLinearGradient(
        earthX - earthRadius * 0.2,
        earthY - earthRadius * 0.2,
        earthX + earthRadius * 0.6,
        earthY + earthRadius * 0.6
      );
      earthShadow.addColorStop(0, 'rgba(0, 0, 0, 0)');
      earthShadow.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
      earthShadow.addColorStop(0.85, 'rgba(0, 0, 0, 0.95)');
      ctx.fillStyle = earthShadow;
      ctx.fillRect(earthX - earthRadius, earthY - earthRadius, earthRadius * 2, earthRadius * 2);
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [focusTarget]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none select-none ${className}`}
    />
  );
};
