import React, { useMemo } from 'react';
import { Flame, TrendingUp, TrendingDown, AlertCircle, Activity } from 'lucide-react';
import { 
  calculateVariationalFreeEnergy, 
  generateFreeEnergyHeatMap,
  normalizeHeatMap,
  calculateFreeEnergyGradient,
  FreeEnergyMetrics 
} from '../utils/freeEnergy';

interface ThermodynamicLossVisualizerProps {
  adjacency: number[][];
}

const ThermodynamicLossVisualizer: React.FC<ThermodynamicLossVisualizerProps> = ({ adjacency }) => {
  
  // Calculate free energy metrics
  const metrics = useMemo(() => {
    return calculateVariationalFreeEnergy(adjacency);
  }, [adjacency]);
  
  // Generate heat map
  const heatMap = useMemo(() => {
    const rawHeatMap = generateFreeEnergyHeatMap(adjacency);
    return normalizeHeatMap(rawHeatMap);
  }, [adjacency]);
  
  // Calculate gradient (instability measure)
  const gradient = useMemo(() => {
    return calculateFreeEnergyGradient(heatMap, adjacency.length);
  }, [heatMap, adjacency.length]);
  
  // Determine overall status
  const freeEnergyLevel = metrics.totalFreeEnergy < 1.5 ? 'low' : metrics.totalFreeEnergy < 3.0 ? 'medium' : 'high';
  
  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-orange-400" />
          <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Free Energy Principle (Thermodynamics)
          </span>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
          freeEnergyLevel === 'low' 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            : freeEnergyLevel === 'medium'
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            : 'bg-red-500/10 text-red-400 border-red-500/30'
        }`}>
          {freeEnergyLevel.toUpperCase()} FE
        </div>
      </div>
      
      {/* Info Banner */}
      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 flex gap-3">
        <Flame size={16} className="text-orange-400 shrink-0 mt-0.5" />
        <div className="text-xs text-orange-300/90 font-mono leading-relaxed">
          <strong className="text-orange-200">Principle:</strong> Genome folds to minimize variational free energy 
          (surprise) relative to evolutionary priors. Low FE = structure that "expects" the biospheric data horizon.
        </div>
      </div>
      
      {/* Heat Map Visualization */}
      <div className="relative">
        <div className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-2">
          Free Energy Heat Map
        </div>
        <div className="bg-slate-950/50 rounded-lg border border-slate-800/50 p-2" style={{ height: '200px' }}>
          <HeatMapCanvas heatMap={heatMap} size={adjacency.length} />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-mono">
          <span>Low Free Energy (Stable)</span>
          <span>High Free Energy (Unstable)</span>
        </div>
        <div className="h-2 w-full rounded-full overflow-hidden mt-1 bg-gradient-to-r from-blue-600 via-yellow-500 to-red-600"></div>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Total Free Energy"
          value={metrics.totalFreeEnergy}
          format={(v) => v.toFixed(3)}
          icon={<Flame size={12} className="text-orange-400" />}
          trend={metrics.totalFreeEnergy < 2 ? 'good' : 'bad'}
        />
        <MetricCard
          label="Surprise (Error)"
          value={metrics.predictionError}
          format={(v) => (v * 100).toFixed(1) + '%'}
          icon={<AlertCircle size={12} className="text-amber-400" />}
          trend={metrics.predictionError < 0.3 ? 'good' : 'bad'}
        />
        <MetricCard
          label="Complexity"
          value={metrics.complexity}
          format={(v) => v.toFixed(3)}
          icon={<Activity size={12} className="text-purple-400" />}
          trend="neutral"
        />
        <MetricCard
          label="Accuracy"
          value={metrics.accuracy}
          format={(v) => (v * 100).toFixed(1) + '%'}
          icon={<TrendingUp size={12} className="text-emerald-400" />}
          trend={metrics.accuracy > 0.7 ? 'good' : 'bad'}
        />
      </div>
      
      {/* Additional Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <InfoCard
          label="Entropy Rate"
          value={metrics.entropyRate.toFixed(2) + ' bits'}
          color="cyan"
        />
        <InfoCard
          label="Structural Gradient"
          value={gradient.toFixed(3)}
          color="purple"
        />
      </div>
      
      {/* Interpretation */}
      <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50">
        <div className="text-xs font-mono text-slate-300 leading-relaxed">
          {freeEnergyLevel === 'low' ? (
            <>
              <span className="text-emerald-400 font-bold">Optimal Structure:</span> Low free energy indicates 
              the genome has folded into a configuration that minimizes "surprise" - matching expected patterns 
              from evolutionary history. TAD structures efficiently encode regulatory logic.
            </>
          ) : freeEnergyLevel === 'medium' ? (
            <>
              <span className="text-amber-400 font-bold">Suboptimal Structure:</span> Moderate free energy suggests 
              some regions deviate from optimal folding. May indicate developmental transitions or response to 
              environmental signals requiring structural plasticity.
            </>
          ) : (
            <>
              <span className="text-red-400 font-bold">High Entropy State:</span> Elevated free energy indicates 
              structural disorder. This configuration has high "surprise" - doesn't match evolutionary priors. 
              Could indicate pathological state or early developmental stage.
            </>
          )}
        </div>
      </div>
      
      {/* Formula Display */}
      <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50">
        <div className="text-[10px] font-mono text-slate-500 mb-1">VARIATIONAL FREE ENERGY</div>
        <div className="text-sm font-mono text-slate-300">
          F = Complexity - Accuracy + Surprise
        </div>
        <div className="text-[10px] font-mono text-slate-500 mt-1">
          Minimizing F → Structure that "expects" its environment
        </div>
      </div>
    </div>
  );
};

interface HeatMapCanvasProps {
  heatMap: Array<{ row: number; col: number; freeEnergy: number }>;
  size: number;
}

const HeatMapCanvas: React.FC<HeatMapCanvasProps> = ({ heatMap, size }) => {
  // Downsample for visualization
  const displaySize = 64;
  const scale = size / displaySize;
  
  // Aggregate into display grid
  const displayGrid = Array(displaySize).fill(0).map(() => Array(displaySize).fill(0));
  const counts = Array(displaySize).fill(0).map(() => Array(displaySize).fill(0));
  
  heatMap.forEach(cell => {
    const displayRow = Math.floor(cell.row / scale);
    const displayCol = Math.floor(cell.col / scale);
    
    if (displayRow < displaySize && displayCol < displaySize) {
      displayGrid[displayRow][displayCol] += cell.freeEnergy;
      counts[displayRow][displayCol]++;
    }
  });
  
  // Average
  for (let i = 0; i < displaySize; i++) {
    for (let j = 0; j < displaySize; j++) {
      if (counts[i][j] > 0) {
        displayGrid[i][j] /= counts[i][j];
      }
    }
  }
  
  const cellSize = 100 / displaySize;
  
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" className="w-full h-full">
      {displayGrid.map((row, i) => 
        row.map((value, j) => {
          // Color based on free energy
          const hue = 240 - value * 240; // Blue (240) to Red (0)
          const color = `hsl(${hue}, 70%, 50%)`;
          
          return (
            <rect
              key={`${i}-${j}`}
              x={j * cellSize}
              y={i * cellSize}
              width={cellSize}
              height={cellSize}
              fill={color}
              opacity={0.8}
            />
          );
        })
      )}
    </svg>
  );
};

interface MetricCardProps {
  label: string;
  value: number;
  format: (v: number) => string;
  icon: React.ReactNode;
  trend: 'good' | 'bad' | 'neutral';
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, format, icon, trend }) => {
  const trendIcon = trend === 'good' ? <TrendingDown size={10} className="text-emerald-400" /> :
                    trend === 'bad' ? <TrendingUp size={10} className="text-red-400" /> : null;
  
  return (
    <div className={`bg-slate-950/50 rounded border p-2 ${
      trend === 'good' ? 'border-emerald-500/20' : 
      trend === 'bad' ? 'border-red-500/20' : 'border-slate-800/50'
    }`}>
      <div className="flex items-center gap-1 mb-1">
        {icon}
        <span className="text-[10px] text-slate-500 font-mono">{label}</span>
        {trendIcon}
      </div>
      <div className={`text-sm font-bold font-mono ${
        trend === 'good' ? 'text-emerald-400' : 
        trend === 'bad' ? 'text-red-400' : 'text-slate-300'
      }`}>
        {format(value)}
      </div>
    </div>
  );
};

interface InfoCardProps {
  label: string;
  value: string;
  color: 'cyan' | 'purple';
}

const InfoCard: React.FC<InfoCardProps> = ({ label, value, color }) => {
  const colorClasses = {
    cyan: 'text-cyan-400',
    purple: 'text-purple-400'
  };
  
  return (
    <div className="bg-slate-950/50 rounded border border-slate-800/50 p-2">
      <div className="text-[10px] text-slate-500 font-mono mb-1">{label}</div>
      <div className={`text-sm font-bold font-mono ${colorClasses[color]}`}>{value}</div>
    </div>
  );
};

export default ThermodynamicLossVisualizer;
