import React from 'react';
import { CheckCircle, AlertCircle, ArrowRight, RotateCw, Clock } from 'lucide-react';

export interface WorkflowStepState {
  status: 'complete' | 'active' | 'pending' | 'error';
  iteration: number;
}

export interface WorkflowIndicatorProps {
  category: string;
  analystState: WorkflowStepState;
  associateState: WorkflowStepState;
  followUpState: WorkflowStepState;
  onReset?: () => void;
  onStepClick?: (step: 'analyst' | 'associate' | 'followUp') => void;
  activeStep?: 'analyst' | 'associate' | 'followUp';
}

const WorkflowIndicator: React.FC<WorkflowIndicatorProps> = ({
  category,
  analystState,
  associateState,
  followUpState,
  onReset,
  onStepClick,
  activeStep = 'analyst'
}) => {
  // Get the highest iteration number for display
  const currentIteration = Math.max(
    analystState.iteration,
    associateState.iteration,
    followUpState.iteration
  );
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="text-green-600" size={16} />;
      case 'active':
        return <Clock className="text-blue-600 animate-pulse" size={16} />;
      case 'error':
        return <AlertCircle className="text-red-600" size={16} />;
      default:
        return <Clock className="text-gray-400" size={16} />;
    }
  };
  
  const getStepBackground = (status: string, isActive: boolean) => {
    if (isActive) return 'bg-blue-100 border-blue-300';
    
    switch (status) {
      case 'complete': return 'bg-green-50 border-green-200';
      case 'active': return 'bg-blue-50 border-blue-200';
      case 'error': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };
  
  return (
    <div className="mb-4 p-2 rounded-lg bg-white border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-gray-700">
          Workflow Progress {currentIteration > 0 && `(Iteration ${currentIteration})`}
        </div>
        {onReset && currentIteration > 0 && (
          <button
            onClick={onReset}
            className="flex items-center text-xs text-gray-600 hover:text-gray-800"
          >
            <RotateCw size={12} className="mr-1" />
            Reset Workflow
          </button>
        )}
      </div>
      
      <div className="flex items-center">
        {/* Analyst Step */}
        <div 
          className={`flex items-center px-3 py-1.5 rounded-md ${getStepBackground(analystState.status, activeStep === 'analyst')} ${onStepClick ? 'cursor-pointer hover:bg-gray-100' : ''}`}
          onClick={() => onStepClick && onStepClick('analyst')}
        >
          <span className="mr-2">{getStatusIcon(analystState.status)}</span>
          <span className="text-sm">Analyst</span>
        </div>
        
        {/* Arrow */}
        <ArrowRight size={16} className="mx-2 text-gray-400" />
        
        {/* Associate Step */}
        <div 
          className={`flex items-center px-3 py-1.5 rounded-md ${getStepBackground(associateState.status, activeStep === 'associate')} ${onStepClick ? 'cursor-pointer hover:bg-gray-100' : ''}`}
          onClick={() => onStepClick && associateState.status !== 'pending' && onStepClick('associate')}
        >
          <span className="mr-2">{getStatusIcon(associateState.status)}</span>
          <span className="text-sm">Associate</span>
        </div>
        
        {/* Arrow */}
        <ArrowRight size={16} className="mx-2 text-gray-400" />
        
        {/* Follow-up Step */}
        <div 
          className={`flex items-center px-3 py-1.5 rounded-md ${getStepBackground(followUpState.status, activeStep === 'followUp')} ${onStepClick ? 'cursor-pointer hover:bg-gray-100' : ''}`}
          onClick={() => onStepClick && followUpState.status !== 'pending' && onStepClick('followUp')}
        >
          <span className="mr-2">{getStatusIcon(followUpState.status)}</span>
          <span className="text-sm">Follow-up</span>
        </div>
      </div>
    </div>
  );
};

export default WorkflowIndicator; 