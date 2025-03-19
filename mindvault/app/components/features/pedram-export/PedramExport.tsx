import React, { useState, useRef } from 'react';
import { X, Download, FileDown } from 'lucide-react';
import { generateCustomInstructions } from '../investment-memo/utils/customInstructionsGenerator';
import { buildPromptForPedramQuestion } from '../investment-memo/utils/promptBuilder';
import { pedramAnswerService } from '../../../services/pedramAnswerService';
import { PEDRAM_QUESTIONS } from './data/pedramQuestions';

interface PedramExportProps {
  files: any[];
  onClose: () => void;
}

interface ProgressState {
  currentQuestion: number;
  total: number;
  answers: Record<string, string>;
}

export const PedramExport: React.FC<PedramExportProps> = ({ files, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({
    currentQuestion: 0,
    total: PEDRAM_QUESTIONS.length,
    answers: {}
  });
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleClose = () => {
    if (isProcessing) {
      abortControllerRef.current?.abort();
      setIsProcessing(false);
    }
    onClose();
  };

  const processQuestions = async () => {
    setIsProcessing(true);
    const answers: Record<string, string> = {};
    abortControllerRef.current = new AbortController();

    try {
      for (let i = 0; i < PEDRAM_QUESTIONS.length; i++) {
        // Check if processing was aborted
        if (abortControllerRef.current.signal.aborted) {
          throw new Error('Processing aborted');
        }

        const question = PEDRAM_QUESTIONS[i];
        let instructions = question.instructions || '';

        // Generate custom instructions if needed
        if (question.instructionType === 'custom') {
          try {
            instructions = await generateCustomInstructions({ 
              question: question.question,
              id: `pedram_${i}`,
              description: question.question
            });
          } catch (error) {
            console.error('Error generating custom instructions:', error);
            instructions = 'Failed to generate custom instructions';
          }
        }

        // Build the prompt
        const prompt = buildPromptForPedramQuestion(question.question, instructions);

        // Get the answer
        try {
          const response = await pedramAnswerService.sendMessage(prompt, files, question.model);
          answers[question.question] = response.text;
        } catch (error) {
          if (error.name === 'AbortError') {
            throw error;
          }
          console.error('Error processing question:', error);
          answers[question.question] = 'Failed to process question';
        }

        // Update progress
        setProgress(prev => ({
          ...prev,
          currentQuestion: i + 1,
          answers
        }));
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error during processing:', error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResults = () => {
    const formattedResults = PEDRAM_QUESTIONS.map(q => ({
      question: q.question,
      answer: progress.answers[q.question] || 'No answer generated'
    }));

    const blob = new Blob([JSON.stringify(formattedResults, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedram-analysis-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const progressPercentage = (progress.currentQuestion / progress.total) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Pedram Analysis</h3>
              <p className="text-sm text-gray-600">Generate comprehensive analysis for all questions</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              disabled={isProcessing}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Analysis Progress</span>
              <span className="text-sm text-gray-600">{progress.currentQuestion} of {progress.total} questions</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            {!isProcessing && progress.currentQuestion === 0 && (
              <button
                onClick={processQuestions}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
              >
                Start Analysis
              </button>
            )}
            
            <button
              onClick={downloadResults}
              disabled={progress.currentQuestion !== progress.total || isProcessing}
              className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${
                progress.currentQuestion === progress.total && !isProcessing
                  ? 'text-green-600 bg-green-50 border border-green-200 hover:bg-green-100'
                  : 'text-gray-400 bg-gray-50 border border-gray-200 cursor-not-allowed'
              }`}
            >
              <FileDown size={16} />
              Export Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PedramExport; 