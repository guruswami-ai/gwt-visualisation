/**
 * Topological Data Analysis (TDA) Utilities
 * Implements persistent homology and Betti number calculations
 * for comparing simulated genomic manifolds with Hi-C data
 */

export interface PersistentHomology {
  betti0: number; // Connected components
  betti1: number; // Loops/Holes
  betti2: number; // Voids
  persistenceDiagram: Array<[number, number]>; // Birth-death pairs
}

export interface TopologicalMetrics {
  bettiNumbers: PersistentHomology;
  eulerCharacteristic: number;
  modularityIndex: number;
  structuralComplexity: number;
}

/**
 * Simplified Betti number calculation based on adjacency matrix structure
 * For a genomic contact matrix, we analyze:
 * - Betti-0: Number of disconnected TAD regions (connected components)
 * - Betti-1: Number of loop structures (chromatin loops)
 * - Betti-2: 3D void structures (simplified)
 */
export function computeBettiNumbers(adjacency: number[][], threshold: number = 0.2): PersistentHomology {
  const n = adjacency.length;
  
  // Build filtered graph based on threshold
  const graph: Set<number>[] = Array(n).fill(0).map(() => new Set());
  
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (adjacency[i][j] > threshold) {
        graph[i].add(j);
        graph[j].add(i);
      }
    }
  }
  
  // Betti-0: Connected Components (Union-Find)
  const betti0 = countConnectedComponents(graph);
  
  // Betti-1: Loops (Cycle detection)
  const betti1 = countIndependentCycles(graph, adjacency, threshold);
  
  // Betti-2: Simplified (based on higher-order interactions)
  const betti2 = estimateBetti2(adjacency, threshold);
  
  // Generate persistence diagram (simplified)
  const persistenceDiagram = generatePersistenceDiagram(adjacency, threshold);
  
  return {
    betti0,
    betti1,
    betti2,
    persistenceDiagram
  };
}

/**
 * Count connected components using Union-Find
 */
function countConnectedComponents(graph: Set<number>[]): number {
  const n = graph.length;
  const visited = new Array(n).fill(false);
  let components = 0;
  
  function dfs(node: number) {
    visited[node] = true;
    graph[node].forEach(neighbor => {
      if (!visited[neighbor]) {
        dfs(neighbor);
      }
    });
  }
  
  for (let i = 0; i < n; i++) {
    if (!visited[i] && graph[i].size > 0) {
      components++;
      dfs(i);
    }
  }
  
  // Add isolated nodes as separate components
  for (let i = 0; i < n; i++) {
    if (graph[i].size === 0) {
      components++;
    }
  }
  
  return components;
}

/**
 * Count independent cycles (Betti-1)
 * Simplified approach: edges - vertices + connected_components
 * For genomic data, we focus on TAD boundary loops
 */
function countIndependentCycles(graph: Set<number>[], adjacency: number[][], threshold: number): number {
  const n = graph.length;
  let edges = 0;
  let vertices = 0;
  
  // Count active vertices and edges
  for (let i = 0; i < n; i++) {
    if (graph[i].size > 0) {
      vertices++;
      edges += graph[i].size;
    }
  }
  
  edges = edges / 2; // Each edge counted twice
  
  const components = countConnectedComponents(graph);
  
  // Euler characteristic: V - E + F = 2 - 2g (g = genus = number of holes)
  // For planar graphs: E - V + C gives cycle rank
  const cycleRank = Math.max(0, edges - vertices + components);
  
  // For genomic data, look for diagonal-offset patterns (TAD corners)
  const tadLoops = detectTADLoops(adjacency, threshold);
  
  return Math.max(cycleRank, tadLoops);
}

/**
 * Detect TAD loop structures from Hi-C-like patterns
 * TAD loops appear as bright spots at TAD corners
 */
