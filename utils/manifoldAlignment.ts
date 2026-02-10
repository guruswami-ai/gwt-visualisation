/**
 * Cross-Manifold Alignment Utilities
 * Implements Procrustes analysis and manifold alignment algorithms
 * to compare genomic manifolds (Hi-C) with neural manifolds (fMRI/connectome)
 */

export interface ManifoldPoint {
  id: number;
  coordinates: number[]; // 2D or 3D coordinates
  label?: string;
}

export interface AlignmentResult {
  alignmentError: number; // Lower = better alignment
  rotationMatrix: number[][];
  translationVector: number[];
  scaleFactor: number;
  correlationCoefficient: number;
}

/**
 * Convert adjacency matrix to 2D embedding using MDS-like approach
 * (Simplified multidimensional scaling)
 */
export function adjacencyToEmbedding(adjacency: number[][], dimensions: number = 2): ManifoldPoint[] {
  const n = adjacency.length;
  const points: ManifoldPoint[] = [];
  
  // For visualization, we'll use a force-directed approach
  // Initialize random positions
  const positions: number[][] = [];
  for (let i = 0; i < n; i++) {
    positions.push([
      Math.random() * 10 - 5,
      Math.random() * 10 - 5
    ]);
  }
  
  // Simple force-directed layout (simplified)
  const iterations = 50;
  const learningRate = 0.1;
  
  for (let iter = 0; iter < iterations; iter++) {
    const forces: number[][] = Array(n).fill(0).map(() => [0, 0]);
    
    // Attractive forces for connected nodes
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (adjacency[i][j] > 0.1) {
          const dx = positions[j][0] - positions[i][0];
          const dy = positions[j][1] - positions[i][1];
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.01;
          
          const force = adjacency[i][j] * 0.5;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          
          forces[i][0] += fx;
          forces[i][1] += fy;
          forces[j][0] -= fx;
          forces[j][1] -= fy;
        }
      }
    }
    
    // Repulsive forces
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = positions[j][0] - positions[i][0];
        const dy = positions[j][1] - positions[i][1];
        const distSq = dx * dx + dy * dy + 0.01;
        const dist = Math.sqrt(distSq);
        
        const repulsion = 0.5 / distSq;
        const fx = (dx / dist) * repulsion;
        const fy = (dy / dist) * repulsion;
        
        forces[i][0] -= fx;
        forces[i][1] -= fy;
        forces[j][0] += fx;
        forces[j][1] += fy;
      }
    }
    
    // Update positions
    for (let i = 0; i < n; i++) {
      positions[i][0] += forces[i][0] * learningRate;
      positions[i][1] += forces[i][1] * learningRate;
    }
  }
  
  // Normalize and create points
  for (let i = 0; i < n; i++) {
    points.push({
      id: i,
      coordinates: [...positions[i]]
    });
  }
  
  return points;
}

/**
 * Generate synthetic neural manifold data
 * Simulates a brain connectivity network with similar structure to genomic data
 */
export function generateNeuralManifold(size: number = 128): number[][] {
  const neural = Array(size).fill(0).map(() => Array(size).fill(0));
  
  // Simulate brain modules (like cortical regions)
  const moduleSize = 16;
  const numModules = Math.floor(size / moduleSize);
  
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const iModule = Math.floor(i / moduleSize);
      const jModule = Math.floor(j / moduleSize);
      const dist = Math.abs(i - j);
      
      // Within-module connectivity (like within-region)
      if (iModule === jModule) {
        const strength = Math.exp(-dist / 8) * (0.5 + Math.random() * 0.3);
        neural[i][j] = strength;
      } 
      // Between-module connectivity (like inter-region)
      else if (Math.abs(iModule - jModule) <= 1) {
        // Adjacent modules have some connectivity
        const strength = Math.exp(-dist / 32) * (0.1 + Math.random() * 0.2);
        neural[i][j] = strength;
      }
      // Long-range connections (like association fibers)
      else if (Math.random() < 0.01) {
        neural[i][j] = 0.1 + Math.random() * 0.2;
      }
    }
  }
  
  // Make symmetric (undirected network)
  for (let i = 0; i < size; i++) {
    for (let j = i + 1; j < size; j++) {
      const avg = (neural[i][j] + neural[j][i]) / 2;
      neural[i][j] = avg;
      neural[j][i] = avg;
    }
  }
  
  return neural;
}

/**
 * Procrustes analysis: Find optimal rotation, translation, and scaling
 * to align two sets of points
 */
