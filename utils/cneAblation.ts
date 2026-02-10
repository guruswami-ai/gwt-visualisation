/**
 * CNE (Conserved Non-Coding Element) Ablation Utilities
 * Implements CRISPR-like deletion of CNE anchors to measure
 * transcriptional entropy and structural collapse
 */

export interface CNEAnchor {
  id: string;
  position: number; // Index in the matrix (0-127 for 128x128)
  strength: number; // Connection strength (0-1)
  isActive: boolean; // Whether it's currently active or ablated
  type: 'boundary' | 'enhancer' | 'promoter';
}

export interface AblationMetrics {
  structuralEntropy: number; // Shannon entropy of the structure
  transcriptionalNoise: number; // Variance in gene expression
  connectivityLoss: number; // Percentage of lost connections
  modularityCollapse: number; // Decrease in modularity
  freeEnergyIncrease: number; // Increase in variational free energy
}

/**
 * Identify CNE anchors from adjacency matrix
 * CNE anchors are high-connectivity nodes at TAD boundaries
 */
export function identifyCNEAnchors(adjacency: number[][], threshold: number = 0.3): CNEAnchor[] {
  const n = adjacency.length;
  const TAD_SIZE = 16;
  const anchors: CNEAnchor[] = [];
  
  // Scan for TAD boundaries (every TAD_SIZE positions)
  for (let i = 0; i < n; i += TAD_SIZE) {
    // Calculate connection strength at this position
    let totalStrength = 0;
    let connections = 0;
    
    // Check incoming and outgoing connections
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        const weight = adjacency[i][j];
        if (weight > threshold) {
          totalStrength += weight;
          connections++;
        }
      }
    }
    
    const avgStrength = connections > 0 ? totalStrength / connections : 0;
    
    // Boundary anchors are at TAD edges
    if (i % TAD_SIZE === 0 && avgStrength > threshold) {
      anchors.push({
        id: `cne_boundary_${i}`,
        position: i,
        strength: avgStrength,
        isActive: true,
        type: 'boundary'
      });
    }
  }
  
  // Add high-connectivity internal positions as enhancers
  for (let i = 0; i < n; i++) {
    if (i % TAD_SIZE === 0) continue; // Skip boundaries already added
    
    let totalStrength = 0;
    let connections = 0;
    
    for (let j = Math.max(0, i - 8); j < Math.min(n, i + 8); j++) {
      if (i !== j) {
        const weight = adjacency[i][j];
        if (weight > threshold) {
          totalStrength += weight;
          connections++;
        }
      }
    }
    
    const avgStrength = connections > 0 ? totalStrength / connections : 0;
    
    // Enhancers are high-connectivity internal nodes
    if (avgStrength > threshold * 1.5 && connections > 5) {
      anchors.push({
        id: `cne_enhancer_${i}`,
        position: i,
        strength: avgStrength,
        isActive: true,
        type: 'enhancer'
      });
    }
  }
  
  return anchors;
}

/**
 * Apply CNE ablation to adjacency matrix
 * Removes connections associated with ablated anchors
 */
export function applyAblation(
  originalAdjacency: number[][], 
  anchors: CNEAnchor[],
  ablationStrength: number = 0.8
): number[][] {
  const n = originalAdjacency.length;
  const ablatedAdjacency = originalAdjacency.map(row => [...row]);
  
  // Get ablated anchor positions
  const ablatedPositions = new Set(
    anchors.filter(a => !a.isActive).map(a => a.position)
  );
  
  // Remove connections involving ablated anchors
  ablatedPositions.forEach(pos => {
    for (let j = 0; j < n; j++) {
      // Reduce outgoing connections
      ablatedAdjacency[pos][j] *= (1 - ablationStrength);
      // Reduce incoming connections
      ablatedAdjacency[j][pos] *= (1 - ablationStrength);
    }
  });
  
  // For boundary anchors, also affect neighboring regions
  anchors.forEach(anchor => {
    if (!anchor.isActive && anchor.type === 'boundary') {
      const radius = 4; // Affect nearby positions
      for (let i = Math.max(0, anchor.position - radius); 
           i < Math.min(n, anchor.position + radius); i++) {
        for (let j = Math.max(0, anchor.position - radius); 
             j < Math.min(n, anchor.position + radius); j++) {
          ablatedAdjacency[i][j] *= (1 - ablationStrength * 0.5);
        }
      }
    }
  });
  
  return ablatedAdjacency;
}

