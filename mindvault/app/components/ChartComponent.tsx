import React, { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export interface ChartData {
  type: 'line' | 'bar' | 'area';
  title: string;
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
      pointBackgroundColor?: string;
      pointRadius?: number;
      tension?: number;
    }>;
  };
}

interface ChartComponentProps {
  chartData: ChartData;
  height?: number;
}

/**
 * Financial chart component to visualize time-series data
 */
const ChartComponent: React.FC<ChartComponentProps> = ({ 
  chartData, 
  height = 300 
}) => {
  // Add state to track the selected chart type
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>(chartData?.type || 'line');
  
  // If no chart data is provided, don't render anything
  if (!chartData || !chartData.data || !chartData.data.labels) {
    return null;
  }
  
  // Transform the data into the format Recharts expects
  const transformedData = chartData.data.labels.map((label, index) => {
    const dataPoint: { [key: string]: any } = { name: label };
    
    // Add each dataset's value for this label
    chartData.data.datasets.forEach(dataset => {
      dataPoint[dataset.label] = dataset.data[index];
    });
    
    return dataPoint;
  });
  
  // Default colors if none provided
  const defaultColors = [
    '#4287f5', '#36B37E', '#6554C0', '#FF5630', '#FFAB00',
    '#00B8D9', '#0065FF', '#4C9AFF', '#2684FF', '#B3D4FF'
  ];
  
  // Find min/max values for better Y axis scaling
  const allValues = chartData.data.datasets.flatMap(dataset => dataset.data);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  
  // Calculate appropriate Y axis domain to emphasize growth
  // Use 80% of the minimum value to make growth appear more significant
  const yAxisDomain = [
    minValue > 0 ? minValue * 0.8 : minValue * 1.1, 
    maxValue * 1.05
  ];
  
  // Common chart props for styling
  const commonChartProps = {
    data: transformedData,
    margin: { top: 10, right: 30, left: 20, bottom: 20 }
  };
  
  // Common axis props
  const xAxisProps = {
    dataKey: "name",
    tick: { fill: '#666', fontSize: 12 },
    angle: -45,
    textAnchor: "end",
    axisLine: { stroke: '#666' }
  };
  
  // Format tooltip values
  const formatTooltip = (value: number) => {
    // Check if the dataset label contains currency or unit information
    const dataset = chartData.data.datasets[0];
    const label = dataset?.label?.toLowerCase() || '';
    
    // If ARR or Revenue (typically in millions)
    if (label.includes('arr') || label.includes('revenue')) {
      return `$${value.toFixed(2)}M`;
    }
    // If Burn Rate (typically in thousands)
    else if (label.includes('burn')) {
      return `$${value.toFixed(0)}K`;
    }
    // If Growth Rate (percentages)
    else if (label.includes('growth') || chartData.title.toLowerCase().includes('growth')) {
      return `${value.toFixed(1)}%`;
    }
    // Default formatting
    else {
      return value.toFixed(2);
    }
  };
  
  // Properly capitalize chart title with special handling for ARR
  const formattedTitle = chartData.title
    .replace(/\b(arr)\b/gi, 'ARR') // First replace ARR
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  // Determine the proper Y-axis tick formatter based on the data
  const getYAxisTickFormatter = () => {
    const dataset = chartData.data.datasets[0];
    const label = dataset?.label?.toLowerCase() || '';
    
    // For ARR and Revenue metrics (typically in millions)
    if (label.includes('arr') || label.includes('revenue')) {
      return (value: number) => `$${(value).toFixed(1)}M`;
    }
    // For Burn Rate (typically in thousands)
    else if (label.includes('burn')) {
      return (value: number) => `$${(value).toFixed(0)}K`;
    }
    // For Growth Rate (percentages)
    else if (label.includes('growth') || chartData.title.toLowerCase().includes('growth')) {
      return (value: number) => `${value.toFixed(1)}%`;
    }
    // Default formatter
    else {
      return (value: number) => {
        if (value >= 1000000) {
          return `${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
          return `${(value / 1000).toFixed(1)}K`;
        } else {
          return value.toFixed(1);
        }
      };
    }
  };
  
  // Get appropriate Y-axis tick formatter
  const yAxisTickFormatter = getYAxisTickFormatter();
  
  // Common grid props
  const gridProps = {
    strokeDasharray: "3 3",
    stroke: "#f0f0f0"
  };
  
  // Common legend props
  const legendProps = {
    wrapperStyle: {
      paddingTop: '10px',
      fontSize: '14px'
    }
  };
  
  // Render the appropriate chart type
  const renderChart = () => {
    switch(chartType) {
      case 'bar':
        return (
          <BarChart {...commonChartProps}>
            <CartesianGrid {...gridProps} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip formatter={formatTooltip} />
            <Legend {...legendProps} />
            {chartData.data.datasets.map((dataset, index) => (
              <Bar
                key={dataset.label}
                dataKey={dataset.label}
                fill={dataset.backgroundColor || defaultColors[index % defaultColors.length]}
                animationDuration={1500}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );
      
      case 'area':
        return (
          <AreaChart {...commonChartProps}>
            <CartesianGrid {...gridProps} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip formatter={formatTooltip} />
            <Legend {...legendProps} />
            {chartData.data.datasets.map((dataset, index) => (
              <Area
                key={dataset.label}
                type="monotone"
                dataKey={dataset.label}
                stroke={dataset.borderColor || defaultColors[index % defaultColors.length]}
                fill={dataset.backgroundColor || `${defaultColors[index % defaultColors.length]}55`}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        );
      
      case 'line':
      default:
        return (
          <LineChart {...commonChartProps}>
            <CartesianGrid {...gridProps} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip formatter={formatTooltip} />
            <Legend {...legendProps} />
            {chartData.data.datasets.map((dataset, index) => (
              <Line
                key={dataset.label}
                type="monotone"
                dataKey={dataset.label}
                stroke={dataset.borderColor || defaultColors[index % defaultColors.length]}
                activeDot={{ r: dataset.pointRadius || 6 }}
                dot={{ r: 4, fill: dataset.pointBackgroundColor || dataset.borderColor || defaultColors[index % defaultColors.length] }}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        );
    }
  };
  
  const yAxisProps = {
    tick: { fill: '#666', fontSize: 12 },
    width: 60,
    domain: yAxisDomain,
    tickFormatter: yAxisTickFormatter
  };
  
  return (
    <div className="mt-4 p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-700">{formattedTitle}</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1 text-sm rounded-md ${chartType === 'line' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Line
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1 text-sm rounded-md ${chartType === 'bar' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Bar
          </button>
          <button
            onClick={() => setChartType('area')}
            className={`px-3 py-1 text-sm rounded-md ${chartType === 'area' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Area
          </button>
        </div>
      </div>
      <div className="w-full" style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartComponent; 