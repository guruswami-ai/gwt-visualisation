import React, { useRef, useEffect, useMemo } from 'react';
import { MATRIX_SIZE } from '../types';

interface HeatmapProps {
  adjacency: number[][];
  colorBase: [number, number, number]; // RGB tuple
}

// Helper: Convert RGB to HSL for dynamic palette generation
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

const Heatmap: React.FC<HeatmapProps> = ({ adjacency, colorBase }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate a 256-step Look-Up Table (LUT) for the gradient
  // This mimics scientific colormaps (like Magma/Inferno) but tinted to the strategy color
  const palette = useMemo(() => {
    const [h, s] = rgbToHsl(colorBase[0], colorBase[1], colorBase[2]);
    
    // Gradient Logic:
    // 0.0 - 0.15: Deep Shadow (Lifted slightly from black for visibility)
    // 0.15 - 0.50: Rich Saturated Midtones
    // 0.50 - 0.85: Vibrant Highlights
    // 0.85 - 1.00: Incandescent Core (White-hot)
    
    return new Array(256).fill('').map((_, i) => {
        const t = i / 255;
        let localH = h;
        let localL = 0;
        let localS = s;

        if (t <= 0.15) {
            // Shadow Region: Rapidly gain luminance to escape absolute black
            // L: 2% -> 20%
            localL = 2 + (t / 0.15) * 18;
            localS = s * 0.8 + (t / 0.15) * (s * 0.2); // Ramp saturation
        } else if (t <= 0.5) {
            // Midtone Region: High saturation, linear luminance ramp
            const p = (t - 0.15) / 0.35;
            localL = 20 + p * 30; // 20% -> 50%
            localS = 100; // Force max saturation for "pop"
        } else if (t <= 0.85) {
            // Highlight Region: Approaching pastel
            const p = (t - 0.5) / 0.35;
            localL = 50 + p * 30; // 50% -> 80%
            localS = 100;
        } else {
            // Core Region: Burn to white
            const p = (t - 0.85) / 0.15;
            localL = 80 + p * 20; // 80% -> 100%
            localS = 100 - p * 100; // Desaturate
        }

        return `hsl(${localH}, ${localS}%, ${localL}%)`;
    });
  }, [colorBase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = '#020617'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cellSize = canvas.width / MATRIX_SIZE;
    // Removing gap for a continuous field (better for scientific vis)
    
    adjacency.forEach((row, r) => {
      row.forEach((val, c) => {
        if (val <= 0.001) return; // Skip near-zero

        // Perceptual Mapping:
        // Use a power law (Gamma 0.3) to significantly boost visibility of low-probability interactions
        // This reveals the "sparse structure" usually hidden in linear mappings
        let intensity = Math.pow(val, 0.3);
        intensity = Math.min(1, Math.max(0, intensity));
        
        const colorIndex = Math.floor(intensity * 255);
        ctx.fillStyle = palette[colorIndex];
        
        // Draw using ceil/floor to prevent sub-pixel antialiasing gaps
        ctx.fillRect(
          Math.floor(c * cellSize), 
          Math.floor(r * cellSize), 
          Math.ceil(cellSize), 
          Math.ceil(cellSize)
        );
      });
    });

  }, [adjacency, palette]);

  return (
    <div className="relative w-full aspect-square bg-slate-950 border border-slate-800 rounded overflow-hidden shadow-inner group">
      <canvas 
        ref={canvasRef}
        width={512} // Upscaled resolution for sharpness
        height={512}
        className="w-full h-full object-contain"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* HUD Overlay: Scanlines & Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(15,23,42,0.1)_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_4px] opacity-20" />
      <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded" />
    </div>
  );
};

export default Heatmap;