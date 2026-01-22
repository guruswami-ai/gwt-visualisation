import React, { useEffect, useRef } from 'react';

const CELL_SIZE = 8; // Size of the "pixels"
const DECAY_RATE = 0.05; // How fast trails fade
const SIMULATION_SPEED = 50; // ms between updates

const GameOfLifeBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = 0;
    
    // Grid State
    let cols = 0;
    let rows = 0;
    let grid: number[] = [];
    let nextGrid: number[] = [];
    // Visual state (for trails) - 0.0 to 1.0
    let alphaGrid: number[] = []; 

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        
        cols = Math.ceil(canvas.width / CELL_SIZE);
        rows = Math.ceil(canvas.height / CELL_SIZE);
        
        // Initialize random grid
        grid = new Array(cols * rows).fill(0).map(() => Math.random() > 0.85 ? 1 : 0);
        nextGrid = new Array(cols * rows).fill(0);
        alphaGrid = new Array(cols * rows).fill(0);
      }
    };

    window.addEventListener('resize', resize);
    resize();

    const getIdx = (x: number, y: number) => {
      // Wrap around (Toroidal surface)
      const cx = (x + cols) % cols;
      const cy = (y + rows) % rows;
      return cy * cols + cx;
    };

    const countNeighbors = (x: number, y: number) => {
      let sum = 0;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue;
          sum += grid[getIdx(x + i, y + j)];
        }
      }
      return sum;
    };

    const update = (timestamp: number) => {
      const delta = timestamp - lastTime;
      
      // Update Simulation Logic at fixed timestep
      if (delta > SIMULATION_SPEED) {
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const idx = y * cols + x;
            const neighbors = countNeighbors(x, y);
            const state = grid[idx];
            
            // Conway's Rules
            if (state === 1 && (neighbors < 2 || neighbors > 3)) {
              nextGrid[idx] = 0;
            } else if (state === 0 && neighbors === 3) {
              nextGrid[idx] = 1;
            } else {
              nextGrid[idx] = state;
            }
          }
        }
        
        // Swap grids
        [grid, nextGrid] = [nextGrid, grid];
        
        // Randomly spark new life to keep it interesting (Entropy injection)
        if (Math.random() > 0.9) {
             const cx = Math.floor(Math.random() * cols);
             const cy = Math.floor(Math.random() * rows);
             // Glider pattern or random noise
             grid[getIdx(cx, cy)] = 1;
             grid[getIdx(cx+1, cy)] = 1;
             grid[getIdx(cx, cy+1)] = 1;
        }

        lastTime = timestamp;
      }

      // Render Loop (Runs every frame for smooth fading)
      // Clear with very slight transparency to ensure background visibility
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < grid.length; i++) {
        // Update visual alpha
        if (grid[i] === 1) {
          alphaGrid[i] = 1.0;
        } else {
          alphaGrid[i] = Math.max(0, alphaGrid[i] - DECAY_RATE);
        }

        if (alphaGrid[i] > 0.01) {
            const x = (i % cols) * CELL_SIZE;
            const y = Math.floor(i / cols) * CELL_SIZE;
            
            // Color Logic: Boosted opacity for visibility
            if (grid[i] === 1) {
                // Active cells: Bright Indigo, high opacity
                ctx.fillStyle = `rgba(129, 140, 248, ${alphaGrid[i] * 0.9})`; 
            } else {
                // Trails: Slate/Cyan, moderate opacity
                ctx.fillStyle = `rgba(30, 41, 59, ${alphaGrid[i] * 0.5})`; 
            }
            
            ctx.fillRect(x, y, CELL_SIZE - 1, CELL_SIZE - 1);
        }
      }

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    // Increased opacity from 0.4 to 0.75 for better contrast
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-75 mix-blend-screen">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      />
      {/* Vignette Overlay to fade edges */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_90%)]" />
    </div>
  );
};

export default GameOfLifeBackground;