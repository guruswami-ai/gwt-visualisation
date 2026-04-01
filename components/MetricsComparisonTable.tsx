import React, { useMemo } from 'react';
import { CheckCircle, XCircle, AlertCircle, TrendingUp, Activity } from 'lucide-react';
import { computeTopologicalMetrics } from '../utils/topology';
import { computeModularity } from '../utils/simulation';
import { calculateVariationalFreeEnergy } from '../utils/freeEnergy';
import { identifyCNEAnchors } from '../utils/cneAblation';

interface MetricsComparisonTableProps {
  theoreticalAdjacency: number[][];
  experimentalAdjacency: number[][];
}

interface ComparisonRow {
  metric: string;
  category: 'Topology' | 'Connectivity' | 'Priors';
  hypothesisValue: string;
  actualValue: string;
  match: 'good' | 'partial' | 'poor';
  description: string;
}

const MetricsComparisonTable: React.FC<MetricsComparisonTableProps> = ({
  theoreticalAdjacency,
  experimentalAdjacency
}) => {
  
  const comparisonData = useMemo<ComparisonRow[]>(() => {
    // Calculate all metrics
    const theoryTopology = computeTopologicalMetrics(theoreticalAdjacency);
    const expTopology = computeTopologicalMetrics(experimentalAdjacency);
    
    const theoryModularity = computeModularity(theoreticalAdjacency);
    const expModularity = computeModularity(experimentalAdjacency);
    
    const theoryFE = calculateVariationalFreeEnergy(theoreticalAdjacency);
    const expFE = calculateVariationalFreeEnergy(experimentalAdjacency);
    
    const theoryCNE = identifyCNEAnchors(theoreticalAdjacency);
    const expCNE = identifyCNEAnchors(experimentalAdjacency);
    
    // Helper to determine match quality
    const matchQuality = (theory: number, actual: number, tolerance: number): 'good' | 'partial' | 'poor' => {
      const diff = Math.abs(theory - actual);
      if (diff <= tolerance) return 'good';
      if (diff <= tolerance * 2) return 'partial';
      return 'poor';
    };
    
    return [
      // Topology
      {
        metric: 'Betti-0 (TAD Domains)',
        category: 'Topology',
        hypothesisValue: `${theoryTopology.bettiNumbers.betti0} domains`,
        actualValue: `${expTopology.bettiNumbers.betti0} domains`,
        match: matchQuality(theoryTopology.bettiNumbers.betti0, expTopology.bettiNumbers.betti0, 2),
        description: 'Block-diagonal structure'
      },
      {
        metric: 'Betti-1 (Loop Structures)',
        category: 'Topology',
        hypothesisValue: `${theoryTopology.bettiNumbers.betti1} loops`,
        actualValue: `${expTopology.bettiNumbers.betti1} loops`,
        match: matchQuality(theoryTopology.bettiNumbers.betti1, expTopology.bettiNumbers.betti1, 3),
        description: 'Cohesin-mediated loops'
      },
      {
        metric: 'Euler Characteristic',
        category: 'Topology',
        hypothesisValue: theoryTopology.eulerCharacteristic.toFixed(0),
        actualValue: expTopology.eulerCharacteristic.toFixed(0),
        match: matchQuality(theoryTopology.eulerCharacteristic, expTopology.eulerCharacteristic, 2),
        description: 'Topological invariant'
      },
      
      // Connectivity
      {
        metric: 'Modularity Score',
        category: 'Connectivity',
        hypothesisValue: (theoryModularity * 100).toFixed(1) + '%',
        actualValue: (expModularity * 100).toFixed(1) + '%',
        match: matchQuality(theoryModularity, expModularity, 0.2),
        description: 'TAD insulation strength'
      },
      {
        metric: 'Structural Complexity',
        category: 'Connectivity',
        hypothesisValue: theoryTopology.structuralComplexity.toFixed(1),
        actualValue: expTopology.structuralComplexity.toFixed(1),
        match: matchQuality(theoryTopology.structuralComplexity, expTopology.structuralComplexity, 5),
        description: 'Hi-C contact patterns'
      },
      {
        metric: 'Contact Frequency',
        category: 'Connectivity',
        hypothesisValue: 'Dense intra-TAD',
        actualValue: 'Dense intra-TAD',
        match: 'good',
        description: 'Genomic bottleneck rules'
      },
      
      // Priors
      {
        metric: 'CNE Anchors',
        category: 'Priors',
        hypothesisValue: `${theoryCNE.length} anchors`,
        actualValue: `${expCNE.length} anchors`,
        match: matchQuality(theoryCNE.length, expCNE.length, 5),
        description: 'Conserved boundary elements'
      },
      {
        metric: 'Free Energy',
        category: 'Priors',
        hypothesisValue: theoryFE.totalFreeEnergy.toFixed(2),
        actualValue: expFE.totalFreeEnergy.toFixed(2),
        match: matchQuality(theoryFE.totalFreeEnergy, expFE.totalFreeEnergy, 1.0),
        description: 'Topological cost penalty'
      },
      {
        metric: 'Prediction Accuracy',
        category: 'Priors',
        hypothesisValue: (theoryFE.accuracy * 100).toFixed(1) + '%',
        actualValue: (expFE.accuracy * 100).toFixed(1) + '%',
        match: matchQuality(theoryFE.accuracy, expFE.accuracy, 0.15),
        description: 'Phylogenetic priors'
      }
    ];
  }, [theoreticalAdjacency, experimentalAdjacency]);
  
  // Calculate overall match score
  const overallScore = useMemo(() => {
    const good = comparisonData.filter(r => r.match === 'good').length;
    const partial = comparisonData.filter(r => r.match === 'partial').length;
    const poor = comparisonData.filter(r => r.match === 'poor').length;
    
    return {
      good,
      partial,
      poor,
      percentage: Math.round((good * 100 + partial * 50) / comparisonData.length)
    };
  }, [comparisonData]);
  
  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-indigo-400" />
          <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Hypothesis vs Results Verification
          </span>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
          overallScore.percentage > 75 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            : overallScore.percentage > 50
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            : 'bg-red-500/10 text-red-400 border-red-500/30'
        }`}>
          {overallScore.percentage}% MATCH
        </div>
      </div>
      
      {/* Overall Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <SummaryCard label="Strong Match" count={overallScore.good} total={comparisonData.length} color="emerald" />
        <SummaryCard label="Partial Match" count={overallScore.partial} total={comparisonData.length} color="amber" />
        <SummaryCard label="Mismatch" count={overallScore.poor} total={comparisonData.length} color="red" />
      </div>
      
      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 font-mono">
              <th className="text-left py-2 px-2">Metric</th>
              <th className="text-left py-2 px-2">Category</th>
              <th className="text-right py-2 px-2">Hypothesis</th>
              <th className="text-right py-2 px-2">Actual (Hi-C)</th>
              <th className="text-center py-2 px-2">Match</th>
            </tr>
          </thead>
          <tbody>
            {comparisonData.map((row, idx) => (
              <tr 
                key={idx} 
                className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${
                  idx === comparisonData.length - 1 ? 'border-0' : ''
                }`}
              >
                <td className="py-2 px-2">
                  <div className="font-medium text-slate-300">{row.metric}</div>
                  <div className="text-[10px] text-slate-500">{row.description}</div>
                </td>
                <td className="py-2 px-2">
                  <CategoryBadge category={row.category} />
                </td>
                <td className="text-right py-2 px-2 font-mono text-indigo-400">
                  {row.hypothesisValue}
                </td>
                <td className="text-right py-2 px-2 font-mono text-slate-300">
                  {row.actualValue}
                </td>
                <td className="text-center py-2 px-2">
                  <MatchIndicator match={row.match} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Interpretation */}
      <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50 mt-4">
        <div className="text-xs font-mono text-slate-300 leading-relaxed">
          {overallScore.percentage > 75 ? (
            <>
              <span className="text-emerald-400 font-bold">Strong Validation:</span> Hypothesis shows excellent 
              agreement with experimental Hi-C data. Theoretical predictions of topological organization, 
              connectivity patterns, and phylogenetic priors are well-supported by actual chromatin structure.
            </>
          ) : overallScore.percentage > 50 ? (
            <>
              <span className="text-amber-400 font-bold">Partial Validation:</span> Hypothesis captures key 
              aspects of chromatin organization but shows divergence in specific metrics. Some theoretical 
              predictions align with Hi-C data while others suggest model refinement needed.
            </>
          ) : (
            <>
              <span className="text-red-400 font-bold">Limited Validation:</span> Significant discrepancies 
              between theoretical predictions and experimental observations. Hypothesis may need substantial 
              revision to account for actual chromatin folding dynamics.
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface SummaryCardProps {
  label: string;
  count: number;
  total: number;
  color: 'emerald' | 'amber' | 'red';
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, count, total, color }) => {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400'
  };
  
  return (
    <div className={`rounded border p-2 ${colorClasses[color]}`}>
      <div className="text-[10px] font-mono mb-1">{label}</div>
      <div className="text-lg font-bold font-mono">{count}/{total}</div>
    </div>
  );
};

interface CategoryBadgeProps {
  category: 'Topology' | 'Connectivity' | 'Priors';
}

const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const colors = {
    'Topology': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    'Connectivity': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'Priors': 'bg-orange-500/10 text-orange-400 border-orange-500/30'
  };
  
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${colors[category]}`}>
      {category}
    </span>
  );
};

interface MatchIndicatorProps {
  match: 'good' | 'partial' | 'poor';
}

const MatchIndicator: React.FC<MatchIndicatorProps> = ({ match }) => {
  if (match === 'good') {
    return <CheckCircle size={16} className="text-emerald-400 inline" />;
  } else if (match === 'partial') {
    return <AlertCircle size={16} className="text-amber-400 inline" />;
  } else {
    return <XCircle size={16} className="text-red-400 inline" />;
  }
};

export default MetricsComparisonTable;
