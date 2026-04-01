/**
 * Thermodynamic Loss Function and Free Energy Calculations
 * Implements the Free Energy Principle for genomic topology
 */

export interface FreeEnergyMetrics {
  totalFreeEnergy: number;
  predictionError: number; // "Surprise"
  complexity: number; // Model complexity
  accuracy: number; // Fit to data
  entropyRate: number; // Information entropy
}

export interface HeatMapCell {
  row: number;
  col: number;
  freeEnergy: number; // Local free energy at this position
  surprise: number; // Local prediction error
}

/**
 * Calculate Variational Free Energy for genomic structure
 * Free Energy = Complexity - Accuracy
 * Minimizing free energy = maximizing evidence for the model
 */
export function calculateVariationalFreeEnergy(
  adjacency: number[][],
  expectedPattern: number[][] | null = null
): FreeEnergyMetrics {
  const n = adjacency.length;
  
  // 1. Calculate Complexity (Entropy of the structure)
  const complexity = calculateStructuralComplexity(adjacency);
  
  // 2. Calculate Accuracy (Fit to expected pattern)
  let accuracy = 0;
  if (expectedPattern) {
    accuracy = calculateAccuracy(adjacency, expectedPattern);
  } else {
    // Use ideal TAD structure as expectation
    const idealTAD = generateIdealTADPattern(n);
    accuracy = calculateAccuracy(adjacency, idealTAD);
  }
  
  // 3. Prediction Error ("Surprise")
  const predictionError = 1.0 - accuracy;
  
  // 4. Entropy Rate
  const entropyRate = calculateEntropyRate(adjacency);
  
  // 5. Total Free Energy = Complexity - Accuracy (or Complexity + Surprise)
  // Higher free energy = less optimal structure
  const totalFreeEnergy = complexity - accuracy + predictionError;
  
  return {
    totalFreeEnergy,
    predictionError,
    complexity,
    accuracy,
    entropyRate
  };
}

/**
 * Calculate structural complexity (KL divergence approximation)
 */
function calculateStructuralComplexity(adjacency: number[][]): number {
  const n = adjacency.length;
  let complexity = 0;
  
  // Calculate distribution of connection strengths
  const values: number[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      if (adjacency[i][j] > 0.01) {
        values.push(adjacency[i][j]);
      }
    }
  }
  
  if (values.length === 0) return 0;
  
  // Bin the values
  const bins = 10;
  const histogram = new Array(bins).fill(0);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const binSize = (max - min) / bins;
  
  values.forEach(v => {
    const bin = Math.min(bins - 1, Math.floor((v - min) / binSize));
    histogram[bin]++;
  });
  
  // Calculate KL divergence from uniform distribution
  const uniform = 1.0 / bins;
  const total = values.length;
  
  histogram.forEach(count => {
    if (count > 0) {
      const p = count / total;
      complexity += p * Math.log(p / uniform);
    }
  });
  
  return complexity;
}

/**
 * Calculate accuracy (similarity to expected pattern)
 */
function calculateAccuracy(actual: number[][], expected: number[][]): number {
  const n = actual.length;
  let correlation = 0;
  let actualSum = 0;
  let expectedSum = 0;
  let actualSumSq = 0;
  let expectedSumSq = 0;
  let count = 0;
  
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const a = actual[i][j];
      const e = expected[i][j];
      
      correlation += a * e;
      actualSum += a;
      expectedSum += e;
      actualSumSq += a * a;
      expectedSumSq += e * e;
      count++;
    }
  }
  
  // Pearson correlation coefficient
  const numerator = count * correlation - actualSum * expectedSum;
  const denominator = Math.sqrt(
    (count * actualSumSq - actualSum * actualSum) *
    (count * expectedSumSq - expectedSum * expectedSum)
  );
  
  if (denominator === 0) return 0;
  
  const corr = numerator / denominator;
  return (corr + 1) / 2; // Normalize to 0-1
}

/**
 * Generate ideal TAD pattern for comparison
 */
function generateIdealTADPattern(size: number): number[][] {
  const pattern = Array(size).fill(0).map(() => Array(size).fill(0));
  const TAD_SIZE = 16;
  
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const rowTad = Math.floor(i / TAD_SIZE);
      const colTad = Math.floor(j / TAD_SIZE);
      const dist = Math.abs(i - j);
      
      if (rowTad === colTad) {
        // Within TAD: exponential decay
        pattern[i][j] = Math.exp(-dist / 8);
        
        // Corner peaks
        const tadStart = rowTad * TAD_SIZE;
        const tadEnd = tadStart + TAD_SIZE;
        const isCorner = (i < tadStart + 3 && j > tadEnd - 4) || (j < tadStart + 3 && i > tadEnd - 4);
        if (isCorner) {
          pattern[i][j] = 1.0;
        }
      } else {
        // Between TADs: very low
        pattern[i][j] = 0.01;
      }
    }
  }
  
  return pattern;
}

