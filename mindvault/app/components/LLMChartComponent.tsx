import React, { useState, useEffect } from 'react';
import { 
  LineChart, BarChart, AreaChart, 
  Line, Bar, Area, 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { generateChartFromLLM } from '../services/llmChartService';

interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor: string;
  borderColor: string;
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

interface ParsedChartData {
  type: string;
  title: string;
  data: ChartData;
}

interface FormattedDataPoint {
  name: string;
  value: number;
}

interface LLMChartComponentProps {
  question: string;
  answer: string;
  fileContent: string;
  isVisible?: boolean;
  height?: number;
}

/**
 * Component that uses LLM to generate relevant charts based on question/answer context
 */
const LLMChartComponent: React.FC<LLMChartComponentProps> = ({ 
  question, 
  answer, 
  fileContent, 
  isVisible = true,
  height = 300
}) => {
  const [chartData, setChartData] = useState<ParsedChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't try to generate a chart if component is hidden
    if (!isVisible || !question || !answer || !fileContent) return;
    
    const generateChart = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("LLMChartComponent: Starting chart generation for question:", question);
        
        // Generate chart data from the LLM service
        const data = await generateChartFromLLM(question, answer, fileContent);
        console.log("LLMChartComponent: Chart generation result:", data ? "Success" : "No chart data returned");
        setChartData(data);
      } catch (err) {
        console.error('Error generating chart:', err);
        setError('Failed to generate chart');
      } finally {
        setLoading(false);
      }
    };
    
    generateChart();
  }, [question, answer, fileContent, isVisible]);

  // If the component is not visible, return null
  if (!isVisible) return null;
  
  // If loading, show a loading indicator
  if (loading) {
    return (
      <div className="p-4 border rounded-lg bg-blue-50 space-y-2">
        <h3 className="text-sm font-semibold text-blue-700">Generating Chart...</h3>
        <div className="h-48 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      </div>
    );
  }
  
  // If error, show error message
  if (error) {
    return (
      <div className="p-4 border rounded-lg bg-red-50">
        <h3 className="text-sm font-semibold text-red-700">Chart Generation Error</h3>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }
  
  // If no chart data or the LLM decided not to create a chart, return null
  if (!chartData) return null;
  
  // Format the data for Recharts
  const formattedData: FormattedDataPoint[] = chartData.data.labels.map((label, index) => ({
    name: label,
    value: chartData.data.datasets[0].data[index]
  }));
  
  // Determine the chart type
  const renderChart = () => {
    const dataKey = "value";
    const stroke = chartData.data.datasets[0].borderColor;
    const fill = chartData.data.datasets[0].backgroundColor;
    
    switch (chartData.type.toLowerCase()) {
      case 'bar':
        return (
          <BarChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar 
              dataKey={dataKey} 
              name={chartData.data.datasets[0].label} 
              fill={fill} 
              stroke={stroke}
              strokeWidth={1}
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        );
      
      case 'area':
        return (
          <AreaChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              name={chartData.data.datasets[0].label} 
              stroke={stroke} 
              fill={fill} 
              strokeWidth={2}
            />
          </AreaChart>
        );
      
      case 'line':
      default:
        return (
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              name={chartData.data.datasets[0].label} 
              stroke={stroke} 
              strokeWidth={2}
              dot={{ r: 4, fill: stroke }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );
    }
  };
  
  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">{chartData.title}</h3>
      <div style={{ width: '100%', height: `${height}px` }}>
        <ResponsiveContainer>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LLMChartComponent; 