export function procrustesAlignment(
  source: ManifoldPoint[],
  target: ManifoldPoint[]
): AlignmentResult {
  if (source.length !== target.length) {
    throw new Error('Source and target must have same number of points');
  }
  
  const n = source.length;
  const dim = source[0].coordinates.length;
  
  // Center both point sets
  const sourceCentroid = calculateCentroid(source);
  const targetCentroid = calculateCentroid(target);
  
  const centeredSource = source.map(p => ({
    ...p,
    coordinates: p.coordinates.map((c, i) => c - sourceCentroid[i])
  }));
  
  const centeredTarget = target.map(p => ({
    ...p,
    coordinates: p.coordinates.map((c, i) => c - targetCentroid[i])
  }));
  
  // Calculate optimal scale
  const sourceNorm = calculateNorm(centeredSource);
  const targetNorm = calculateNorm(centeredTarget);
  const scaleFactor = targetNorm / sourceNorm;
  
  // Scale source
  const scaledSource = centeredSource.map(p => ({
    ...p,
    coordinates: p.coordinates.map(c => c * scaleFactor)
  }));
  
  // For 2D, calculate optimal rotation using SVD approximation
  // Simplified: just calculate correlation-based alignment
  const rotationMatrix = calculateOptimalRotation2D(scaledSource, centeredTarget);
  
  // Apply rotation
  const rotatedSource = scaledSource.map(p => ({
    ...p,
    coordinates: applyRotation2D(p.coordinates, rotationMatrix)
  }));
  
  // Calculate alignment error (sum of squared distances)
  let totalError = 0;
  for (let i = 0; i < n; i++) {
    const dx = rotatedSource[i].coordinates[0] - centeredTarget[i].coordinates[0];
    const dy = rotatedSource[i].coordinates[1] - centeredTarget[i].coordinates[1];
    totalError += dx * dx + dy * dy;
  }
  
  const alignmentError = Math.sqrt(totalError / n);
  
  // Calculate correlation coefficient
  const correlation = calculateCorrelation(rotatedSource, centeredTarget);
  
  return {
    alignmentError,
    rotationMatrix,
    translationVector: targetCentroid.map((t, i) => t - sourceCentroid[i] * scaleFactor),
    scaleFactor,
    correlationCoefficient: correlation
  };
}

function calculateCentroid(points: ManifoldPoint[]): number[] {
  const dim = points[0].coordinates.length;
  const centroid = Array(dim).fill(0);
  
  points.forEach(p => {
    p.coordinates.forEach((c, i) => {
      centroid[i] += c;
    });
  });
  
  return centroid.map(c => c / points.length);
}

function calculateNorm(points: ManifoldPoint[]): number {
  let sum = 0;
  points.forEach(p => {
    p.coordinates.forEach(c => {
      sum += c * c;
    });
  });
  return Math.sqrt(sum);
}

function calculateOptimalRotation2D(source: ManifoldPoint[], target: ManifoldPoint[]): number[][] {
  // Simplified rotation calculation
  // Calculate angle between source and target distributions
  let sumXX = 0, sumXY = 0, sumYX = 0, sumYY = 0;
  
  for (let i = 0; i < source.length; i++) {
    const sx = source[i].coordinates[0];
    const sy = source[i].coordinates[1];
    const tx = target[i].coordinates[0];
    const ty = target[i].coordinates[1];
    
    sumXX += sx * tx;
    sumXY += sx * ty;
    sumYX += sy * tx;
    sumYY += sy * ty;
  }
  
  // Approximate rotation angle
  const angle = Math.atan2(sumXY + sumYX, sumXX + sumYY);
  
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  return [
    [cos, -sin],
    [sin, cos]
  ];
}

function applyRotation2D(coords: number[], rotationMatrix: number[][]): number[] {
  const x = coords[0];
  const y = coords[1];
  
  return [
    rotationMatrix[0][0] * x + rotationMatrix[0][1] * y,
    rotationMatrix[1][0] * x + rotationMatrix[1][1] * y
  ];
}

function calculateCorrelation(source: ManifoldPoint[], target: ManifoldPoint[]): number {
  const n = source.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  
  for (let i = 0; i < n; i++) {
    const x = source[i].coordinates[0];
    const y = target[i].coordinates[0];
    
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Calculate manifold similarity score
 * Combines multiple metrics into a single score (0-100)
 */
export function calculateManifoldSimilarity(alignment: AlignmentResult): number {
  // Lower error is better, higher correlation is better
  const errorScore = Math.max(0, 100 - alignment.alignmentError * 10);
  const correlationScore = (alignment.correlationCoefficient + 1) * 50;
  
  return (errorScore * 0.5 + correlationScore * 0.5);
}
