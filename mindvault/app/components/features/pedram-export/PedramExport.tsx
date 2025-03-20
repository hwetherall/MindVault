import React, { useState, useRef } from 'react';
import { X, Download, FileDown, FileText } from 'lucide-react';
import { generateCustomInstructions } from '../investment-memo/utils/customInstructionsGenerator';
import { buildPromptForPedramQuestion } from '../investment-memo/utils/promptBuilder';
import { pedramAnswerService } from '../../../services/pedramAnswerService';
import { PEDRAM_QUESTIONS } from './data/pedramQuestions';
import './InvestmentMemoStyles.css';

interface PedramExportProps {
  files: any[];
  onClose: () => void;
}

interface ProgressState {
  currentQuestion: number;
  total: number;
  answers: Record<string, string>;
  stage: 'initial' | 'questions' | 'generating' | 'complete';
  memo: string | null;
}

export const PedramExport: React.FC<PedramExportProps> = ({ files, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({
    currentQuestion: 0,
    total: PEDRAM_QUESTIONS.length,
    answers: {},
    stage: 'initial',
    memo: null
  });
  const abortControllerRef = useRef<AbortController | null>(null);
  const memoContentRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    if (isProcessing) {
      abortControllerRef.current?.abort();
      setIsProcessing(false);
    }
    onClose();
  };

  const processQuestions = async () => {
    setIsProcessing(true);
    setProgress(prev => ({ ...prev, stage: 'questions' }));
    const answers: Record<string, string> = {};
    abortControllerRef.current = new AbortController();
    
    // Helper function to delay execution
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Configurable delay between API calls (in milliseconds)
    const API_DELAY = 300; // Adjust as needed
    
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
              ...question,
              id: `pedram_${i}`
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
          answers[question.question] = typeof response === 'string' ? response : response.text;
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
        
        // Add delay between requests, but not after the last one
        if (i < PEDRAM_QUESTIONS.length - 1) {
          console.log(`Waiting ${API_DELAY}ms before next request to avoid rate limiting...`);
          await delay(API_DELAY);
        }
      }

      // After all questions are answered, generate the investment memo
      await generateInvestmentMemo(answers);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error during processing:', error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const generateInvestmentMemo = async (answers: Record<string, string>) => {
    try {
      setProgress(prev => ({ ...prev, stage: 'generating' }));
      
      // Format the questions and answers into a structured format for the LLM
      const questionsAndAnswers = PEDRAM_QUESTIONS.map(q => ({
        question: q.question,
        answer: answers[q.question] || 'No answer available',
        category: q.category
      }));

      // Convert to JSON string for the LLM prompt
      const qaJson = JSON.stringify(questionsAndAnswers, null, 2);

      // Create a prompt for the high-quality LLM to generate an investment memo
      const memoPrompt = `
You are an expert investment analyst. I'm going to provide you with JSON data containing 
questions and answers about a potential investment opportunity. 

Your task is to synthesize this information into a professional investment memo similar to 
the X-Energy example, with the following sections:

1. Executive Summary
   - Venture Overview
   - Market Opportunity
   - Product/Service Offering
   - Business Model and Traction
   - Leadership Team

2. Market Potential
   - Strategic Fit
   - Market Size and Growth
   - Optimistic Growth Scenario
   - Other Strategic Alignment

3. Current Stage and Ask
   - Current Resources
   - Investment Needs
   - Key Achievements
   - Growth Plan
   - Return Potential

4. Strategic Thesis Fit
   - Market Potential
   - Team
   - Traction and Growth

5. Market Opportunity
   - Industry Overview
   - Customer Pain Points
   - Competitive Landscape
   - Target Market
   - Market Validation

6. Product and Value Proposition
   - Solution Overview
   - Key Features
   - Customer Validation
   - Sustainable Advantage

7. Business Model and Go-To-Market
   - Revenue Model
   - Target Customers
   - Partnerships
   - Expansion Strategy

8. Competitive Landscape
   - Competitors
   - Differentiation

9. Financials
   - Financial Performance
   - Profitability Timeline
   - Resource Needs and Investment Ask

10. Key Risks
    - Risks
    - Mitigation Strategies

11. Opportunity Analysis
    - High Case
    - Base Case
    - Low Case
    - Loss of Capital

12. Conclusion
    - Investment Recommendation
    - Strategic Alignment
    - Final Considerations

Please format the memo in HTML with appropriate styling. Use tables where relevant,
and create a professional, well-structured report. Identify and highlight key metrics and insights.

Here is the data to analyze:
${qaJson}

Based on this information, generate a comprehensive investment memo that would help
an investor make an informed decision about this opportunity.
      `;

      // Call the high-quality LLM to generate the memo
      const response = await pedramAnswerService.sendHighQualityMessage(memoPrompt, 'deepseek-r1-distill-llama-70b');
      
      // Update state with the generated memo
      setProgress(prev => ({ 
        ...prev, 
        stage: 'complete', 
        memo: typeof response === 'string' ? response : response.text 
      }));
      
    } catch (error) {
      console.error('Error generating investment memo:', error);
      setProgress(prev => ({ 
        ...prev, 
        stage: 'complete', 
        memo: '<p>Error generating investment memo. Please try again.</p>' 
      }));
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

  const downloadPdf = async () => {
    if (!memoContentRef.current) return;
    
    // Only import html2pdf.js on the client side
    if (typeof window !== 'undefined') {
      try {
        const html2pdf = (await import('html2pdf.js')).default;
        
        // Configure PDF options
        const opt = {
          margin: [10, 10, 10, 10],
          filename: `investment-memo-${new Date().toISOString()}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Generate PDF from the HTML content
        html2pdf().set(opt).from(memoContentRef.current).save();
      } catch (error) {
        console.error('Error generating PDF:', error);
      }
    }
  };

  const progressPercentage = progress.stage === 'questions' 
    ? (progress.currentQuestion / progress.total) * 100
    : progress.stage === 'generating' ? 100 : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 my-8">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {progress.stage === 'complete' ? 'Investment Memo' : 'Pedram Analysis'}
              </h3>
              <p className="text-sm text-gray-600">
                {progress.stage === 'initial' && 'Generate comprehensive analysis for all questions'}
                {progress.stage === 'questions' && `Processing ${progress.currentQuestion} of ${progress.total} questions`}
                {progress.stage === 'generating' && 'Generating investment memo from analysis...'}
                {progress.stage === 'complete' && 'Your investment memo is ready to download'}
              </p>
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
          {(progress.stage === 'initial' || progress.stage === 'questions' || progress.stage === 'generating') && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {progress.stage === 'generating' ? 'Generating Investment Memo' : 'Analysis Progress'}
                </span>
                {progress.stage === 'questions' && (
                  <span className="text-sm text-gray-600">
                    {progress.currentQuestion} of {progress.total} questions
                  </span>
                )}
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Show the investment memo when complete */}
          {progress.stage === 'complete' && progress.memo && (
            <div 
              ref={memoContentRef} 
              className="max-h-[60vh] overflow-y-auto mb-6 p-4 border rounded-lg"
              dangerouslySetInnerHTML={{ __html: progress.memo }}
            />
          )}

          <div className="flex justify-end gap-3">
            {!isProcessing && progress.stage === 'initial' && (
              <button
                onClick={processQuestions}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
              >
                Start Analysis
              </button>
            )}
            
            {progress.stage === 'complete' && (
              <>
                <button
                  onClick={downloadResults}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                >
                  <FileDown size={16} />
                  Export JSON
                </button>
                <button
                  onClick={downloadPdf}
                  className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2"
                >
                  <FileText size={16} />
                  Download PDF
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PedramExport; 