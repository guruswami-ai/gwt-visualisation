import React, { useState } from 'react';
import { Play, Pause, Zap, Wind, Anchor, Settings2, Info } from 'lucide-react';

export interface LoopExtrusionParams {
  motorSpeed: number; // 0.1 - 3.0
  langevinDamping: number; // 0.5 - 0.95
  thermalNoise: number; // 0.0 - 0.5
  ctcfStrength: number; // 0.5 - 2.0
  extrusionForce: number; // 0.05 - 0.3
}

interface LoopExtrusionControlsProps {
  params: LoopExtrusionParams;
  onParamsChange: (params: LoopExtrusionParams) => void;
  isPaused: boolean;
  onTogglePause: () => void;
}

const LoopExtrusionControls: React.FC<LoopExtrusionControlsProps> = ({
  params,
  onParamsChange,
  isPaused,
  onTogglePause
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const updateParam = (key: keyof LoopExtrusionParams, value: number) => {
    onParamsChange({
      ...params,
      [key]: value
    });
  };
  
  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-amber-400" />
          <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Loop Extrusion Dynamics (Protocol A)
          </span>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-3 py-1 rounded text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced
        </button>
      </div>
      
      {/* Info Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-3">
        <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-300/90 font-mono leading-relaxed">
          <strong className="text-amber-200">Physics of the Fold:</strong> Adjust Langevin dynamics parameters to simulate 
          the real-time cohesin motor activity. Watch topology "refold" in response to environmental signals.
        </div>
      </div>
      
      {/* Main Controls */}
      <div className="space-y-4">
        {/* Motor Speed */}
        <ParameterSlider
          icon={<Zap size={14} className="text-amber-400" />}
          label="Motor Speed"
          description="Cohesin translocation rate"
          value={params.motorSpeed}
          min={0.1}
          max={3.0}
          step={0.1}
          onChange={(v) => updateParam('motorSpeed', v)}
          unit="×"
          color="amber"
        />
        
        {/* CTCF Strength */}
        <ParameterSlider
          icon={<Anchor size={14} className="text-blue-400" />}
          label="CTCF Brake Force"
          description="Boundary anchor strength"
          value={params.ctcfStrength}
          min={0.5}
          max={2.0}
          step={0.1}
          onChange={(v) => updateParam('ctcfStrength', v)}
          unit="×"
          color="blue"
        />
        
        {showAdvanced && (
          <>
            {/* Langevin Damping */}
            <ParameterSlider
              icon={<Wind size={14} className="text-cyan-400" />}
              label="Langevin Damping"
              description="Viscous drag coefficient"
              value={params.langevinDamping}
              min={0.5}
              max={0.95}
              step={0.05}
              onChange={(v) => updateParam('langevinDamping', v)}
              format={(v) => v.toFixed(2)}
              color="cyan"
            />
            
            {/* Thermal Noise */}
            <ParameterSlider
              icon={<Wind size={14} className="text-purple-400" />}
              label="Thermal Noise"
              description="Brownian motion intensity"
              value={params.thermalNoise}
              min={0.0}
              max={0.5}
              step={0.05}
              onChange={(v) => updateParam('thermalNoise', v)}
              format={(v) => v.toFixed(2)}
              color="purple"
            />
            
            {/* Extrusion Force */}
            <ParameterSlider
              icon={<Zap size={14} className="text-emerald-400" />}
              label="Extrusion Force"
              description="Loop expansion strength"
              value={params.extrusionForce}
              min={0.05}
              max={0.3}
              step={0.01}
              onChange={(v) => updateParam('extrusionForce', v)}
              format={(v) => v.toFixed(2)}
              color="emerald"
            />
          </>
        )}
      </div>
      
      {/* Simulation Control */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
        <button
          onClick={onTogglePause}
          className={`flex-1 h-9 flex items-center justify-center gap-2 rounded-lg font-bold text-sm transition-all border ${
            isPaused 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
          }`}
        >
          {isPaused ? <><Play size={14} /> Resume Physics</> : <><Pause size={14} /> Pause Physics</>}
        </button>
      </div>
      
      {/* Real-time Status */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <StatusCard label="Motor State" value={isPaused ? "STALLED" : "ACTIVE"} active={!isPaused} />
        <StatusCard 
          label="Loop Rate" 
          value={`${(params.motorSpeed * 10).toFixed(1)}/s`} 
          active={!isPaused} 
        />
      </div>
    </div>
  );
};

interface ParameterSliderProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  unit?: string;
  color?: 'amber' | 'blue' | 'cyan' | 'purple' | 'emerald';
}

const ParameterSlider: React.FC<ParameterSliderProps> = ({
  icon,
  label,
  description,
  value,
  min,
  max,
  step,
  onChange,
  format,
  unit = '',
  color = 'indigo'
}) => {
  const displayValue = format ? format(value) : value.toFixed(1);
  
  const colorClasses = {
    amber: 'accent-amber-500 hover:accent-amber-400',
    blue: 'accent-blue-500 hover:accent-blue-400',
    cyan: 'accent-cyan-500 hover:accent-cyan-400',
    purple: 'accent-purple-500 hover:accent-purple-400',
    emerald: 'accent-emerald-500 hover:accent-emerald-400',
    indigo: 'accent-indigo-500 hover:accent-indigo-400'
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <div className="text-xs font-bold text-slate-300">{label}</div>
            <div className="text-[10px] text-slate-500">{description}</div>
          </div>
        </div>
        <span className="text-sm font-bold font-mono text-slate-200">
          {displayValue}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer ${colorClasses[color]}`}
      />
    </div>
  );
};

interface StatusCardProps {
  label: string;
  value: string;
  active: boolean;
}

const StatusCard: React.FC<StatusCardProps> = ({ label, value, active }) => {
  return (
    <div className="bg-slate-950/50 rounded border border-slate-800/50 p-2">
      <div className="text-[10px] text-slate-500 font-mono mb-1 flex items-center gap-1">
        {label}
        <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
      </div>
      <div className={`text-sm font-bold font-mono ${active ? 'text-emerald-400' : 'text-slate-500'}`}>
        {value}
      </div>
    </div>
  );
};

export default LoopExtrusionControls;
