import React, { useState, useEffect, useRef } from 'react';
import { useExperiment } from './hooks/useExperiment';
import StrategyCard from './components/StrategyCard';
import ThesisMeter from './components/ThesisMeter';
import Heatmap from './components/Heatmap';
import DNAVisualizer from './components/DNAVisualizer';
import ResearchManifesto from './components/ResearchManifesto';
import ClusterMonitor from './components/ClusterMonitor';
import TelemetrySetup from './components/TelemetrySetup';
import GameOfLifeBackground from './components/GameOfLifeBackground';
import { StrategyType, StrategyData } from './types';
import { Activity, Terminal, Play, Pause, RotateCcw, BarChart3, Zap, Cpu, Lock, Globe, Code2, Flame, Snowflake, RefreshCw, Atom, Dna, Brain, Network, FileText, Box, Grid, Timer, History, Database, AlertTriangle, Users, Settings } from 'lucide-react';

const EvolutionTicker = ({ generation }: { generation: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animate the DNA spinning based on the generation count
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear frame
    ctx.clearRect(0, 0, 48, 48);
    
    const centerX = 24;
    const amplitude = 14;
    // Map generation count to phase angle. 
    // Faster generations = faster spin.
    const phase = generation * 0.2; 
    const frequency = 0.2;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // Draw base pairs vertically
    for (let y = 6; y <= 42; y += 5) {
        // Calculate strand positions
        const x1 = centerX + Math.sin(y * frequency + phase) * amplitude;
        const x2 = centerX + Math.sin(y * frequency + phase + Math.PI) * amplitude;
        
        // Z-depth simulation for opacity (items in back are dimmer)
        const depth = Math.cos(y * frequency + phase);
        
        // Draw Connector (Base Pair)
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.strokeStyle = `rgba(99, 102, 241, ${0.3 + (depth + 1) * 0.2})`; // Indigo, varying opacity
        ctx.stroke();

        // Draw Strand Dots
        // Strand 1
        ctx.beginPath();
        ctx.arc(x1, y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(165, 180, 252, ${(depth + 1.5) / 2.5})`; // Light Indigo
        ctx.fill();

        // Strand 2
        ctx.beginPath();
        ctx.arc(x2, y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(224, 231, 255, ${(-depth + 1.5) / 2.5})`; // Lighter Indigo
        ctx.fill();
    }

  }, [generation]);

  return (
    <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-lg border border-slate-800/50 shadow-lg relative z-20">
      {/* Animated DNA Canvas */}
      <div className="relative w-12 h-12 flex items-center justify-center bg-slate-950/50 rounded-lg border border-indigo-500/10 shadow-inner">
         <canvas ref={canvasRef} width={48} height={48} />
      </div>

      <div className="flex flex-col">
         <span className="text-[10px] text-indigo-400 font-mono leading-tight tracking-wider uppercase mb-1">Current Epoch</span>
         <span className="text-2xl font-bold text-slate-100 leading-none font-mono tracking-tight tabular-nums">
            {generation.toString().padStart(6, '0')}
         </span>
         <div className="h-1 w-full bg-slate-800 mt-2 overflow-hidden rounded-full relative">
             <div 
               className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-100" 
               style={{ width: `${(generation % 100)}%` }}
             />
         </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { state, togglePause, resetExperiment, setTelemetryMode, setSimulationDelay, togglePlaybackMode } = useExperiment();
  const [showManifesto, setShowManifesto] = useState(false);
  const [showTelemetrySetup, setShowTelemetrySetup] = useState(false);
  const [visualMode, setVisualMode] = useState<'heatmap' | '3d'>('3d');

  if (!state) return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-emerald-500 font-mono gap-4">
        <Activity className="animate-spin" size={32} />
        <span className="animate-pulse">LOADING SIMULATION PARAMETERS...</span>
      </div>
  );

  const topologicalData = state.strategies[StrategyType.Topological];

  // Helper for strategy colors (matching StrategyCard)
  const getStrategyColor = (type: StrategyType) => {
    switch (type) {
      case StrategyType.Direct: return '#3b82f6';
      case StrategyType.Flat: return '#eab308';
      case StrategyType.Hierarchical: return '#a855f7';
      case StrategyType.Topological: return '#10b981';
      default: return '#cbd5e1';
    }
  };

  // Convert delay to "Speed Percentage" for UI
  const speedPercent = Math.max(0, Math.min(100, Math.round(100 - (state.simulationDelay / 500) * 100)));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30 relative overflow-hidden">
      
      {/* Background Simulation */}
      <GameOfLifeBackground />

      {/* Modals */}
      {showManifesto && <ResearchManifesto onClose={() => setShowManifesto(false)} />}
      {showTelemetrySetup && <TelemetrySetup onClose={() => setShowTelemetrySetup(false)} />}

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-900/20 rounded border border-indigo-500/20 shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)]">
                <Brain className="text-indigo-500" size={24} />
              </div>
              <div className="hidden lg:block">
                <h1 className="text-lg font-bold tracking-tight text-slate-100">Genomic Weights Experiment Visualisation</h1>
                <p className="text-xs text-indigo-400 font-mono">LAYER: RL_CONVERGENCE_PROTOCOL</p>
              </div>
            </div>

            {/* Evolution Ticker & Large Counter */}
            <EvolutionTicker generation={state.generation} />
            
            {/* Dynamic Comparison Text */}
            <div className="hidden xl:flex flex-col justify-center pl-6 border-l border-slate-800 h-10 animate-fade-in">
                <span className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-0.5">Observation Mode</span>
                <span className={`text-base font-bold tracking-tight transition-all duration-300 ${state.playbackMode === 'theory' ? 'text-indigo-200' : 'text-emerald-200'}`}>
                    {state.playbackMode === 'theory' ? "What our theory suggests..." : "What actually happened..."}
                </span>
            </div>
          </div>
          
          <div className="flex items-center gap-6 font-mono text-sm">
             {/* Simple Header Controls */}
             <div className="flex items-center gap-4">
                <button 
                    onClick={() => setShowManifesto(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/80 text-slate-300 rounded-full border border-slate-700 transition-all hover:border-slate-500"
                    title="View Research Manifesto"
                >
                    <FileText size={16} />
                    <span className="hidden sm:inline">Project Manifesto</span>
                </button>
             </div>

            <div className="flex flex-col items-end border-l border-slate-800 pl-6">
              <span className="text-slate-500 text-xs">MODEL_STATUS</span>
              <span className="text-slate-200 flex items-center gap-2 text-xs sm:text-sm">
                {state.playbackMode === 'experimental' ? 'REPLAYING' : 'LEARNING'}
                <span className={`w-2 h-2 rounded-full ${state.playbackMode === 'experimental' ? 'bg-emerald-500 shadow-[0_0_8px_emerald]' : 'bg-indigo-500 shadow-[0_0_8px_indigo]'} animate-pulse`} />
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* LEFT COLUMN: Controls & Metrics (1/3 Width) */}
        <div className="space-y-6 order-2 lg:order-1">
          
          {/* Main Control Deck */}
          <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-5 space-y-4">
             <div className="flex items-center justify-between text-slate-400 text-sm uppercase tracking-wider font-semibold border-b border-slate-800 pb-2">
                 <div className="flex items-center gap-2"><Settings size={16} /> Simulation Control</div>
             </div>
             
             {/* Mode Switcher */}
             <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button 
                    onClick={() => togglePlaybackMode('theory')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all text-xs font-bold ${
                        state.playbackMode === 'theory' 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                    }`}
                >
                    <Cpu size={14} /> THEORY
                </button>
                <button 
                    onClick={() => togglePlaybackMode('experimental')}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all text-xs font-bold ${
                        state.playbackMode === 'experimental' 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                    }`}
                >
                    <Database size={14} /> RESULTS
                </button>
             </div>

             {/* Playback Controls */}
             <div className="flex items-center gap-2">
                 <button 
                    onClick={togglePause}
                    className={`flex-1 h-10 flex items-center justify-center gap-2 rounded-lg font-bold text-sm transition-all border ${
                        state.isRunning 
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20' 
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20'
                    }`}
                 >
                     {state.isRunning ? <><Pause size={16} /> PAUSE</> : <><Play size={16} /> START</>}
                 </button>
                 
                 <button 
                    onClick={resetExperiment}
                    className="h-10 px-4 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all"
                    title={state.playbackMode === 'experimental' ? "Replay Data" : "Reset Simulation"}
                 >
                     <RotateCcw size={16} />
                 </button>
             </div>

             {/* Speed Control */}
             <div>
                 <div className="flex justify-between items-center mb-2">
                     <span className="text-[10px] font-mono text-slate-500">EVOLUTION SPEED</span>
                     <span className="text-[10px] font-mono text-indigo-400">{speedPercent}%</span>
                 </div>
                 <input 
                    type="range" min="0" max="500" step="10" 
                    value={500 - state.simulationDelay}
                    onChange={(e) => setSimulationDelay(500 - parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                 />
             </div>
          </div>

          {/* Thesis Meter */}
          <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-5">
            <div className="mb-2 flex justify-between items-end">
              <span className="text-sm font-bold text-slate-300">
                  {state.playbackMode === 'experimental' ? 'Hypothesis Result' : 'Convergence Goal'}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                  {state.playbackMode === 'experimental' ? 'REJECTED' : 'GLOBAL OPTIMUM'}
              </span>
            </div>
            
            <ThesisMeter 
                progress={state.playbackMode === 'experimental' ? 100 : state.metrics.thesisProgress} 
                status={state.playbackMode === 'experimental' ? 'rejected' : 'active'}
            />
          </div>

          <div className="flex justify-between items-center text-slate-400 text-sm uppercase tracking-wider font-semibold">
            <span className="flex items-center gap-2"><Network size={16} /> Active Policy Networks</span>
            <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 border border-slate-800 px-2 py-0.5 rounded-full">
                <Users size={10} /> POPULATION: 50
            </span>
          </div>
          {/* Changed to 1 column for the sidebar layout */}
          <div className="grid grid-cols-1 gap-4">
            {Object.values(state.strategies).map((strategy: StrategyData) => (
              <StrategyCard key={strategy.type} data={strategy} />
            ))}
          </div>

          <ClusterMonitor 
            nodes={state.cluster} 
            mode={state.telemetryMode}
            isConnected={state.isLocalConnected}
            onToggleMode={setTelemetryMode}
            onOpenSetup={() => setShowTelemetrySetup(true)}
          />

        </div>

        {/* RIGHT COLUMN: Visualization Hero (2/3 Width) */}
        <div className="space-y-6 flex flex-col order-1 lg:order-2 lg:col-span-2">
           
           {/* MOVED: Reinforcement Metrics Table */}
           <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4 text-slate-400 text-sm uppercase tracking-wider font-semibold">
              <BarChart3 size={16} /> Reinforcement Metrics
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-500 font-mono text-right">
                    <th className="px-2 py-2 text-left">POLICY</th>
                    <th className="px-2 py-2">RWD(μ)</th>
                    <th className="px-2 py-2">σ (Std)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(state.strategies).map((strat: StrategyData) => {
                    const history = strat.fitnessHistory;
                    const avgFit = history.length > 0 
                      ? history.reduce((a, b) => a + b, 0) / history.length 
                      : 0;
                    const variance = history.length > 0
                      ? history.reduce((a, b) => a + Math.pow(b - avgFit, 2), 0) / history.length
                      : 0;
                    const stdDev = Math.sqrt(variance);
                    
                    return (
                      <tr key={strat.type} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors last:border-0">
                        <td className="px-2 py-2 font-medium capitalize flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getStrategyColor(strat.type) }}></span>
                           <span className="truncate max-w-[80px]">{strat.type}</span>
                        </td>
                        <td className="px-2 py-2 text-right font-mono text-slate-200">
                          {strat.fitness.toFixed(1)}
                        </td>
                        <td className="px-2 py-2 text-right font-mono text-slate-500">
                          {stdDev.toFixed(1)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

           <div className="flex justify-between items-center text-slate-400 text-sm uppercase tracking-wider font-semibold">
            <div className="flex items-center gap-2"><Code2 size={16} /> Agent View (DNA)</div>
            
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-md border border-slate-800">
                <button 
                    onClick={() => setVisualMode('heatmap')}
                    className={`p-1 rounded transition-colors ${visualMode === 'heatmap' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                    title="2D Matrix Heatmap"
                >
                    <Grid size={14} />
                </button>
                <button 
                    onClick={() => setVisualMode('3d')}
                    className={`p-1 rounded transition-colors ${visualMode === '3d' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                    title="3D Polymer Folding"
                >
                    <Box size={14} />
                </button>
            </div>
          </div>
          
          <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-6 flex-1 flex flex-col gap-6 relative overflow-hidden group">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-indigo-500/10 transition-all duration-1000" />

            <div className="flex justify-between items-start z-10">
              <div>
                <h2 className="text-2xl font-bold text-indigo-400 mb-1 flex items-center gap-2">
                    Policy Network (DNA)
                    <span className={`px-1.5 py-0.5 rounded text-[10px] border animate-pulse ${
                        state.playbackMode === 'experimental' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    }`}>
                        {state.playbackMode === 'experimental' ? 'RESULTS' : 'THEORY'}
                    </span>
                </h2>
                <p className="text-sm text-slate-500 max-w-xl">
                  Visualizing the "Cohesin Ring" mechanism (Donut Shape). It extrudes the DNA loop until it hits a boundary marker (CTCF), effectively compressing the genome.
                </p>
              </div>
              
              <div className="flex gap-4">
                 <div className="p-3 bg-slate-950/80 rounded border border-slate-800 backdrop-blur-sm">
                     <div className="text-slate-500 text-xs mb-1 flex items-center gap-1"><Snowflake size={12}/> Reward Function</div>
                     <div className={`font-mono text-xl ${state.metrics.topoLead > 0 ? 'text-indigo-400' : 'text-amber-500'}`}>
                        {state.metrics.modularityScore.toFixed(3)}
                     </div>
                 </div>
                 <div className="p-3 bg-slate-950/80 rounded border border-slate-800 backdrop-blur-sm">
                     <div className="text-slate-500 text-xs mb-1 flex items-center gap-1"><Flame size={12}/> Loss (Metabolic)</div>
                     <div className="font-mono text-xl text-red-400">
                        DETECTED
                     </div>
                 </div>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center bg-slate-950/50 rounded-lg border border-slate-800/50 p-6 shadow-inner relative h-[350px] min-h-[350px] max-h-[350px]">
              {topologicalData && (
                <div className="w-full h-full absolute inset-0">
                    {visualMode === 'heatmap' ? (
                        <div className="flex items-center justify-center h-full p-4">
                             <div className="w-full max-w-[600px]">
                                <Heatmap adjacency={topologicalData.adjacency} colorBase={[99, 102, 241]} />
                             </div>
                        </div>
                    ) : (
                        <DNAVisualizer 
                            key={state.id}
                            adjacency={topologicalData.adjacency} 
                            colorBase={[99, 102, 241]} 
                        />
                    )}
                </div>
              )}
            </div>

            {/* Static Descriptive Text (Replacing scrolling logs) */}
            {/* UPDATED: Larger text and container */}
            <div className="bg-slate-950 p-6 rounded-lg border border-slate-800 text-base text-slate-300 font-mono leading-relaxed space-y-4 relative min-h-[16rem] shadow-inner flex flex-col justify-center">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50" />
                <p className="font-bold text-indigo-400 text-lg mb-2">
                    The Policy Network DNA (3D Visualization) is not just a pre-made animation. It is a real-time physics simulation driven directly by the Adjacency Matrix of the current generation's "Topological Strategy."
                </p>
                <ul className="space-y-3 list-disc pl-6 marker:text-indigo-500">
                    <li><strong className="text-white">Evolution:</strong> The algorithm evolves the genome to minimize "Metabolic Cost" (energy).</li>
                    <li><strong className="text-white">Cost Metric:</strong> Cost is calculated based on the "wire-length" distance between interacting genes.</li>
                    <li><strong className="text-white">Visualization:</strong> The 3D view applies attractive forces between genes that interact.</li>
                    <li><strong className="text-white">Result:</strong> As the AI learns to form tight clusters (TADs) to save energy (increasing fitness), you will visually see the 3D DNA strand fold into more compact, organized globules rather than a messy spaghetti. The visualization is the "phenotype" of the evolved "genotype."</li>
                </ul>
            </div>
          </div>
          
           <div className="mt-4 p-4 bg-indigo-950/30 border border-indigo-500/20 rounded-lg flex gap-4 items-center backdrop-blur-sm">
                <Terminal className="text-indigo-400 shrink-0" size={24} />
                <div>
                    <h4 className="text-sm font-bold text-indigo-200">Mechanism Note</h4>
                    <p className="text-xs text-indigo-300/80 mt-1 font-mono">
                        The pink ring (Cohesin) is a torus. It does not tie a knot; it slides along the tube, pulling a loop through itself until it collides with the blue CTCF anchors.
                    </p>
                </div>
            </div>

        </div>

      </main>
    </div>
  );
};

export default App;