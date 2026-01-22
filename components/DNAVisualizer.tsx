import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Torus, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { MATRIX_SIZE } from '../types';
import { Play, Pause, Settings2, RotateCw, RotateCcw, Droplets, Gauge, Maximize, Circle, Disc } from 'lucide-react';

// Standard Three.js elements
const Group = 'group' as any;
const Fog = 'fog' as any;
const AmbientLight = 'ambientLight' as any;
const PointLight = 'pointLight' as any;
const DirectionalLight = 'directionalLight' as any;
const Mesh = 'mesh' as any;
const TorusGeometry = 'torusGeometry' as any;
const MeshStandardMaterial = 'meshStandardMaterial' as any;
const GridHelper = 'gridHelper' as any;
const SphereGeometry = 'sphereGeometry' as any;

interface DNAVisualizerProps {
  adjacency: number[][];
  colorBase: [number, number, number];
}

interface SimulationProps extends DNAVisualizerProps {
  paused: boolean;
  speed: number;
  nodeSize: number;
}

// 128 SCALE CONSTANTS
const NUM_PARTICLES = MATRIX_SIZE;
// Physics Constants Tuned for Stability
const REPULSION = 1.0; 
const DAMPING = 0.85; 
const BACKBONE_LENGTH = 1.0; 
const BOUNDARIES = [16, 32, 48, 64, 80, 96, 112];
const MAX_VELOCITY = 1.5; 
const BOUNDARY_RADIUS = 60; 

// High Contrast Colors for White Background
const DOMAIN_COLORS = [
  '#dc2626', // Red 600
  '#ea580c', // Orange 600
  '#ca8a04', // Yellow 600
  '#65a30d', // Lime 600
  '#059669', // Emerald 600
  '#0891b2', // Cyan 600
  '#2563eb', // Blue 600
  '#7c3aed', // Violet 600
  '#c026d3', // Fuchsia 600
];

const getDomainColor = (index: number) => {
    // 16 unit domains
    const domainIdx = Math.floor(index / 16);
    return DOMAIN_COLORS[domainIdx % DOMAIN_COLORS.length];
};

// Reusable scratch vectors
const scratch = {
    vec: new THREE.Vector3(),
    diff: new THREE.Vector3(),
    force: new THREE.Vector3(),
    mid: new THREE.Vector3(),
    axis: new THREE.Vector3(),
    up: new THREE.Vector3(0, 1, 0),
    dummyRot: new THREE.Quaternion(),
    dummyRot2: new THREE.Quaternion()
};

const CohesinClamp = ({ position, rotation, active }: { position: THREE.Vector3, rotation: THREE.Quaternion, active: boolean }) => {
  return (
    <Group position={position} quaternion={rotation} visible={active}>
       {/* Ring is Dark Gray/Black for high contrast on white */}
       <Mesh rotation={[Math.PI / 2, 0, 0]}>
          <TorusGeometry args={[2.5, 0.5, 16, 32]} />
          <MeshStandardMaterial color="#1e293b" roughness={0.2} metalness={0.8} />
       </Mesh>
       
       {/* Pink accent light */}
       <PointLight color="#ec4899" intensity={active ? 5 : 0} distance={20} decay={2} />
    </Group>
  );
};

