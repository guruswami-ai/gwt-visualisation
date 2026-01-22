import React from 'react';
import { X, FileText, Cpu, Zap, Brain, Network, PackageSearch } from 'lucide-react';

interface ResearchManifestoProps {
  onClose: () => void;
}

const ResearchManifesto: React.FC<ResearchManifestoProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl max-h-[90vh] rounded-lg shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded border border-emerald-500/20">
              <FileText className="text-emerald-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 font-mono">PROJECT_MANIFESTO.md</h2>
              <p className="text-xs text-slate-500 font-mono">SESSION_ID: 5B_YEARS_OPTIMIZATION</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto p-8 space-y-12 font-sans text-slate-300 selection:bg-emerald-500/30">
          
          {/* Intro */}
          <div className="border-l-2 border-emerald-500 pl-6">
            <h1 className="text-2xl font-bold text-white mb-2">The Universal Optimization Protocol</h1>
            <p className="text-slate-400 italic">
              A summary of findings regarding Entropy, Computation, and Evolutionary Reinforcement Learning.
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm font-bold uppercase">
              <Zap size={16} /> Insight 01
            </div>
            <h3 className="text-xl font-bold text-slate-100">The Entropy Economy</h3>
            <div className="prose prose-invert prose-sm max-w-none text-slate-400 space-y-4 leading-relaxed">
              <p>
                <strong>Entropy is not just chaos; it is currency.</strong> The universe operates on a strict transactional basis. Order requires a payment of energy.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-slate-200">The Atomic Lease:</strong> We do not own our matter. We are leasing approximately 7x10<sup>27</sup> atoms. When our ATP cycle (the "rent payment") ceases, the lease expires, and the atoms return to the universal pool.
                </li>
                <li>
                  <strong className="text-slate-200">Panpsychism of Matter:</strong> Atoms are not dead; they are immortal code snippets that "take turns" participating in life. They are intelligent substrate waiting for a host.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm font-bold uppercase">
              <Cpu size={16} /> Insight 02
            </div>
            <h3 className="text-xl font-bold text-slate-100">The "Meat Puppet" Paradox</h3>
            <div className="prose prose-invert prose-sm max-w-none text-slate-400 space-y-4 leading-relaxed">
              <p>
                There is a "Computation Gap" between human cognition and genomic wisdom.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-slate-200">The Cost of Decision:</strong> In thermodynamics (Landauer's Principle), information processing generates heat. Thinking is expensive.
                </li>
                <li>
                  <strong className="text-slate-200">The Archive:</strong> DNA (4 billion years old) is smarter than the Brain (1.8 million years old). DNA has already solved problems we cannot conceive of. It locks these answers into <strong>Topological Structures</strong> (folding) to avoid the metabolic cost of "re-thinking" them.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm font-bold uppercase">
              <Brain size={16} /> Insight 03
            </div>
            <h3 className="text-xl font-bold text-slate-100">Biology as Reinforcement Learning</h3>
            <div className="prose prose-invert prose-sm max-w-none text-slate-400 space-y-4 leading-relaxed">
              <p>
                Evolution is not a magical process; it is a massive, parallel <strong>Reinforcement Learning (RL)</strong> algorithm running on "wetware."
              </p>
              <div className="bg-slate-950 p-4 rounded border border-slate-800 font-mono text-xs grid grid-cols-2 gap-4">
                <div>
                  <div className="text-slate-500 mb-1">AGENT</div>
                  <div className="text-indigo-400">The Organism / DNA</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">REWARD FUNCTION (+)</div>
                  <div className="text-emerald-400">Reproduction / Energy Capture</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">LOSS FUNCTION (-)</div>
                  <div className="text-red-400">Metabolic Cost / Death</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1">PRE-TRAINED WEIGHTS</div>
                  <div className="text-amber-400">Genome (4 Billion Epochs)</div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 - NEW: Linking Loop Extrusion */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm font-bold uppercase">
              <PackageSearch size={16} /> Insight 04
            </div>
            <h3 className="text-xl font-bold text-slate-100">Loop Extrusion = Physical Compression</h3>
            <div className="prose prose-invert prose-sm max-w-none text-slate-400 space-y-4 leading-relaxed">
              <p>
                How does the Topological Strategy (simulated in the graphs) actually work in reality?
              </p>
              <p>
                It uses a biological machine called <strong>Cohesin</strong> (the pink ring in the 3D viewer). This motor lands on DNA and actively "extrudes" it into a loop until it hits a boundary marker (CTCF).
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                   <strong className="text-slate-200">The Zip File Analogy:</strong> Just as a .zip algorithm searches for patterns to compress data, Cohesin searches for boundaries to compress the physical polymer.
                </li>
                <li>
                   <strong className="text-slate-200">Why it matters:</strong> This process (Loop Extrusion) creates the dense squares you see in the Hi-C Heatmaps. It is the hardware implementation of the "Topological Compression" software.
                </li>
              </ul>
            </div>
          </section>

          <div className="pt-8 border-t border-slate-800 text-center">
            <p className="font-mono text-xs text-slate-600">
              END OF FILE • GENERATED BY UNIVERSAL_ENTROPY_SIMULATOR
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ResearchManifesto;