/**
 * Calculate Shannon entropy of the adjacency matrix structure
 */
export function calculateStructuralEntropy(adjacency: number[][]): number {
  const n = adjacency.length;
  const values: number[] = [];
  
  // Collect all non-zero values
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      if (adjacency[i][j] > 0.01) {
        values.push(adjacency[i][j]);
      }
    }
  }
  
  if (values.length === 0) return 0;
  
  // Calculate histogram
  const bins = 20;
  const histogram = new Array(bins).fill(0);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const binSize = (max - min) / bins;
  
  values.forEach(v => {
    const bin = Math.min(bins - 1, Math.floor((v - min) / binSize));
    histogram[bin]++;
  });
  
  // Calculate entropy: -Σ(p * log2(p))
  const total = values.length;
  let entropy = 0;
  
  histogram.forEach(count => {
    if (count > 0) {
      const p = count / total;
      entropy -= p * Math.log2(p);
    }
  });
  
  return entropy;
}

/**
 * Calculate transcriptional noise (variance in expression)
 */
export function calculateTranscriptionalNoise(adjacency: number[][]): number {
  const n = adjacency.length;
  const rowSums: number[] = [];
  
  // Sum each row (representing "expression level")
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      sum += adjacency[i][j];
    }
    rowSums.push(sum);
  }
  
  if (rowSums.length === 0) return 0;
  
  // Calculate variance
  const mean = rowSums.reduce((a, b) => a + b, 0) / rowSums.length;
  const variance = rowSums.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / rowSums.length;
  
  return Math.sqrt(variance); // Return standard deviation
}

/**
 * Calculate connectivity loss percentage
 */
export function calculateConnectivityLoss(
  original: number[][], 
  ablated: number[][],
  threshold: number = 0.1
): number {
  const n = original.length;
  let originalConnections = 0;
  let ablatedConnections = 0;
  
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (original[i][j] > threshold) originalConnections++;
      if (ablated[i][j] > threshold) ablatedConnections++;
    }
  }
  
  if (originalConnections === 0) return 0;
  
  return ((originalConnections - ablatedConnections) / originalConnections) * 100;
}

/**
 * Calculate modularity collapse
 */
export function calculateModularityCollapse(
  originalModularity: number,
  ablatedModularity: number
): number {
  if (originalModularity === 0) return 0;
  return ((originalModularity - ablatedModularity) / originalModularity) * 100;
}

/**
 * Estimate variational free energy increase
 * Free energy = Complexity - Accuracy
 * Higher entropy + lower modularity = higher free energy
 */
export function calculateFreeEnergyIncrease(
  originalEntropy: number,
  ablatedEntropy: number,
  originalModularity: number,
  ablatedModularity: number
): number {
  const originalFreeEnergy = originalEntropy / (originalModularity + 0.1);
  const ablatedFreeEnergy = ablatedEntropy / (ablatedModularity + 0.1);
  
  return ((ablatedFreeEnergy - originalFreeEnergy) / originalFreeEnergy) * 100;
}

/**
 * Compute all ablation metrics
 */
export function computeAblationMetrics(
  originalAdjacency: number[][],
  ablatedAdjacency: number[][],
  originalModularity: number,
  ablatedModularity: number
): AblationMetrics {
  const structuralEntropy = calculateStructuralEntropy(ablatedAdjacency);
  const transcriptionalNoise = calculateTranscriptionalNoise(ablatedAdjacency);
  const connectivityLoss = calculateConnectivityLoss(originalAdjacency, ablatedAdjacency);
  const modularityCollapse = calculateModularityCollapse(originalModularity, ablatedModularity);
  
  const originalEntropy = calculateStructuralEntropy(originalAdjacency);
  const freeEnergyIncrease = calculateFreeEnergyIncrease(
    originalEntropy,
    structuralEntropy,
    originalModularity,
    ablatedModularity
  );
  
  return {
    structuralEntropy,
    transcriptionalNoise,
    connectivityLoss,
    modularityCollapse,
    freeEnergyIncrease
  };
}
