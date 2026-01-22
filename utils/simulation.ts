
import { StrategyType, MATRIX_SIZE } from '../types';

export function createInitialPopulation(size: number): number[] {
  // We utilize a 1:1 mapping between population genes and matrix cells
  return Array(size).fill(0).map(() => Math.random() * 2 - 1);
}

// NEW: Calculate the energy cost of the structure
// DNA creates "Topologically Associating Domains" (TADs) to minimize the wire-length between interacting genes.
// Random structures have high wire-length -> High Metabolic Cost -> Extinction.
export function computeMetabolicCost(adj: number[][]): number {
  const n = adj.length;
  let totalCost = 0;
  let totalSignal = 0;

  // Optimization: Sample the matrix for cost calculation
  const step = 2; 

  for (let i = 0; i < n; i += step) {
    for (let j = 0; j < n; j += step) {
      const weight = adj[i][j];
      if (weight > 0.05) {
        const dist = Math.abs(i - j);
        totalCost += weight * (dist * dist);
        totalSignal += weight;
      }
    }
  }
  
  // Normalized cost per unit of signal
  return totalSignal > 0 ? (totalCost / totalSignal) / (n * n) : 0;
}

export function computeFitness(pop: number[], adj: number[][]): number {
  if (pop.length === 0) return 0;
  
  // 1. Raw Vitality (Signal Strength)
  let sum = 0;
  let sumSq = 0;
  const sampleSize = Math.min(pop.length, 1000);
  for(let k=0; k<sampleSize; k++) {
      const val = pop[Math.floor(Math.random() * pop.length)];
      sum += val;
      sumSq += (val * val);
  }
  
  const mean = sum / sampleSize;
  const variance = (sumSq / sampleSize) - (mean * mean);
  const vitality = (mean * 0.5 + Math.sqrt(Math.max(0, variance)) * 0.5);

  // 2. Metabolic Cost (The Entropy Tax)
  const cost = computeMetabolicCost(adj);
  
  // 3. Efficiency Ratio
  return vitality - (cost * 2.5); 
}

export function generateAdjacency(pop: number[]): number[][] {
  const n = MATRIX_SIZE;
  const adj = Array(n).fill(0).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n * n; i++) {
    const row = Math.floor(i / n);
    const col = i % n;
    const geneVal = pop[i % pop.length];
    adj[row][col] = Math.max(0, geneVal);
  }
  
  const rowSums = adj.map(row => row.reduce((a, b) => a + b, 0));
  for (let i = 0; i < n; i++) {
    if (rowSums[i] > 0.001) {
      for (let j = 0; j < n; j++) {
        adj[i][j] = adj[i][j] / (rowSums[i] * 0.8 + 0.2); 
      }
    }
  }
  return adj;
}

// NEW: Generates a synthetic adjacency matrix based purely on a target Modularity Score.
// Used for "Experimental Playback" mode to visualize the data without running the full physics engine.
export function generateSyntheticAdjacency(modularityTarget: number): number[][] {
    const n = MATRIX_SIZE;
    const TAD_SIZE = 16;
    const adj = Array(n).fill(0).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const rowTad = Math.floor(i / TAD_SIZE);
            const colTad = Math.floor(j / TAD_SIZE);
            const dist = Math.abs(i - j);

            let val = 0;

            if (rowTad === colTad) {
                // Inside TAD
                // Strength correlates with modularityTarget
                val = modularityTarget * 0.8; 
                
                // Decay
                if (dist < 8) val += (1 - dist/8) * 0.2;
                
                // Corner Peaks
                const tadStart = rowTad * TAD_SIZE;
                const tadEnd = tadStart + TAD_SIZE;
                const isCorner = (i < tadStart + 3 && j > tadEnd - 4) || (j < tadStart + 3 && i > tadEnd - 4);
                if (isCorner) val += modularityTarget * 0.5;

            } else {
                // Noise floor
                val = Math.random() * 0.05;
            }

            // Ensure visual contrast
            adj[i][j] = Math.max(0, Math.min(1, val));
        }
    }
    return adj;
}

export function computeModularity(adj: number[][]): number {
  const n = adj.length;
  let score = 0;
  let totalWeight = 0;
  const step = 2; 

  for (let i = 0; i < n; i += step) {
    for (let j = 0; j < n; j += step) {
      const weight = adj[i][j];
      totalWeight += weight;
      const dist = Math.abs(i - j);
      
      if (dist <= 4) { 
        score += weight * (5 - dist); 
      } else {
        score -= weight * (dist * 0.2); 
      }
    }
  }
  
  return totalWeight > 0 ? Math.max(0, score / totalWeight) : 0;
}

export function computeHistoryVariance(history: number[]): number {
    if (history.length < 2) return 0;
    const mean = history.reduce((a, b) => a + b, 0) / history.length;
    const sqDiff = history.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
    return Math.sqrt(sqDiff / history.length);
}

export function evolvePopulation(pop: number[], strategy: StrategyType): number[] {
  const nextPop = [...pop];
  const n = MATRIX_SIZE;
  
  // Define fixed CTCF Boundary Sites for 128-mer (Every 16 units)
  const TAD_SIZE = 16;

  for (let i = 0; i < nextPop.length; i++) {
    let gene = nextPop[i];
    
    // Thermal Noise (Entropy)
    gene += (Math.random() - 0.5) * 0.2;
    
    const row = Math.floor(i / n);
    const col = i % n;
    
    // Euclidean distance from diagonal (interaction distance)
    const dist = Math.abs(row - col);

    if (strategy === StrategyType.Topological) {
      // LOGIC: Create squares along the diagonal (TADs)
      const rowTad = Math.floor(row / TAD_SIZE);
      const colTad = Math.floor(col / TAD_SIZE);

      if (rowTad === colTad) {
          // 1. We are INSIDE a TAD Square
          // Base interaction probability is high
          gene += 0.2;

          // 2. Diagonal Decay (Polymer Physics)
          if (dist < 8) {
             gene += 0.3 * (1 - dist/8); 
          }

          // 3. Corner Peaks (The "Loop Spot")
          // This creates the distinctive dots seen in Hi-C maps where Cohesin stops
          const tadStart = rowTad * TAD_SIZE;
          const tadEnd = tadStart + TAD_SIZE;
          
          const isCorner = (row < tadStart + 3 && col > tadEnd - 4) || (col < tadStart + 3 && row > tadEnd - 4);
          
          if (isCorner) {
              gene += 0.8; // Bright spot at the corner of the TAD
          }

      } else {
          // We are in the empty space between TADs (Insulation)
          gene -= 0.1; 
      }
      
      // Cleanup noise
      if (gene < 0.1) gene = 0;

    } else if (strategy === StrategyType.Hierarchical) {
       // Fractal pattern
       const levels = 4;
       const target = Math.round(gene * levels) / levels;
       gene = gene + (target - gene) * 0.15;
       
    } else if (strategy === StrategyType.Flat) {
       // Clamping
       gene = gene * 0.9 + (Math.random() - 0.5) * 0.05;
       gene = Math.max(-0.2, Math.min(0.2, gene));
    } else {
       // Direct / Random Strategy
       if (Math.random() < 0.005) gene = 1;
    }
    
    nextPop[i] = Math.max(-1, Math.min(1, gene));
  }
  
  return nextPop;
}
