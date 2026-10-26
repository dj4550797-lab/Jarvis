import React, { useEffect, useRef } from 'react';
import { VoiceState } from '../types';

interface HologramProps {
  voiceState: VoiceState;
  decibelLevel?: number;
}

export const Hologram: React.FC<HologramProps> = ({ voiceState, decibelLevel = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;

    // Particle nodes for the hologram sphere
    const particleCount = 140;
    const particles: Array<{ x: number; y: number; z: number; baseRadius: number }> = [];

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = 2 * Math.PI * Math.random();
      const r = 85 + (Math.random() - 0.5) * 15;
      particles.push({
        x: r * Math.sin(theta) * Math.cos(phi),
        y: r * Math.sin(theta) * Math.sin(phi),
        z: r * Math.cos(theta),
        baseRadius: Math.random() * 1.5 + 1.2,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Adjust rotation speed and energy based on voice state
      let speed = 0.008;
      let particleColor = 'rgba(0, 240, 255, ';
      let ringColor = 'rgba(0, 240, 255, 0.2)';

      if (voiceState === 'listening') {
        speed = 0.02 + Math.abs(decibelLevel) * 0.001;
        particleColor = 'rgba(0, 230, 118, ';
        ringColor = 'rgba(0, 230, 118, 0.35)';
      } else if (voiceState === 'processing') {
        speed = 0.035;
        particleColor = 'rgba(168, 85, 247, ';
        ringColor = 'rgba(168, 85, 247, 0.4)';
      } else if (voiceState === 'speaking') {
        speed = 0.018;
        particleColor = 'rgba(0, 240, 255, ';
        ringColor = 'rgba(0, 240, 255, 0.5)';
      } else if (voiceState === 'error') {
        particleColor = 'rgba(244, 63, 94, ';
        ringColor = 'rgba(244, 63, 94, 0.4)';
      }

      angle += speed;

      // Draw orbital rings
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle * 0.4);
      ctx.beginPath();
      ctx.ellipse(0, 0, 115, 45, 0, 0, Math.PI * 2);
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 8]);
      ctx.stroke();

      ctx.rotate(Math.PI / 3 + angle * 0.2);
      ctx.beginPath();
      ctx.ellipse(0, 0, 115, 45, 0, 0, Math.PI * 2);
      ctx.strokeStyle = ringColor;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.restore();

      // Render 3D projected particles
      particles.forEach((p) => {
        // Rotate around Y-axis
        const cosY = Math.cos(angle);
        const sinY = Math.sin(angle);
        const rotX = p.x * cosY + p.z * sinY;
        const rotZ = -p.x * sinY + p.z * cosY;

        // Perspective projection
        const fov = 260;
        const scale = fov / (fov + rotZ);
        const projX = centerX + rotX * scale;
        const projY = centerY + p.y * scale;

        // Depth opacity
        const alpha = Math.max(0.15, Math.min(0.9, (rotZ + 100) / 200));

        ctx.beginPath();
        ctx.arc(projX, projY, p.baseRadius * scale, 0, Math.PI * 2);
        ctx.fillStyle = `${particleColor}${alpha})`;
        ctx.shadowColor = `${particleColor}0.8)`;
        ctx.shadowBlur = 6 * scale;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Central core glow
      const coreGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, 55);
      coreGrad.addColorStop(0, `${particleColor}0.4)`);
      coreGrad.addColorStop(0.5, `${particleColor}0.1)`);
      coreGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 55, 0, Math.PI * 2);
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [voiceState, decibelLevel]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={320}
        height={300}
        style={{ display: 'block', maxWidth: '100%' }}
      />
      <div style={{ marginTop: '-12px', textAlign: 'center' }}>
        <span
          className="badge"
          style={{
            borderColor:
              voiceState === 'listening'
                ? 'var(--emerald)'
                : voiceState === 'processing'
                ? 'var(--purple-glow)'
                : 'var(--border-subtle)',
            color:
              voiceState === 'listening'
                ? 'var(--emerald)'
                : voiceState === 'processing'
                ? 'var(--purple-glow)'
                : 'var(--cyan-glow)',
          }}
        >
          ● VOICE CORE: {voiceState.toUpperCase()}
        </span>
      </div>
    </div>
  );
};