const ChromatinSpaghetti = ({ 
  positions, 
  colorBase, 
  extrusionState,
  nodeSize
}: { 
  positions: React.MutableRefObject<THREE.Vector3[]>, 
  colorBase: [number, number, number], 
  extrusionState: React.MutableRefObject<any>,
  nodeSize: number
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const spheresRef = useRef<THREE.Group>(null);
  
  const curve = useMemo(() => new THREE.CatmullRomCurve3(
      new Array(NUM_PARTICLES).fill(0).map(() => new THREE.Vector3()), 
      false, 
      'catmullrom', 
      0.5
  ), []);

  const [clampPos, setClampPos] = useState(new THREE.Vector3(0,0,0));
  const [clampRot, setClampRot] = useState(new THREE.Quaternion());

  useFrame(() => {
    if (!meshRef.current || positions.current.length === 0) return;
    
    // Update Curve
    for(let i=0; i<NUM_PARTICLES; i++) {
        curve.points[i].copy(positions.current[i]);
    }
    
    // Geometry Update - Backbone thickness scales with nodeSize for consistency
    if (meshRef.current.geometry) meshRef.current.geometry.dispose();
    const tubeRadius = 0.5 * Math.min(1.2, Math.max(0.3, nodeSize));
    meshRef.current.geometry = new THREE.TubeGeometry(curve, 128, tubeRadius, 8, false); 

    // Update Spheres
    if (spheresRef.current) {
        spheresRef.current.children.forEach((child: any, i) => {
            if (positions.current[i]) {
                child.position.copy(positions.current[i]);
                const isBoundary = BOUNDARIES.includes(i);
                // Apply dynamic scaling
                const scale = isBoundary ? 1.5 * nodeSize : 1.0 * nodeSize;
                child.scale.setScalar(scale);
            }
        });
    }

    // Update Clamp
    const state = extrusionState.current;
    if (state.active) {
        const left = positions.current[state.leftFoot];
        const right = positions.current[state.rightFoot];
        if (left && right) {
            scratch.mid.addVectors(left, right).multiplyScalar(0.5);
            setClampPos(scratch.mid.clone()); 
            
            scratch.axis.subVectors(right, left).normalize();
            scratch.dummyRot.setFromUnitVectors(scratch.up, scratch.axis);
            scratch.dummyRot2.setFromAxisAngle(new THREE.Vector3(1,0,0), Math.PI/2);
            scratch.dummyRot.multiply(scratch.dummyRot2);
            setClampRot(scratch.dummyRot.clone());
        }
    }
  });

  return (
    <Group>
        {/* Backbone */}
        <Mesh ref={meshRef}>
            <MeshStandardMaterial 
                color="#475569" 
                roughness={0.5} 
                metalness={0.1} 
                transparent={true}
                opacity={0.8}
            />
        </Mesh>
        
        {/* Nucleosomes */}
        <Group ref={spheresRef}>
            {new Array(NUM_PARTICLES).fill(0).map((_, i) => {
                const color = getDomainColor(i);
                const isBoundary = BOUNDARIES.includes(i);
                
                return (
                    <Mesh key={i}>
                        <SphereGeometry args={[0.6, 8, 8]} />
                        <MeshStandardMaterial 
                            color={isBoundary ? '#000000' : color} 
                            emissive={isBoundary ? '#000000' : color}
                            emissiveIntensity={isBoundary ? 0 : 0.2}
                            roughness={0.2}
                        />
                    </Mesh>
                );
            })}
        </Group>

        <CohesinClamp 
            position={clampPos} 
            rotation={clampRot} 
            active={extrusionState.current.active} 
        />
    </Group>
  );
};


const PolymerSimulation = ({ adjacency, colorBase, paused, speed, nodeSize }: SimulationProps) => {
  const positions = useRef<THREE.Vector3[]>([]);
  const velocities = useRef<THREE.Vector3[]>([]);
  
  const extrusionState = useRef({
      active: true,
      center: 64,
      leftFoot: 64,
      rightFoot: 65,
      timer: 0
  });
  
  useMemo(() => {
    // ALWAYS Initialize / Reset when this component mounts
    positions.current = [];
    velocities.current = [];
    
    // INITIALIZATION - SPIRAL / SOLENOID SHAPE
    // This prevents the "straight line" look
    for (let i = 0; i < NUM_PARTICLES; i++) {
      const t = i * 0.3; // tighter coil
      const x = (i - NUM_PARTICLES / 2) * 0.8; // Compressed axis
      const radius = 8;
      const y = Math.cos(t) * radius;
      const z = Math.sin(t) * radius;
      
      positions.current.push(new THREE.Vector3(x, y, z));
      velocities.current.push(new THREE.Vector3(0, 0, 0));
    }
  }, []);

  useFrame(() => {
    if (paused) return; // Freezes physics and logic

    const pos = positions.current;
    const vel = velocities.current;
    
    // --- 1. Loop Extrusion Logic ---
    const ext = extrusionState.current;
    
    // Speed directly affects how fast the motor steps occur
    ext.timer += speed; 
    
    // Threshold is constant (5 frames at 1x speed). 
    // Higher speed = reach threshold faster = faster extrusion.
    if (ext.active && ext.timer > 5) { 
        ext.timer = 0;
        let stalled = false;
        
        if (ext.leftFoot > 0 && !BOUNDARIES.includes(ext.leftFoot)) ext.leftFoot--;
        else stalled = true;

        if (ext.rightFoot < NUM_PARTICLES - 1 && !BOUNDARIES.includes(ext.rightFoot)) ext.rightFoot++;
        else stalled = true;
        
        if (stalled || (ext.rightFoot - ext.leftFoot) > 32) {
            ext.active = false;
            ext.timer = -200; // Pause before reset
        }
    } else if (!ext.active && ext.timer > 200) {
        // Reset
        const newStart = Math.floor(Math.random() * (NUM_PARTICLES - 40)) + 5;
        ext.center = newStart;
        ext.leftFoot = newStart;
        ext.rightFoot = newStart + 1;
        ext.active = true;
        ext.timer = 0;
    }

    // --- 2. Physics Engine ---
    for (let i = 0; i < NUM_PARTICLES; i++) {
      scratch.force.set(0, 0, 0);

      // A. Center Pull (STRONG - Prevents drift)
      scratch.vec.copy(pos[i]).multiplyScalar(-0.02); 
      scratch.force.add(scratch.vec);

      // B. Repulsion
      const windowSize = 25; 
      const start = Math.max(0, i - windowSize);
      const end = Math.min(NUM_PARTICLES, i + windowSize);

      for (let j = start; j < end; j++) {
        if (i === j) continue;
        scratch.diff.subVectors(pos[i], pos[j]);
        const distSq = scratch.diff.lengthSq();
        
        if (distSq < 0.1) {
             // Avoid singularity
             scratch.vec.set((Math.random()-0.5), (Math.random()-0.5), (Math.random()-0.5)).multiplyScalar(0.5);
             scratch.force.add(scratch.vec);
        } else if (distSq < 10.0) {
            // Soft inverse square force with HARD CAP
            let f = REPULSION / (distSq + 0.1);
            if (f > 2.0) f = 2.0; 
            scratch.diff.multiplyScalar(f); 
            scratch.force.add(scratch.diff);
        }
      }

      // C. Backbone Constraints
      const springK = 0.5;
      if (i > 0) {
          scratch.diff.subVectors(pos[i-1], pos[i]);
          const len = scratch.diff.length();
          const stretch = len - BACKBONE_LENGTH;
          scratch.diff.normalize().multiplyScalar(stretch * springK);
          scratch.force.add(scratch.diff);
      }
      if (i < NUM_PARTICLES - 1) {
          scratch.diff.subVectors(pos[i+1], pos[i]);
          const len = scratch.diff.length();
          const stretch = len - BACKBONE_LENGTH;
          scratch.diff.normalize().multiplyScalar(stretch * springK);
          scratch.force.add(scratch.diff);
      }

      // D. MATRIX FORCES (Global Folding)
      const foldWindow = 40; 
      const foldStart = Math.max(0, i - foldWindow);
      const foldEnd = Math.min(NUM_PARTICLES, i + foldWindow);

      for (let j = foldStart; j < foldEnd; j++) {
          if (i === j) continue;
          if (Math.abs(i - j) < 4) continue; 

          const weight = adjacency[i][j];
          if (weight > 0.15) {
              scratch.diff.subVectors(pos[j], pos[i]);
              scratch.diff.normalize().multiplyScalar(0.02 * weight);
              scratch.force.add(scratch.diff);
          }
      }
      
      // E. Motor Force (Loop Extrusion)
      if (ext.active) {
          // Pull feet together
          const motorStrength = 0.08; 
          
          if (i === ext.leftFoot) {
              scratch.diff.subVectors(pos[ext.rightFoot], pos[i]);
              scratch.force.add(scratch.diff.multiplyScalar(motorStrength)); 
          }
          if (i === ext.rightFoot) {
              scratch.diff.subVectors(pos[ext.leftFoot], pos[i]);
              scratch.force.add(scratch.diff.multiplyScalar(motorStrength)); 
          }
          
          // CRITICAL: Push the loop segment OUTWARDS visibly
          if (i > ext.leftFoot && i < ext.rightFoot) {
             scratch.mid.addVectors(pos[ext.leftFoot], pos[ext.rightFoot]).multiplyScalar(0.5);
             
             // Calculate vector away from midline of feet
             scratch.diff.subVectors(pos[i], scratch.mid);
             
             // Add artificial "up" bias to ensure it pops out of the coil
             scratch.diff.y += 10.0;
             
             // Strong push
             scratch.diff.normalize().multiplyScalar(0.15); 
             scratch.force.add(scratch.diff);
          }
      }

      // --- INTEGRATION ---
      // Apply forces
      vel[i].add(scratch.force.multiplyScalar(speed * 0.5)); 
      
      // Damping 
      vel[i].multiplyScalar(DAMPING); 

      // Strict Velocity Clamp
      const vSq = vel[i].lengthSq();
      if (vSq > MAX_VELOCITY * MAX_VELOCITY) {
          vel[i].multiplyScalar(MAX_VELOCITY / Math.sqrt(vSq));
      }
      
      // Position Update
      scratch.vec.copy(vel[i]).multiplyScalar(speed);
      pos[i].add(scratch.vec);

      // Boundary Constraint
      const rSq = pos[i].lengthSq();
      if (rSq > BOUNDARY_RADIUS * BOUNDARY_RADIUS) {
          scratch.vec.copy(pos[i]).normalize().multiplyScalar(-1.0); 
          vel[i].add(scratch.vec); 
          pos[i].normalize().multiplyScalar(BOUNDARY_RADIUS);
      }
    }
  });

  return (
      <ChromatinSpaghetti 
        positions={positions} 
        colorBase={colorBase} 
        extrusionState={extrusionState} 
        nodeSize={nodeSize} 
      />
  );
};

const DNAVisualizer: React.FC<DNAVisualizerProps> = (props) => {
  const [autoRotate, setAutoRotate] = useState(false); 
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(0.4);
  const [nodeSize, setNodeSize] = useState(1.0);
  
  // Simulation Key to force re-mounting and physics reset
  const [simKey, setSimKey] = useState(0);
  const controlsRef = useRef<any>(null);

  const handleReset = () => {
    setSimKey(prev => prev + 1); // Triggers re-initialization of PolymerSimulation
    if (controlsRef.current) {
        controlsRef.current.reset(); // Resets Camera to initial position
    }
  };

  return (
    <div className="w-full h-full bg-white relative rounded overflow-hidden shadow-inner group border border-slate-200">
      <Canvas 
        camera={{ position: [0, 15, 65], fov: 55 }}
        gl={{ 
            antialias: true, 
            toneMapping: THREE.ACESFilmicToneMapping, 
            toneMappingExposure: 1.0,
            powerPreference: "high-performance"
        }}
        shadows
      >
        <Fog attach="fog" args={['#ffffff', 50, 300]} />
        
        <AmbientLight intensity={0.7} />
        <DirectionalLight 
            position={[50, 100, 50]} 
            intensity={1.5} 
            castShadow 
            shadow-mapSize={[1024, 1024]} 
        />
        <PointLight position={[-50, -20, 50]} intensity={0.5} color="#cbd5e1" />
        
        <GridHelper args={[200, 20, 0x94a3b8, 0xe2e8f0]} position={[0, -30, 0]} />

        <PolymerSimulation 
            key={simKey}
            {...props} 
            paused={paused} 
            speed={speed} 
            nodeSize={nodeSize} 
        />
        
        <OrbitControls 
            ref={controlsRef}
            makeDefault
            autoRotate={autoRotate}
            autoRotateSpeed={0.5} 
            enablePan={true}
            enableZoom={true}
            minDistance={20}
            maxDistance={500}
            target={[0, 0, 0]}
        />
      </Canvas>
      
      {/* Overlay UI - Legend & Status */}
      <div className="absolute bottom-4 left-4 pointer-events-none p-3 bg-white/80 backdrop-blur border border-slate-200 rounded shadow-sm z-0">
         <div className="flex flex-col gap-2">
             <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-1">
                <span className="text-xs font-bold text-slate-800 tracking-wider">VISUALIZER LEGEND</span>
             </div>
             
             {/* Legend Items */}
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-black border border-slate-300 shadow-sm"></div>
                <span className="text-[10px] text-slate-600 font-mono font-bold">CTCF (Boundary Anchor)</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full border-2 border-slate-800 bg-transparent flex items-center justify-center">
                    <div className="w-1 h-1 bg-pink-500 rounded-full animate-pulse"></div>
                </div>
                <span className="text-[10px] text-slate-600 font-mono font-bold">COHESIN (Motor Ring)</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm"></div>
                <span className="text-[9px] text-slate-500 font-mono">TAD DOMAIN (Chromatin)</span>
             </div>

             <div className="mt-2 pt-2 border-t border-slate-200">
                <span className="text-[9px] text-slate-400 font-mono">128-PARTICLE PHYSICS SIMULATION</span>
             </div>
         </div>
      </div>

      {/* Control Panel Overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-3 z-10 bg-slate-950/90 backdrop-blur p-3 rounded-lg border border-slate-800 shadow-xl w-48">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-1">
            <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                <Settings2 size={12} /> PHYSICS
            </span>
            <div className="flex gap-1">
                 <button 
                    onClick={handleReset}
                    className="p-1 rounded transition-colors text-slate-500 hover:text-white hover:bg-slate-800"
                    title="Reset View & Simulation"
                 >
                     <RotateCcw size={14} />
                 </button>
                 <button 
                    onClick={() => setAutoRotate(!autoRotate)} 
                    className={`p-1 rounded transition-colors ${autoRotate ? 'text-indigo-400 bg-indigo-500/20' : 'text-slate-500 hover:text-white'}`} 
                    title="Auto Rotate"
                 >
                     <RotateCw size={14} />
                 </button>
                 <button 
                    onClick={() => setPaused(!paused)} 
                    className={`p-1 rounded transition-colors ${paused ? 'text-amber-400 bg-amber-500/20' : 'text-emerald-400 bg-emerald-500/20'}`} 
                    title={paused ? "Resume" : "Pause"}
                 >
                     {paused ? <Play size={14} /> : <Pause size={14} />}
                 </button>
            </div>
        </div>

        {/* Speed Control */}
        <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span className="flex items-center gap-1"><Gauge size={10}/> SPEED</span>
                <span>{speed.toFixed(1)}x</span>
            </div>
            <input 
                type="range" min="0.1" max="3.0" step="0.1" 
                value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
            />
        </div>

        {/* Size Control */}
        <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span className="flex items-center gap-1"><Maximize size={10}/> SCALE</span>
                <span>{Math.round(nodeSize * 100)}%</span>
            </div>
            <input 
                type="range" min="0.2" max="2.0" step="0.1" 
                value={nodeSize} onChange={(e) => setNodeSize(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400"
            />
        </div>
      </div>
    </div>
  );
};

export default DNAVisualizer;