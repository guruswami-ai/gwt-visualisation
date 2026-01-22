
export enum StrategyType {
  Direct = 'direct',
  Flat = 'flat',
  Hierarchical = 'hierarchical',
  Topological = 'topological',
}

export interface ClusterNode {
  id: string;
  name: string;
  status: 'active' | 'standby' | 'syncing';
  runtime: string; // e.g. "8h 47min"
  generation: number;
  cpuUsage: number; // %
  memoryUsage: number; // GB
  temperature: number; // Celsius
  gpuUsage: number; // %
  vramUsage: number; // GB
  powerDraw: number; // Watts
  tflops: number; // TeraFLOPS
}

export interface SimulationState {
  id: string; // Session ID for Reset handling
  generation: number;
  simulationDelay: number; // ms between generations (0 = max speed)
  strategies: {
    [key in StrategyType]: StrategyData;
  };
  cluster: ClusterNode[];
  metrics: {
    topoLead: number;
    modularityScore: number;
    thesisProgress: number;
  };
  isRunning: boolean;
  telemetryMode: 'simulated' | 'local';
  isLocalConnected: boolean;
  playbackMode: 'theory' | 'experimental'; // NEW: Toggle between Live Sim and Data Replay
}

export interface StrategyData {
  type: StrategyType;
  population: number[];
  fitness: number;
  modularity: number;
  adjacency: number[][];
  fitnessHistory: number[]; // For time-series chart
  variance: number; // Current standard deviation
  varianceHistory: number[]; // For variance collapse chart
}

// Optimized Resolution for Mechanical Clarity
export const MATRIX_SIZE = 128; 
export const POPULATION_SIZE = 16384; // 128 * 128