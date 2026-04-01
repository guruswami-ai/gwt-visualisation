import React, { useMemo } from 'react';
import { Circle, TrendingUp, TrendingDown, Minus, GitBranch, Box } from 'lucide-react';
import { computeTopologicalMetrics, compareTopology, TopologicalMetrics } from '../utils/topology';

interface BettiNumberAnalyzerProps {
  theoreticalAdjacency: number[][];
  experimentalAdjacency: number[][];
  mode: 'theory' | 'experimental';
}

const BettiNumberAnalyzer: React.FC<BettiNumberAnalyzerProps> = ({ 
  theoreticalAdjacency, 
  experimentalAdjacency,
  mode 
}) => {
  
  const theoreticalMetrics = useMemo(() => {
    return computeTopologicalMetrics(theoreticalAdjacency, 0.2);
  }, [theoreticalAdjacency]);
  
  const experimentalMetrics = useMemo(() => {
    return computeTopologicalMetrics(experimentalAdjacency, 0.2);
  }, [experimentalAdjacency]);
  
  const comparison = useMemo(() => {
    return compareTopology(theoreticalMetrics, experimentalMetrics);
  }, [theoreticalMetrics, experimentalMetrics]);
  
  const currentMetrics = mode === 'theory' ? theoreticalMetrics : experimentalMetrics;
  
  // Determine if topology is validating or refuting hypothesis
  const isValidating = comparison.overallSimilarity < 5.0; // Lower = more similar
  const similarityPercent = Math.max(0, Math.min(100, 100 - comparison.overallSimilarity * 10));
  
  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <GitBranch size={16} className="text-purple-400" />
          <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Topological Data Analysis (Protocol D)
          </span>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
          isValidating 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
            : 'bg-red-500/10 text-red-400 border-red-500/30'
        }`}>
          {isValidating ? 'TOPOLOGY MATCH' : 'TOPOLOGY MISMATCH'}
        </div>
      </div>
      
      {/* Betti Numbers Display */}
      <div className="grid grid-cols-3 gap-3">
        <BettiCard
          label="Betti-0"
          description="TAD Domains"
          value={currentMetrics.bettiNumbers.betti0}
          theoreticalValue={theoreticalMetrics.bettiNumbers.betti0}
          experimentalValue={experimentalMetrics.bettiNumbers.betti0}
          icon={<Circle size={16} />}
          mode={mode}
        />
        <BettiCard
          label="Betti-1"
          description="Loop Structures"
          value={currentMetrics.bettiNumbers.betti1}
          theoreticalValue={theoreticalMetrics.bettiNumbers.betti1}
          experimentalValue={experimentalMetrics.bettiNumbers.betti1}
          icon={<GitBranch size={16} />}
          mode={mode}
          highlight
        />
        <BettiCard
          label="Betti-2"
          description="3D Voids"
          value={currentMetrics.bettiNumbers.betti2}
          theoreticalValue={theoreticalMetrics.bettiNumbers.betti2}
          experimentalValue={experimentalMetrics.bettiNumbers.betti2}
          icon={<Box size={16} />}
          mode={mode}
        />
      </div>
      
      {/* Additional Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard
          label="Euler χ"
          value={currentMetrics.eulerCharacteristic}
          format={(v) => v.toFixed(0)}
        />
        <MetricCard
          label="Modularity"
          value={currentMetrics.modularityIndex}
          format={(v) => (v * 100).toFixed(1) + '%'}
        />
        <MetricCard
          label="Complexity"
          value={currentMetrics.structuralComplexity}
          format={(v) => v.toFixed(0)}
        />
      </div>
      
      {/* Comparison Bar */}
      <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800/50">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-slate-400 font-mono uppercase">Isomorphism Score</span>
          <span className={`text-lg font-bold font-mono ${
            similarityPercent > 70 ? 'text-emerald-400' : 
            similarityPercent > 40 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {similarityPercent.toFixed(1)}%
          </span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              similarityPercent > 70 ? 'bg-emerald-500' : 
              similarityPercent > 40 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${similarityPercent}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-500 mt-2 font-mono">
          {similarityPercent > 70 
            ? 'Theory and experiment show strong topological alignment' 
            : similarityPercent > 40
            ? 'Partial alignment detected - some topological features diverge'
            : 'Significant topological divergence - hypothesis requires revision'}
        </p>
      </div>
      
      {/* Detailed Comparison */}
      <div className="space-y-2">
        <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">Comparison Deltas</div>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <DiffItem label="Betti-0" diff={comparison.betti0Diff} />
          <DiffItem label="Betti-1" diff={comparison.betti1Diff} highlight />
          <DiffItem label="Euler χ" diff={comparison.eulerDiff} />
          <DiffItem label="Modularity" diff={comparison.modularityDiff} highlight />
        </div>
      </div>
    </div>
  );
};