/**
 * Calculate entropy rate (information content)
 */
function calculateEntropyRate(adjacency: number[][]): number {
  const n = adjacency.length;
  const rowEntropies: number[] = [];
  
  for (let i = 0; i < n; i++) {
    const row = adjacency[i];
    const sum = row.reduce((a, b) => a + b, 0);
    
    if (sum > 0) {
      let entropy = 0;
      for (let j = 0; j < n; j++) {
        if (row[j] > 0) {
          const p = row[j] / sum;
          entropy -= p * Math.log2(p);
        }
      }
      rowEntropies.push(entropy);
    }
  }
  
  return rowEntropies.length > 0 
    ? rowEntropies.reduce((a, b) => a + b, 0) / rowEntropies.length 
    : 0;
}

/**
 * Generate heat map of free energy across the matrix
 * Each cell shows local free energy (deviation from expected pattern)
 */
export function generateFreeEnergyHeatMap(adjacency: number[][]): HeatMapCell[] {
  const n = adjacency.length;
  const heatMap: HeatMapCell[] = [];
  const idealPattern = generateIdealTADPattern(n);
  
  // Calculate local free energy for each cell
  // Free energy = deviation from ideal + local complexity
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const actual = adjacency[i][j];
      const expected = idealPattern[i][j];
      
      // Surprise: how different from expectation
      const surprise = Math.abs(actual - expected);
      
      // Local complexity: variance in neighborhood
      const neighborhood = getNeighborhoodValues(adjacency, i, j, 2);
      const mean = neighborhood.reduce((a, b) => a + b, 0) / neighborhood.length;
      const variance = neighborhood.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / neighborhood.length;
      
      // Free energy = surprise + complexity
      const freeEnergy = surprise + Math.sqrt(variance);
      
      heatMap.push({
        row: i,
        col: j,
        freeEnergy,
        surprise
      });
      
      // Add symmetric entry
      if (i !== j) {
        heatMap.push({
          row: j,
          col: i,
          freeEnergy,
          surprise
        });
      }
    }
  }
  
  return heatMap;
}

/**
 * Get values in a neighborhood around a cell
 */
function getNeighborhoodValues(matrix: number[][], row: number, col: number, radius: number): number[] {
  const n = matrix.length;
  const values: number[] = [];
  
  for (let i = Math.max(0, row - radius); i <= Math.min(n - 1, row + radius); i++) {
    for (let j = Math.max(0, col - radius); j <= Math.min(n - 1, col + radius); j++) {
      values.push(matrix[i][j]);
    }
  }
  
  return values;
}

/**
 * Normalize heat map values to 0-1 range for visualization
 */
export function normalizeHeatMap(heatMap: HeatMapCell[]): HeatMapCell[] {
  if (heatMap.length === 0) return [];
  
  const maxFE = Math.max(...heatMap.map(c => c.freeEnergy));
  const minFE = Math.min(...heatMap.map(c => c.freeEnergy));
  const rangeFE = maxFE - minFE;
  
  const maxS = Math.max(...heatMap.map(c => c.surprise));
  const minS = Math.min(...heatMap.map(c => c.surprise));
  const rangeS = maxS - minS;
  
  return heatMap.map(cell => ({
    ...cell,
    freeEnergy: rangeFE > 0 ? (cell.freeEnergy - minFE) / rangeFE : 0.5,
    surprise: rangeS > 0 ? (cell.surprise - minS) / rangeS : 0.5
  }));
}

/**
 * Calculate spatial gradient of free energy
 * High gradient = rapid changes = structural instability
 */
export function calculateFreeEnergyGradient(heatMap: HeatMapCell[], matrixSize: number): number {
  const matrix = Array(matrixSize).fill(0).map(() => Array(matrixSize).fill(0));
  
  // Build matrix from heat map
  heatMap.forEach(cell => {
    matrix[cell.row][cell.col] = cell.freeEnergy;
  });
  
  let totalGradient = 0;
  let count = 0;
  
  for (let i = 1; i < matrixSize - 1; i++) {
    for (let j = 1; j < matrixSize - 1; j++) {
      const gx = (matrix[i + 1][j] - matrix[i - 1][j]) / 2;
      const gy = (matrix[i][j + 1] - matrix[i][j - 1]) / 2;
      const gradMagnitude = Math.sqrt(gx * gx + gy * gy);
      
      totalGradient += gradMagnitude;
      count++;
    }
  }
  
  return count > 0 ? totalGradient / count : 0;
}
