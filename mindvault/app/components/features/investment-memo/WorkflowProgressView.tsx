import React from 'react';
import { ChevronRight, CheckCircle, AlertCircle, Clock, RotateCw } from 'lucide-react';

export interface WorkflowProgressProps {
  steps: {
    name: string;
    status: 'complete' | 'active' | 'pending' | 'error';
    timestamp?: string;
  }[];
  currentIteration: number;
  totalIterations: number;
  onReset?: () => void;
}

const WorkflowProgressView: React.FC<WorkflowProgressProps> = ({
  steps,
  currentIteration,
  totalIterations,
  onReset
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="text-green-600" size={18} />;
      case 'active':
        return <Clock className="text-blue-600 animate-pulse" size={18} />;
      case 'error':
        return <AlertCircle className="text-red-600" size={18} />;
      default:
        return <Clock className="text-gray-400" size={18} />;
    }
  };
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'complete': return 'text-green-700 bg-green-50 border-green-200';
      case 'active': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'error': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };
  
  return (
    <div className="w-full">
      {/* Iteration indicator */}
      {totalIterations > 1 && (
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium">
            Iteration {currentIteration + 1} of {totalIterations}
          </div>
          {onReset && (
            <button
              onClick={onReset}
              className="flex items-center text-xs text-gray-600 hover:text-gray-800"
            >
              <RotateCw size={12} className="mr-1" />
              Reset Workflow
            </button>
          )}
        </div>
      )}
      
      {/* Progress steps */}
      <div className="flex items-center w-full mb-3">
        {steps.map((step, index) => (
          <React.Fragment key={step.name}>
            {/* Step */}
            <div 
              className={`flex-1 flex-shrink-0 flex items-center px-3 py-2 rounded-md border ${getStatusClass(step.status)}`}
            >
              <span className="mr-2">{getStatusIcon(step.status)}</span>
              <span className="text-sm font-medium">{step.name}</span>
              {step.timestamp && (
                <span className="ml-2 text-xs opacity-70">
                  {new Date(step.timestamp).toLocaleTimeString()}
                </span>
              )}
            </div>
            
            {/* Connector */}
            {index < steps.length - 1 && (
              <ChevronRight className="mx-1 text-gray-400 flex-shrink-0" size={18} />
            )}
          </React.Fragment>
        ))}
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
        <div 
          className="bg-blue-600 rounded-full h-2 transition-all duration-500 ease-in-out"
          style={{ 
            width: `${calculateProgress(steps)}%` 
          }}
        ></div>
      </div>
      
      {/* Progress percentage */}
      <div className="text-xs text-gray-600 text-right">
        {calculateProgress(steps)}% Complete
      </div>
    </div>
  );
};

// Helper to calculate overall progress
const calculateProgress = (steps: WorkflowProgressProps['steps']) => {
  if (steps.length === 0) return 0;
  
  // Each complete step contributes to the progress
  const completeSteps = steps.filter(step => step.status === 'complete').length;
  // Active steps contribute half value
  const activeSteps = steps.filter(step => step.status === 'active').length;
  
  const progress = Math.round(((completeSteps + activeSteps * 0.5) / steps.length) * 100);
  return Math.min(100, Math.max(0, progress));
};

export default WorkflowProgressView; 