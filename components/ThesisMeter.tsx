import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ThesisMeterProps {
  progress: number;
  status?: 'active' | 'rejected';
}

const ThesisMeter: React.FC<ThesisMeterProps> = ({ progress, status = 'active' }) => {
  const isRejected = status === 'rejected';

  // Dynamic Color Calculation for Active State
  const hue = Math.min(140, Math.max(0, (progress / 100) * 140));
  const activeColor = `hsl(${hue}, 80%, 50%)`;
  
  // Rejected State Color (Red)
  const rejectedColor = '#ef4444';

  const currentColor = isRejected ? rejectedColor : activeColor;

  return (
    <div className="w-full bg-slate-950 h-7 relative rounded overflow-hidden border border-slate-700 shadow-inner group">
      
      {/* Background Grid Ticks */}
      <div className="absolute inset-0 flex justify-between px-2 z-0 opacity-20 pointer-events-none">
         {[0, 25, 50, 75, 100].map((tick) => (
             <div key={tick} className="h-full w-px bg-slate-400" />
         ))}
      </div>

      {/* Dynamic Progress Bar */}
      <div 
        className={`h-full transition-all duration-500 ease-out flex items-center justify-end pr-2 relative z-10 ${isRejected ? 'animate-pulse' : ''}`}
        style={{ 
          width: `${progress}%`,
          backgroundColor: currentColor,
          boxShadow: `0 0 20px -5px ${currentColor}`
        }}
      >
        {/* Hazard Stripes for Rejected State */}
        {isRejected && (
            <div className="absolute inset-0 w-full h-full opacity-30" 
                 style={{
                     backgroundImage: 'linear-gradient(45deg, rgba(0,0,0,0.2) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2) 75%, transparent 75%, transparent)',
                     backgroundSize: '20px 20px'
                 }} 
            />
        )}

        {/* Gloss Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent mix-blend-overlay" />
      </div>

      {/* Readout Overlay */}
      <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-mono font-bold text-white z-20" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
        <span className="opacity-90 tracking-wider flex items-center gap-2">
            {isRejected ? (
                <><AlertTriangle size={12} className="text-white" /> HYPOTHESIS FALSIFIED</>
            ) : (
                <><CheckCircle2 size={12} className="opacity-50" /> CONFIDENCE</>
            )}
        </span>
        <span className="tabular-nums">
            {isRejected ? 'NEGATIVE_RESULT' : `${progress.toFixed(1)}%`}
        </span>
      </div>
    </div>
  );
};

export default ThesisMeter;