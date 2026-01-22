// Data derived from "Genomic-Inspired Weight Compression for Neuroevolution" (Nevin)
// Benchmark: Ant Locomotion (Round 1)
// Key Insight: "Variance Collapse" - Structured encodings have low variance but lower peak fitness.

export interface DataPoint {
  gen: number;
  direct: number;
  flat: number;
  hierarchical: number;
  topological: number;
  modularity: number;
  
  // Standard Deviations (Variance)
  flatStd: number;
  hierStd: number;
  topoStd: number;
  directStd: number;
}

const TOTAL_FRAMES = 101;

export const EXPERIMENTAL_DATASET: DataPoint[] = Array.from({ length: TOTAL_FRAMES }).map((_, i) => {
  const progress = i / (TOTAL_FRAMES - 1);
  
  // Logistic growth helper
  // t: time 0-1, k: steepness, x0: midpoint
  const sigmoid = (t: number, k: number, x0: number) => 1 / (1 + Math.exp(-k * (t - x0)));
  
  // 1. FLAT (The Winner)
  // Mean ~407.9, Std ~52.7
  const flatBase = 407.9 * sigmoid(progress, 12, 0.15);
  const flatStd = 52.7 * Math.min(1, 0.2 + progress * 0.8); // Variance grows with fitness
  const flatNoise = (Math.random() - 0.5) * flatStd; 
  const flat = Math.max(0, flatBase + flatNoise);

  // 2. HIERARCHICAL (TAD-like)
  // Mean ~378.2, Std ~30.8
  const hierBase = 378.2 * sigmoid(progress, 10, 0.2);
  const hierStd = 30.8 * Math.max(0.2, 1.0 - progress * 0.3); // Variance reduces slightly
  const hierNoise = (Math.random() - 0.5) * hierStd;
  const hierarchical = Math.max(0, hierBase + hierNoise);

  // 3. TOPOLOGICAL (Chromatin-like)
  // Mean ~366.4, Std ~12.3
  // "Variance Collapse": Std starts moderate and collapses to very low
  const topoBase = 366.4 * sigmoid(progress, 9, 0.2);
  const topoStd = 25.0 * Math.max(0.1, Math.exp(-progress * 3)); // Rapid collapse
  const topoNoise = (Math.random() - 0.5) * (12.3 * Math.min(1, progress * 1.5)); 
  const topological = Math.max(0, topoBase + topoNoise);

  // 4. DIRECT (Control/Random)
  const direct = 150 * sigmoid(progress, 5, 0.4) + (Math.random() - 0.5) * 40;
  const directStd = 40;

  // Modularity Score (Q)
  const modularity = 0.65 + (0.25 * sigmoid(progress, 5, 0.1)) + (Math.random() * 0.02);

  return {
    gen: i,
    direct,
    flat,
    hierarchical,
    topological,
    modularity,
    flatStd,
    hierStd,
    topoStd,
    directStd
  };
});