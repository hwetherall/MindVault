import React, { useState } from 'react';
import { INVESTMENT_MEMO_QUESTIONS } from './constants';
import QuestionSelectionStep from './QuestionSelectionStep';
import ReportSetupStep from './ReportSetupStep';
import ReportGenerationStep from './ReportGenerationStep';
import ReportEditor from './ReportEditor';
import PDFExporter from './PDFExporter';
import { Answer } from './utils/pdfExport';

interface InvestmentMemoWizardProps {
  files: any[];
  onComplete?: (passed: boolean) => void;
}

/**
 * The main wizard container component that manages the multi-step flow
 * for creating investment memos
 */
const InvestmentMemoWizard: React.FC<InvestmentMemoWizardProps> = ({
  files,
  onComplete
}) => {
  // Define the steps of the wizard
  const STEPS = [
    'Question Selection',
    'Report Setup',
    'Report Generation',
    'Report Editing',
    'Export'
  ];

  // State for the wizard
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [reportState, setReportState] = useState({
    title: '',
    description: '',
    selectedQuestions: [] as string[],
    answers: {} as Record<string, Answer>,
    status: 'initial', // 'initial', 'generating', 'complete'
    progress: 0
  });

  // Handler for moving to the next step
  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  // Handler for moving to the previous step
  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // Handler for updating report state
  const updateReportState = (updates: Partial<typeof reportState>) => {
    // Ensure title and description are always strings
    const sanitizedUpdates = {
      ...updates,
      title: typeof updates.title !== 'undefined' ? String(updates.title || '') : undefined,
      description: typeof updates.description !== 'undefined' ? String(updates.description || '') : undefined
    };
    
    setReportState(prev => ({
      ...prev,
      ...(sanitizedUpdates as Partial<typeof reportState>)
    }));
  };

  // Render the current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <QuestionSelectionStep
            questions={INVESTMENT_MEMO_QUESTIONS}
            selectedQuestions={reportState.selectedQuestions}
            onSelectionChange={(selectedQuestions) => 
              updateReportState({ selectedQuestions })
            }
            onNext={handleNext}
          />
        );
      case 1:
        return (
          <ReportSetupStep
            title={reportState.title}
            description={reportState.description}
            files={files}
            onConfigChange={(config) => updateReportState(config)}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <ReportGenerationStep
            selectedQuestions={reportState.selectedQuestions}
            files={files}
            title={reportState.title}
            description={reportState.description}
            onProgress={(progress) => updateReportState({ progress })}
            onGenerationComplete={(answers) => 
              updateReportState({ 
                answers, 
                status: 'complete' 
              })
            }
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        );
      case 3:
        return (
          <ReportEditor
            title={reportState.title}
            description={reportState.description}
            questions={INVESTMENT_MEMO_QUESTIONS.filter(q => 
              reportState.selectedQuestions.includes(q.id)
            )}
            answers={reportState.answers}
            onAnswersChange={(answers) => updateReportState({ answers })}
            onPrevious={handlePrevious}
            onNext={handleNext}
          />
        );
      case 4:
        return (
          <PDFExporter
            title={reportState.title}
            description={reportState.description}
            questions={INVESTMENT_MEMO_QUESTIONS.filter(q => 
              reportState.selectedQuestions.includes(q.id)
            )}
            answers={reportState.answers}
            onPrevious={handlePrevious}
            onComplete={() => onComplete && onComplete(true)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Wizard Progress Indicator */}
      <div className="mb-6">
        <div className="flex justify-between items-center w-full mb-2">
          {STEPS.map((step, index) => (
            <div 
              key={index} 
              className={`flex items-center ${
                index < STEPS.length - 1 ? 'flex-1' : ''
              }`}
            >
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                  index < currentStep 
                    ? 'bg-green-500 text-white' 
                    : index === currentStep 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700'
                }`}
              >
                {index + 1}
              </div>
              {index < STEPS.length - 1 && (
                <div 
                  className={`h-1 flex-1 mx-2 ${
                    index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between w-full px-1">
          {STEPS.map((step, index) => (
            <div 
              key={index} 
              className={`text-xs font-medium ${
                index === currentStep 
                  ? 'text-blue-600' 
                  : index < currentStep 
                    ? 'text-green-500' 
                    : 'text-gray-500'
              }`}
              style={{ 
                width: `${100 / STEPS.length}%`, 
                textAlign: index === 0 ? 'left' : index === STEPS.length - 1 ? 'right' : 'center' 
              }}
            >
              {step}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="flex-1">
        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default InvestmentMemoWizard; 