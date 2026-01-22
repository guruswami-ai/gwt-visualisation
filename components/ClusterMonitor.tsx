import React, { useMemo } from 'react';
import { ClusterNode } from '../types';
import { Server, Cpu, HardDrive, Activity, Thermometer, Wifi, WifiOff, RefreshCw, Settings2, Network, Zap, CircuitBoard } from 'lucide-react';

interface ClusterMonitorProps {
  nodes: ClusterNode[];
  mode: 'simulated' | 'local';
  isConnected: boolean;
  onToggleMode: (mode: 'simulated' | 'local') => void;
  onOpenSetup: () => void;
}

const CHAKRA_CONFIG: Record<string, { color: string, hex: string }> = {
  'muladhara': { color: 'red', hex: '#ef4444' },     // Root
  'svadhisthana': { color: 'orange', hex: '#f97316' }, // Sacral
  'manipura': { color: 'yellow', hex: '#eab308' },     // Solar Plexus
  'anahata': { color: 'green', hex: '#22c55e' },       // Heart
  'vishuddha': { color: 'blue', hex: '#3b82f6' }       // Throat
};

const ClusterTopology: React.FC<{ nodes: ClusterNode[] }> = ({ nodes }) => {
  const radius = 80;
  const cx = 150;
  const cy = 130; 
  
  // Calculate pentagon positions
  const points = useMemo(() => {
    return nodes.map((node, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / nodes.length;
      return {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        angle,
        config: CHAKRA_CONFIG[node.name.toLowerCase()] || { color: 'slate', hex: '#94a3b8' }
      };
    });
  }, [nodes]);

  // Aggregate Metrics for HUD
  const totalTflops = nodes.reduce((acc, n) => acc + (n.tflops || 0), 0);

  // Generate full mesh connections
  const connections = useMemo(() => {
    const lines = [];
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        lines.push({
          x1: points[i].x,
          y1: points[i].y,
          x2: points[j].x,
          y2: points[j].y,
          id: `${i}-${j}`
        });
      }
    }
    return lines;
  }, [points]);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-950/30 rounded border border-slate-800 mb-4 relative overflow-hidden">
      <div className="absolute top-2 left-3 text-[10px] font-mono text-slate-500 flex items-center gap-1">
         <Network size={10} />
         RDMA_MESH::ACTIVE
      </div>

      <div className="absolute top-2 right-3 text-[10px] font-mono text-slate-500 text-right">
         <div className="font-bold text-slate-300">{totalTflops} TFLOPS</div>
         <div className="text-[8px] opacity-60">AGGREGATE_COMPUTE</div>
      </div>
      
      <svg width="300" height="260" className="overflow-visible">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Connections */}
        {connections.map((line, i) => (
          <g key={line.id}>
             <line 
                x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} 
                stroke="#1e293b" 
                strokeWidth="1" 
             />
             <line 
                x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} 
                stroke="white" 
                strokeWidth="1.5"
                strokeLinecap="round"
                className="opacity-20"
             >
                <animate 
                   attributeName="stroke-dasharray" 
                   values="0,150;150,0;0,150" 
                   dur={`${2 + (i % 3) * 0.5}s`} 
                   repeatCount="indefinite" 
                />
                 <animate 
                   attributeName="stroke-opacity" 
                   values="0.1;0.6;0.1" 
                   dur={`${1 + (i % 2)}s`} 
                   repeatCount="indefinite" 
                />
             </line>
          </g>
        ))}

        {/* Nodes */}
        {points.map((p, i) => {
          const node = nodes[i];
          const isActive = node.status === 'active';
          
          return (
            <g key={node.id} className="cursor-default group">
              {/* Outer Glow Ring (Pulsing) */}
              <circle 
                cx={p.x} cy={p.y} r="18" 
                fill="none" 
                stroke={p.config.hex} 
                strokeWidth="1"
                className={isActive ? "animate-ping opacity-30" : "opacity-0"}
                style={{ animationDuration: isActive ? '2s' : '0s' }}
              />
              
              {/* Core Node Glow */}
              <circle 
                cx={p.x} cy={p.y} r="8" 
                fill={isActive ? p.config.hex : '#0f172a'} 
                fillOpacity={isActive ? 0.2 : 1}
                stroke={p.config.hex} 
                strokeWidth="2" 
                filter="url(#glow)"
                className="transition-colors duration-500"
              />

              {/* Inner Dot */}
              <circle 
                cx={p.x} cy={p.y} r="3" 
                fill={p.config.hex} 
              />

              {/* Node Name Label */}
              <text 
                x={p.x + (Math.cos(p.angle) * 30)} 
                y={p.y + (Math.sin(p.angle) * 30)} 
                textAnchor={Math.cos(p.angle) > 0.1 ? "start" : Math.cos(p.angle) < -0.1 ? "end" : "middle"} 
                alignmentBaseline={Math.sin(p.angle) > 0.1 ? "hanging" : "baseline"}
                fill={p.config.hex} 
                className="text-[9px] font-mono uppercase font-bold tracking-wider"
                style={{ textShadow: `0 0 10px ${p.config.hex}` }}
              >
                {node.name}
              </text>
              
              {/* GPU/CPU Metric Label */}
              <text 
                x={p.x + (Math.cos(p.angle) * 30)} 
                y={p.y + (Math.sin(p.angle) * 30) + 12} 
                textAnchor={Math.cos(p.angle) > 0.1 ? "start" : Math.cos(p.angle) < -0.1 ? "end" : "middle"} 
                alignmentBaseline={Math.sin(p.angle) > 0.1 ? "hanging" : "baseline"}
                fill="#64748b" 
                className="text-[7px] font-mono"
              >
                GPU:{node.gpuUsage}% | {node.powerDraw}W
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const ClusterMonitor: React.FC<ClusterMonitorProps> = ({ nodes, mode, isConnected, onToggleMode, onOpenSetup }) => {
  // Compute Aggregates
  const totalRam = nodes.reduce((acc, n) => acc + n.memoryUsage, 0);
  const totalVram = nodes.reduce((acc, n) => acc + (n.vramUsage || 0), 0);
  const totalPower = nodes.reduce((acc, n) => acc + (n.powerDraw || 0), 0);
  const totalTflops = nodes.reduce((acc, n) => acc + (n.tflops || 0), 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2 text-slate-400 text-sm uppercase tracking-wider font-semibold">
          <Server size={16} /> Hardware Telemetry
        </div>
        
        {/* Connection Toggle */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button 
                onClick={() => onToggleMode('simulated')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                    mode === 'simulated' 
                    ? 'bg-amber-500/10 text-amber-500 shadow-[0_0_10px_-3px_rgba(245,158,11,0.3)]' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
            >
                <WifiOff size={12} />
                DIGITAL_TWIN
            </button>
            <button 
                onClick={() => onToggleMode('local')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                    mode === 'local' 
                    ? 'bg-emerald-500/10 text-emerald-500 shadow-[0_0_10px_-3px_rgba(16,185,129,0.3)]' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
            >
                <Wifi size={12} />
                LIVE_MQTT
            </button>
        </div>
      </div>
      
      {/* Local Status Bar */}
      {mode === 'local' && (
          <div className="mb-4 flex items-center justify-between bg-slate-950/50 p-2 rounded border border-slate-800/50">
             <div className="flex items-center gap-2 text-xs font-mono">
                Status: 
                {isConnected ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                        CONNECTED <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/>
                    </span>
                ) : (
                    <span className="text-red-400 flex items-center gap-1">
                        DISCONNECTED <RefreshCw size={10} className="animate-spin" />
                    </span>
                )}
             </div>
             <button 
                onClick={onOpenSetup}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2 py-1 rounded hover:bg-indigo-500/20 transition-colors"
            >
                <Settings2 size={10} /> BRIDGE_CONFIG
             </button>
          </div>
      )}

      {/* Topology Visualization */}
      <ClusterTopology nodes={nodes} />

      {/* Aggregate Metrics Bar */}
      <div className="grid grid-cols-4 gap-2 mb-4 bg-slate-950 p-3 rounded border border-slate-800">
         <div className="text-center">
            <div className="text-[9px] text-slate-500 mb-0.5">TOTAL_TFLOPS</div>
            <div className="text-xs font-mono font-bold text-emerald-400">{totalTflops}</div>
         </div>
         <div className="text-center border-l border-slate-800">
            <div className="text-[9px] text-slate-500 mb-0.5">SYS_RAM</div>
            <div className="text-xs font-mono font-bold text-indigo-400">{Math.round(totalRam)} GB</div>
         </div>
         <div className="text-center border-l border-slate-800">
            <div className="text-[9px] text-slate-500 mb-0.5">VRAM_POOL</div>
            <div className="text-xs font-mono font-bold text-violet-400">{Math.round(totalVram)} GB</div>
         </div>
         <div className="text-center border-l border-slate-800">
            <div className="text-[9px] text-slate-500 mb-0.5">POWER_DRAW</div>
            <div className="text-xs font-mono font-bold text-amber-400">{totalPower} W</div>
         </div>
      </div>

      {/* Nodes List */}
      <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {nodes.map(node => {
           const config = CHAKRA_CONFIG[node.name.toLowerCase()] || { color: 'slate', hex: '#64748b' };
           const isActive = node.status === 'active';

           return (
             <div key={node.id} className="flex items-center justify-between p-2 bg-slate-950/40 rounded border border-slate-800/50 hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-3">
                   <div className={`w-2 h-2 rounded-full ${isActive ? 'animate-pulse' : ''}`} style={{ backgroundColor: config.hex, boxShadow: isActive ? `0 0 8px ${config.hex}` : 'none' }} />
                   <div>
                      <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{node.name}</div>
                      <div className="text-[9px] text-slate-500 font-mono">ID: {node.id.toUpperCase()}</div>
                   </div>
                </div>
                
                <div className="flex items-center gap-4">
                   <div className="text-right">
                      <div className="text-[9px] text-slate-500">GPU_LOAD</div>
                      <div className="text-[10px] font-mono text-slate-300">{node.gpuUsage}%</div>
                   </div>
                   <div className="text-right w-12">
                      <div className="text-[9px] text-slate-500">TEMP</div>
                      <div className={`text-[10px] font-mono ${node.temperature > 80 ? 'text-red-400' : 'text-slate-300'}`}>{node.temperature}°C</div>
                   </div>
                   <div className="text-right w-12">
                      <div className="text-[9px] text-slate-500">POWER</div>
                      <div className="text-[10px] font-mono text-amber-500">{node.powerDraw}W</div>
                   </div>
                </div>
             </div>
           );
        })}
      </div>
      
      <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-500">
        <span className="flex items-center gap-1"><CircuitBoard size={10} /> CLUSTER_ID: CHAKRA_V4</span>
        <span className="flex items-center gap-1">
             <span className={`w-1.5 h-1.5 rounded-full ${mode === 'local' && isConnected ? 'bg-emerald-500 shadow-[0_0_5px_emerald]' : 'bg-amber-500'}`}></span>
             {mode === 'local' ? 'LIVE_FEED :: MQTT' : 'SIMULATION :: TWIN'}
        </span>
      </div>
    </div>
  );
};

export default ClusterMonitor;