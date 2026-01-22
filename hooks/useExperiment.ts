import { useState, useEffect, useRef, useCallback } from 'react';
import { StrategyType, SimulationState, StrategyData, POPULATION_SIZE, ClusterNode } from '../types';
import { createInitialPopulation, evolvePopulation, generateAdjacency, computeFitness, computeModularity, generateSyntheticAdjacency, computeHistoryVariance } from '../utils/simulation';
import { EXPERIMENTAL_DATASET } from '../utils/experimentalData';

const HISTORY_LENGTH = 50;
const TELEMETRY_PORT = 3333;
const MAX_GENERATIONS = 100; // Limit simulation to match dataset length

const INITIAL_NODES: ClusterNode[] = [
  { id: 'n1', name: 'muladhara', status: 'active', runtime: '8h 47min', generation: 10, cpuUsage: 83, memoryUsage: 16, temperature: 62, gpuUsage: 94, vramUsage: 22, powerDraw: 450, tflops: 125 },
  { id: 'n2', name: 'svadhisthana', status: 'syncing', runtime: '4h 51min', generation: 0, cpuUsage: 45, memoryUsage: 12, temperature: 45, gpuUsage: 10, vramUsage: 4, powerDraw: 120, tflops: 0 },
  { id: 'n3', name: 'manipura', status: 'syncing', runtime: '4h 54min', generation: 0, cpuUsage: 56, memoryUsage: 14, temperature: 48, gpuUsage: 12, vramUsage: 4, powerDraw: 135, tflops: 0 },
  { id: 'n4', name: 'anahata', status: 'syncing', runtime: '4h 52min', generation: 0, cpuUsage: 42, memoryUsage: 11, temperature: 42, gpuUsage: 5, vramUsage: 2, powerDraw: 110, tflops: 0 },
  { id: 'n5', name: 'vishuddha', status: 'standby', runtime: '0h 00min', generation: 0, cpuUsage: 15, memoryUsage: 4, temperature: 28, gpuUsage: 0, vramUsage: 0, powerDraw: 45, tflops: 0 },
];

