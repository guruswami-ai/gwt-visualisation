import React, { useState, useMemo } from 'react';
import { Scissors, AlertTriangle, TrendingUp, Activity, Shield, Zap, Info } from 'lucide-react';
import { 
  identifyCNEAnchors, 
  applyAblation, 
  computeAblationMetrics, 
  CNEAnchor,
  AblationMetrics 
} from '../utils/cneAblation';
import { computeModularity } from '../utils/simulation';

interface CNEAblationToolProps {
  adjacency: number[][];
  onAblatedAdjacencyChange?: (ablated: number[][]) => void;
}

const CNEAblationTool: React.FC<CNEAblationToolProps> = ({ adjacency, onAblatedAdjacencyChange }) => {
  const [ablationStrength, setAblationStrength] = useState(0.8);
  
  // Identify CNE anchors from adjacency matrix
  const cneAnchors = useMemo(() => {
    return identifyCNEAnchors(adjacency, 0.2);
  }, [adjacency]);
  
  // Track which anchors are active/ablated
  const [anchorStates, setAnchorStates] = useState<Map<string, boolean>>(
    new Map(cneAnchors.map(a => [a.id, true]))
  );
  
  // Compute ablated adjacency matrix
  const ablatedAdjacency = useMemo(() => {
    const updatedAnchors = cneAnchors.map(a => ({
      ...a,
      isActive: anchorStates.get(a.id) ?? true
    }));
    const ablated = applyAblation(adjacency, updatedAnchors, ablationStrength);
    onAblatedAdjacencyChange?.(ablated);
    return ablated;
  }, [adjacency, anchorStates, ablationStrength, cneAnchors, onAblatedAdjacencyChange]);
  
  // Compute metrics
  const metrics = useMemo(() => {
    const originalModularity = computeModularity(adjacency);
    const ablatedModularity = computeModularity(ablatedAdjacency);
    return computeAblationMetrics(adjacency, ablatedAdjacency, originalModularity, ablatedModularity);
  }, [adjacency, ablatedAdjacency]);
  
  // Count ablated anchors
  const ablatedCount = Array.from(anchorStates.values()).filter(v => !v).length;
  const totalCount = cneAnchors.length;
  
  // Group anchors by type
  const anchorsByType = useMemo(() => {
    return {
      boundary: cneAnchors.filter(a => a.type === 'boundary'),
      enhancer: cneAnchors.filter(a => a.type === 'enhancer'),
      promoter: cneAnchors.filter(a => a.type === 'promoter')
    };
  }, [cneAnchors]);
  
  const toggleAnchor = (anchorId: string) => {
    setAnchorStates(prev => {
      const newMap = new Map(prev);
      newMap.set(anchorId, !newMap.get(anchorId));
      return newMap;
    });
  };
  
  const toggleAllType = (type: 'boundary' | 'enhancer' | 'promoter', active: boolean) => {
    setAnchorStates(prev => {
      const newMap = new Map(prev);
      const anchorsOfType = cneAnchors.filter(a => a.type === type);
      anchorsOfType.forEach(a => newMap.set(a.id, active));
      return newMap;
    });
  };
  
  const resetAll = () => {
    setAnchorStates(new Map(cneAnchors.map(a => [a.id, true])));
  };
  
  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Scissors size={16} className="text-red-400" />
          <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            CNE Ablation Tool (Protocol B)
          </span>
        </div>
        <div className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30">
          {ablatedCount}/{totalCount} ABLATED
        </div>
      </div>
      
      {/* Info Banner */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex gap-3">
        <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
        <div className="text-xs text-red-300/90 font-mono leading-relaxed">
          <strong className="text-red-200">CRISPR Simulation:</strong> Toggle CNE anchors to "delete" them 
          and observe structural collapse. CNEs act as phylogenetic priors that minimize free energy.
        </div>
      </div>
      
      {/* Ablation Strength Control */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-300">Ablation Strength</span>
          <span className="text-sm font-bold font-mono text-slate-200">{(ablationStrength * 100).toFixed(0)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={ablationStrength}
          onChange={(e) => setAblationStrength(parseFloat(e.target.value))}
          className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500 hover:accent-red-400"
        />
      </div>
      
      {/* Anchor Type Controls */}
      <div className="space-y-2">
        <div className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-2">Anchor Types</div>
        
        <div className="grid grid-cols-1 gap-2">
          <AnchorTypeControl
            label="TAD Boundaries"
            icon={<Shield size={14} className="text-blue-400" />}
            count={anchorsByType.boundary.length}
            activeCount={anchorsByType.boundary.filter(a => anchorStates.get(a.id) ?? true).length}
            onToggleAll={(active) => toggleAllType('boundary', active)}
            color="blue"
          />
          
          <AnchorTypeControl
            label="Enhancers"
            icon={<Zap size={14} className="text-amber-400" />}
            count={anchorsByType.enhancer.length}
            activeCount={anchorsByType.enhancer.filter(a => anchorStates.get(a.id) ?? true).length}
            onToggleAll={(active) => toggleAllType('enhancer', active)}
            color="amber"
          />
        </div>
      </div>
      
      {/* Individual Anchor Toggles (Compact List) */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">Individual Anchors</div>
          <button
            onClick={resetAll}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Reset All
          </button>
        </div>
        
        <div className="bg-slate-950/50 rounded-lg border border-slate-800/50 p-2 max-h-32 overflow-y-auto space-y-1">
          {cneAnchors.slice(0, 10).map(anchor => (
            <button
              key={anchor.id}
              onClick={() => toggleAnchor(anchor.id)}
              className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs font-mono transition-colors ${
                anchorStates.get(anchor.id) ?? true
                  ? 'bg-slate-800/50 hover:bg-slate-800 text-slate-300'
                  : 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
              }`}
            >
              <span className="truncate">
                {anchor.type === 'boundary' ? '🛡️' : '⚡'} pos:{anchor.position}
              </span>
              <span className={`text-[10px] ${anchorStates.get(anchor.id) ?? true ? 'text-emerald-400' : 'text-red-400'}`}>
                {anchorStates.get(anchor.id) ?? true ? 'ACTIVE' : 'ABLATED'}
              </span>
            </button>
          ))}
          {cneAnchors.length > 10 && (
            <div className="text-center text-[10px] text-slate-500 py-1">
              +{cneAnchors.length - 10} more anchors
            </div>
          )}
        </div>
      </div>
      
      {/* Metrics Display */}
      <div className="space-y-2 pt-2 border-t border-slate-800">
        <div className="text-xs text-slate-500 font-mono uppercase tracking-wider">Impact Metrics</div>
        
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            icon={<Activity size={12} className="text-red-400" />}
            label="Entropy"
            value={metrics.structuralEntropy}
            format={(v) => v.toFixed(2)}
            trend="up"
            bad
          />
          <MetricCard
            icon={<TrendingUp size={12} className="text-amber-400" />}
            label="Noise"
            value={metrics.transcriptionalNoise}
            format={(v) => v.toFixed(2)}
            trend="up"
            bad
          />
          <MetricCard
            icon={<AlertTriangle size={12} className="text-red-400" />}
            label="Loss"
            value={metrics.connectivityLoss}
            format={(v) => v.toFixed(1) + '%'}
            trend="up"
            bad
          />
          <MetricCard
            icon={<Zap size={12} className="text-purple-400" />}
            label="Free Energy"
            value={metrics.freeEnergyIncrease}
            format={(v) => (v > 0 ? '+' : '') + v.toFixed(1) + '%'}
            trend="up"
            bad
          />
        </div>
      </div>
    </div>
  );
};

interface AnchorTypeControlProps {
  label: string;
  icon: React.ReactNode;
  count: number;
  activeCount: number;
  onToggleAll: (active: boolean) => void;
  color: 'blue' | 'amber';
}

const AnchorTypeControl: React.FC<AnchorTypeControlProps> = ({
  label,
  icon,
  count,
  activeCount,
  onToggleAll,
  color
}) => {
  const allActive = activeCount === count;
  const colorClasses = {
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400'
  };
  
  return (
    <div className={`flex items-center justify-between p-2 rounded border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <div className="text-xs font-bold">{label}</div>
          <div className="text-[10px] opacity-70">{activeCount}/{count} active</div>
        </div>
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => onToggleAll(true)}
          className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
        >
          All On
        </button>
        <button
          onClick={() => onToggleAll(false)}
          className="px-2 py-1 rounded text-[10px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
        >
          All Off
        </button>
      </div>
    </div>
  );
};

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  format: (v: number) => string;
  trend?: 'up' | 'down';
  bad?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, format, trend, bad }) => {
  return (
    <div className={`bg-slate-950/50 rounded border p-2 ${
      bad && value > 0 ? 'border-red-500/20' : 'border-slate-800/50'
    }`}>
      <div className="flex items-center gap-1 mb-1">
        {icon}
        <span className="text-[10px] text-slate-500 font-mono">{label}</span>
      </div>
      <div className={`text-sm font-bold font-mono ${
        bad && value > 0 ? 'text-red-400' : 'text-slate-300'
      }`}>
        {format(value)}
      </div>
    </div>
  );
};

export default CNEAblationTool;
