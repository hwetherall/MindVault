import React, { useState, useEffect, useRef } from 'react';
import { FileDown, PlusCircle, Pencil, Check, RefreshCw, MessageCircle, Gauge, ArrowUpCircle, Upload, FileText, X } from 'lucide-react';
import QuestionItem from './QuestionItem';
import QuestionSelectionModal from './QuestionSelectionModal';
import TemplateSelectionModal from './TemplateSelectionModal';
import { useInvestmentMemo, InvestmentMemoQuestion } from './hooks/useInvestmentMemo';
import { exportToPDF, Answer } from './utils/pdfExport';
import { ExportPDFDialog } from './ExportPDFDialog';

// Import from the new data file instead of constants
import { INVESTMENT_MEMO_QUESTIONS } from './data/questions';
import { TEMPLATES } from './data/templates';

// Add a constant at the top of the file for the OpenRouter API key
const OPENROUTER_API_KEY = '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';

// Local FastModeToggle component to avoid import issues
interface FastModeToggleProps {
  fastMode: boolean;
  setFastMode: (mode: boolean) => void;
}

const FastModeToggle: React.FC<FastModeToggleProps> = ({ fastMode, setFastMode }) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
        <button
          onClick={() => setFastMode(!fastMode)}
          className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-all ${
            fastMode 
              ? 'bg-amber-100 text-amber-700 shadow-sm border border-amber-200' 
              : 'bg-blue-50 text-blue-700 shadow-sm border border-blue-200'
          }`}
          aria-pressed={fastMode}
          title={fastMode ? "Fast mode: Quick answers but less thorough" : "Normal mode: More detailed and thorough analysis"}
        >
          <span>{fastMode ? 'Fast Mode' : 'Normal Mode'}</span>
        </button>
        
        <span className="text-xs text-gray-600">
          {fastMode 
            ? 'Quick analysis'
            : 'Detailed analysis'
          }
        </span>
      </div>
    </div>
  );
};

interface ExportOptions {
  includeTableOfContents: boolean;
  includeAppendices: boolean;
  language: 'en' | 'ja';
  isDetailedView: boolean;
}

interface InvestmentMemoProps {
  files: any[];
  onComplete?: (passed: boolean) => void;
  onAnswerUpdate?: (id: string, summary: string, details: string) => void;
}

interface TranslatedContent {
  title: string;
  description: string;
  questions: Array<{
    id: string;
    question: string;
    description: string;
    category: string;
  }>;
  answers: {
    [key: string]: {
      summary: string;
      details: string;
    };
  };
}

// Extend Answer type to include model information
interface AnswerWithModel extends Answer {
  modelUsed?: string;
}

// Define types for analysis results
interface QuestionAnalysis {
  id: string;
  question: string;
  completeness: {
    score: number;
    feedback: string;
  };
  quality: {
    score: number;
    feedback: string;
  };
  followUpQuestions?: string[];
}

// Add new types for the follow-up questions feature
interface ImprovementSession {
  questionId: string;
  followUpQuestions: string[];
  responses: string[];
  currentQuestionIndex: number;
  completed: boolean;
}

// Add ImprovementModal interface after ImprovementSession interface
interface ImprovementModal {
  questionId: string;
  question: string;
  description?: string;
  followUpQuestions: string[];
  currentQuestionIndex: number;
  responses: string[];
  uploadedFiles: Array<{name: string; content: string; type: string}>;
}

// Add the new ImprovementModal component before PedramAssistantModal
interface ImprovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ImprovementModal | null;
  onComplete: (responses: string[], files: Array<{name: string; content: string; type: string}>) => void;
}

const ImprovementModal: React.FC<ImprovementModalProps> = ({ 
  isOpen, 
  onClose, 
  data, 
  onComplete 
}) => {
  const [responses, setResponses] = useState<string[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{name: string; content: string; type: string}>>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [inputMethod, setInputMethod] = useState<'text' | 'upload'>('text');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Reset state when modal is opened or data changes
  useEffect(() => {
    if (isOpen && data) {
      setResponses(data.responses || []);
      setCurrentQuestionIndex(data.currentQuestionIndex || 0);
      setUploadedFiles(data.uploadedFiles || []);
      setCurrentResponse('');
    }
  }, [isOpen, data]);
  
  const handleNext = () => {
    // Save current response
    const newResponses = [...responses];
    newResponses[currentQuestionIndex] = currentResponse;
    setResponses(newResponses);
    
    // Move to next question if available
    if (data && currentQuestionIndex < data.followUpQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentResponse('');
      setInputMethod('text');
    } else {
      // Complete the process
      onComplete(newResponses, uploadedFiles);
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      // Save current response
      const newResponses = [...responses];
      newResponses[currentQuestionIndex] = currentResponse;
      setResponses(newResponses);
      
      // Go back to previous question
      setCurrentQuestionIndex(prev => prev - 1);
      setCurrentResponse(responses[currentQuestionIndex - 1] || '');
    }
  };
  
  const handleFileSelection = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target?.result as string;
      
      // Add file to uploadedFiles
      const newFile = {
        name: file.name,
        content,
        type: file.type
      };
      
      setUploadedFiles(prev => [...prev, newFile]);
      
      // Update response to reference the file
      setCurrentResponse(`Please refer to the uploaded file: ${file.name}`);
    };
    
    reader.readAsText(file);
  };
  
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    if (currentResponse.includes(uploadedFiles[index].name)) {
      setCurrentResponse('');
    }
  };
  
  if (!isOpen || !data) return null;
  
  const currentQuestion = data.followUpQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === data.followUpQuestions.length - 1;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Improve Answer</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            &times;
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">{data.question}</h3>
            {data.description && (
              <p className="text-gray-600 mb-4">{data.description}</p>
            )}
            
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-blue-800">
                Question {currentQuestionIndex + 1} of {data.followUpQuestions.length}:
              </p>
              <p className="text-lg font-medium mt-1">{currentQuestion}</p>
            </div>
            
            <div className="mb-4">
              <div className="flex gap-4 mb-4">
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                    inputMethod === 'text' 
                      ? 'bg-blue-50 border-blue-300 text-blue-700' 
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                  onClick={() => setInputMethod('text')}
                >
                  <FileText size={18} />
                  <span>Type Answer</span>
                </button>
                
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                    inputMethod === 'upload' 
                      ? 'bg-blue-50 border-blue-300 text-blue-700' 
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                  onClick={() => setInputMethod('upload')}
                >
                  <Upload size={18} />
                  <span>Upload Document</span>
                </button>
              </div>
              
              {inputMethod === 'text' ? (
                <div>
                  <textarea
                    value={currentResponse}
                    onChange={(e) => setCurrentResponse(e.target.value)}
                    placeholder="Type your response here..."
                    className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <div>
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50"
                    onClick={handleFileSelection}
                  >
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, TXT, CSV, etc.
                    </p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                  
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Uploaded Files:</h4>
                      <div className="space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                            <div className="flex items-center">
                              <FileText size={16} className="text-blue-600 mr-2" />
                              <span className="text-sm">{file.name}</span>
                            </div>
                            <button 
                              onClick={() => removeFile(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className={`px-4 py-2 rounded-lg ${
              currentQuestionIndex === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Previous
          </button>
          
          <button
            onClick={handleNext}
            disabled={inputMethod === 'text' && !currentResponse.trim() && uploadedFiles.length === 0}
            className={`px-4 py-2 rounded-lg bg-[#F15A29] text-white hover:bg-[#D94315] disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed`}
          >
            {isLastQuestion ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Add the PedramAssistantModal component with enhanced functionality
interface PedramAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: InvestmentMemoQuestion[];
  answers: Record<string, Answer>;
  title: string;
  onAnswerRegenerate?: (questionId: string, additionalContext: string) => Promise<void>;
}

const PedramAssistantModal: React.FC<PedramAssistantModalProps> = ({ 
  isOpen, 
  onClose, 
  questions, 
  answers, 
  title,
  onAnswerRegenerate
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<QuestionAnalysis[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [messages, setMessages] = useState<Array<{role: string; content: string}>>([]);
  
  // New state for handling improvement sessions
  const [activeImprovementSession, setActiveImprovementSession] = useState<ImprovementSession | null>(null);
  const [improvementModalData, setImprovementModalData] = useState<ImprovementModal | null>(null);
  const [isImprovementModalOpen, setIsImprovementModalOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isRescoring, setIsRescoring] = useState(false);
  const [previousScore, setPreviousScore] = useState<{completeness: number; quality: number} | null>(null);
  const [uploadedImprovedFiles, setUploadedImprovedFiles] = useState<Array<{name: string; content: string; type: string}>>([]);
  
  // Function to generate follow-up questions for answers with low completeness
  const generateFollowUpQuestions = async (questionId: string) => {
    const result = analysisResults.find(r => r.id === questionId);
    if (!result) return;
    
    const question = questions.find(q => q.id === questionId);
    const answer = answers[questionId];
    
    if (!question || !answer) return;
    
    try {
      // Generate follow-up questions based on the completeness feedback
      const prompt = `
You are Pedram, an expert venture capital investor analyzing an investment memo.

INVESTMENT MEMO TITLE: ${title}

QUESTION: ${question.question}
${question.description ? `QUESTION DESCRIPTION: ${question.description}` : ''}
ANSWER SUMMARY: ${answer.summary}
ANSWER DETAILS: ${answer.details || 'No detailed explanation provided'}

COMPLETENESS SCORE: ${result.completeness.score}/10
COMPLETENESS FEEDBACK: ${result.completeness.feedback}

The answer above needs improvement. Please provide 3-5 specific follow-up questions that would help the user improve their answer. These should be direct, focused questions that address the gaps you identified.

Output ONLY the questions, one per line. Do not include any JSON formatting or other text.`;

      console.log("Sending prompt for follow-up questions:", prompt);

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'MindVault Investment Memo Follow-up Questions'
        },
        body: JSON.stringify({
          model: 'openai/o3-mini-high',
          messages: [{ role: 'user', content: prompt }]
          // Removed response_format to allow free-form text
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Raw API response:", data);
      
      const resultContent = data.choices[0]?.message?.content || '';
      console.log("Result content:", resultContent);
      
      if (!resultContent.trim()) {
        throw new Error("Received empty response from API");
      }
      
      // Parse the response as plain text, split by new lines
      const followUpQuestions = resultContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && line.length > 0 && /\?$/.test(line)); // Keep only lines that end with ?
      
      console.log("Processed follow-up questions:", followUpQuestions);
      
      if (followUpQuestions.length === 0) {
        // As a fallback, try to extract questions from the text using regex
        const questionPattern = /\d+[\.\)]\s*([^?.]+\?)/g;
        const matches = [...resultContent.matchAll(questionPattern)];
        
        if (matches.length > 0) {
          const extractedQuestions = matches.map(match => match[1].trim());
          console.log("Extracted questions using regex:", extractedQuestions);
          
          // Update the analysis results with follow-up questions
          setAnalysisResults(prev => 
            prev.map(r => 
              r.id === questionId 
                ? { ...r, followUpQuestions: extractedQuestions } 
                : r
            )
          );
          
          return extractedQuestions;
        }
        
        // Final fallback: generate some generic questions based on the feedback
        const genericQuestions = [
          `Can you provide more details about ${question.question.toLowerCase()}?`,
          `What specific metrics or data points can you share related to this question?`,
          `How does this aspect compare to industry standards or competitors?`,
          `What are the future plans or strategies for improvement in this area?`
        ];
        
        console.log("Using generic fallback questions:", genericQuestions);
        
        // Update the analysis results with follow-up questions
        setAnalysisResults(prev => 
          prev.map(r => 
            r.id === questionId 
              ? { ...r, followUpQuestions: genericQuestions } 
              : r
          )
        );
        
        return genericQuestions;
      }
      
      // Update the analysis results with follow-up questions
      setAnalysisResults(prev => 
        prev.map(r => 
          r.id === questionId 
            ? { ...r, followUpQuestions } 
            : r
        )
      );
      
      return followUpQuestions;
    } catch (error) {
      console.error('Error generating follow-up questions:', error);
      
      // Provide generic fallback questions on error
      const genericQuestions = [
        `Can you provide more details about ${question.question.toLowerCase()}?`,
        `What specific metrics or data points can you share related to this question?`,
        `How does this aspect compare to industry standards or competitors?`,
        `What are the future plans or strategies for improvement in this area?`
      ];
      
      console.log("Using generic fallback questions due to error:", genericQuestions);
      
      // Update the analysis results with the generic questions
      setAnalysisResults(prev => 
        prev.map(r => 
          r.id === questionId 
            ? { ...r, followUpQuestions: genericQuestions } 
            : r
        )
      );
      
      return genericQuestions;
    }
  };
  
  // Update the startImprovementSession function to open the modal instead
  const startImprovementSession = async (questionId: string) => {
    const result = analysisResults.find(r => r.id === questionId);
    if (!result) return;
    
    // If we already have follow-up questions, use them; otherwise, generate new ones
    let followUpQuestions = result.followUpQuestions;
    if (!followUpQuestions || followUpQuestions.length === 0) {
      followUpQuestions = await generateFollowUpQuestions(questionId);
      if (!followUpQuestions || followUpQuestions.length === 0) {
        // Failed to generate questions
        setMessages(prev => [
          ...prev,
          { 
            role: "assistant", 
            content: "I couldn't generate follow-up questions at this time. Please try again later."
          }
        ]);
        return;
      }
    }
    
    // Save the current scores for comparison after regeneration
    setPreviousScore({
      completeness: result.completeness.score,
      quality: result.quality.score
    });
    
    // Find the question details
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    // Open the improvement modal instead of continuing in chat
    setImprovementModalData({
      questionId,
      question: question.question,
      description: question.description,
      followUpQuestions,
      currentQuestionIndex: 0,
      responses: [],
      uploadedFiles: []
    });
    
    setIsImprovementModalOpen(true);
  };
  
  // New function to handle completion of the improvement modal
  const handleImprovementComplete = async (responses: string[], files: Array<{name: string; content: string; type: string}>) => {
    if (!improvementModalData) return;
    
    setIsImprovementModalOpen(false);
    
    // Store the files
    setUploadedImprovedFiles(files);
    
    // Create improvement session
    const session: ImprovementSession = {
      questionId: improvementModalData.questionId,
      followUpQuestions: improvementModalData.followUpQuestions,
      responses,
      currentQuestionIndex: improvementModalData.followUpQuestions.length - 1,
      completed: true
    };
    
    setActiveImprovementSession(session);
    
    // Add message to chat
    setMessages(prev => [
      ...prev,
      { 
        role: "assistant", 
        content: "Thank you for providing this additional information. I'll now update your investment memo with these details." 
      }
    ]);
    
    // Save the responses to a file
    await saveResponsesToFile(session, files);
    
    // Regenerate the answer with the new information
    await regenerateAnswer(session, files);
  };
  
  // Update saveResponsesToFile to include file information
  const saveResponsesToFile = async (session: ImprovementSession, files: Array<{name: string; content: string; type: string}> = []) => {
    try {
      const question = questions.find(q => q.id === session.questionId);
      if (!question) return;
      
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const fileName = `improvement_${session.questionId}_${timestamp}.txt`;
      
      // Format the content
      let content = `Investment Memo Question: ${question.question}\n\n`;
      
      // Add the follow-up Q&A
      content += session.followUpQuestions.map((q, i) => 
        `Q${i+1}: ${q}\nA${i+1}: ${session.responses[i] || 'No response'}\n`
      ).join('\n');
      
      // Add info about uploaded files
      if (files.length > 0) {
        content += '\n\nUploaded Files:\n';
        content += files.map(file => `- ${file.name}\n`).join('');
      }
      
      // In a real app, this would send the content to the server
      // For now, we'll simulate this with a console log
      console.log(`Saving responses to file ${fileName}:\n${content}`);
      
      // Create a blob and download it locally (this is just for demonstration)
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return fileName;
    } catch (error) {
      console.error('Error saving responses to file:', error);
    }
  };
  
  // Update regenerateAnswer to include file information
  const regenerateAnswer = async (session: ImprovementSession, files: Array<{name: string; content: string; type: string}> = []) => {
    if (!onAnswerRegenerate) return;
    
    setIsRegenerating(true);
    
    try {
      // Format the additional context from the follow-up responses
      let additionalContext = session.followUpQuestions.map((q, i) => 
        `Follow-up Question: ${q}\nResponse: ${session.responses[i] || 'No response'}`
      ).join('\n\n');
      
      // Add file content if available
      if (files.length > 0) {
        additionalContext += '\n\n--- UPLOADED DOCUMENTS ---\n\n';
        files.forEach(file => {
          additionalContext += `Document: ${file.name}\n`;
          additionalContext += `Content: ${file.content.substring(0, 1000)}${file.content.length > 1000 ? '...' : ''}\n\n`;
        });
      }
      
      // Call the parent component's regenerate function
      await onAnswerRegenerate(session.questionId, additionalContext);
      
      // Re-score the answer
      await rescoreAnswer(session.questionId);
    } catch (error) {
      console.error('Error regenerating answer:', error);
      setMessages(prev => [
        ...prev,
        { 
          role: "assistant", 
          content: "I encountered an error while updating your answer. Please try again later."
        }
      ]);
    } finally {
      setIsRegenerating(false);
    }
  };
  
  // Function to analyze investment memo using OpenRouter API
  const analyzeInvestmentMemo = async () => {
    setIsAnalyzing(true);
    
    // Filter questions that have answers
    const questionsWithAnswers = questions.filter(q => answers[q.id] && answers[q.id].summary);
    
    if (questionsWithAnswers.length === 0) {
      setMessages([
        ...messages,
        {
          role: "assistant",
          content: "I don't see any answered questions in your investment memo yet. Please answer some questions first, and I'll be able to provide analysis."
        }
      ]);
      setIsAnalyzing(false);
      return;
    }
    
    try {
      // Prepare data for analysis
      const analysisPromises = questionsWithAnswers.map(async (question) => {
        const answer = answers[question.id];
        
        // Skip if no answer
        if (!answer || !answer.summary) {
          return null;
        }
        
        // Prepare the prompt for the model
        const prompt = `
You are Pedram, an expert venture capital investor analyzing an investment memo.

INVESTMENT MEMO TITLE: ${title}

QUESTION: ${question.question}
${question.description ? `QUESTION DESCRIPTION: ${question.description}` : ''}
ANSWER SUMMARY: ${answer.summary}
ANSWER DETAILS: ${answer.details || 'No detailed explanation provided'}

Please analyze this Q&A pair and provide:

1. COMPLETENESS SCORE (1-10): How complete is the information provided? Does it sufficiently answer the question?
2. COMPLETENESS FEEDBACK: What information is missing? What should be added to make this answer more complete?
3. QUALITY SCORE (1-10): Based on this answer, how promising does this aspect of the company appear? 
4. QUALITY FEEDBACK: Why did you give this quality score? What are the strengths or concerns?

Format your response as a JSON object with the following structure:
{
  "completeness": {
    "score": [number between 1-10],
    "feedback": [your feedback on completeness]
  },
  "quality": {
    "score": [number between 1-10],
    "feedback": [your feedback on quality]
  }
}`;

        // Call OpenRouter API with Gemini model
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'MindVault Investment Memo Analysis'
          },
          body: JSON.stringify({
            model: 'openai/o3-mini-high',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: "json_object" }
          })
        });
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        const resultContent = data.choices[0]?.message?.content || '{}';
        
        // Parse the JSON response
        let analysisResult;
        try {
          analysisResult = JSON.parse(resultContent);
        } catch (e) {
          console.error('Failed to parse JSON response:', e);
          analysisResult = {
            completeness: { score: 5, feedback: "Error analyzing response" },
            quality: { score: 5, feedback: "Error analyzing response" }
          };
        }
        
        return {
          id: question.id,
          question: question.question,
          completeness: analysisResult.completeness,
          quality: analysisResult.quality
        };
      });
      
      // Wait for all analyses to complete
      const results = await Promise.all(analysisPromises);
      const validResults = results.filter(Boolean) as QuestionAnalysis[];
      
      setAnalysisResults(validResults);
      
      // Add an overall summary message
      if (validResults.length > 0) {
        const avgCompleteness = validResults.reduce((sum, item) => sum + item.completeness.score, 0) / validResults.length;
        const avgQuality = validResults.reduce((sum, item) => sum + item.quality.score, 0) / validResults.length;
        
        setMessages([
          {
            role: "assistant",
            content: `I've analyzed your investment memo "${title}" and here's what I found:

Overall completeness score: ${avgCompleteness.toFixed(1)}/10
Overall quality score: ${avgQuality.toFixed(1)}/10

Click on any question in the list to see detailed feedback.`
          }
        ]);
      }
    } catch (error) {
      console.error('Error analyzing investment memo:', error);
      setMessages([
        ...messages,
        {
          role: "assistant",
          content: "I encountered an error while analyzing your investment memo. Please try again later."
        }
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Run analysis when modal is opened
  useEffect(() => {
    if (isOpen && analysisResults.length === 0 && !isAnalyzing) {
      analyzeInvestmentMemo();
    }
  }, [isOpen]);
  
  // Update handleSubmit to handle follow-up responses
  const handleSubmit = async () => {
    if (!userInput.trim()) return;
    
    // If in an active improvement session, handle as a follow-up response
    if (activeImprovementSession && !activeImprovementSession.completed) {
      await handleImprovementComplete([userInput], []);
      setUserInput('');
      return;
    }
    
    // Add user message
    const newMessages = [
      ...messages,
      { role: "user", content: userInput }
    ];
    setMessages(newMessages);
    setUserInput('');
    
    // Continue with existing chat functionality
    // ... rest of the existing handleSubmit code ...
    
    // Prepare context from the investment memo
    const context = `
Investment Memo Title: ${title}
Questions and Answers:
${questions.filter(q => answers[q.id] && answers[q.id].summary)
  .map(q => `
Question: ${q.question}
Answer: ${answers[q.id].summary}
${answers[q.id].details ? `Details: ${answers[q.id].details}` : ''}
`).join('\n')}

Analysis Results:
${analysisResults.map(result => `
Question: ${result.question}
Completeness Score: ${result.completeness.score}/10
Completeness Feedback: ${result.completeness.feedback}
Quality Score: ${result.quality.score}/10
Quality Feedback: ${result.quality.feedback}
`).join('\n')}
`;
    
    try {
      // Call OpenRouter API with the model for conversation
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'MindVault Investment Memo Assistant'
        },
        body: JSON.stringify({
          model: 'openai/o3-mini-high',
          messages: [
            { 
              role: 'system', 
              content: `You are Pedram, an expert venture capital investor who helps evaluate startups based on investment memos. 
You have analyzed the following investment memo and can provide insights, answer questions, and give advice on improving the memo.
${context}`
            },
            ...newMessages
          ]
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content || "I'm sorry, I couldn't process your request.";
      
      // Add assistant response
      setMessages([
        ...newMessages,
        { role: "assistant", content: assistantMessage }
      ]);
    } catch (error) {
      console.error('Error in conversation:', error);
      setMessages([
        ...newMessages,
        { role: "assistant", content: "I encountered an error while processing your question. Please try again later." }
      ]);
    }
  };
  
  // Add a function to render an improvement button for questions with low completeness
  const renderImprovementButton = (questionId: string) => {
    const result = analysisResults.find(r => r.id === questionId);
    if (!result || result.completeness.score > 8) return null;
    
    return (
      <button 
        onClick={() => startImprovementSession(questionId)}
        disabled={!!activeImprovementSession || isRegenerating || isRescoring}
        className="flex items-center gap-1 text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-100 mt-3"
      >
        <ArrowUpCircle size={16} />
        <span>Improve this answer</span>
      </button>
    );
  };
  
  // Find the selected question details
  const selectedQuestion = selectedQuestionId 
    ? analysisResults.find(r => r.id === selectedQuestionId)
    : null;
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Ask Pedram - Virtual VC Assistant</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            &times;
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar - list of analyzed questions */}
          <div className="w-64 border-r overflow-y-auto p-4 bg-gray-50">
            <div className="flex justify-center mb-6">
              <img 
                src="/pedram_image.png" 
                alt="Pedram" 
                className="w-24 h-24 rounded-full object-cover border-4 border-[#F15A29]" 
              />
            </div>
            
            <h3 className="font-semibold mb-3">Investment Memo Analysis</h3>
            
            {isAnalyzing ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin h-6 w-6 border-2 border-[#F15A29] border-t-transparent rounded-full"></div>
                <span className="ml-2 text-gray-600">Analyzing...</span>
              </div>
            ) : analysisResults.length > 0 ? (
              <div className="space-y-3">
                {analysisResults.map(result => (
                  <div 
                    key={result.id}
                    className={`p-3 rounded-lg cursor-pointer text-sm transition-colors ${
                      selectedQuestionId === result.id 
                        ? 'bg-[#F15A29] bg-opacity-10 border border-[#F15A29] border-opacity-30' 
                        : 'hover:bg-gray-100 border border-gray-200'
                    }`}
                    onClick={() => setSelectedQuestionId(result.id)}
                  >
                    <div className="font-medium mb-1 truncate" title={result.question}>
                      {result.question}
                    </div>
                    <div className="flex justify-between text-xs">
                      <div className="flex items-center">
                        <span className="text-gray-600 mr-1">Complete:</span>
                        <span className={getScoreColor(result.completeness.score)}>
                          {result.completeness.score}/10
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-600 mr-1">Quality:</span>
                        <span className={getScoreColor(result.quality.score)}>
                          {result.quality.score}/10
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
                No questions analyzed yet. Please make sure your investment memo contains answered questions.
              </div>
            )}
          </div>
          
          {/* Main content area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Question details when selected */}
            {selectedQuestion && (
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-lg mb-2">{selectedQuestion.question}</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="border rounded-lg p-3 bg-white">
                    <div className="flex items-center gap-2 mb-2">
                      <Gauge className="text-blue-600" size={18} />
                      <h4 className="font-medium">Completeness: <span className={getScoreColor(selectedQuestion.completeness.score)}>{selectedQuestion.completeness.score}/10</span></h4>
                    </div>
                    <p className="text-sm text-gray-700">{selectedQuestion.completeness.feedback}</p>
                    {renderImprovementButton(selectedQuestion.id)}
                  </div>
                  
                  <div className="border rounded-lg p-3 bg-white">
                    <div className="flex items-center gap-2 mb-2">
                      <Gauge className="text-purple-600" size={18} />
                      <h4 className="font-medium">Quality: <span className={getScoreColor(selectedQuestion.quality.score)}>{selectedQuestion.quality.score}/10</span></h4>
                    </div>
                    <p className="text-sm text-gray-700">{selectedQuestion.quality.feedback}</p>
                  </div>
                </div>
                
                <button 
                  className="text-sm text-blue-600 hover:underline"
                  onClick={() => setSelectedQuestionId(null)}
                >
                  Back to conversation
                </button>
              </div>
            )}
            
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-gray-700">
                      Hi, I'm Pedram, your virtual VC assistant. I'm analyzing your investment memo and will provide insights based on my experience.
                    </p>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-lg ${
                        msg.role === 'assistant' 
                          ? 'bg-gray-50 border border-gray-200' 
                          : 'bg-blue-50 border border-blue-200 ml-auto'
                      }`}
                    >
                      <p className={msg.role === 'assistant' ? 'text-gray-800' : 'text-blue-800'}>
                        {msg.content}
                      </p>
                    </div>
                  ))
                )}
                
                {isAnalyzing && (
                  <div className="bg-gray-50 p-3 rounded-lg animate-pulse">
                    <div className="flex items-center">
                      <div className="animate-spin h-4 w-4 border-2 border-[#F15A29] border-t-transparent rounded-full mr-2"></div>
                      <p className="text-gray-600">Analyzing your investment memo...</p>
                    </div>
                  </div>
                )}
                
                {(isRegenerating || isRescoring) && (
                  <div className="bg-gray-50 p-3 rounded-lg animate-pulse">
                    <div className="flex items-center">
                      <div className="animate-spin h-4 w-4 border-2 border-[#F15A29] border-t-transparent rounded-full mr-2"></div>
                      <p className="text-gray-600">
                        {isRegenerating ? "Updating your answer with new information..." : "Rescoring your updated answer..."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Input area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder={activeImprovementSession && !activeImprovementSession.completed 
                    ? "Type your response to the follow-up question..." 
                    : "Ask Pedram about your investment memo..."}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#F15A29]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
                <button 
                  className={`bg-[#F15A29] text-white px-4 py-2 rounded-lg hover:bg-[#D94315] disabled:opacity-50`}
                  onClick={handleSubmit}
                  disabled={isAnalyzing || isRegenerating || isRescoring || !userInput.trim()}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add the ImprovementModal */}
      <ImprovementModal
        isOpen={isImprovementModalOpen}
        onClose={() => setIsImprovementModalOpen(false)}
        data={improvementModalData}
        onComplete={handleImprovementComplete}
      />
    </div>
  );
};

/**
 * Main component for the Investment Memo feature
 */
const InvestmentMemoMain: React.FC<InvestmentMemoProps> = ({
  files,
  onComplete,
  onAnswerUpdate
}) => {
  // State for question selection modal
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isPedramModalOpen, setIsPedramModalOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<TranslatedContent | null>(null);
  const [originalContent, setOriginalContent] = useState<{
    title: string;
    description: string;
    questions: InvestmentMemoQuestion[];
  } | null>(null);

  // Add fast mode state with default value (false)
  const [fastMode, setFastMode] = useState(false);
  
  // Use useEffect to safely access localStorage after component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTitle = localStorage.getItem('investmentMemoTitle');
      if (savedTitle) {
        setTitle(savedTitle);
      }
      
      const savedDescription = localStorage.getItem('investmentMemoDescription');
      if (savedDescription) {
        setDescription(savedDescription);
      }
      
      const savedQuestions = localStorage.getItem('investmentMemoSelectedQuestions');
      if (savedQuestions) {
        try {
          setSelectedQuestionIds(JSON.parse(savedQuestions));
        } catch (e) {
          console.error('Error parsing saved questions:', e);
        }
      }
      
      // Load fast mode setting
      const savedFastMode = localStorage.getItem('fastMode');
      if (savedFastMode === 'true') {
        setFastMode(true);
      }
    }
  }, []);
  
  // Update localStorage when the mode changes
  const handleSetFastMode = (value: boolean) => {
    setFastMode(value);
    // Check if localStorage is available
    if (typeof window !== 'undefined') {
      localStorage.setItem('fastMode', value.toString());
    }
  };
  
  // Model information
  const modelInfo = {
    normal: {
      id: "deepseek-r1-distill-llama-70b",
      description: "More detailed analysis",
      displayName: "The Innovera Tortoise is methodically examining every detail in your documents."
    },
    fast: {
      id: "llama-3.2-3b-preview",
      description: "Faster responses",
      displayName: "The Innovera Hare is racing through your documents to find quick answers."
    }
  };
  
  // Get current model based on mode
  const getCurrentModel = () => fastMode ? modelInfo.fast.id : modelInfo.normal.id;

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeTableOfContents: true,
    includeAppendices: true,
    language: 'en',
    isDetailedView: false
  });
  // State for selected question IDs
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  // State to track IDs that should be analyzed immediately after selection
  const [pendingAnalysisIds, setPendingAnalysisIds] = useState<string[]>([]);
  const [title, setTitle] = useState('Investment Memo');
  const [description, setDescription] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [tempDescription, setTempDescription] = useState(description);
  
  // Add state for custom questions
  const [customQuestions, setCustomQuestions] = useState<InvestmentMemoQuestion[]>([]);
  
  // Modify the filteredQuestions to include custom questions
  const filteredQuestions = selectedQuestionIds.length > 0
    ? [...INVESTMENT_MEMO_QUESTIONS, ...customQuestions].filter(q => selectedQuestionIds.includes(q.id))
    : [];
  
  // Custom wrapper for onAnswerUpdate to handle both summary and details
  const handleAnswerUpdate = (id: string, summary: string, details: string) => {
    if (onAnswerUpdate) {
      onAnswerUpdate(id, summary, details);
    }
  };
  
  const {
    isAnalyzing,
    answers,
    error,
    expandedAnswers,
    editingId,
    editedAnswer,
    setEditedAnswer,
    toggleAnswer,
    handleEdit,
    handleSave,
    analyzeDocuments,
    analyzeSelectedQuestions: originalAnalyzeSelectedQuestions,
    regenerateAnswer: originalRegenerateAnswer
  } = useInvestmentMemo({
    files,
    questions: filteredQuestions, 
    onComplete,
    onAnswerUpdate: handleAnswerUpdate,
    fastMode
  });

  // Get loading status from answers
  const getLoadingQuestions = () => {
    return Object.entries(answers).filter(([_, answer]) => 
      (answer as any).isLoading === true
    ).length;
  };
  
  const loading = getLoadingQuestions();
  
  // Get total number of questions
  const total = filteredQuestions.length;
  
  // Get category list
  const categories = Array.from(new Set(filteredQuestions.map(q => q.category || 'General')));
  
  // Wrap the analyzeSelectedQuestions to include fastMode
  const analyzeSelectedQuestions = async (questionIds: string[]) => {
    // Call the original method with fastMode parameter
    await originalAnalyzeSelectedQuestions(questionIds);
    
    // Store the model used for each answer - this is just for UI display
    const currentModel = getCurrentModel();
    questionIds.forEach(id => {
      if (answers[id]) {
        // We need to use any type here because modelUsed isn't in the Answer type
        (answers[id] as any).modelUsed = currentModel;
      }
    });
  };
  
  // Update the regenerateAnswer function
  const regenerateAnswer = async (id: string, customPrompt?: string) => {
    // Call the original method with both the id and custom prompt
    await originalRegenerateAnswer(id, customPrompt);
  };
  
  // Effect to handle analyzing questions after state updates have completed
  useEffect(() => {
    if (pendingAnalysisIds.length > 0) {
      // Ensure the filtered questions includes the questions we want to analyze
      const readyToAnalyze = pendingAnalysisIds.every(id => 
        filteredQuestions.some(q => q.id === id)
      );
      
      if (readyToAnalyze) {
        // Now it's safe to analyze
        analyzeSelectedQuestions(pendingAnalysisIds);
        // Clear the pending analysis queue
        setPendingAnalysisIds([]);
      }
    }
  }, [pendingAnalysisIds, filteredQuestions, analyzeSelectedQuestions]);
  
  // Handle question selection submission
  const handleQuestionSelection = (selectedIds: string[], immediatelyAnalyze: boolean) => {
    // Find newly added questions (questions that weren't selected before)
    const previouslySelectedIds = selectedQuestionIds;
    const newlyAddedIds = selectedIds.filter(id => !previouslySelectedIds.includes(id));
    
    // Update the selection
    setSelectedQuestionIds(selectedIds);
    
    // If immediate analysis is requested and there are new questions, queue them for analysis
    if (immediatelyAnalyze && newlyAddedIds.length > 0) {
      setPendingAnalysisIds(newlyAddedIds);
    }
  };

  const handleExportPDF = async () => {
    setIsExportDialogOpen(true);
  };

  // Function to handle PDF export from dialog
  const handleExportPDFPopup = async () => {
    const contentToExport = exportOptions.language === 'ja' && translatedContent
      ? {
          questions: translatedContent.questions,
          answers: Object.entries(translatedContent.answers).reduce((acc, [id, answer]) => {
            acc[id] = {
              ...answer,
              isEdited: answers[id]?.isEdited || false
            };
            return acc;
          }, {} as Record<string, Answer>),
          title: translatedContent.title,
          description: translatedContent.description
        }
      : {
          questions: filteredQuestions,
          answers,
          title,
          description
        };

    await exportToPDF(
      contentToExport.questions,
      contentToExport.answers,
      contentToExport.title,
      contentToExport.description,
      exportOptions
    );
    setIsExportDialogOpen(false);
    if (onComplete) {
      onComplete(true);
    }
  };

  // Store original content when questions are selected
  useEffect(() => {
    if (filteredQuestions.length > 0 && !originalContent) {
      setOriginalContent({
        title,
        description,
        questions: filteredQuestions
      });
    }
  }, [filteredQuestions, title, description, originalContent]);

  const handleLanguageChange = async (newLanguage: 'en' | 'ja') => {
    if (newLanguage === 'ja' && !translatedContent) {
      setIsTranslating(true);
      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: {
              title,
              description,
              questions: filteredQuestions.map(q => ({
                id: q.id,
                question: q.question,
                description: q.description,
                category: q.category
              })),
              answers: Object.entries(answers).map(([id, answer]) => ({
                id,
                summary: answer.summary,
                details: answer.details,
                isEdited: answer.isEdited
              }))
            },
            targetLanguage: 'ja'
          }),
        });

        if (!response.ok) {
          throw new Error('Translation failed');
        }

        const translatedData = await response.json();
        setTranslatedContent(translatedData);
      } catch (error) {
        console.error('Translation error:', error);
        // Handle error appropriately
      } finally {
        setIsTranslating(false);
      }
    } else if (newLanguage === 'en') {
      setTranslatedContent(null);
    }
    setExportOptions(prev => ({ ...prev, language: newLanguage }));
  };

  // Get the current content based on language
  const getCurrentContent = () => {
    if (exportOptions.language === 'ja' && translatedContent) {
      return {
        title: translatedContent.title,
        description: translatedContent.description,
        questions: translatedContent.questions,
        answers: Object.entries(translatedContent.answers).reduce((acc, [id, answer]) => {
          acc[id] = {
            ...answer,
            isEdited: answers[id]?.isEdited || false
          };
          return acc;
        }, {} as Record<string, Answer>)
      };
    }
    return {
      title,
      description,
      questions: filteredQuestions,
      answers
    };
  };

  const currentContent = getCurrentContent();

  const handleTitleEdit = () => {
    setTempTitle(title);
    setIsEditingTitle(true);
  };
  
  const handleTitleSave = () => {
    setTitle(tempTitle);
    setIsEditingTitle(false);
  };
  
  const handleDescriptionEdit = () => {
    setTempDescription(description);
    setIsEditingDescription(true);
  };
  
  const handleDescriptionSave = () => {
    setDescription(tempDescription);
    setIsEditingDescription(false);
  };

  // Add handler for custom questions
  const handleCustomQuestionAdd = (question: InvestmentMemoQuestion) => {
    setCustomQuestions(prev => [...prev, question]);
  };

  // Function to handle deleting an individual question
  const handleDeleteQuestion = (id: string) => {
    try {
      // Remove the question ID from the selected questions
      setSelectedQuestionIds(prev => prev.filter(qId => qId !== id));
      
      // If it's a custom question, remove it from the custom questions list as well
      const isCustomQuestion = customQuestions.some(q => q.id === id);
      if (isCustomQuestion) {
        setCustomQuestions(prev => prev.filter(q => q.id !== id));
      }
      
      console.log(`Removed question with ID: ${id}`);
    } catch (error) {
      console.error('Error removing question:', error);
    }
  };

  // Handle template selection
  const handleTemplateSelection = (templateId: string) => {
    // Find the template
    const selectedTemplate = TEMPLATES.find(t => t.id === templateId);
    if (selectedTemplate) {
      console.log(`Selected template: ${selectedTemplate.name}`);
      console.log(`Template has ${selectedTemplate.questions.length} questions`);
      
      // Set fastMode to true when Quick Analysis template is selected
      if (templateId === 'quick_analysis') {
        handleSetFastMode(true);
        console.log('Fast mode enabled for Quick Analysis template');
      } else {
        // For other templates, set to normal mode
        handleSetFastMode(false);
        console.log('Normal mode set for non-Quick Analysis template');
      }
      
      // Log a few question IDs for debugging
      if (selectedTemplate.questions.length > 0) {
        console.log('Sample question IDs:', selectedTemplate.questions.slice(0, 3));
        
        // Verify if these IDs exist in INVESTMENT_MEMO_QUESTIONS
        const foundQuestions = INVESTMENT_MEMO_QUESTIONS.filter(q => 
          selectedTemplate.questions.includes(q.id)
        );
        console.log(`Found ${foundQuestions.length} matching questions in INVESTMENT_MEMO_QUESTIONS`);
      } else {
        console.warn(`Template ${selectedTemplate.name} has no questions!`);
      }
      
      // Get the questions from the template
      handleQuestionSelection(selectedTemplate.questions, true);
    } else {
      console.error(`Template with ID ${templateId} not found`);
    }
    setIsTemplateModalOpen(false);
  };

  // Handle custom template selection
  const handleCustomSelection = () => {
    setIsTemplateModalOpen(false);
    setIsSelectionModalOpen(true);
  };

  // Save title to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('investmentMemoTitle', title);
    }
  }, [title]);

  // Save description to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('investmentMemoDescription', description);
    }
  }, [description]);

  // Save selected questions to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('investmentMemoSelectedQuestions', JSON.stringify(selectedQuestionIds));
    }
  }, [selectedQuestionIds]);

  const clearLocalStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('investmentMemoAnswers');
      localStorage.removeItem('investmentMemoExpanded');
      localStorage.removeItem('investmentMemoTitle');
      localStorage.removeItem('investmentMemoDescription');
      localStorage.removeItem('investmentMemoSelectedQuestions');
    }
  };

  // Add function to regenerate an answer with additional context
  const regenerateAnswerWithContext = async (questionId: string, additionalContext: string) => {
    const question = filteredQuestions.find(q => q.id === questionId);
    if (!question) return;
    
    // Prepare a custom prompt with the additional context
    const customPrompt = `
Please regenerate the answer to this investment memo question:

QUESTION: ${question.question}
${question.description ? `DESCRIPTION: ${question.description}` : ''}

ADDITIONAL CONTEXT FROM USER FOLLOW-UP:
${additionalContext}

Based on the question and this additional context, provide a complete and detailed answer.
`;
    
    // Use the existing regenerate function with the custom prompt
    await regenerateAnswer(questionId, customPrompt);
  };

  // Add back the getScoreColor function
  // Function to get the color based on score
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  // Add back the rescoreAnswer function after the regenerateAnswer function
  // Function to re-score the answer after regeneration
  const rescoreAnswer = async (questionId: string) => {
    setIsRescoring(true);
    
    const question = questions.find(q => q.id === questionId);
    const answer = answers[questionId];
    
    if (!question || !answer) {
      setIsRescoring(false);
      return;
    }
    
    try {
      // Prepare the prompt for the model
      const prompt = `
You are Pedram, an expert venture capital investor analyzing an investment memo.

INVESTMENT MEMO TITLE: ${title}

QUESTION: ${question.question}
${question.description ? `QUESTION DESCRIPTION: ${question.description}` : ''}
ANSWER SUMMARY: ${answer.summary}
ANSWER DETAILS: ${answer.details || 'No detailed explanation provided'}

Please analyze this Q&A pair and provide:

1. COMPLETENESS SCORE (1-10): How complete is the information provided? Does it sufficiently answer the question?
2. COMPLETENESS FEEDBACK: What information is missing? What should be added to make this answer more complete?
3. QUALITY SCORE (1-10): Based on this answer, how promising does this aspect of the company appear? 
4. QUALITY FEEDBACK: Why did you give this quality score? What are the strengths or concerns?

Format your response as a JSON object with the following structure:
{
  "completeness": {
    "score": [number between 1-10],
    "feedback": [your feedback on completeness]
  },
  "quality": {
    "score": [number between 1-10],
    "feedback": [your feedback on quality]
  }
}`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'MindVault Investment Memo Rescoring'
        },
        body: JSON.stringify({
          model: 'openai/o3-mini-high',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: "json_object" }
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      const resultContent = data.choices[0]?.message?.content || '{}';
      
      // Parse the JSON response
      let newScore;
      try {
        newScore = JSON.parse(resultContent);
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        throw new Error('Failed to parse rescoring result');
      }
      
      // Update the analysis results
      setAnalysisResults(prev => 
        prev.map(r => 
          r.id === questionId 
            ? { 
                ...r, 
                completeness: newScore.completeness,
                quality: newScore.quality
              } 
            : r
        )
      );
      
      // Generate a comparison message
      const oldScore = previousScore;
      if (oldScore) {
        const completenessChange = newScore.completeness.score - oldScore.completeness;
        const qualityChange = newScore.quality.score - oldScore.quality;
        
        let improvementMessage = `I've updated your answer with the additional information and rescored it.\n\n`;
        
        improvementMessage += `**Completeness Score:**\n`;
        improvementMessage += `- Before: ${oldScore.completeness}/10\n`;
        improvementMessage += `- After: ${newScore.completeness.score}/10\n`;
        improvementMessage += completenessChange > 0 
          ? `- Improved by ${completenessChange} points! 🎉\n\n` 
          : completenessChange === 0 
            ? `- No change in score\n\n` 
            : `- Decreased by ${Math.abs(completenessChange)} points\n\n`;
        
        improvementMessage += `**Quality Score:**\n`;
        improvementMessage += `- Before: ${oldScore.quality}/10\n`;
        improvementMessage += `- After: ${newScore.quality.score}/10\n`;
        improvementMessage += qualityChange > 0 
          ? `- Improved by ${qualityChange} points! 🎉\n\n` 
          : qualityChange === 0 
            ? `- No change in score\n\n` 
            : `- Decreased by ${Math.abs(qualityChange)} points\n\n`;
        
        improvementMessage += `**Feedback:**\n${newScore.completeness.feedback}\n\n`;
        improvementMessage += `Would you like to continue improving another answer?`;
        
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: improvementMessage }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { 
            role: "assistant", 
            content: `I've updated and rescored your answer. The new completeness score is ${newScore.completeness.score}/10 and the quality score is ${newScore.quality.score}/10.`
          }
        ]);
      }
      
      // Reset improvement session
      setActiveImprovementSession(null);
      setPreviousScore(null);
    } catch (error) {
      console.error('Error rescoring answer:', error);
      setMessages(prev => [
        ...prev,
        { 
          role: "assistant", 
          content: "I encountered an error while rescoring your answer. Please try again later."
        }
      ]);
    } finally {
      setIsRescoring(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <>
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="text-2xl font-semibold text-[#1A1F2E] bg-transparent border-b border-[#F15A29] outline-none pb-1"
                  autoFocus
                />
                <button
                  onClick={handleTitleSave}
                  className="p-1 text-green-600 hover:text-green-700"
                >
                  <Check size={18} />
                </button>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-[#1A1F2E]">{currentContent.title}</h2>
                <button
                  onClick={handleTitleEdit}
                  className="p-1 text-[#F15A29] hover:text-[#D94315]"
                >
                  <Pencil size={16} />
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Fast Mode Toggle */}
            <FastModeToggle fastMode={fastMode} setFastMode={handleSetFastMode} />
            
            {/* Add Ask Pedram button */}
            <button
              onClick={() => setIsPedramModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1 rounded bg-[#F15A29] text-white hover:bg-[#D94315]"
              title="Ask Pedram - Virtual VC Assistant"
            >
              <MessageCircle size={18} />
              <span>Ask Pedram</span>
            </button>
            
            <button
              onClick={handleExportPDF}
              className={`flex items-center gap-2 px-3 py-1 rounded transition-colors ${
                isAnalyzing || loading > 0 || total === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              disabled={isAnalyzing || loading > 0 || total === 0}
            >
              <FileDown size={18} />
              <span>Export PDF</span>
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-start gap-2">
          {isEditingDescription ? (
            <>
              <input
                type="text"
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                placeholder="Add a description..."
                className="flex-1 text-base text-gray-600 bg-transparent border-b border-[#F15A29] outline-none pb-1 italic font-normal"
                autoFocus
              />
              <button
                onClick={handleDescriptionSave}
                className="p-1 text-green-600 hover:text-green-700"
              >
                <Check size={16} />
              </button>
            </>
          ) : (
            <div className="flex-1 flex items-center">
              <p className="text-base text-gray-600 italic font-normal">
                {currentContent.description || <span className="text-gray-400">Add a description...</span>}
              </p>
              <button
                onClick={handleDescriptionEdit}
                className="p-1 text-[#F15A29] hover:text-[#D94315] ml-1"
              >
                <Pencil size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Information */}
      <div className="mb-6">
        <div className="flex gap-2">
          <button 
            onClick={() => setIsTemplateModalOpen(true)}
            className="flex items-center gap-2 bg-[#F15A29] text-white px-4 py-2 rounded-lg hover:bg-[#D94315]"
          >
            <PlusCircle size={18} />
            <span>{selectedQuestionIds.length === 0 ? 'Select Questions' : 'Add or Remove Questions'}</span>
          </button>
          
          {selectedQuestionIds.length > 0 && (
            <button 
              onClick={() => {
                clearLocalStorage();
                // Reset other state as needed
                setTitle('Investment Memo');
                setDescription('');
                setSelectedQuestionIds([]);
                // ... other state resets
              }}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              <RefreshCw size={18} />
              <span>Reset</span>
            </button>
          )}
        </div>
        
        {loading > 0 && (
          <div className="flex items-center gap-2 text-blue-600 mb-4 mt-4">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-1"></div>
            <span>Analyzing {loading} question{loading > 1 ? 's' : ''}...</span>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-4 mt-4">
            {error}
          </div>
        )}
      </div>

      {selectedQuestionIds.length === 0 ? (
        <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Questions Selected</h3>
          <p className="text-base text-gray-500 mb-4">
            Start by selecting investment questions to analyze your documents
          </p>
          <button 
            onClick={() => setIsTemplateModalOpen(true)}
            className="inline-flex items-center gap-2 bg-[#F15A29] text-white px-4 py-2 rounded-lg hover:bg-[#D94315]"
          >
            <PlusCircle size={18} />
            <span>Select Questions</span>
          </button>
        </div>
      ) : (
        <div>
          {categories.length > 0 && (
            <div className="space-y-8">
              {categories.map(category => (
                <div key={category}>
                  <h3 className="text-xl font-semibold border-b pb-2 mb-4">{category}</h3>
                  <div className="space-y-6">
                    {currentContent.questions
                      .filter(question => question.category === category)
                      .map(question => {
                      const questionAnswer = currentContent.answers[question.id];
                      const modelUsed = (questionAnswer as any)?.modelUsed || 
                        (fastMode ? modelInfo.fast.id : modelInfo.normal.id);
                      const isFastMode = modelUsed === modelInfo.fast.id;
                      
                      return (
                        <QuestionItem
                          key={question.id}
                          question={question}
                          answer={questionAnswer}
                          isExpanded={expandedAnswers[question.id] || false}
                          onToggle={() => toggleAnswer(question.id)}
                          onEdit={handleEdit}
                          onSave={(id, content) => handleSave(id, content)}
                          onRegenerate={(customPrompt?: string) => regenerateAnswer(question.id, customPrompt)}
                          editedAnswer={editingId === question.id ? editedAnswer : ''}
                          setEditedAnswer={setEditedAnswer}
                          onDelete={handleDeleteQuestion}
                        >
                          {/* Model indicator */}
                          {questionAnswer && (
                            <div className={`text-xs mb-2 ${
                              isFastMode ? 'text-amber-600' : 'text-blue-600'
                            }`}>
                              {isFastMode 
                                ? modelInfo.fast.displayName
                                : modelInfo.normal.displayName
                              }
                            </div>
                          )}
                        </QuestionItem>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Question Selection Modal */}
      <QuestionSelectionModal
        isOpen={isSelectionModalOpen}
        onClose={() => setIsSelectionModalOpen(false)}
        onSubmit={handleQuestionSelection}
        initialSelections={selectedQuestionIds}
        customQuestions={customQuestions}
        onCustomQuestionAdd={handleCustomQuestionAdd}
      />

      {/* Template Selection Modal */}
      <TemplateSelectionModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleTemplateSelection}
        onSelectCustom={handleCustomSelection}
      />

      {/* Export PDF Dialog */}
      {isExportDialogOpen && (
        <ExportPDFDialog
          onClose={() => setIsExportDialogOpen(false)}
          onExport={handleExportPDFPopup}
          options={exportOptions}
          onOptionsChange={setExportOptions}
          onLanguageChange={handleLanguageChange}
          isTranslating={isTranslating}
        />
      )}

      {/* Pedram Assistant Modal */}
      <PedramAssistantModal
        isOpen={isPedramModalOpen}
        onClose={() => setIsPedramModalOpen(false)}
        questions={filteredQuestions}
        answers={answers}
        title={title}
        onAnswerRegenerate={regenerateAnswerWithContext}
      />
    </div>
  );
};

export default InvestmentMemoMain; 