function detectTADLoops(adjacency: number[][], threshold: number): number {
  const n = adjacency.length;
  let loopCount = 0;
  const TAD_SIZE = 16; // Expected TAD size
  
  // Scan for corner peaks in diagonal blocks
  for (let blockRow = 0; blockRow < Math.floor(n / TAD_SIZE); blockRow++) {
    for (let blockCol = 0; blockCol < Math.floor(n / TAD_SIZE); blockCol++) {
      if (blockRow === blockCol) {
        // Check corners of this diagonal block
        const startRow = blockRow * TAD_SIZE;
        const startCol = blockCol * TAD_SIZE;
        
        // Look for loop extrusion signature (high value at corners)
        const cornerSignal = checkCornerSignal(adjacency, startRow, startCol, TAD_SIZE, threshold);
        if (cornerSignal) {
          loopCount++;
        }
      }
    }
  }
  
  return loopCount;
}

/**
 * Check for loop extrusion signature at TAD corners
 */
function checkCornerSignal(adj: number[][], startRow: number, startCol: number, size: number, threshold: number): boolean {
  const endRow = Math.min(adj.length, startRow + size);
  const endCol = Math.min(adj.length, startCol + size);
  
  // Check top-right and bottom-left corners
  let topRightSignal = 0;
  let bottomLeftSignal = 0;
  const cornerSize = 3;
  
  for (let i = 0; i < cornerSize && startRow + i < endRow; i++) {
    for (let j = 0; j < cornerSize && endCol - cornerSize + j < adj.length; j++) {
      topRightSignal += adj[startRow + i][endCol - cornerSize + j];
    }
  }
  
  for (let i = 0; i < cornerSize && endRow - cornerSize + i < adj.length; i++) {
    for (let j = 0; j < cornerSize && startCol + j < endCol; j++) {
      bottomLeftSignal += adj[endRow - cornerSize + i][startCol + j];
    }
  }
  
  const avgSignal = (topRightSignal + bottomLeftSignal) / (2 * cornerSize * cornerSize);
  return avgSignal > threshold * 2; // Corner peaks should be stronger
}

/**
 * Estimate Betti-2 (voids in 3D structure)
 * Simplified: based on enclosed regions in the matrix
 */
function estimateBetti2(adjacency: number[][], threshold: number): number {
  // For 2D contact maps, Betti-2 is typically 0
  // But we can estimate based on complex interaction patterns
  const n = adjacency.length;
  let enclosedRegions = 0;
  
  // Look for "box" patterns indicating 3D enclosure
  const step = 8;
  for (let i = 0; i < n - step * 2; i += step) {
    for (let j = i + step; j < n - step; j += step) {
      if (checkEnclosedPattern(adjacency, i, j, step, threshold)) {
        enclosedRegions++;
      }
    }
  }
  
  return enclosedRegions;
}

/**
 * Check for enclosed pattern (simplified void detection)
 */
function checkEnclosedPattern(adj: number[][], row: number, col: number, size: number, threshold: number): boolean {
  // Check if there's a ring of high interactions with low center
  let ringSum = 0;
  let centerSum = 0;
  let ringCount = 0;
  let centerCount = 0;
  
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (row + i >= adj.length || col + j >= adj.length) continue;
      
      const isEdge = i === 0 || i === size - 1 || j === 0 || j === size - 1;
      if (isEdge) {
        ringSum += adj[row + i][col + j];
        ringCount++;
      } else {
        centerSum += adj[row + i][col + j];
        centerCount++;
      }
    }
  }
  
  const ringAvg = ringCount > 0 ? ringSum / ringCount : 0;
  const centerAvg = centerCount > 0 ? centerSum / centerCount : 0;
  
  return ringAvg > threshold && centerAvg < threshold * 0.5;
}

/**
 * Generate simplified persistence diagram
 * Birth-death pairs for topological features
 */
