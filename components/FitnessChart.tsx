import React from 'react';
import { ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';

interface FitnessChartProps {
  data: number[];
  color: string;
}

const FitnessChart: React.FC<FitnessChartProps> = ({ data, color }) => {
  const chartData = data.map((val, i) => ({ i, val }));

  return (
    <div className="h-20 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <YAxis domain={[-1, 1]} hide />
          <Line 
            type="monotone" 
            dataKey="val" 
            stroke={color} 
            strokeWidth={2} 
            dot={false}
            isAnimationActive={false} // Disable animation for real-time performance
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FitnessChart;