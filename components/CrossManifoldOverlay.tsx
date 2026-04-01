import React, { useMemo, useState } from 'react';
import { Brain, Dna, GitMerge, TrendingDown, TrendingUp } from 'lucide-react';
import { 
  adjacencyToEmbedding, 
  generateNeuralManifold, 
  procrustesAlignment,
  calculateManifoldSimilarity,
  ManifoldPoint 
} from '../utils/manifoldAlignment';

interface CrossManifoldOverlayProps {
  genomicAdjacency: number[][];
}

const CrossManifoldOverlay: React.FC<CrossManifoldOverlayProps> = ({ genomicAdjacency }) => {
  const [viewMode, setViewMode] = useState<'split' | 'overlay'>('split');
  
  // Generate neural manifold (simulated)
  const neuralAdjacency = useMemo(() => {
    return generateNeuralManifold(genomicAdjacency.length);
  }, [genomicAdjacency.length]);
  
  // Convert both to 2D embeddings
  const genomicEmbedding = useMemo(() => {
    return adjacencyToEmbedding(genomicAdjacency, 2);
  }, [genomicAdjacency]);
  
  const neuralEmbedding = useMemo(() => {
    return adjacencyToEmbedding(neuralAdjacency, 2);
  }, [neuralAdjacency]);
  
  // Perform Procrustes alignment
  const alignment = useMemo(() => {
    return procrustesAlignment(neuralEmbedding, genomicEmbedding);
  }, [neuralEmbedding, genomicEmbedding]);
  
  const similarityScore = useMemo(() => {
    return calculateManifoldSimilarity(alignment);
  }, [alignment]);
  
  // Determine if alignment validates hypothesis
  const isValidating = similarityScore > 60;
  
  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <GitMerge size={16} className="text-cyan-400" />
          <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Cross-Manifold Analysis (Bach Test)
          </span>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
          isValidating 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
        }`}>
          {isValidating ? 'ALIGNMENT OK' : 'PARTIAL ALIGNMENT'}
        </div>
      </div>
      
      {/* Info Banner */}
      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 flex gap-3">
        <GitMerge size={16} className="text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-cyan-300/90 font-mono leading-relaxed">
          <strong className="text-cyan-200">Hypothesis:</strong> Cortical connectivity is a projection of genomic topology. 
          Low alignment error confirms biological "software" is constrained by topological "firmware."
        </div>
      </div>
      
      {/* View Mode Toggle */}
      <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
        <button 
          onClick={() => setViewMode('split')}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all text-xs font-bold ${
            viewMode === 'split' 
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Brain size={14} /> SPLIT VIEW
        </button>
        <button 
          onClick={() => setViewMode('overlay')}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all text-xs font-bold ${
            viewMode === 'overlay' 
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          <GitMerge size={14} /> OVERLAY
        </button>
      </div>
      
      {/* Visualization Area */}
      <div className="bg-slate-950/50 rounded-lg border border-slate-800/50 p-4" style={{ height: '300px' }}>
        {viewMode === 'split' ? (
          <div className="grid grid-cols-2 gap-4 h-full">
            <ManifoldView 
              points={genomicEmbedding} 
              color="#10b981" 
              label="Genomic Manifold"
              icon={<Dna size={14} />}
            />
            <ManifoldView 
              points={neuralEmbedding} 
              color="#3b82f6" 
              label="Neural Manifold"
              icon={<Brain size={14} />}
            />
          </div>
        ) : (
          <OverlayView 
            genomicPoints={genomicEmbedding}
            neuralPoints={neuralEmbedding}
          />
        )}
      </div>
      
      {/* Alignment Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Alignment Error"
          value={alignment.alignmentError}
          format={(v) => v.toFixed(3)}
          icon={<TrendingDown size={12} className="text-emerald-400" />}
          good={alignment.alignmentError < 2}
        />
        <MetricCard
          label="Correlation"
          value={alignment.correlationCoefficient}
          format={(v) => v.toFixed(3)}
          icon={<TrendingUp size={12} className="text-cyan-400" />}
          good={alignment.correlationCoefficient > 0.5}
        />
        <MetricCard
          label="Scale Factor"
          value={alignment.scaleFactor}
          format={(v) => v.toFixed(2) + '×'}
          icon={<GitMerge size={12} className="text-purple-400" />}
          good={Math.abs(alignment.scaleFactor - 1) < 0.5}
        />
        <MetricCard
          label="Similarity"
          value={similarityScore}
          format={(v) => v.toFixed(1) + '%'}
          icon={<Brain size={12} className="text-indigo-400" />}
          good={similarityScore > 60}
        />
      </div>
      
      {/* Interpretation */}
      <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50">
        <div className="text-xs font-mono text-slate-300 leading-relaxed">
          {similarityScore > 80 ? (
            <>
              <span className="text-emerald-400 font-bold">Strong Alignment:</span> Neural and genomic 
              manifolds show significant structural similarity, supporting the hypothesis that cortical 
              organization reflects genomic topology.
            </>
          ) : similarityScore > 60 ? (
            <>
              <span className="text-cyan-400 font-bold">Moderate Alignment:</span> Partial correspondence 
              detected between manifolds. Some topological constraints appear shared, but divergence suggests 
              additional epigenetic factors.
            </>
          ) : (
            <>
              <span className="text-amber-400 font-bold">Weak Alignment:</span> Limited structural similarity. 
              Neural connectivity may be driven more by developmental plasticity than genomic constraints.
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface ManifoldViewProps {
  points: ManifoldPoint[];
  color: string;
  label: string;
  icon: React.ReactNode;
}

const ManifoldView: React.FC<ManifoldViewProps> = ({ points, color, label, icon }) => {
  // Normalize points for visualization
  const normalized = useMemo(() => {
    const allX = points.map(p => p.coordinates[0]);
    const allY = points.map(p => p.coordinates[1]);
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);
    const rangeX = maxX - minX;
    const rangeY = maxY - minY;
    
    return points.map(p => ({
      x: ((p.coordinates[0] - minX) / rangeX) * 90 + 5,
      y: ((p.coordinates[1] - minY) / rangeY) * 90 + 5
    }));
  }, [points]);
  
  return (
    <div className="relative h-full flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-bold text-slate-300">{label}</span>
      </div>
      <div className="flex-1 relative bg-slate-900/50 rounded border border-slate-800">
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0">
          {/* Sample subset of points for performance */}
          {normalized.filter((_, i) => i % 2 === 0).map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="0.8"
              fill={color}
              opacity="0.6"
            />
          ))}
        </svg>
      </div>
    </div>
  );
};

interface OverlayViewProps {
  genomicPoints: ManifoldPoint[];
  neuralPoints: ManifoldPoint[];
}

const OverlayView: React.FC<OverlayViewProps> = ({ genomicPoints, neuralPoints }) => {
  // Normalize both sets
  const normalizePoints = (points: ManifoldPoint[]) => {
    const allX = points.map(p => p.coordinates[0]);
    const allY = points.map(p => p.coordinates[1]);
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);
    const rangeX = maxX - minX;
    const rangeY = maxY - minY;
    
    return points.map(p => ({
      x: ((p.coordinates[0] - minX) / rangeX) * 90 + 5,
      y: ((p.coordinates[1] - minY) / rangeY) * 90 + 5
    }));
  };
  
  const genomic = normalizePoints(genomicPoints);
  const neural = normalizePoints(neuralPoints);
  
  return (
    <div className="relative h-full flex flex-col">
      <div className="flex items-center justify-center gap-4 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-xs font-bold text-slate-400">Genomic</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-xs font-bold text-slate-400">Neural</span>
        </div>
      </div>
      <div className="flex-1 relative bg-slate-900/50 rounded border border-slate-800">
        <svg width="100%" height="100%" viewBox="0 0 100 100" className="absolute inset-0">
          {/* Genomic points */}
          {genomic.filter((_, i) => i % 2 === 0).map((p, i) => (
            <circle
              key={`g-${i}`}
              cx={p.x}
              cy={p.y}
              r="0.8"
              fill="#10b981"
              opacity="0.4"
            />
          ))}
          {/* Neural points */}
          {neural.filter((_, i) => i % 2 === 0).map((p, i) => (
            <circle
              key={`n-${i}`}
              cx={p.x}
              cy={p.y}
              r="0.8"
              fill="#3b82f6"
              opacity="0.4"
            />
          ))}
        </svg>
      </div>
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: number;
  format: (v: number) => string;
  icon: React.ReactNode;
  good: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, format, icon, good }) => {
  return (
    <div className={`bg-slate-950/50 rounded border p-2 ${
      good ? 'border-emerald-500/20' : 'border-slate-800/50'
    }`}>
      <div className="flex items-center gap-1 mb-1">
        {icon}
        <span className="text-[10px] text-slate-500 font-mono">{label}</span>
      </div>
      <div className={`text-sm font-bold font-mono ${
        good ? 'text-emerald-400' : 'text-slate-300'
      }`}>
        {format(value)}
      </div>
    </div>
  );
};

export default CrossManifoldOverlay;