interface BettiCardProps {
  label: string;
  description: string;
  value: number;
  theoreticalValue: number;
  experimentalValue: number;
  icon: React.ReactNode;
  mode: 'theory' | 'experimental';
  highlight?: boolean;
}

const BettiCard: React.FC<BettiCardProps> = ({ 
  label, 
  description, 
  value, 
  theoreticalValue, 
  experimentalValue,
  icon, 
  mode,
  highlight = false 
}) => {
  const diff = theoreticalValue - experimentalValue;
  const diffAbs = Math.abs(diff);
  
  return (
    <div className={`bg-slate-950/50 rounded-lg p-3 border ${
      highlight ? 'border-purple-500/30 shadow-[0_0_15px_-5px_rgba(168,85,247,0.4)]' : 'border-slate-800/50'
    }`}>
      <div className="flex items-center gap-2 mb-1">
        <div className={`${highlight ? 'text-purple-400' : 'text-slate-400'}`}>
          {icon}
        </div>
        <span className="text-xs font-bold text-slate-300">{label}</span>
      </div>
      <div className={`text-2xl font-bold mb-1 ${
        highlight ? 'text-purple-400' : 'text-slate-200'
      }`}>
        {value}
      </div>
      <div className="text-[10px] text-slate-500 mb-2">{description}</div>
      
      {/* Comparison indicator */}
      <div className="flex items-center gap-1 text-[10px] font-mono">
        {diffAbs < 0.5 ? (
          <>
            <Minus size={10} className="text-slate-500" />
            <span className="text-slate-500">No change</span>
          </>
        ) : diff > 0 ? (
          <>
            <TrendingDown size={10} className="text-amber-400" />
            <span className="text-amber-400">-{diffAbs.toFixed(0)} in data</span>
          </>
        ) : (
          <>
            <TrendingUp size={10} className="text-emerald-400" />
            <span className="text-emerald-400">+{diffAbs.toFixed(0)} in data</span>
          </>
        )}
      </div>
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: number;
  format: (v: number) => string;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, format }) => {
  return (
    <div className="bg-slate-950/50 rounded border border-slate-800/50 p-2">
      <div className="text-[10px] text-slate-500 font-mono mb-1">{label}</div>
      <div className="text-lg font-bold text-slate-200 font-mono">{format(value)}</div>
    </div>
  );
};

interface DiffItemProps {
  label: string;
  diff: number;
  highlight?: boolean;
}

const DiffItem: React.FC<DiffItemProps> = ({ label, diff, highlight = false }) => {
  return (
    <div className={`flex justify-between p-2 rounded ${
      highlight ? 'bg-purple-500/5' : 'bg-slate-800/30'
    }`}>
      <span className="text-slate-400">{label}:</span>
      <span className={`font-bold ${
        diff < 0.5 ? 'text-emerald-400' : diff < 2 ? 'text-amber-400' : 'text-red-400'
      }`}>
        Δ{diff.toFixed(2)}
      </span>
    </div>
  );
};

export default BettiNumberAnalyzer;