function generatePersistenceDiagram(adjacency: number[][], baseThreshold: number): Array<[number, number]> {
  const diagram: Array<[number, number]> = [];
  const thresholds = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
  
  let prevComponents = 0;
  
  for (const threshold of thresholds) {
    const betti = computeBettiNumbers(adjacency, threshold);
    
    // Track birth and death of components
    if (betti.betti0 > prevComponents) {
      // New component born
      for (let i = 0; i < betti.betti0 - prevComponents; i++) {
        diagram.push([threshold, 1.0]); // Birth at this threshold, "death" at max
      }
    }
    
    prevComponents = betti.betti0;
  }
  
  return diagram;
}

/**
 * Compute comprehensive topological metrics
 */
export function computeTopologicalMetrics(adjacency: number[][], threshold: number = 0.2): TopologicalMetrics {
  const bettiNumbers = computeBettiNumbers(adjacency, threshold);
  
  // Euler characteristic: χ = b0 - b1 + b2
  const eulerCharacteristic = bettiNumbers.betti0 - bettiNumbers.betti1 + bettiNumbers.betti2;
  
  // Modularity index (based on block diagonal strength)
  const modularityIndex = computeModularityIndex(adjacency);
  
  // Structural complexity (based on Betti numbers)
  const structuralComplexity = bettiNumbers.betti1 + bettiNumbers.betti2 * 2;
  
  return {
    bettiNumbers,
    eulerCharacteristic,
    modularityIndex,
    structuralComplexity
  };
}

/**
 * Compute modularity index for the adjacency matrix
 */
function computeModularityIndex(adjacency: number[][]): number {
  const n = adjacency.length;
  const TAD_SIZE = 16;
  let intraModuleSum = 0;
  let interModuleSum = 0;
  let intraCount = 0;
  let interCount = 0;
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const iModule = Math.floor(i / TAD_SIZE);
      const jModule = Math.floor(j / TAD_SIZE);
      
      if (iModule === jModule) {
        intraModuleSum += adjacency[i][j];
        intraCount++;
      } else {
        interModuleSum += adjacency[i][j];
        interCount++;
      }
    }
  }
  
  const intraAvg = intraCount > 0 ? intraModuleSum / intraCount : 0;
  const interAvg = interCount > 0 ? interModuleSum / interCount : 0;
  
  // Modularity = (intra - inter) / (intra + inter)
  const total = intraAvg + interAvg;
  return total > 0 ? (intraAvg - interAvg) / total : 0;
}

/**
 * Compare topological metrics between two structures
 */
export function compareTopology(metrics1: TopologicalMetrics, metrics2: TopologicalMetrics): {
  betti0Diff: number;
  betti1Diff: number;
  betti2Diff: number;
  eulerDiff: number;
  modularityDiff: number;
  complexityDiff: number;
  overallSimilarity: number;
} {
  const betti0Diff = Math.abs(metrics1.bettiNumbers.betti0 - metrics2.bettiNumbers.betti0);
  const betti1Diff = Math.abs(metrics1.bettiNumbers.betti1 - metrics2.bettiNumbers.betti1);
  const betti2Diff = Math.abs(metrics1.bettiNumbers.betti2 - metrics2.bettiNumbers.betti2);
  const eulerDiff = Math.abs(metrics1.eulerCharacteristic - metrics2.eulerCharacteristic);
  const modularityDiff = Math.abs(metrics1.modularityIndex - metrics2.modularityIndex);
  const complexityDiff = Math.abs(metrics1.structuralComplexity - metrics2.structuralComplexity);
  
  // Overall similarity (0 = identical, higher = more different)
  // Weighted by importance: Betti-1 and modularity are most important for genomic structures
  const overallSimilarity = (
    betti0Diff * 0.5 + 
    betti1Diff * 2.0 + 
    betti2Diff * 0.5 + 
    eulerDiff * 0.5 + 
    modularityDiff * 2.0 + 
    complexityDiff * 0.5
  ) / 6.0;
  
  return {
    betti0Diff,
    betti1Diff,
    betti2Diff,
    eulerDiff,
    modularityDiff,
    complexityDiff,
    overallSimilarity
  };
}