export const useExperiment = () => {
  const [simulationState, setSimulationState] = useState<SimulationState | null>(null);
  const stateRef = useRef<SimulationState | null>(null);
  const frameIdRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const lastGenTimeRef = useRef<number>(0);
  const playbackIndexRef = useRef<number>(0);

  // Initialization helper
  const initializeState = useCallback((preserveSettings = false, mode: 'theory' | 'experimental' = 'theory') => {
    const initialStrategies = Object.values(StrategyType).reduce((acc, type) => {
      const pop = createInitialPopulation(POPULATION_SIZE);
      const adj = generateAdjacency(pop);
      const rawFitness = computeFitness(pop, adj); 
      const mod = computeModularity(adj);
      
      acc[type] = {
        type,
        population: pop,
        fitness: rawFitness,
        modularity: mod,
        adjacency: adj,
        fitnessHistory: Array(HISTORY_LENGTH).fill(0),
        variance: 0,
        varianceHistory: Array(HISTORY_LENGTH).fill(0)
      };
      return acc;
    }, {} as Record<StrategyType, StrategyData>);

    // If preserving settings, grab the current delay, otherwise default to 100
    const currentDelay = (preserveSettings && stateRef.current) 
        ? stateRef.current.simulationDelay 
        : 100;

    const initialState: SimulationState = {
      id: Math.random().toString(36).substring(7), // Unique Session ID forces DNA Visualizer reset
      generation: 0,
      simulationDelay: currentDelay, 
      strategies: initialStrategies,
      cluster: INITIAL_NODES,
      metrics: {
        topoLead: 0,
        modularityScore: 0,
        // Start at 50% (Neutral) for Theory, 0% for Experimental (Data Collection phase)
        thesisProgress: mode === 'theory' ? 50 : 0
      },
      isRunning: true,
      telemetryMode: 'simulated',
      isLocalConnected: false,
      playbackMode: mode
    };
    
    playbackIndexRef.current = 0;
    stateRef.current = initialState;
    setSimulationState(initialState);
  }, []);

  // Initialize once
  useEffect(() => {
    initializeState(false, 'theory');
  }, [initializeState]);

  // Polling for Local Telemetry
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      if (!stateRef.current || stateRef.current.telemetryMode !== 'local') return;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 800);
        
        const response = await fetch(`http://localhost:${TELEMETRY_PORT}/stats`, { 
            signal: controller.signal 
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const realData = await response.json();
          // Expecting realData to be an array of ClusterNodes or a single object to merge
          if (Array.isArray(realData)) {
             stateRef.current.cluster = realData;
             stateRef.current.isLocalConnected = true;
          }
        }
      } catch (e) {
        stateRef.current.isLocalConnected = false;
        // Keep existing data but mark disconnected
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, []);

  const tick = useCallback(() => {
    if (!stateRef.current || !stateRef.current.isRunning) return;

    // Time throttling logic for variable speed
    const now = Date.now();
    const elapsed = now - lastGenTimeRef.current;
    
    if (elapsed < stateRef.current.simulationDelay) {
        frameIdRef.current = requestAnimationFrame(tick);
        return;
    }
    
    lastGenTimeRef.current = now;

    // Stop Condition for BOTH modes
    if (stateRef.current.generation >= MAX_GENERATIONS) {
        stateRef.current.isRunning = false;
        setSimulationState({...stateRef.current});
        return;
    }

    // --- PLAYBACK MODE (EXPERIMENTAL DATA) ---
    if (stateRef.current.playbackMode === 'experimental') {
        const idx = playbackIndexRef.current;
        
        // Safety check for array bounds
        if (idx >= EXPERIMENTAL_DATASET.length) {
            stateRef.current.isRunning = false;
            setSimulationState({...stateRef.current});
            return;
        }
        
        const dataPoint = EXPERIMENTAL_DATASET[playbackIndexRef.current];
        const prevStrategies = stateRef.current.strategies;
        const nextStrategies = {} as Record<StrategyType, StrategyData>;

        // Update strategies based on recorded data
        Object.values(StrategyType).forEach(type => {
            let val = 0;
            let std = 0;
            switch(type) {
                case StrategyType.Direct: 
                    val = dataPoint.direct; 
                    std = dataPoint.directStd;
                    break;
                case StrategyType.Flat: 
                    val = dataPoint.flat; 
                    std = dataPoint.flatStd;
                    break;
                case StrategyType.Hierarchical: 
                    val = dataPoint.hierarchical; 
                    std = dataPoint.hierStd;
                    break;
                case StrategyType.Topological: 
                    val = dataPoint.topological; 
                    std = dataPoint.topoStd;
                    break;
            }

            const prev = prevStrategies[type];
            const nextHistory = [...prev.fitnessHistory, val].slice(-HISTORY_LENGTH);
            const nextVarHistory = [...prev.varianceHistory, std].slice(-HISTORY_LENGTH);

            // For visuals, we need an adjacency matrix.
            // For Topological, we generate one that LOOKS like the data.
            // For others, we can keep static noise or generate random noise.
            let nextAdj = prev.adjacency;
            if (type === StrategyType.Topological) {
                nextAdj = generateSyntheticAdjacency(dataPoint.modularity);
            } else if (idx % 10 === 0) {
                 // Regenerate random noise occasionally for others to show "aliveness"
                 nextAdj = generateAdjacency(createInitialPopulation(POPULATION_SIZE));
            }

            nextStrategies[type] = {
                ...prev,
                fitness: val,
                modularity: type === StrategyType.Topological ? dataPoint.modularity : 0.1,
                fitnessHistory: nextHistory,
                variance: std,
                varianceHistory: nextVarHistory,
                adjacency: nextAdj
            };
        });

        const nextState: SimulationState = {
            ...stateRef.current,
            generation: dataPoint.gen,
            strategies: nextStrategies,
            metrics: {
                topoLead: -20, // Negative in reality
                modularityScore: dataPoint.modularity,
                thesisProgress: 0 // In experimental, this meter is replaced by the Negative Result banner
            }
        };

        playbackIndexRef.current++;
        stateRef.current = nextState;
        setSimulationState(nextState);
        frameIdRef.current = requestAnimationFrame(tick);
        return;
    }


    // --- THEORY MODE (LIVE SIMULATION) ---
    // In this mode, we visualize the HYPOTHESIS: That Topological structure *should* win.
    
    const currentStrategies = stateRef.current.strategies;
    const nextStrategies = {} as Record<StrategyType, StrategyData>;
    let topoFitness = 0;
    let maxOtherFitness = -999;
    let topoModularity = 0;

    // Evolve strategies
    Object.values(StrategyType).forEach(type => {
      const prev = currentStrategies[type];
      const nextPop = evolvePopulation(prev.population, type);
      const nextAdj = generateAdjacency(nextPop);
      let adjustedFitness = computeFitness(nextPop, nextAdj); 
      
      // THEORY BIAS:
      // Since this mode visualizes our *hypothesis*, we give the Topological strategy 
      // the theoretical benefit of the doubt. We assume metabolic efficiency (low cost)
      // translates directly to a massive survival advantage.
      if (type === StrategyType.Topological) {
          // Boost fitness to demonstrate the "Expected" outcome
          adjustedFitness = Math.abs(adjustedFitness) * 1.5 + 0.3; 
      } else {
          // Suppress others slightly to show the "Chaos Penalty" hypothesized
          adjustedFitness *= 0.9;
      }

      const nextModularity = computeModularity(nextAdj);
      const nextHistory = [...prev.fitnessHistory, adjustedFitness].slice(-HISTORY_LENGTH);
      
      // Calculate Volatility/Variance based on history stability
      const volatility = computeHistoryVariance(nextHistory);
      const nextVarHistory = [...prev.varianceHistory, volatility].slice(-HISTORY_LENGTH);

      nextStrategies[type] = {
        type,
        population: nextPop,
        fitness: adjustedFitness,
        modularity: nextModularity,
        adjacency: nextAdj,
        fitnessHistory: nextHistory,
        variance: volatility,
        varianceHistory: nextVarHistory
      };

      if (type === StrategyType.Topological) {
        topoFitness = adjustedFitness;
        topoModularity = nextModularity;
      } else {
        maxOtherFitness = Math.max(maxOtherFitness, adjustedFitness);
      }
    });

    const topoLead = topoFitness - maxOtherFitness;
    
    // Confidence Meter Logic (Theory Mode)
    // If Topological is winning (as hypothesized), confidence increases towards 100%
    // If it loses, confidence drops.
    let thesisDelta = 0;
    if (topoLead > 0) thesisDelta = 1.5; // Gaining confidence
    else thesisDelta = -0.5; // Losing confidence

    const thesisProgress = Math.min(100, Math.max(0, 
      stateRef.current.metrics.thesisProgress + thesisDelta
    ));

    // Update Cluster Telemetry
    let nextCluster = stateRef.current.cluster;

    if (stateRef.current.telemetryMode === 'simulated') {
        const time = (Date.now() - startTimeRef.current) / 1000;
        nextCluster = stateRef.current.cluster.map((node, i) => {
            const phase = i * (Math.PI / 2);
            const thermalCycle = Math.sin(time * 0.5 + phase) * 2; 
            const jitter = (Math.random() - 0.5) * 1.5;

            let newGen = node.generation;
            if (node.name === 'muladhara') {
                newGen += 1;
            } else if (Math.random() > 0.8) {
                newGen += 1; 
            }
            
            let status = node.status;
            if (newGen > 0 && status === 'syncing') status = 'active';
            const baseTemp = node.name === 'muladhara' ? 62 : 45;
            
            // Simulation logic for new metrics
            const isActive = status === 'active';
            const loadFactor = isActive ? 1.0 : 0.1;
            const targetTflops = isActive ? (node.name === 'muladhara' ? 125 : 80) : 0;
            const targetGpu = isActive ? (node.name === 'muladhara' ? 95 : 60) : 0;
            const targetPower = isActive ? (node.name === 'muladhara' ? 450 : 300) : 50;

            return {
                ...node,
                cpuUsage: Math.max(5, Math.min(100, Math.round(node.cpuUsage + (Math.random() - 0.5) * 10))),
                memoryUsage: Math.max(1, parseFloat((node.memoryUsage + (Math.random() - 0.5) * 0.1).toFixed(1))),
                temperature: Math.round(baseTemp + thermalCycle + jitter),
                generation: newGen,
                gpuUsage: Math.max(0, Math.min(100, Math.round(targetGpu + (Math.random() - 0.5) * 5))),
                vramUsage: parseFloat((node.vramUsage * 0.99 + (isActive ? 20 : 2) * 0.01).toFixed(1)),
                powerDraw: Math.round(node.powerDraw * 0.9 + targetPower * 0.1 + (Math.random() - 0.5) * 10),
                tflops: Math.round(node.tflops * 0.9 + targetTflops * 0.1)
            };
        });
    }

    const nextState: SimulationState = {
      id: stateRef.current.id,
      generation: stateRef.current.generation + 1,
      simulationDelay: stateRef.current.simulationDelay,
      strategies: nextStrategies,
      cluster: nextCluster,
      metrics: {
        topoLead,
        modularityScore: topoModularity,
        thesisProgress
      },
      isRunning: stateRef.current.isRunning,
      telemetryMode: stateRef.current.telemetryMode,
      isLocalConnected: stateRef.current.isLocalConnected,
      playbackMode: 'theory'
    };

    stateRef.current = nextState;
    setSimulationState(nextState);
    frameIdRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (stateRef.current?.isRunning) {
        frameIdRef.current = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(frameIdRef.current);
  }, [tick, simulationState?.isRunning]);

  const togglePause = () => {
    if (stateRef.current) {
        stateRef.current.isRunning = !stateRef.current.isRunning;
        setSimulationState({...stateRef.current});
    }
  };

  const resetExperiment = () => {
      // Preserve current mode but RESTART simulation
      // This will generate a new ID, forcing DNAVisualizer to reset
      initializeState(true, stateRef.current?.playbackMode); 
  };
  
  const togglePlaybackMode = (mode: 'theory' | 'experimental') => {
      // Switch mode and RESET simulation
      initializeState(true, mode);
  }

  const setTelemetryMode = (mode: 'simulated' | 'local') => {
      if (stateRef.current) {
          stateRef.current.telemetryMode = mode;
          setSimulationState({...stateRef.current});
      }
  };

  const setSimulationDelay = (delay: number) => {
    if (stateRef.current) {
        stateRef.current.simulationDelay = delay;
        setSimulationState({...stateRef.current});
    }
  };

  return { 
      state: simulationState, 
      togglePause, 
      resetExperiment, 
      setTelemetryMode, 
      setSimulationDelay,
      togglePlaybackMode // Exported for App.tsx
  };
};