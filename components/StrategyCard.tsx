
import React from 'react';
import { StrategyData, StrategyType } from '../types';
import Heatmap from './Heatmap';
import FitnessChart from './FitnessChart';
import { Activity, GitMerge, Layers, Zap, BrainCircuit, TrendingDown } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';

interface StrategyCardProps {
  data: StrategyData;
}

const STRATEGY_CONFIG: Record<StrategyType, { color: string; rgb: [number, number, number]; icon: any; desc: string; label: string }> = {
  [StrategyType.Direct]: { 
    color: '#3b82f6', 
    rgb: [59, 130, 246], 
    icon: Zap,
    desc: 'Stochastic Policy (Random)',
    label: 'RANDOM_WALK'
  },
  [StrategyType.Flat]: { 
    color: '#eab308', 
    rgb: [234, 179, 8], 
    icon: Layers,
    desc: 'Value Clipping (Clamped)',
    label: 'VALUE_CLAMP'
  },
  [StrategyType.Hierarchical]: { 
    color: '#a855f7', 
    rgb: [168, 85, 247], 
    icon: GitMerge,
    desc: 'Batch Normalization (Block)',
    label: 'BATCH_NORM'
  },
  [StrategyType.Topological]: { 
    color: '#10b981', 
    rgb: [16, 185, 129], 
    icon: BrainCircuit,
    desc: 'TAD Formation (PNAS 2016)',
    label: 'LOOP_EXTRUSION'
  },
};

const VarianceSparkline = ({ data, color }: { data: number[], color: string }) => {
    const chartData = data.map((val, i) => ({ i, val }));
    return (
        <div className="h-6 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <YAxis domain={['auto', 'auto']} hide />
                    <Line 
                        type="monotone" 
                        dataKey="val" 
                        stroke="#94a3b8" 
                        strokeWidth={1} 
                        dot={false}
                        isAnimationActive={false} 
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

const StrategyCard: React.FC<StrategyCardProps> = ({ data }) => {
  const config = STRATEGY_CONFIG[data.type];
  const Icon = config.icon;

  return (
    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-lg backdrop-blur-sm flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2 uppercase font-mono">
            <Icon size={18} style={{ color: config.color }} />
            {config.label}
          </h3>
          <p className="text-xs text-slate-500 font-mono">POLICY: {config.desc}</p>
        </div>
        <div className="text-right font-mono text-xs">
          <div style={{ color: config.color }}>RWD: {data.fitness.toFixed(3)}</div>
          <div className="text-slate-400">Q-VAL: {data.modularity.toFixed(2)}</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center min-h-[160px]">
        <div className="w-32 h-32 relative group">
          <Heatmap adjacency={data.adjacency} colorBase={config.rgb} />
          <div className="absolute inset-0 border border-white/5 pointer-events-none rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-1">
             <span className="text-[10px] bg-black/80 text-white px-1 font-mono">HI-C MAP</span>
          </div>
        </div>
        
        <p className="text-[10px] text-slate-500 text-center mt-3 mb-1 px-2 leading-tight">
          Map of gene proximity & connectivity. High density = lower metabolic cost & superior compression.
        </p>

        <FitnessChart data={data.fitnessHistory} color={config.color} />
      </div>

      {/* Variance Collapse Indicator */}
      <div className="border-t border-slate-800 pt-2 mt-1">
         <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono mb-1">
             <span className="flex items-center gap-1"><TrendingDown size={10} /> VARIANCE (σ)</span>
             <span>{data.variance.toFixed(2)}</span>
         </div>
         <VarianceSparkline data={data.varianceHistory} color={config.color} />
      </div>
    </div>
  );
};

export default StrategyCard;
