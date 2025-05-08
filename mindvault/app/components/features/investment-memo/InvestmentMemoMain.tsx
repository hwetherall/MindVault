import React, { useState, useEffect } from 'react';
import { FileDown, PlusCircle, Pencil, Check, RefreshCw, X, ChevronDown, ChevronUp, FileText, Eye, CheckCircle, MessageSquare, Clock, DollarSign, GanttChart, Send, FileSpreadsheet } from 'lucide-react';
import QuestionItem from './QuestionItem';
import QuestionSelectionModal from './QuestionSelectionModal';
import TemplateSelectionModal from './TemplateSelectionModal';
import { useInvestmentMemo, InvestmentMemoQuestion } from './hooks/useInvestmentMemo';
import { exportToPDF, Answer } from './utils/pdfExport';
import { ExportPDFDialog } from './ExportPDFDialog';
import { getQuestionById } from './data/questions';

// Import from the new data file instead of constants
import { INVESTMENT_MEMO_QUESTIONS } from './data/questions';
import { TEMPLATES } from './data/templates';
import BenchmarkSelectionModal from './BenchmarkSelectionModal';
import { BENCHMARK_COMPANIES } from './data/benchmarkCompanies';
import BenchmarkComparisonRenderer from './BenchmarkComparisonRenderer';
import WorkflowIndicator, { WorkflowStepState } from './WorkflowIndicator';
import IterationHistory from './IterationHistory';

// Define WorkflowStatus interface before it's used
interface WorkflowStatus {
  [category: string]: {
    analyst: WorkflowStepState;
    associate: WorkflowStepState;
    followUp: WorkflowStepState;
    iterations: {
      index: number;
      questions: string[];
      timestamp?: string;
      isComplete: boolean;
    }[];
    activeIteration: number;
  };
}

// Global model information for all components
const modelInfo = {
  normal: {
    id: 'anthropic/claude-3.7-sonnet',
    component: 'Analyst',
    displayName: 'Claude 3.7 Sonnet',
    description: 'Analyst analysis and evaluation using Claude 3.7 Sonnet'
  },
  fast: {
    id: 'anthropic/claude-3-haiku',
    component: 'Analyst',
    displayName: 'Quick Analysis (Claude 3 Haiku)',
    description: 'Faster analysis with Claude 3 Haiku. Lower quality but quicker responses.'
  },
  associate: {
    id: 'anthropic/claude-3.7-sonnet',
    component: 'Associate',
    displayName: 'Claude 3.7 Sonnet',
    description: 'Associate analysis and evaluation using Claude 3.7 Sonnet'
  },
  pedram: {
    id: 'anthropic/claude-3.7-sonnet:thinking',
    component: 'Partner',
    displayName: 'Pedram (Claude 3.7 Sonnet with Thinking)',
    description: 'Final decision maker with Claude 3.7 Sonnet thinking model'
  }
};

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

// Add Pedram Mode toggle component
interface PedramModeToggleProps {
  pedramMode: boolean;
  setPedramMode: (mode: boolean) => void;
}

// Add Benchmark toggle component
interface BenchmarkToggleProps {
  benchmarkEnabled: boolean;
  setBenchmarkEnabled: (enabled: boolean) => void;
  onOpenBenchmarkSelector: () => void;
  selectedCompanyName: string | null;
}

const PedramModeToggle: React.FC<PedramModeToggleProps> = ({ pedramMode, setPedramMode }) => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
        <button
          onClick={() => setPedramMode(!pedramMode)}
          className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-all ${
            pedramMode 
              ? 'bg-purple-100 text-purple-700 shadow-sm border border-purple-200' 
              : 'bg-gray-100 text-gray-700 shadow-sm border border-gray-300'
          }`}
          aria-pressed={pedramMode}
          title={pedramMode ? "Pedram mode: Focused on Financial Modelling and Team & Talent" : "Standard mode: All selected questions"}
        >
          <span>{pedramMode ? 'Pedram Mode' : 'Standard Mode'}</span>
        </button>
        
        <span className="text-xs text-gray-600">
          {pedramMode 
            ? 'Financial & Team focus'
            : 'All sections'
          }
        </span>
      </div>
    </div>
  );
};

const BenchmarkToggle: React.FC<BenchmarkToggleProps> = ({ 
  benchmarkEnabled, 
  setBenchmarkEnabled,
  onOpenBenchmarkSelector,
  selectedCompanyName
}) => {
  const handleClick = () => {
    if (!benchmarkEnabled) {
      // When enabling, open the selector
      onOpenBenchmarkSelector();
    } else {
      // When disabling, just toggle off
      setBenchmarkEnabled(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
        <button
          onClick={handleClick}
          className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-all ${
            benchmarkEnabled 
              ? 'bg-blue-100 text-blue-700 shadow-sm border border-blue-200' 
              : 'bg-gray-100 text-gray-700 shadow-sm border border-gray-300'
          }`}
          aria-pressed={benchmarkEnabled}
          title={benchmarkEnabled ? "Compare with benchmark company" : "No benchmark comparison"}
        >
          <span>Benchmark?</span>
        </button>
        
        <span className="text-xs text-gray-600">
          {benchmarkEnabled 
            ? `Compare with ${selectedCompanyName || 'benchmark'}`
            : 'No comparison'
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

// Define Pedram Mode Questions
const PEDRAM_MODE_QUESTIONS = {
  Finances: [
    "What is the current Annual Recurring Revenue (ARR) of the company?",
    "What is the Year-over-Year (YoY) growth rate?",
    "What is the target valuation for the company?",
    "What is the current monthly cash burn rate?",
    "How much runway does the company have?",
    "What is the company's funding history?"
  ],
  'Market Research': [
    "Who are the company's key customers?",
    "What is the total addressable market (TAM) for the company's product or service, and what is the projected growth rate of this market over the next 5-10 years?",
    "What regulatory or legal factors could impact the company's operations or the market as a whole, and how is the company positioned to navigate these challenges?",
    "What are the key trends or technological advancements shaping the market, and how is the company leveraging or adapting to these trends?",
    "Who are the main competitors?"
  ]
};

// Define interface for question answers
interface AnalystQuestionAnswer {
  question: string;
  answer: string;
  isLoading: boolean;
  error?: string;
  isFollowUp?: boolean;
  iterationIndex?: number; // 0 for original, 1+ for follow-ups
}

/**
 * Question analysis result component
 */
interface QuestionAnalysisResultProps {
  question: string;
  answer: AnalystQuestionAnswer;
  renderMarkdown: (content: string) => React.ReactNode;
  onSaveAnswer?: (question: string, answer: string, category?: string) => void;
  category?: string;
}

const QuestionAnalysisResult: React.FC<QuestionAnalysisResultProps> = ({ 
  question, 
  answer, 
  renderMarkdown, 
  onSaveAnswer,
  category 
}) => {
  // Change initial state to true to make questions collapsed by default
  const [isCollapsed, setIsCollapsed] = useState(true);
  // Add state for edit mode
  const [isEditing, setIsEditing] = useState(false);
  // Add state for edited content
  const [editedAnswer, setEditedAnswer] = useState('');
  
  // Function to toggle collapsed state
  const toggleCollapsed = () => {
    // Don't toggle if in edit mode
    if (isEditing) return;
    setIsCollapsed(!isCollapsed);
  };

  // Function to enable edit mode
  const handleEdit = () => {
    setEditedAnswer(answer.answer);
    setIsEditing(true);
    // Ensure content is expanded when editing
    setIsCollapsed(false);
  };

  // Function to save edits
  const handleSave = () => {
    if (onSaveAnswer) {
      onSaveAnswer(question, editedAnswer, category);
    }
    setIsEditing(false);
  };

  // Function to cancel editing
  const handleCancel = () => {
    setIsEditing(false);
  };
  
  // Function to ensure consistent formatting within sections
  const processSection = (title: string, content: string) => {
    const lines = content.trim().split('\n');
    let processedContent = '';
    
    if (title === 'Source') {
      // Convert any initial dash or bullet into proper bullet format
      const firstLine = lines[0].trim();
      if (firstLine.startsWith('- ') || firstLine.startsWith('• ')) {
        processedContent = '• ' + firstLine.substring(2) + '\n' + lines.slice(1).join('\n');
      } else {
        // Ensure the first line is formatted like a bullet point for consistency
        processedContent = '• ' + firstLine + '\n' + lines.slice(1).join('\n');
      }
    } else if (title === 'Analysis') {
      // Make sure each line is a bullet point in the Analysis section
      processedContent = lines.map(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return '';
        if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ')) {
          return trimmedLine; // Already a bullet point
        }
        return '- ' + trimmedLine; // Convert to bullet point
      }).join('\n');
    } else if (title === 'Conclusion') {
      // Keep the conclusion content as is, as the renderMarkdown function now handles the styling
      processedContent = content;
    } else {
      // For any other section, keep as is
      processedContent = content;
    }
    
    return processedContent;
  };
  
  // Determine if this is a follow-up question
  const isFollowUp = answer.isFollowUp || false;
  
  // Set appropriate styling based on whether it's a follow-up question
  const headerBgColor = isFollowUp ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200';
  const headerTextColor = isFollowUp ? 'text-amber-900' : 'text-gray-800';
  const borderColor = isFollowUp ? 'border-amber-200' : 'border-gray-200';
  
  // Determine the status indicator to show
  const getStatusIndicator = () => {
    if (answer.isLoading) {
      return (
        <div className="flex items-center space-x-1">
          <div className="animate-spin h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="text-xs text-blue-600">Analyzing</span>
        </div>
      );
    } else if (answer.error) {
      return (
        <div className="flex items-center space-x-1">
          <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full">Error</span>
        </div>
      );
    } else if (answer.answer) {
      // Extract the conclusion if available
      let conclusion = '';
      if (answer.answer) {
        const conclusionMatch = answer.answer.match(/# Conclusion\n([\s\S]*?)(?=\n#|$)/);
        if (conclusionMatch && conclusionMatch[1]) {
          conclusion = conclusionMatch[1].trim();
          // Limit the length
          if (conclusion.length > 60) {
            conclusion = conclusion.substring(0, 60) + '...';
          }
        }
      }
      
      return (
        <div className="flex items-center space-x-1">
          <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full flex items-center">
            <CheckCircle size={12} className="mr-1" />
            Answered
          </span>
          {isCollapsed && conclusion && (
            <span className="text-xs text-gray-500 ml-2 italic hidden sm:inline max-w-[200px] truncate">{conclusion}</span>
          )}
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-1">
          <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">Pending</span>
        </div>
      );
    }
  };
  
  return (
    <div className={`border ${borderColor} rounded-md overflow-hidden mb-4`}>
      <div 
        className={`p-3 ${headerBgColor} border-b ${borderColor} ${isEditing ? '' : 'cursor-pointer'} flex justify-between items-center`} 
        onClick={toggleCollapsed}
      >
        {/* Question text on the left */}
        <div className="flex items-center pr-2 flex-grow truncate">
          {isFollowUp && (
            <span className="mr-2 px-2 py-0.5 bg-amber-200 text-amber-800 text-xs font-medium rounded flex-shrink-0">
              Follow-up
            </span>
          )}
          <p className={`font-medium ${headerTextColor} truncate`}>{question}</p>
        </div>
        
        {/* Status indicator and chevron on the right */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Status indicator */}
          <div className="flex-shrink-0">
            {getStatusIndicator()}
          </div>
          
          {/* Edit button - only show when answer exists and not loading */}
          {!isCollapsed && answer.answer && !answer.isLoading && !isEditing && onSaveAnswer && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              className="p-1 text-blue-600 hover:text-blue-800"
              title="Edit answer"
            >
              <Pencil size={16} />
            </button>
          )}
          
          {/* Chevron */}
          <div className="flex-shrink-0">
            {isCollapsed ? (
              <ChevronDown size={18} className="text-gray-500" />
            ) : (
              <ChevronUp size={18} className="text-gray-500" />
            )}
          </div>
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="p-4">
          {answer.isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="text-blue-600">Analyzing documents...</span>
            </div>
          ) : answer.error ? (
            <div className="text-red-600">{answer.error}</div>
          ) : answer.answer ? (
            <>
              {isEditing ? (
                <div className="space-y-4">
                  <textarea
                    value={editedAnswer}
                    onChange={(e) => setEditedAnswer(e.target.value)}
                    className="w-full h-64 p-2 border border-gray-300 rounded-md font-mono text-sm"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleCancel}
                      className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-800 prose prose-sm max-w-none">
                  {answer.answer.split('# ').map((section, idx) => {
                    if (idx === 0) return null; // Skip empty first part
                    
                    const [title, ...content] = section.split('\n');
                    let sectionContent = content.join('\n').trim();
                    
                    // Process the section content for consistent formatting
                    sectionContent = processSection(title, sectionContent);
                    
                    return (
                      <div key={idx} className="mb-4">
                        <h3 className="text-md font-semibold mb-2 text-gray-800">{title}</h3>
                        <div className="prose prose-sm max-w-none">
                          {renderMarkdown(sectionContent)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-500">Waiting for analysis...</div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Clean AI response by removing thinking sections and keeping only structured answer
 */
const cleanAIResponse = (response: string): string => {
  // Handle empty responses
  if (!response || response.trim() === '') {
    return '';
  }

  let cleanedResponse = response;
  
  // Extract content from <answer>...</answer> tags if present (Claude thinking model format)
  const answerTagMatch = cleanedResponse.match(/<answer>([\s\S]*?)<\/answer>/);
  if (answerTagMatch && answerTagMatch[1]) {
    cleanedResponse = answerTagMatch[1].trim();
    console.log("Extracted content from <answer> tags");
  }
  
  // Remove <think>...</think> sections if present
  cleanedResponse = cleanedResponse.replace(/<think>[\s\S]*?<\/think>/g, '');
  
  // Check for sectioned format (Source, Analysis, Conclusion)
  const hasSourceHeading = cleanedResponse.includes('# Source');
  
  if (hasSourceHeading) {
    // Remove any text before the first section heading (# Source)
    const sourceIndex = cleanedResponse.indexOf('# Source');
    if (sourceIndex !== -1) {
      cleanedResponse = cleanedResponse.substring(sourceIndex);
    }
    
    // Check if we have all required sections
    const hasAnalysis = cleanedResponse.includes('# Analysis');
    const hasConclusion = cleanedResponse.includes('# Conclusion');
    
    // Log warning if missing any section
    if (!hasAnalysis || !hasConclusion) {
      console.warn('AI response is missing expected sections');
    }
  } else {
    // This might be a different format (like Pedram's decision with ## section headings)
    // Look for any section heading starting with ## 
    const firstSectionMatch = cleanedResponse.match(/##\s+[^\n]+/);
    if (firstSectionMatch) {
      const firstSectionIndex = cleanedResponse.indexOf(firstSectionMatch[0]);
      if (firstSectionIndex > 0) {
        // Remove any thinking content before the first proper section
        cleanedResponse = cleanedResponse.substring(firstSectionIndex);
        console.log("Trimmed thinking content before first section heading");
      }
    }
  }
  
  return cleanedResponse.trim();
};

/**
 * Process a single question with AI
 */
const processQuestionWithAI = async (question: string, files: any[], category: string, fastMode: boolean = false) => {
  try {
    // Find the corresponding question ID from our questions database
    let questionId;
    
    if (category === 'Finances') {
      // Map finance questions to IDs
      const financeQuestionMap: Record<string, string> = {
        "What is the current Annual Recurring Revenue (ARR) of the company?": "arr",
        "What is the Year-over-Year (YoY) growth rate?": "growth_rate",
        "What is the target valuation for the company?": "valuation",
        "What is the current monthly cash burn rate?": "burn_rate",
        "How much runway does the company have?": "runway",
        "What is the company's funding history?": "funding_history"
      };
      questionId = financeQuestionMap[question];
    } else if (category === 'Market Research') {
      // Map market research questions to IDs
      const marketQuestionMap: Record<string, string> = {
        "Who are the company's key customers?": "customers",
        "What is the total addressable market (TAM) for the company's product or service, and what is the projected growth rate of this market over the next 5-10 years?": "tam",
        "What regulatory or legal factors could impact the company's operations or the market as a whole, and how is the company positioned to navigate these challenges?": "regulatory_factors",
        "What are the key trends or technological advancements shaping the market, and how is the company leveraging or adapting to these trends?": "market_trends",
        "Who are the main competitors?": "competition"
      };
      questionId = marketQuestionMap[question];
    }
    
    // If we don't have a matching ID, use a default approach
    const questionDetails = questionId ? getQuestionById(questionId) : null;
    
    // Get file content for each file
    const fileContents = files.map(file => {
      return {
        name: file.name,
        type: file.type,
        content: file.content || 'Content not available'
      };
    });
    
    // Determine instructions based on question and category
    let instructions = '';
    
    if (category === 'Market Research' && !questionDetails?.instructions) {
      const marketResearchPrompts: Record<string, string> = {
        "Who are the company's key customers?": `You are tasked with identifying the company's key customers based on the provided documents.

IMPORTANT INSTRUCTIONS:
1. Focus only on ACTUAL customers, not target customers or prospects.
2. Look carefully through any PDFs labeled as "Market Report," "Pitch Deck," or similar.
3. Pay special attention to sections mentioning clients, case studies, or testimonials.
4. Note both named enterprise customers and any customer segments described.
5. If possible, identify the importance or revenue contribution of different customers.
6. NEVER include your reasoning, self-corrections, or thought process in your response.
7. Only provide the required response format with your final answer.

Your answer MUST be structured in the following format:
# Source
Specify which document(s) and sections you used to find the information about customers.

# Analysis
- Provide 3-5 bullet points identifying key customer segments or notable clients
- Note any information about customer concentration or distribution
- Include information about customer industries or verticals if available
- Mention any notable customer testimonials or case studies

# Conclusion
Provide a 1-2 sentence direct answer summarizing who the company's key customers are, both by named accounts and by segment types.`,

        "What is the total addressable market (TAM) for the company's product or service, and what is the projected growth rate of this market over the next 5-10 years?": `You are tasked with determining the total addressable market (TAM) and its projected growth rate based on the provided documents.

IMPORTANT INSTRUCTIONS:
1. Focus specifically on the "Go1 Market Info.pdf" document.
2. Look for explicit mentions of TAM, market size, or addressable market.
3. Identify both the current market size and projected future size.
4. Calculate or extract the CAGR (Compound Annual Growth Rate) if available.
5. Note whether these figures are global or for specific regions.
6. NEVER include your reasoning, self-corrections, or thought process in your response.
7. Only provide the required response format with your final answer.

Your answer MUST be structured in the following format:
# Source
Specify which sections of the Go1 Market Info.pdf document contained market size and growth projections.

# Analysis
- Provide the total addressable market size with specific figures and currency
- Note any segmentation of the market (by region, industry, etc.)
- Detail the projected growth rate (CAGR) for the next 5-10 years
- Explain any factors driving market growth mentioned in the document
- Assess the reliability of the market projections if possible

# Conclusion
Provide a 1-2 sentence direct answer stating the total addressable market size and its projected growth rate over the next 5-10 years with specific figures.`,

        "What regulatory or legal factors could impact the company's operations or the market as a whole, and how is the company positioned to navigate these challenges?": `You are tasked with identifying regulatory and legal factors that could impact the company based on the provided documents.

IMPORTANT INSTRUCTIONS:
1. Focus specifically on the "Go1 Market Info.pdf" document.
2. Look for mentions of regulations, compliance requirements, legal challenges, or policy trends.
3. Identify industry-specific regulations relevant to the company's operations.
4. Note how the company plans to address or is already addressing these challenges.
5. Consider both current and upcoming regulatory changes.
6. NEVER include your reasoning, self-corrections, or thought process in your response.
7. Only provide the required response format with your final answer.

Your answer MUST be structured in the following format:
# Source
Specify which sections of the Go1 Market Info.pdf document contained information about regulatory factors.

# Analysis
- Identify the most significant regulatory or legal factors affecting the company
- Note any specific regulations mentioned by name or description
- Detail how these factors could positively or negatively impact operations
- Explain the company's current approach to compliance or regulatory challenges
- Assess whether the company appears well-positioned to navigate these challenges

# Conclusion
Provide a 1-2 sentence direct answer summarizing the key regulatory factors and how well-positioned the company is to address them.`,

        "What are the key trends or technological advancements shaping the market, and how is the company leveraging or adapting to these trends?": `You are tasked with identifying key market trends and technological advancements based on the provided documents.

IMPORTANT INSTRUCTIONS:
1. Focus specifically on the "Go1 Market Info.pdf" document.
2. Look for explicit mentions of trends, technological shifts, or innovations.
3. Identify how these trends are affecting the market and competition.
4. Note specifically how the company is responding to or leveraging each trend.
5. Consider both current trends and projected future developments.
6. NEVER include your reasoning, self-corrections, or thought process in your response.
7. Only provide the required response format with your final answer.

Your answer MUST be structured in the following format:
# Source
Specify which sections of the Go1 Market Info.pdf document contained information about market trends and technological advancements.

# Analysis
- Identify 3-5 major trends or technological advancements affecting the market
- Explain how each trend is changing the competitive landscape
- Detail specific ways the company is adapting to or leveraging each trend
- Note any competitive advantage the company has regarding these trends
- Assess how well-positioned the company is compared to competitors in adapting to these changes

# Conclusion
Provide a 1-2 sentence direct answer summarizing the key market trends and how effectively the company is leveraging them.`,

        "Who are the main competitors?": `You are tasked with identifying the company's main competitors based on both provided documents and up-to-date web information.

IMPORTANT INSTRUCTIONS:
1. First, examine any PDFs labeled as "Market Report" or "Pitch Deck" for competitor information.
2. Note both direct competitors (similar offerings) and indirect competitors (alternative solutions).
3. For each competitor mentioned, identify their relative positioning and strengths.
4. Then, use perplexity/sonar to search for the top 5 current competitors to Go1.
5. Compare the information from both document analysis and web search.
6. NEVER include your reasoning, self-corrections, or thought process in your response.
7. Only provide the required response format with your final answer.

Your answer MUST be structured in the following format:
# Source
Specify which document(s) contained competitor information AND mention that web search results were used to supplement the analysis.

# Analysis
- List the main competitors identified in the documents with brief descriptions
- List the top 5 competitors found through web search (using perplexity/sonar)
- Note any discrepancies between document-based competitors and web-based results
- Identify the apparent market positioning of key competitors
- Explain any competitive advantages mentioned for the main rivals

# Conclusion
Provide a 1-2 sentence direct answer summarizing who the main competitors are, based on both document analysis and current web information.`
      };
      
      instructions = marketResearchPrompts[question] || 
        `You are tasked with answering the following question about a company based on the provided documents: "${question}".
        Analyze all available documents thoroughly. Focus particularly on any "Go1 Market Info.pdf" document if available.
        
        IMPORTANT INSTRUCTIONS:
        1. NEVER include your reasoning, self-corrections, or thought process in your response.
        2. Only provide the required response format with your final answer.
        
        Your answer MUST be structured in the following format:
        # Source
        Specify which document(s) and sections you used to find the answer.
        
        # Analysis
        - Provide 3-5 bullet points with key findings from your analysis
        - Each bullet should be concise and focused on a specific insight
        - Include relevant figures, dates, or metrics when available
        
        # Conclusion
        Provide a 1-2 sentence direct answer to the question. Be specific and include exact figures when available.`;
    } else {
      // Use the instructions from the question if available, otherwise use a generic instruction
      instructions = questionDetails?.instructions || 
        `You are tasked with answering the following question about a company based on the provided documents: "${question}".
        Analyze all available documents thoroughly. Provide a clear, concise, factual answer based only on the information in the documents.
        If the information is not available in the documents, state this clearly.
        
        IMPORTANT INSTRUCTIONS:
        1. NEVER include your reasoning, self-corrections, or thought process in your response.
        2. Only provide the required response format with your final answer.
        
        Your answer MUST be structured in the following format:
        # Source
        Specify which document(s) and sections you used to find the answer.
        
        # Analysis
        - Provide 3-5 bullet points with key findings from your analysis
        - Each bullet should be concise and focused on a specific insight
        - Include relevant figures, dates, or metrics when available
        
        # Conclusion
        Provide a 1-2 sentence direct answer to the question. Be specific and include exact figures when available.`;
    }
    
    // Special handling for competitor question that requires web search
    if (question === "Who are the main competitors?" && category === "Market Research") {
      // Here we would implement the web search integration
      console.log("Using web search for competitor analysis");
      // For now, use the standard API route but in a real implementation, we would
      // call a different endpoint that includes web search capabilities
    }
    
    // Prepare the response
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        files: fileContents,
        instructions,
        model: process.env.GROQ_API_MODEL || 'deepseek-r1-distill-llama-70b'
      }),
    });
    
    // Log the model being used for Analyst
    const modelUsed = process.env.GROQ_API_MODEL || 'deepseek-r1-distill-llama-70b';
    const analystModel = fastMode ? modelInfo.fast : modelInfo.normal;
    console.log(`%c[${analystModel.component}] Using model: ${modelUsed}`, 'background: #e6f7ff; color: #0066cc; font-weight: bold; padding: 2px 5px; border-radius: 3px;');
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Clean the response to remove thinking sections and keep only structured answer
    const cleanedAnswer = cleanAIResponse(result.answer);
    
    return cleanedAnswer;
  } catch (error) {
    console.error('Error processing question:', error);
    throw error;
  }
};

// Add a new PromptModal component
interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  prompt: string;
}

const PromptModal: React.FC<PromptModalProps> = ({ isOpen, onClose, title, prompt }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
            {prompt}
          </pre>
        </div>
        <div className="border-t px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
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
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<TranslatedContent | null>(null);
  const [originalContent, setOriginalContent] = useState<{
    title: string;
    description: string;
    questions: InvestmentMemoQuestion[];
  } | null>(null);

  // Add state for prompt modal
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [promptModalTitle, setPromptModalTitle] = useState("");

  // Add function to show prompt modal
  const showPrompt = (prompt: string, title: string) => {
    setCurrentPrompt(prompt);
    setPromptModalTitle(title);
    setPromptModalOpen(true);
  };

  // Add function to get question prompt
  const getQuestionPrompt = (question: string, category: string) => {
    // Get the question details based on category
    const questionDetails = category === 'Finances' 
      ? pedramModeFinanceQuestions.find(q => q.question === question)
      : pedramModeMarketQuestions.find(q => q.question === question);
    
    // Construct the prompt similar to processQuestionWithAI
    let instructions = '';
    
    if (category === 'Market Research') {
      const marketResearchPrompts: Record<string, string> = {
        "Who are the company's key customers?": `You are tasked with identifying the company's key customers based on the provided documents.

IMPORTANT INSTRUCTIONS:
1. Focus only on ACTUAL customers, not target customers or prospects.
2. Look carefully through any PDFs labeled as "Market Report," "Pitch Deck," or similar.
3. Pay special attention to sections mentioning clients, case studies, or testimonials.
4. Note both named enterprise customers and any customer segments described.
5. If possible, identify the importance or revenue contribution of different customers.
6. NEVER include your reasoning, self-corrections, or thought process in your response.
7. Only provide the required response format with your final answer.

Your answer MUST be structured in the following format:
# Source
Specify which document(s) and sections you used to find the information about customers.

# Analysis
- Provide 3-5 bullet points identifying key customer segments or notable clients
- Note any information about customer concentration or distribution
- Include information about customer industries or verticals if available
- Mention any notable customer testimonials or case studies

# Conclusion
Provide a 1-2 sentence direct answer summarizing who the company's key customers are, both by named accounts and by segment types.`,
        // ... other market research questions
      };
      
      instructions = marketResearchPrompts[question] || 
        `You are tasked with answering the following question about a company based on the provided documents: "${question}".
        Analyze all available documents thoroughly. Focus particularly on any "Go1 Market Info.pdf" document if available.
        
        IMPORTANT INSTRUCTIONS:
        1. NEVER include your reasoning, self-corrections, or thought process in your response.
        2. Only provide the required response format with your final answer.
        
        Your answer MUST be structured in the following format:
        # Source
        Specify which document(s) and sections you used to find the answer.
        
        # Analysis
        - Provide 3-5 bullet points with key findings from your analysis
        - Each bullet should be concise and focused on a specific insight
        - Include relevant figures, dates, or metrics when available
        
        # Conclusion
        Provide a 1-2 sentence direct answer to the question. Be specific and include exact figures when available.`;
    } else {
      instructions = questionDetails?.instructions || 
        `You are tasked with answering the following question about a company based on the provided documents: "${question}".
        Analyze all available documents thoroughly. Provide a clear, concise, factual answer based only on the information in the documents.
        If the information is not available in the documents, state this clearly.
        
        IMPORTANT INSTRUCTIONS:
        1. NEVER include your reasoning, self-corrections, or thought process in your response.
        2. Only provide the required response format with your final answer.
        
        Your answer MUST be structured in the following format:
        # Source
        Specify which document(s) and sections you used to find the answer.
        
        # Analysis
        - Provide 3-5 bullet points with key findings from your analysis
        - Each bullet should be concise and focused on a specific insight
        - Include relevant figures, dates, or metrics when available
        
        # Conclusion
        Provide a 1-2 sentence direct answer to the question. Be specific and include exact figures when available.`;
    }
    
    // Create a sample of how the prompt will be formatted
    return `
QUESTION: ${question}
CATEGORY: ${category}

INSTRUCTIONS:
${instructions}

Here are the documents to analyze:
[Document contents would be included here]

Your answer MUST be structured in the following format:
# Source
Specify which document(s) and sections you used to find the answer.

# Analysis
- Provide 3-5 bullet points with key findings from your analysis
- Each bullet should be concise and focused on a specific insight
- Include relevant figures, dates, or metrics when available

# Conclusion
Provide a 1-2 sentence direct answer to the question. Be specific and include exact figures when available.`;
  };

  // Get associate prompt
  const getAssociatePrompt = (category: string) => {
    // Get the questions for this category
    const categoryQuestions = PEDRAM_MODE_QUESTIONS[category as keyof typeof PEDRAM_MODE_QUESTIONS] || [];
    
    // Get the main question based on category
    const mainQuestion = category === 'Finances' 
      ? 'Is this company financially viable?' 
      : 'Is this market worthwhile entering?';
    
    // Get sample Q&As
    let questionsAndAnswers = '';
    categoryQuestions.forEach((question, index) => {
      const answer = analystQuestionAnswers[question]?.answer || 'No answer provided';
      
      questionsAndAnswers += `
Question ${index + 1}: ${question}

Answer ${index + 1}:
${answer}
-------------------
`;
    });
    
    // Return the associate prompt
    return `
MAIN QUESTION: "${mainQuestion}"

You are a highly skilled VC associate at a top-tier firm like Sequoia or A16Z. You've been asked to review an analyst's work on this investment opportunity.

Below are the analyst's findings based on the company's documents:

${questionsAndAnswers}

For context, here is some information from the company's pitch deck:
[Pitch deck content would be included here]

IMPORTANT INSTRUCTION:
- Focus SOLELY on the topic at hand (${category}).
- Do NOT mention or be concerned about missing information from other domains (like finances, team, product, etc.) outside your specific focus area.
- If working on Finances, only evaluate financial information without worrying about market data.
- If working on Market Research, only evaluate market information without worrying about financial metrics.
- Your job is domain-specific expertise, not cross-domain analysis.
- NEVER include your reasoning process, self-corrections, or thought processes in your response.
- Only provide your final analysis in the required format without any intermediate thinking.

Provide your review in a formal, structured format WITHOUT any conversational elements. Do NOT include any introductions like "Dear Senior Partner" or explanatory paragraphs about what you're going to do. 

Start your analysis immediately with the heading structures below:

## Sense Check
Assessment: [Good/Needs Improvement]
[Direct analysis of logical consistency without any introductory text, focusing ONLY on ${category} aspects]

## Completeness Check
Score: [1-10]/10
[Thorough analysis of information completeness with clear justification for score]
[List specific information gaps or inconsistencies]
[Identify key metrics or data points that are missing]
[If score is below 8, be explicit about what critical information is needed]

## Quality Check
[Based ONLY on the information provided about ${category}, your assessment of strengths and risks]

## Recommended Next Steps
[Based on your analysis above, recommend ONE of the following options:]
${category === 'Finances' 
  ? '1. If score is 8 or higher AND the information is logically consistent: "Proceed to Partner Review - Financial analysis is sufficient for investment decision."'
  : '1. If score is 8 or higher AND the information is logically consistent: "Proceed to Partner Review - Market analysis is sufficient for investment decision."'}
2. If score is below 8 OR information is inconsistent: "Additional Analyst Research Required" followed by up to THREE specific follow-up questions you would ask the analyst to address the most critical information gaps.

Make your analysis focused, concise, and direct. Do not include ANY salutations, introductions, or conclusion paragraphs.`;
  };

  // Get Pedram's final decision prompt
  const getPedramPrompt = () => {
    const financeAnalysis = associateAnalysis['Finances']?.analysis || 'Finance analysis not available';
    const marketAnalysis = associateAnalysis['Market Research']?.analysis || 'Market analysis not available';
    
    return `
You are Pedram Mokrian, a top venture capitalist and General Partner at an elite VC firm. Known for your sharp analytical skills and strategic insights, you're the final decision maker on all investments.

You've received two detailed analyses from your team on a potential investment opportunity:

1. Financial Analysis:
${financeAnalysis}

2. Market Research Analysis:
${marketAnalysis}

TASK (Using OpenAI o1 model):
Based on these analyses, provide a final investment decision on whether this company should progress to the next stage of investment consideration.

IMPORTANT INSTRUCTIONS:
- NEVER include your reasoning process, self-corrections, or thought processes in your response.
- Only provide your final analysis in the required format without any intermediate thinking.
- Do not write messages like "Let me analyze this..." or "Based on the information provided..."
- Start directly with the format below.

Your response should follow this EXACT format:

## Investment Decision
[Clear YES or NO to advancing this company, followed by a one-sentence explanation]

## Key Reasons
- [3-5 bullet points outlining the most compelling reasons for your decision, both positive and negative factors]

## Financial Assessment
[2-3 paragraphs assessing the financial viability, focusing on metrics like ARR, growth rate, burn rate, and runway]

## Market Assessment
[2-3 paragraphs evaluating the market opportunity, focusing on TAM, growth trajectory, and competitive positioning]

## Risks & Mitigations
[2-3 paragraphs identifying the key risks and possible mitigations]

## Next Steps
[3-5 bullet points with specific action items or information needed before making a final investment]

IMPORTANT:
- If the answer isn't a "Hell yeah", it is a "No". In other words, you should only say "Yes" if you would personally invest in this company.
- Your analysis should be balanced, highlighting both strengths and concerns
- Provide specific metrics and figures from the analyses when available
- Focus on substantive analysis rather than generalities
- Be direct and decisive in your recommendations
- If benchmark comparison data is available, include specific comparisons

Your response should read like a crisp, authoritative investment decision from a seasoned venture capitalist - not a general AI assistant.`;
  };

  // Add fast mode state with default value (false)
  const [fastMode, setFastMode] = useState(false);
  
  // Add Pedram mode state
  const [pedramMode, setPedramMode] = useState(false);
  
  // Add Benchmark toggle state
  const [benchmarkEnabled, setBenchmarkEnabled] = useState(false);
  
  // Add state for benchmark selection modal
  const [isBenchmarkModalOpen, setIsBenchmarkModalOpen] = useState(false);
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState<string | null>(null);
  
  // Use useEffect to safely access localStorage after component mounts
  useEffect(() => {
    // Check if localStorage is available (client-side only)
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('fastMode');
      if (saved === 'true') {
        setFastMode(true);
      }
      
      const savedPedramMode = localStorage.getItem('pedramMode');
      if (savedPedramMode === 'true') {
        setPedramMode(true);
      }
      
      const savedBenchmarkEnabled = localStorage.getItem('benchmarkEnabled');
      if (savedBenchmarkEnabled === 'true') {
        setBenchmarkEnabled(true);
      }
      
      const savedBenchmarkId = localStorage.getItem('selectedBenchmarkId');
      if (savedBenchmarkId) {
        setSelectedBenchmarkId(savedBenchmarkId);
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
  
  // Update localStorage when Pedram mode changes
  const handleSetPedramMode = (value: boolean) => {
    setPedramMode(value);
    // Check if localStorage is available
    if (typeof window !== 'undefined') {
      localStorage.setItem('pedramMode', value.toString());
    }
  };
  
  // Update localStorage when Benchmark toggle changes
  const handleSetBenchmarkEnabled = (value: boolean) => {
    setBenchmarkEnabled(value);
    
    // If turning off, also clear the selected benchmark
    if (!value) {
      setSelectedBenchmarkId(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selectedBenchmarkId');
      }
    }
    
    // Check if localStorage is available
    if (typeof window !== 'undefined') {
      localStorage.setItem('benchmarkEnabled', value.toString());
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
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('investmentMemoSelectedQuestions');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  // State to track IDs that should be analyzed immediately after selection
  const [pendingAnalysisIds, setPendingAnalysisIds] = useState<string[]>([]);
  const [title, setTitle] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('investmentMemoTitle') || 'Investment Memo';
    }
    return 'Investment Memo';
  });
  const [description, setDescription] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('investmentMemoDescription') || '';
    }
    return '';
  });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [tempDescription, setTempDescription] = useState(description);
  
  // Add state for custom questions
  const [customQuestions, setCustomQuestions] = useState<InvestmentMemoQuestion[]>([]);
  
  // Modify the filteredQuestions to include custom questions
  const allFilteredQuestions = selectedQuestionIds.length > 0
    ? [...INVESTMENT_MEMO_QUESTIONS, ...customQuestions].filter(q => selectedQuestionIds.includes(q.id))
    : [];
    
  // Apply Pedram Mode filtering if enabled
  const filteredQuestions = pedramMode
    ? allFilteredQuestions.filter(q => 
        q.category === 'Financial Modelling' || q.category === 'Team and Talent')
    : allFilteredQuestions;
  
  // Add state for tracking analyst completion for each category in Pedram Mode
  const [analystCompleted, setAnalystCompleted] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pedramModeAnalystCompleted');
      return saved ? JSON.parse(saved) : { Finances: false, 'Market Research': false };
    }
    return { Finances: false, 'Market Research': false };
  });

  // Add state for analyst questions modal
  const [isAnalystModalOpen, setIsAnalystModalOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string>('');
  
  // Add state for storing AI-generated answers
  const [analystQuestionAnswers, setAnalystQuestionAnswers] = useState<Record<string, AnalystQuestionAnswer>>({});

  // Track expanded analysis sections by category
  const [expandedAnalysis, setExpandedAnalysis] = useState<Record<string, boolean>>({});
  
  // Track if analysis is in progress for a category
  const [analysisInProgress, setAnalysisInProgress] = useState<Record<string, boolean>>({});

  // Add state for tracking collapsed box sections in Pedram Mode
  const [collapsedBoxes, setCollapsedBoxes] = useState<Record<string, boolean>>({});
  
  // Add state for tracking associate analysis
  const [associateAnalysis, setAssociateAnalysis] = useState<Record<string, { 
    analysis: string;
    isLoading: boolean;
    error?: string;
  }>>({});

  // Add state for tracking Pedram's final decision
  const [pedramDecision, setPedramDecision] = useState<{
    decision: string;
    isLoading: boolean;
    error?: string;
  }>({
    decision: '',
    isLoading: false
  });
  
  // Add state for tracking follow-up questions
  const [followUpQuestions, setFollowUpQuestions] = useState<Record<string, string[]>>({});
  
  // Add state for tracking whether questions have been sent to analyst
  const [sentToAnalyst, setSentToAnalyst] = useState<Record<string, boolean>>({});

  // Initialize question collapse state when answers are updated
  useEffect(() => {
    // Get all questions that have answers
    const answeredQuestionIds = Object.keys(analystQuestionAnswers)
      .filter(q => analystQuestionAnswers[q].answer && !analystQuestionAnswers[q].isLoading)
      .map(q => {
        // Look for both category sections to find the question
        for (const category of ['Finances', 'Market Research']) {
          const questions = category === 'Finances' 
            ? PEDRAM_MODE_QUESTIONS.Finances 
            : PEDRAM_MODE_QUESTIONS['Market Research'];
          
          const index = questions.indexOf(q);
          if (index >= 0) {
            return `${category}-question-${index}`;
          }
        }
        return '';
      })
      .filter(id => id !== '');
    
    // Only set the state if there are newly answered questions
    if (answeredQuestionIds.length > 0) {
      setCollapsedBoxes(prev => {
        const updates: Record<string, boolean> = {};
        // Set new answers to collapsed by default
        answeredQuestionIds.forEach(id => {
          if (prev[id] === undefined) {
            updates[id] = true; // Collapse by default
          }
        });
        
        if (Object.keys(updates).length > 0) {
          return { ...prev, ...updates };
        }
        return prev;
      });
    }
  }, [analystQuestionAnswers]);
  
  // Log model information to developer console on component mount
  useEffect(() => {
    console.group('%cMindVault AI Model Information', 'font-size: 14px; font-weight: bold; color: #333;');
    console.log('%cAnalyst (Normal Mode):', 'font-weight: bold; color: #0066cc;', 
      `Using ${modelInfo.normal.id}`, 
      `\nDescription: ${modelInfo.normal.description}`);
    console.log('%cAnalyst (Fast Mode):', 'font-weight: bold; color: #cc6600;', 
      `Using ${modelInfo.fast.id}`, 
      `\nDescription: ${modelInfo.fast.description}`);
    console.log('%cAssociate:', 'font-weight: bold; color: #6600cc;', 
      `Using ${modelInfo.associate.id}`, 
      `\nDescription: ${modelInfo.associate.description}`);
    console.log('%cPedram Decision Maker:', 'font-weight: bold; color: #00995e;', 
      `Using ${modelInfo.pedram.id}`, 
      `\nDescription: ${modelInfo.pedram.description}`);
    console.log('%cCurrent Mode:', 'font-weight: bold;', fastMode ? 'Fast Mode' : 'Normal Mode');
    console.groupEnd();
  }, []);
  
  // Toggle collapsed state for a box
  const toggleBox = (category: string) => {
    setCollapsedBoxes(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };
  
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
  
  // Get category list - reorder for Pedram Mode
  const rawCategories = Array.from(new Set(filteredQuestions.map(q => q.category || 'General')));
  
  // If in Pedram Mode, ensure Financial Modelling comes first, followed by Team and Talent
  const categories = pedramMode
    ? ['Finances', 'Market Research']
    : rawCategories;
  
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
    // Skip this in Pedram Mode
    if (pedramMode) return;
    
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
    if (filteredQuestions.length > 0 && !originalContent && !pedramMode) {
      setOriginalContent({
        title,
        description,
        questions: filteredQuestions
      });
    }
  }, [filteredQuestions, title, description, originalContent, pedramMode]);

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
    if (pedramMode) {
      // In Pedram Mode, just return basic content
      return {
        title,
        description,
        questions: [],
        answers: {}
      };
    }
    
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
    // Skip this in Pedram Mode
    if (pedramMode) return;
    
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
    // Skip this in Pedram Mode
    if (pedramMode) return;
    
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
    // Skip this in Pedram Mode
    if (pedramMode) return;
    
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

  // For mapping categories in Pedram Mode
  const pedramModeCategoryMap = {
    'Financial Modelling': 'Finances',
    'Team and Talent': 'Market Research',
  };

  // For custom main questions in Pedram Mode
  const pedramModeMainQuestions = {
    'Finances': 'Is this company financially viable?',
    'Market Research': 'Is this market worthwhile entering?'
  };

  // Function to process multiple questions at once
  const processQuestionsForCategory = async (category: string) => {
    try {
      // Update workflow status
      setWorkflowStatus(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          analyst: { 
            status: 'active', 
            iteration: prev[category].analyst.iteration 
          }
        }
      }));
      
      setAnalysisInProgress(prev => ({ ...prev, [category]: true }));
      
      // Get questions for the category
      const questionsToProcess = PEDRAM_MODE_QUESTIONS[category as keyof typeof PEDRAM_MODE_QUESTIONS] || [];
      
      // Initialize loading state for all questions
      const initialState: Record<string, AnalystQuestionAnswer> = {};
      questionsToProcess.forEach(question => {
        // Check if this is a new question or an existing one
        const existingAnswer = analystQuestionAnswers[question];
        
        // If it's a follow-up question that was already initialized in sendQuestionsToAnalyst
        if (existingAnswer && existingAnswer.isFollowUp) {
          initialState[question] = {
            ...existingAnswer,
            isLoading: true // Set to loading now that we're processing it
          };
        } else {
          // It's an original question or a follow-up being processed for the first time
          initialState[question] = {
            question,
            answer: '',
            isLoading: true,
            isFollowUp: existingAnswer?.isFollowUp || false,
            iterationIndex: existingAnswer?.iterationIndex || 0 // Default to 0 for original questions
          };
        }
      });
      
      setAnalystQuestionAnswers(prev => ({
        ...prev,
        ...initialState
      }));
      
      // Process each question in parallel
      const promises = questionsToProcess.map(async (question) => {
        try {
          const answer = await processQuestionWithAI(question, files, category, fastMode);
          
          // Update answer state for this specific question
          setAnalystQuestionAnswers(prev => {
            // Get the current record for this question
            const current = prev[question] || {
              question,
              isLoading: false,
              isFollowUp: false,
              iterationIndex: 0
            };
            
            return {
              ...prev,
              [question]: {
                ...current,
                answer,
                isLoading: false
              }
            };
          });
          
          return { question, answer, error: null };
        } catch (error) {
          console.error(`Error processing question "${question}":`, error);
          
          setAnalystQuestionAnswers(prev => {
            // Get the current record for this question
            const current = prev[question] || {
              question,
              isLoading: false,
              isFollowUp: false,
              iterationIndex: 0
            };
            
            return {
              ...prev,
              [question]: {
                ...current,
                answer: '',
                isLoading: false,
                error: 'Failed to process this question. Please try again.'
              }
            };
          });
          
          return { question, error };
        }
      });
      
      // Wait for all questions to be processed
      await Promise.all(promises);
      
      // Mark analysis as complete for this category
      setAnalysisInProgress(prev => ({ ...prev, [category]: false }));
      
      // Mark analyst work as complete for this category
      const updatedCompletions = { ...analystCompleted, [category]: true };
      setAnalystCompleted(updatedCompletions);
      
      // Update workflow status to complete
      setWorkflowStatus(prev => {
        // Get the current iteration index
        const currentIteration = prev[category].activeIteration;
        
        // Update the iterations array to mark the current iteration as complete
        const updatedIterations = [...prev[category].iterations];
        if (updatedIterations[currentIteration]) {
          updatedIterations[currentIteration] = {
            ...updatedIterations[currentIteration],
            isComplete: true
          };
        }
        
        return {
          ...prev,
          [category]: {
            ...prev[category],
            analyst: { 
              status: 'complete', 
              iteration: prev[category].analyst.iteration 
            },
            iterations: updatedIterations
          }
        };
      });
      
      // Auto-expand the results section
      setExpandedAnalysis(prev => ({ ...prev, [category]: true }));
      
    } catch (error) {
      console.error(`Error processing questions for ${category}:`, error);
      
      // Update workflow status to error
      setWorkflowStatus(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          analyst: { 
            status: 'error', 
            iteration: prev[category].analyst.iteration 
          }
        }
      }));
      
      setAnalysisInProgress(prev => ({ ...prev, [category]: false }));
    }
  };

  // Update Function to handle Ask Analyst click
  const handleAskAnalyst = (category: string) => {
    // Start analysis for all questions in the category
    processQuestionsForCategory(category);
    
    // Set current category
    setCurrentCategory(category);
    
    console.log(`Ask Analyst clicked for ${category}`);
  };

  // Toggle expanded state for analysis section
  const toggleAnalysisSection = (category: string) => {
    setExpandedAnalysis(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Function to process associate analysis
  const processAssociateAnalysis = async (category: string) => {
    try {
      // Update workflow status
      setWorkflowStatus(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          associate: { 
            status: 'active', 
            iteration: prev[category].associate.iteration 
          }
        }
      }));
      
      // Update state to show loading
      setAssociateAnalysis(prev => ({
        ...prev,
        [category]: {
          analysis: '',
          isLoading: true
        }
      }));
      
      // Get the questions for this category
      const categoryQuestions = PEDRAM_MODE_QUESTIONS[category as keyof typeof PEDRAM_MODE_QUESTIONS] || [];
      
      // Prepare consolidated answers - group by original question and follow-ups
      const consolidatedAnswers: Record<string, any> = {};
      
      // Group all answers by their question
      categoryQuestions.forEach(question => {
        const answer = analystQuestionAnswers[question];
        if (answer) {
          if (answer.isFollowUp) {
            // This is a follow-up question, add it to the consolidated structure
            consolidatedAnswers[question] = {
              ...answer,
              consolidated: true
            };
          } else {
            // Original question
            consolidatedAnswers[question] = answer;
          }
        }
      });
      
      // Call the API
      const response = await fetch('/api/associate-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          questions: categoryQuestions,
          answers: consolidatedAnswers, // Send the consolidated answers
          files
        }),
      });
      
      // Log the model being used for Associate
      console.log(`%c[${modelInfo.associate.component}] Using model: ${modelInfo.associate.id}`, 'background: #f0e6ff; color: #6600cc; font-weight: bold; padding: 2px 5px; border-radius: 3px;');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Clean the response to remove thinking sections
      const cleanedAnalysis = cleanAIResponse(result.analysis);
      
      // Extract follow-up questions if present
      const extractedQuestions = extractFollowUpQuestions(cleanedAnalysis);
      if (extractedQuestions.length > 0) {
        setFollowUpQuestions(prev => ({
          ...prev,
          [category]: extractedQuestions
        }));
        // Reset the sent status for this category
        setSentToAnalyst(prev => ({
          ...prev,
          [category]: false
        }));
        
        // Update workflow status for follow-up questions available
        setWorkflowStatus(prev => ({
          ...prev,
          [category]: {
            ...prev[category],
            associate: { 
              status: 'complete', 
              iteration: prev[category].associate.iteration 
            },
            followUp: { 
              status: 'pending', 
              iteration: prev[category].followUp.iteration 
            }
          }
        }));
      } else {
        // No follow-up questions, mark as complete
        setWorkflowStatus(prev => ({
          ...prev,
          [category]: {
            ...prev[category],
            associate: { 
              status: 'complete', 
              iteration: prev[category].associate.iteration 
            },
            followUp: { 
              status: 'complete', 
              iteration: prev[category].followUp.iteration 
            }
          }
        }));
        
        // Clear any existing follow-up questions for this category
        setFollowUpQuestions(prev => {
          const updated = { ...prev };
          delete updated[category];
          return updated;
        });
      }
      
      // Update state with the analysis
      setAssociateAnalysis(prev => ({
        ...prev,
        [category]: {
          analysis: cleanedAnalysis,
          isLoading: false
        }
      }));

      // Auto-expand associate section
      toggleBox(`${category}-associate`);
      
    } catch (error) {
      console.error(`Error processing associate analysis for ${category}:`, error);
      
      // Update workflow status to error
      setWorkflowStatus(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          associate: { 
            status: 'error', 
            iteration: prev[category].associate.iteration 
          }
        }
      }));
      
      setAssociateAnalysis(prev => ({
        ...prev,
        [category]: {
          analysis: '',
          isLoading: false,
          error: 'Failed to process associate analysis. Please try again.'
        }
      }));
    }
  };

  // Update Function to handle Ask Associate click
  const handleAskAssociate = (category: string) => {
    // Skip if not complete
    if (!analystCompleted[category]) return;
    
    // Process the associate analysis
    processAssociateAnalysis(category);
    
    // Switch to associate view
    setActiveWorkflowStep(prev => ({
      ...prev,
      [category]: 'associate'
    }));
    
    console.log(`Ask Associate clicked for ${category}`);
  };

  // Function to process Pedram's final decision
  const processPedramDecision = async () => {
    try {
      // Update state to show loading
      setPedramDecision({
        decision: '',
        isLoading: true
      });

      // Check if we have both analyses
      const financeAnalysis = associateAnalysis['Finances']?.analysis;
      const marketAnalysis = associateAnalysis['Market Research']?.analysis;
      
      if (!financeAnalysis || !marketAnalysis) {
        throw new Error('Both finance and market analyses must be completed first');
      }
      
      // Only actually send benchmark data if Stop2 is selected
      const actuallyUseBenchmark = benchmarkEnabled && selectedBenchmarkId === 'stop2';
      
      // Call the API
      const response = await fetch('/api/pedram-decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          financeAnalysis,
          marketAnalysis,
          files,
          model: modelInfo.pedram.id,
          benchmarkEnabled: actuallyUseBenchmark,
          benchmarkCompanyId: selectedBenchmarkId
        }),
      });
      
      // Log the model being used for Pedram
      console.log(`%c[${modelInfo.pedram.component}] Using model: ${modelInfo.pedram.id}`, 'background: #e6fff0; color: #00995e; font-weight: bold; padding: 2px 5px; border-radius: 3px;');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Clean the decision to remove thinking sections
      const cleanedDecision = cleanAIResponse(result.decision);
      
      // Update state with the decision
      setPedramDecision({
        decision: cleanedDecision,
        isLoading: false
      });
      
    } catch (error) {
      console.error('Error processing Pedram decision:', error);
      setPedramDecision({
        decision: '',
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to process decision. Please try again.'
      });
    }
  };

  // Function to check if Ask Pedram should be enabled
  const canAskPedram = () => {
    return (
      associateAnalysis['Finances']?.analysis && 
      associateAnalysis['Market Research']?.analysis &&
      !pedramDecision.isLoading
    );
  };

  // Function to reset Pedram Mode analysis and answers
  const resetPedramMode = () => {
    // Reset workflow status
    setWorkflowStatus({
      'Finances': {
        analyst: { status: 'pending', iteration: 0 },
        associate: { status: 'pending', iteration: 0 },
        followUp: { status: 'pending', iteration: 0 },
        iterations: [{ index: 0, questions: [], isComplete: false }],
        activeIteration: 0
      },
      'Market Research': {
        analyst: { status: 'pending', iteration: 0 },
        associate: { status: 'pending', iteration: 0 },
        followUp: { status: 'pending', iteration: 0 },
        iterations: [{ index: 0, questions: [], isComplete: false }],
        activeIteration: 0
      }
    });
    
    // Reset analyst question answers
    setAnalystQuestionAnswers({});
    
    // Reset PEDRAM_MODE_QUESTIONS to original state (remove follow-up questions)
    // Clone the original questions
    PEDRAM_MODE_QUESTIONS.Finances = [
      "What is the current Annual Recurring Revenue (ARR) of the company?",
      "What is the Year-over-Year (YoY) growth rate?",
      "What is the target valuation for the company?",
      "What is the current monthly cash burn rate?",
      "How much runway does the company have?",
      "What is the company's funding history?"
    ];
    
    PEDRAM_MODE_QUESTIONS['Market Research'] = [
      "Who are the company's key customers?",
      "What is the total addressable market (TAM) for the company's product or service, and what is the projected growth rate of this market over the next 5-10 years?",
      "What regulatory or legal factors could impact the company's operations or the market as a whole, and how is the company positioned to navigate these challenges?",
      "What are the key trends or technological advancements shaping the market, and how is the company leveraging or adapting to these trends?",
      "Who are the main competitors?"
    ];
    
    // Reset analysis completion status
    setAnalystCompleted({ Finances: false, 'Market Research': false });
    
    // Reset analysis progress tracking
    setAnalysisInProgress({ Finances: false, 'Market Research': false });
    
    // Reset expanded analysis sections
    setExpandedAnalysis({ Finances: false, 'Market Research': false });
    
    // Reset collapsed boxes
    setCollapsedBoxes({});
    
    // Reset associate analysis
    setAssociateAnalysis({});
    
    // Reset Pedram decision
    setPedramDecision({
      decision: '',
      isLoading: false
    });
    
    // Reset follow-up questions and sent status
    setFollowUpQuestions({});
    setSentToAnalyst({});
    
    // Reset benchmark toggle and selection
    setBenchmarkEnabled(false);
    setSelectedBenchmarkId(null);
    
    // Clear local storage related to Pedram Mode
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pedramModeAnalystCompleted');
      localStorage.removeItem('benchmarkEnabled');
      localStorage.removeItem('selectedBenchmarkId');
    }
    
    console.log('Pedram Mode reset completed - All questions and answers cleared, including follow-ups');
  };

  // Helper function to render markdown-like content
  const renderMarkdown = (content: string) => {
    if (!content) return null;
    
    // Process the markdown text to convert simple markdown to JSX
    const processText = (text: string) => {
      // Replace **bold** with styled spans
      let processedText = text.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-purple-800">$1</span>');
      
      // Replace __underline__ with styled spans
      processedText = processedText.replace(/__(.*?)__/g, '<span class="underline decoration-purple-500 decoration-2">$1</span>');
      
      // Replace *italic* with styled spans
      processedText = processedText.replace(/\*(.*?)\*/g, '<span class="italic text-purple-700">$1</span>');
      
      // Replace `code` with styled spans
      processedText = processedText.replace(/`(.*?)`/g, '<span class="bg-gray-100 text-purple-800 px-1 py-0.5 rounded font-mono text-sm">$1</span>');
      
      // Create links
      processedText = processedText.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-600 underline hover:text-blue-800" target="_blank">$1</a>');
      
      return processedText;
    };
    
    // Process the lines of content, ensuring consistent formatting for lists
    const lines = content.split('\n');
    const processedLines: string[] = [];
    let inList = false;
    
    // Handle content differently based on the section title
    const title = content.split('\n')[0]?.startsWith('#') ? content.split('\n')[0].substring(1).trim() : '';
    
    if (lines.length > 0) {
      // Add appropriate wrapper for the section content
      processedLines.push('<div class="bg-purple-50 p-3 rounded-md border border-purple-100">');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines
        if (!line) {
          if (inList) {
            inList = false;
            processedLines.push('</ul>');
          }
          processedLines.push('<div class="h-2"></div>');
          continue;
        }
        
        // Handle all types of bullet points (-, •, *)
        if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
          const bulletContent = line.substring(1).trim();
          
          if (!inList) {
            inList = true;
            processedLines.push('<ul class="list-disc pl-5 space-y-1">');
          }
          
          processedLines.push(`<li class="ml-1 text-purple-900">${processText(bulletContent)}</li>`);
        } else {
          if (inList) {
            inList = false;
            processedLines.push('</ul>');
          }
          
          // For non-bullet point text
          processedLines.push(`<p class="text-gray-700 mb-1">${processText(line)}</p>`);
        }
      }
      
      // Close any open list
      if (inList) {
        processedLines.push('</ul>');
      }
      
      // Close the section wrapper
      processedLines.push('</div>');
    }
    
    return <div dangerouslySetInnerHTML={{ __html: processedLines.join('') }} />;
  };

  // Enhanced function for rendering Pedram decision with section-specific styling
  const renderPedramDecision = (content: string) => {
    if (!content) return null;
    
    // Process the markdown text to convert simple markdown to JSX - same as original
    const processText = (text: string) => {
      // Auto-enhance numbers and percentages
      const enhancedText = text.replace(/(\$\d+(?:\.\d+)?(?:K|M|B)?|\d+(?:\.\d+)?%|\d+(?:\,\d+)+)/g, '<span class="font-semibold text-purple-900">$1</span>');
      
      // Replace **bold** with styled spans
      let processedText = enhancedText.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-purple-800">$1</span>');
      
      // Replace __underline__ with styled spans
      processedText = processedText.replace(/__(.*?)__/g, '<span class="underline decoration-purple-500 decoration-2">$1</span>');
      
      // Replace *italic* with styled spans
      processedText = processedText.replace(/\*(.*?)\*/g, '<span class="italic text-purple-700">$1</span>');
      
      // Replace `code` with styled spans
      processedText = processedText.replace(/`(.*?)`/g, '<span class="bg-gray-100 text-purple-800 px-1 py-0.5 rounded font-mono text-sm">$1</span>');
      
      // Create links
      processedText = processedText.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-600 underline hover:text-blue-800" target="_blank">$1</a>');
      
      return processedText;
    };
    
    // Check if this is a thinking model output and extract the final answer
    // The thinking model may include <answer>...</answer> tags or similar
    let cleanedContent = content;
    
    // Handle Claude thinking model specific formatting
    if (content.includes("<answer>")) {
      const answerMatch = content.match(/<answer>([\s\S]*?)<\/answer>/);
      if (answerMatch && answerMatch[1]) {
        cleanedContent = answerMatch[1].trim();
        console.log("Extracted answer from thinking model output");
      }
    }
    
    // If we have thinking content with no tags but starts with thinking/reasoning before the structure
    // Look for the first proper section heading (## Reasons to Move Forward)
    if (!cleanedContent.startsWith("## Reasons to Move Forward") && cleanedContent.includes("## Reasons to Move Forward")) {
      const startIndex = cleanedContent.indexOf("## Reasons to Move Forward");
      if (startIndex > 0) {
        cleanedContent = cleanedContent.substring(startIndex);
        console.log("Trimmed thinking content to start with first section");
      }
    }
    
    // Extract sections using regex to match "## Section Title" patterns
    const sections: {title: string, content: string}[] = [];
    const sectionRegex = /##\s+([^\n]+)([\s\S]*?)(?=\n##|$)/g;
    
    let match;
    while ((match = sectionRegex.exec(cleanedContent)) !== null) {
      sections.push({
        title: match[1].trim(),
        content: match[2].trim()
      });
    }

    // Add better error handling for when no sections are found
    if (sections.length === 0) {
      console.error("No properly formatted sections found in Pedram's decision");
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-semibold mb-2">Error rendering decision</p>
          <p>The decision couldn't be properly formatted. Please try again.</p>
          <div className="mt-4 p-3 bg-white rounded border border-red-100 text-gray-700 max-h-60 overflow-auto text-sm">
            <pre className="whitespace-pre-wrap">{content.substring(0, 500)}...</pre>
          </div>
        </div>
      );
    }
    
    const processedSections = sections.map(section => {
      // Determine styling based on section title
      let sectionClass = '';
      let headerClass = '';
      let iconHtml = '';
      
      switch(section.title) {
        case 'Reasons to Move Forward':
          sectionClass = 'bg-green-50 border-green-200 mb-4';
          headerClass = 'bg-green-100 text-green-800 border-b border-green-200';
          iconHtml = '<span class="mr-2">✅</span>';
          break;
        case 'Reasons Not to Move Forward':
          sectionClass = 'bg-amber-50 border-amber-200 mb-4';
          headerClass = 'bg-amber-100 text-amber-800 border-b border-amber-200';
          iconHtml = '<span class="mr-2">⚠️</span>';
          break;
        case 'Decision':
          sectionClass = 'bg-purple-50 border-purple-200 mb-4';
          headerClass = 'bg-purple-100 text-purple-800 border-b border-purple-200';
          iconHtml = '<span class="mr-2">🎯</span>';
          break;
        case 'Key Questions':
          sectionClass = 'bg-blue-50 border-blue-200 mb-4';
          headerClass = 'bg-blue-100 text-blue-800 border-b border-blue-200';
          iconHtml = '<span class="mr-2">❓</span>';
          break;
        case 'Benchmark Comparison':
          sectionClass = 'bg-indigo-50 border-indigo-200 mb-4';
          headerClass = 'bg-indigo-100 text-indigo-800 border-b border-indigo-200';
          iconHtml = '<span class="mr-2">📊</span>';
          break;
        default:
          sectionClass = 'bg-gray-50 border-gray-200 mb-4';
          headerClass = 'bg-gray-100 text-gray-800 border-b border-gray-200';
      }
      
      // Process bullet points and paragraphs
      const lines = section.content.split('\n');
      const contentHtml: string[] = [];
      let inList = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line) {
          if (inList) {
            inList = false;
            contentHtml.push('</ul>');
          }
          contentHtml.push('<div class="h-2"></div>');
          continue;
        }
        
        // Handle subsection headers (### Title)
        if (line.startsWith('### ')) {
          if (inList) {
            inList = false;
            contentHtml.push('</ul>');
          }
          
          // Add a special class for benchmark subsections
          const subsectionClass = section.title === 'Benchmark Comparison' 
            ? 'mt-4 mb-2 text-indigo-700 font-semibold border-b border-indigo-200 pb-1' 
            : 'mt-4 mb-2 text-gray-700 font-semibold';
          
          contentHtml.push(`<h4 class="${subsectionClass}">${line.substring(4)}</h4>`);
          continue;
        }
        
        // Handle numbered or bullet points
        if (line.match(/^\d+\.\s/) || line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
          const isNumbered = line.match(/^\d+\.\s/);
          const listItemContent = isNumbered 
            ? line.replace(/^\d+\.\s/, '') 
            : line.substring(1).trim();
          
          if (!inList) {
            inList = true;
            const listType = isNumbered ? 'ol' : 'ul';
            const listClass = isNumbered 
              ? 'list-decimal pl-5 space-y-1 my-2' 
              : 'list-disc pl-5 space-y-1 my-2';
            contentHtml.push(`<${listType} class="${listClass}">`);
          }
          
          const itemClass = section.title === 'Reasons to Move Forward' 
            ? 'text-green-800' 
            : section.title === 'Reasons Not to Move Forward' 
              ? 'text-amber-800' 
              : 'text-gray-800';
          
          contentHtml.push(`<li class="${itemClass} ml-1">${processText(listItemContent)}</li>`);
        } else {
          if (inList) {
            inList = false;
            contentHtml.push('</ul>');
          }
          
          // Special handling for benchmark comparison bold headers
          if (line.startsWith('**') && line.endsWith(':**')) {
            contentHtml.push(`<p class="text-indigo-700 font-semibold mt-3 mb-1">${line}</p>`);
          } else {
            contentHtml.push(`<p class="text-gray-800 my-2">${processText(line)}</p>`);
          }
        }
      }
      
      if (inList) {
        contentHtml.push('</ul>');
      }
      
      // Build the full section HTML
      return `
        <div class="rounded-lg border overflow-hidden ${sectionClass} shadow-sm">
          <div class="flex items-center font-semibold p-3 ${headerClass}">
            ${iconHtml}${section.title}
          </div>
          <div class="p-4">
            ${contentHtml.join('')}
          </div>
        </div>
      `;
    });
    
    // Return the processed HTML
    return <div dangerouslySetInnerHTML={{ __html: processedSections.join('') }} />;
  };
  
  // Enhanced function for rendering Associate analysis with section-specific styling
  const renderAssociateAnalysis = (content: string) => {
    // Function to process text for markdown and highlighting
    const processText = (text: string) => {
      // Replace ** with <strong> for bold text
      let processed = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Add color to score based on value
      processed = processed.replace(
        /Score:\s*(\d+)\/10/g, 
        (match, score) => {
          const numScore = parseInt(score, 10);
          let colorClass = 'text-red-600';
          
          if (numScore >= 8) {
            colorClass = 'text-green-600';
          } else if (numScore >= 5) {
            colorClass = 'text-amber-600';
          }
          
          return `Score: <span class="${colorClass} font-semibold">${score}/10</span>`;
        }
      );
      
      // Highlight "Proceed to Partner Review" in green
      processed = processed.replace(
        /(Proceed to Partner Review[^"]*)/g,
        '<span class="text-green-600 font-semibold">$1</span>'
      );
      
      // Highlight "Additional Analyst Research Required" in amber
      processed = processed.replace(
        /(Additional Analyst Research Required)/g,
        '<span class="text-amber-600 font-semibold">$1</span>'
      );
      
      // Convert markdown-style bullet points to HTML
      processed = processed.replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>');
      processed = processed.replace(/(<li>.*<\/li>\n)+/g, '<ul class="list-disc pl-5 space-y-1">$&</ul>');
      
      // Convert numbered list items
      processed = processed.replace(/^\s*(\d+)\.\s+(.*)$/gm, '<li>$2</li>');
      
      // Replace newlines with <br> tags
      processed = processed.replace(/\n/g, '<br>');
      
      return processed;
    };
    
    // Split the content by heading (##)
    const sections = content.split(/^## /m).filter(Boolean);
    
    return (
      <div className="space-y-6">
        {sections.map((section, idx) => {
          const [title, ...contentParts] = section.split('\n');
          let sectionContent = contentParts.join('\n').trim();
          
          // Determine section styling
          let bgColor = 'bg-white';
          let borderColor = 'border-gray-200';
          let textColor = 'text-gray-800';
          let headingColor = 'text-gray-900';
          
          // Apply special styling based on section title
          if (title === 'Sense Check') {
            if (sectionContent.includes('Needs Improvement')) {
              bgColor = 'bg-red-50';
              borderColor = 'border-red-200';
              headingColor = 'text-red-800';
            } else {
              bgColor = 'bg-green-50';
              borderColor = 'border-green-200';
              headingColor = 'text-green-800';
            }
          } else if (title === 'Completeness Check') {
            const scoreMatch = sectionContent.match(/Score:\s*(\d+)\/10/);
            if (scoreMatch) {
              const score = parseInt(scoreMatch[1], 10);
              if (score >= 8) {
                bgColor = 'bg-green-50';
                borderColor = 'border-green-200';
                headingColor = 'text-green-800';
              } else if (score >= 5) {
                bgColor = 'bg-amber-50';
                borderColor = 'border-amber-200';
                headingColor = 'text-amber-800';
              } else {
                bgColor = 'bg-red-50';
                borderColor = 'border-red-200';
                headingColor = 'text-red-800';
              }
            }
          } else if (title === 'Recommended Next Steps') {
            if (sectionContent.includes('Proceed to Partner Review')) {
              bgColor = 'bg-green-50';
              borderColor = 'border-green-200';
              headingColor = 'text-green-800';
            } else {
              bgColor = 'bg-amber-50';
              borderColor = 'border-amber-200';
              headingColor = 'text-amber-800';
            }
          }
          
          // Check if we have follow-up questions in this section
          const hasFollowUpQuestions = title === 'Recommended Next Steps' && 
                                      sectionContent.includes('Additional Analyst Research Required');
          
          return (
            <div key={idx} className={`border ${borderColor} rounded-lg overflow-hidden`}>
              <div className={`${bgColor} px-4 py-3 border-b ${borderColor}`}>
                <h3 className={`font-semibold ${headingColor}`}>{title}</h3>
              </div>
              <div className={`p-4 ${bgColor} ${textColor}`}>
                <div dangerouslySetInnerHTML={{ __html: processText(sectionContent) }} />
                
                {/* Add special UI element for follow-up questions section */}
                {hasFollowUpQuestions && (
                  <div className="mt-3 pt-3 border-t border-amber-200">
                    <p className="text-amber-800 italic text-sm">
                      These follow-up questions are generated by the Associate to fill in critical information gaps.
                      Click "Send questions to analyst" below to have them researched.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Create hardcoded questions for Pedram Mode that don't depend on user selections
  const pedramModeFinanceQuestions: InvestmentMemoQuestion[] = [
    {
      id: 'arr',
      question: 'What is the current Annual Recurring Revenue (ARR) of the company?',
      description: 'Find the most recent ARR figure with currency.',
      category: 'Financial Modelling',
      complexity: 'medium'
    },
    {
      id: 'growth_rate',
      question: 'What is the Year-over-Year (YoY) growth rate?',
      description: 'Calculate the YoY growth percentage from the latest financial data.',
      category: 'Financial Modelling',
      complexity: 'medium'
    },
    {
      id: 'valuation',
      question: 'What is the target valuation for the company?',
      description: 'Identify the valuation the company is seeking in this funding round.',
      category: 'Financial Modelling',
      complexity: 'medium'
    },
    {
      id: 'burn_rate',
      question: 'What is the current monthly cash burn rate?',
      description: 'Calculate the average monthly cash outflow from the financial statements.',
      category: 'Financial Modelling',
      complexity: 'medium'
    },
    {
      id: 'runway',
      question: 'How much runway does the company have?',
      description: 'Determine how many months of operations the company can fund with current cash reserves.',
      category: 'Financial Modelling',
      complexity: 'medium'
    },
    {
      id: 'funding_history',
      question: 'What is the company\'s funding history?',
      description: 'List previous funding rounds, investors, and amounts raised.',
      category: 'Financial Modelling',
      complexity: 'low'
    }
  ];

  const pedramModeMarketQuestions: InvestmentMemoQuestion[] = [
    {
      id: 'customers',
      question: 'Who are the company\'s key customers?',
      description: 'Identify major customers and customer segments.',
      category: 'Team and Talent',
      complexity: 'low'
    },
    {
      id: 'tam',
      question: 'What is the total addressable market (TAM) for the company\'s product or service, and what is the projected growth rate of this market over the next 5-10 years?',
      description: 'Determine the market size and growth potential.',
      category: 'Team and Talent',
      complexity: 'medium'
    },
    {
      id: 'regulatory_factors',
      question: 'What regulatory or legal factors could impact the company\'s operations or the market as a whole, and how is the company positioned to navigate these challenges?',
      description: 'Identify regulatory concerns and company preparedness.',
      category: 'Team and Talent',
      complexity: 'high'
    },
    {
      id: 'market_trends',
      question: 'What are the key trends or technological advancements shaping the market, and how is the company leveraging or adapting to these trends?',
      description: 'Identify market trends and company positioning.',
      category: 'Team and Talent',
      complexity: 'medium'
    },
    {
      id: 'competition',
      question: 'Who are the main competitors?',
      description: 'List direct and indirect competitors and their market positions.',
      category: 'Team and Talent',
      complexity: 'medium'
    }
  ];

  // For Pedram Mode box rendering
  const renderPedramModeBox = (category: string) => {
    // Skip if not in Pedram mode or this category is not in PEDRAM_MODE_QUESTIONS
    if (!pedramMode || !PEDRAM_MODE_QUESTIONS[category as keyof typeof PEDRAM_MODE_QUESTIONS]) {
      return null;
    }
    
    // Get questions for this category
    const categoryQuestions = PEDRAM_MODE_QUESTIONS[category as keyof typeof PEDRAM_MODE_QUESTIONS] || [];
    
    // Get workflow status
    const workflowState = {
      analyst: {
        status: analystCompleted[category] ? 'complete' as const : analysisInProgress[category] ? 'active' as const : 'pending' as const,
        iteration: followUpQuestions[category]?.length || 0
      },
      associate: {
        status: associateAnalysis[category]?.analysis ? 'complete' as const : associateAnalysis[category]?.isLoading ? 'active' as const : 'pending' as const,
        iteration: followUpQuestions[category]?.length || 0
      },
      followUp: {
        status: sentToAnalyst[category] ? 'complete' as const : followUpQuestions[category]?.length ? 'active' as const : 'pending' as const,
        iteration: followUpQuestions[category]?.length || 0
      }
    };
    
    // Get current active iteration
    const activeIteration = 0; // Default to the original analysis
    
    // Toggle expanded state of this section
    const toggleExpanded = () => toggleAnalysisSection(category);
    
    const hasAnswers = categoryQuestions.some(question => 
      analystQuestionAnswers[question]?.answer && !analystQuestionAnswers[question]?.isLoading
    );
    
    const anyLoading = categoryQuestions.some(question => 
      analystQuestionAnswers[question]?.isLoading
    );
    
    // Determine if the associate analysis section is active
    const canShowAssociate = analystCompleted[category];
    
    // Check if there are any follow-up questions
    const hasFollowUp = followUpQuestions[category]?.length > 0;
    
    // Get iterations for this category
    const iterations = workflowStatus[category]?.iterations || [];
    
    // Get the current active step
    const currentStep = activeWorkflowStep[category] || 'analyst';
    
    // Render box content based on the active step
    let contentToRender;
    
    // Iteration history component
    const iterationHistoryComponent = iterations.length > 1 && (
      <IterationHistory 
        iterations={iterations}
        activeIteration={activeIteration}
        onSelectIteration={(index) => handleSelectIteration(category, index)}
      />
    );
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6 overflow-hidden">
        {/* Header */}
        <div 
          className={`flex items-center justify-between p-4 ${collapsedBoxes[category] ? '' : 'border-b border-gray-200'}`}
          onClick={toggleExpanded}
        >
          <div className="flex items-center">
            <div className="mr-3">
              {category === 'Finances' ? (
                <DollarSign className="h-5 w-5 text-blue-600" />
              ) : (
                <GanttChart className="h-5 w-5 text-green-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">{category}</h3>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              className="text-gray-400 hover:text-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                toggleBox(category);
              }}
            >
              {collapsedBoxes[category] ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        
        {!collapsedBoxes[category] && (
          <div className="p-4">
            {/* Workflow indicator */}
            <WorkflowIndicator 
              category={category}
              analystState={workflowState.analyst}
              associateState={workflowState.associate}
              followUpState={workflowState.followUp}
              onReset={() => resetWorkflowForCategory(category)}
              onStepClick={(step) => handleWorkflowStepClick(category, step)}
              activeStep={currentStep}
            />
            
            {/* Iteration history if there are multiple iterations */}
            {iterationHistoryComponent}
            
            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {!analystCompleted[category] && !analysisInProgress[category] && (
                <button
                  onClick={() => handleAskAnalyst(category)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  {hasAnswers ? <CheckCircle size={16} className="mr-2" /> : <FileText size={16} className="mr-2" />}
                  {hasAnswers ? 'Complete Analysis' : 'Ask Analyst'}
                </button>
              )}
              
              {analysisInProgress[category] && (
                <div className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-100 text-blue-800">
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                  Processing...
                </div>
              )}
              
              {canShowAssociate && (
                <button
                  onClick={() => handleAskAssociate(category)}
                  disabled={associateAnalysis[category]?.isLoading}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    associateAnalysis[category]?.isLoading
                      ? 'bg-purple-100 text-purple-400 cursor-not-allowed'
                      : associateAnalysis[category]?.analysis
                        ? 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {associateAnalysis[category]?.isLoading ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                      Evaluating...
                    </>
                  ) : associateAnalysis[category]?.analysis ? (
                    <>
                      <RefreshCw size={16} className="mr-2" />
                      Re-evaluate
                    </>
                  ) : (
                    <>
                      <MessageSquare size={16} className="mr-2" />
                      Ask Associate
                    </>
                  )}
                </button>
              )}
              
              {hasFollowUp && !sentToAnalyst[category] && (
                <button
                  onClick={() => sendQuestionsToAnalyst(category)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-amber-600 text-white hover:bg-amber-700"
                >
                  <MessageSquare size={16} className="mr-2" />
                  Send Follow-up Questions
                </button>
              )}
              
              {/* Add "View Analysis Prompts" button */}
              <button
                onClick={() => showPrompt(getQuestionPrompt(categoryQuestions[0], category), `Analyst Prompt (${category})`)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
              >
                <Eye size={16} className="mr-2" />
                View Prompts
              </button>
            </div>

            {/* Content changes based on active step */}
            {currentStep === 'analyst' && (
              <div className="space-y-4 mt-6">
                {/* Analysis Questions & Results */}
                <div>
                  <h3 className="text-md font-medium text-gray-700 mb-3">Analysis Questions</h3>
                  {categoryQuestions.map((question, index) => (
                    <div 
                      key={`${category}-question-${index}`} 
                      className="mb-4"
                    >
                      <QuestionAnalysisResult
                        question={question}
                        answer={analystQuestionAnswers[question] || { isLoading: false, answer: '', question }}
                        renderMarkdown={renderMarkdown}
                        onSaveAnswer={handleSaveManualAnswer}
                        category={category}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Associate Analysis */}
            {currentStep === 'associate' && canShowAssociate && (
              <div className="mt-6">
                <div className="flex items-center mb-3">
                  <h3 className="text-md font-medium text-gray-700">Associate Evaluation</h3>
                  {associateAnalysis[category]?.analysis && (
                    <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                      <CheckCircle size={12} className="inline mr-1" />
                      Complete
                    </span>
                  )}
                </div>
                
                {associateAnalysis[category]?.isLoading ? (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span>Associate is evaluating the analysis...</span>
                  </div>
                ) : associateAnalysis[category]?.analysis ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    {renderAssociateAnalysis(associateAnalysis[category]?.analysis)}
                  </div>
                ) : (
                  <div className="text-gray-500 italic">
                    No evaluation available. Click "Ask Associate" to get an evaluation.
                  </div>
                )}
                
                {/* Add "View Evaluation Prompt" button */}
                {associateAnalysis[category]?.analysis && (
                  <button
                    onClick={() => showPrompt(getAssociatePrompt(category), `Associate Prompt (${category})`)}
                    className="mt-3 inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                  >
                    <Eye size={14} className="mr-2" />
                    View Evaluation Prompt
                  </button>
                )}
              </div>
            )}
            
            {/* Follow-up Questions */}
            {currentStep === 'followUp' && hasFollowUp && (
              <div className="mt-6">
                <h3 className="text-md font-medium text-gray-700 mb-3">Follow-up Questions</h3>
                <div className="space-y-4">
                  {followUpQuestions[category]?.map((question, index) => {
                    // Get answer if it exists
                    const existingAnswer = analystQuestionAnswers[question];
                    
                    return (
                    <div key={index} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium text-amber-800 flex-grow">{question}</p>
                        <button
                          onClick={() => removeFollowUpQuestion(category, index)}
                          className="text-amber-700 hover:text-amber-900 ml-2"
                          title="Remove this question"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      
                      {/* Manual answer field */}
                      {!sentToAnalyst[category] && (
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-amber-700 mb-1">
                            Manual Answer
                          </label>
                          <textarea
                            value={manualAnswers[question] || ''}
                            onChange={(e) => setManualAnswers(prev => ({
                              ...prev,
                              [question]: e.target.value
                            }))}
                            placeholder="Type your answer here..."
                            className="w-full px-3 py-2 border border-amber-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                            rows={3}
                          />
                          <button
                            onClick={() => handleSaveManualAnswer(question, manualAnswers[question] || '', category)}
                            className="mt-2 inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300"
                            disabled={!manualAnswers[question]?.trim()}
                          >
                            <Check size={12} className="mr-1" />
                            Save Answer
                          </button>
                        </div>
                      )}
                      
                      {/* Show answer if it exists */}
                      {existingAnswer?.answer && (
                        <div className="mt-3 bg-white p-3 rounded-md border border-amber-200">
                          <div className="flex items-center mb-1">
                            <span className="text-xs font-medium text-amber-800">
                              {existingAnswer.isFollowUp ? 'Follow-up Answer' : 'Original Answer'}
                            </span>
                          </div>
                          {renderMarkdown(existingAnswer.answer)}
                        </div>
                      )}
                    </div>
                  )})}
                </div>
                
                {/* Answer action buttons */}
                {!sentToAnalyst[category] && followUpQuestions[category]?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => sendQuestionsToAnalyst(category)}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-amber-600 text-white hover:bg-amber-700"
                    >
                      <Send size={16} className="mr-2" />
                      Send All to Analyst AI
                    </button>
                    
                    <button
                      onClick={() => processFollowUpWithAnalyst(category)}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <MessageSquare size={16} className="mr-2" />
                      Process with Analyst AI
                    </button>
                  </div>
                )}
                
                {/* Add Analyze Answers button and results section */}
                {sentToAnalyst[category] && analystCompleted[category] && (
                  <div className="mt-4">
                    {!followUpAnalysisResults[category]?.analysis && !followUpAnalysisInProgress[category] && (
                      <button
                        onClick={() => analyzeFollowUpAnswers(category)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <FileSpreadsheet size={16} className="mr-2" />
                        Analyze Answers
                      </button>
                    )}
                    
                    {followUpAnalysisInProgress[category] && (
                      <div className="mt-4 flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-100 text-blue-800 w-fit">
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                        Analyzing Follow-up Answers...
                      </div>
                    )}
                    
                    {followUpAnalysisResults[category]?.analysis && (
                      <div className="mt-4">
                        <h4 className="font-medium text-blue-800 mb-2">Follow-up Analysis:</h4>
                        <div className="bg-white p-4 rounded-lg border border-blue-200">
                          {renderMarkdown(followUpAnalysisResults[category].analysis)}
                        </div>
                        
                        <button
                          onClick={() => handleReEvaluate(category)}
                          className="mt-4 inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700"
                        >
                          <RefreshCw size={16} className="mr-2" />
                          Re-Evaluate
                        </button>
                      </div>
                    )}
                    
                    {followUpAnalysisResults[category]?.error && (
                      <div className="text-red-600 mt-2">
                        {followUpAnalysisResults[category].error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Helper to get the name of the selected benchmark company
  const getSelectedBenchmarkName = () => {
    if (!selectedBenchmarkId) return null;
    const company = BENCHMARK_COMPANIES.find(c => c.id === selectedBenchmarkId);
    return company ? company.name : null;
  };

  // Add a function to handle opening the benchmark selector
  const handleOpenBenchmarkSelector = () => {
    setIsBenchmarkModalOpen(true);
  };

  // Add a function to handle selecting a benchmark company
  const handleSelectBenchmark = (companyId: string) => {
    setSelectedBenchmarkId(companyId);
    setBenchmarkEnabled(true);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedBenchmarkId', companyId);
      localStorage.setItem('benchmarkEnabled', 'true');
    }
  };

  // Function to extract follow-up questions from Associate analysis
  const extractFollowUpQuestions = (analysis: string): string[] => {
    if (!analysis) return [];
    
    // Check if analysis contains "Additional Analyst Research Required"
    if (!analysis.includes('Additional Analyst Research Required')) {
      return [];
    }
    
    try {
      // Look for the numbered questions after "Additional Analyst Research Required"
      const questionsSection = analysis.split('Additional Analyst Research Required')[1];
      const questions: string[] = [];
      
      // Match numbered list items (e.g., "1. What is the ARR?")
      const questionRegex = /\d+\.\s+([^\n]+)/g;
      let match;
      
      while ((match = questionRegex.exec(questionsSection)) !== null) {
        if (match[1] && match[1].trim()) {
          questions.push(match[1].trim());
        }
        
        // Limit to 3 questions
        if (questions.length >= 3) break;
      }
      
      return questions;
    } catch (error) {
      console.error('Error extracting follow-up questions:', error);
      return [];
    }
  };

  // Function to send follow-up questions to the analyst
  const sendQuestionsToAnalyst = (category: string) => {
    const questions = followUpQuestions[category] || [];
    if (questions.length === 0) return;
    
    // Calculate the current iteration index
    // Find the maximum iterationIndex from existing answers
    let maxIterationIndex = 0;
    Object.values(analystQuestionAnswers).forEach(answer => {
      if (answer.iterationIndex !== undefined && answer.iterationIndex > maxIterationIndex) {
        maxIterationIndex = answer.iterationIndex;
      }
    });
    const currentIterationIndex = maxIterationIndex + 1;
    
    // Add the follow-up questions to the existing category questions
    const updatedQuestions = [
      ...PEDRAM_MODE_QUESTIONS[category as keyof typeof PEDRAM_MODE_QUESTIONS] || [],
      ...questions
    ];
    
    // Update PEDRAM_MODE_QUESTIONS object
    PEDRAM_MODE_QUESTIONS[category as keyof typeof PEDRAM_MODE_QUESTIONS] = updatedQuestions;
    
    // Mark questions as follow-ups in the tracking state
    questions.forEach(question => {
      // Initialize the question in analystQuestionAnswers with follow-up metadata
      setAnalystQuestionAnswers(prev => ({
        ...prev,
        [question]: {
          question,
          answer: '',
          isLoading: false, // Not loading yet, will be set when processing starts
          isFollowUp: true,
          iterationIndex: currentIterationIndex
        }
      }));
    });
    
    // Mark as sent
    setSentToAnalyst(prev => ({
      ...prev,
      [category]: true
    }));
    
    // Update workflow status
    setWorkflowStatus(prev => {
      // Create a new iteration in the iterations array
      const updatedIterations = [...prev[category].iterations];
      updatedIterations.push({
        index: currentIterationIndex,
        questions: questions,
        timestamp: new Date().toISOString(),
        isComplete: false
      });
      
      return {
        ...prev,
        [category]: {
          ...prev[category],
          analyst: { 
            status: 'pending', 
            iteration: currentIterationIndex 
          },
          associate: { 
            status: 'pending', 
            iteration: prev[category].associate.iteration 
          },
          followUp: { 
            status: 'complete', 
            iteration: prev[category].followUp.iteration 
          },
          iterations: updatedIterations,
          activeIteration: currentIterationIndex
        }
      };
    });
    
    console.log(`Sent ${questions.length} follow-up questions to analyst for ${category}. Iteration: ${currentIterationIndex}`);

    // Immediately process the follow-up questions with the Analyst
    processQuestionsForCategory(category);
  };

  // Function to switch between iterations
  const handleSelectIteration = (category: string, iterationIndex: number) => {
    setWorkflowStatus(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        activeIteration: iterationIndex
      }
    }));
  };

  // Function to reset workflow state for a category
  const resetWorkflowForCategory = (category: string) => {
    setWorkflowStatus(prev => ({
      ...prev,
      [category]: {
        analyst: { status: 'pending', iteration: 0 },
        associate: { status: 'pending', iteration: 0 },
        followUp: { status: 'pending', iteration: 0 },
        iterations: [{ index: 0, questions: [], isComplete: false }],
        activeIteration: 0
      }
    }));
    
    // Reset other related state
    setFollowUpQuestions(prev => {
      const updated = { ...prev };
      delete updated[category];
      return updated;
    });
    
    setSentToAnalyst(prev => ({
      ...prev,
      [category]: false
    }));
    
    // Reset category questions to original set (remove follow-up questions)
    if (category === 'Finances') {
      PEDRAM_MODE_QUESTIONS.Finances = [
        "What is the current Annual Recurring Revenue (ARR) of the company?",
        "What is the Year-over-Year (YoY) growth rate?",
        "What is the target valuation for the company?",
        "What is the current monthly cash burn rate?",
        "How much runway does the company have?",
        "What is the company's funding history?"
      ];
    } else if (category === 'Market Research') {
      PEDRAM_MODE_QUESTIONS['Market Research'] = [
        "Who are the company's key customers?",
        "What is the total addressable market (TAM) for the company's product or service, and what is the projected growth rate of this market over the next 5-10 years?",
        "What regulatory or legal factors could impact the company's operations or the market as a whole, and how is the company positioned to navigate these challenges?",
        "What are the key trends or technological advancements shaping the market, and how is the company leveraging or adapting to these trends?",
        "Who are the main competitors?"
      ];
    }
    
    // Reset analyst completion status for this category
    setAnalystCompleted(prev => ({
      ...prev,
      [category]: false
    }));
    
    // Reset associate analysis
    setAssociateAnalysis(prev => {
      const updated = { ...prev };
      delete updated[category];
      return updated;
    });
    
    // Remove answers for this category's questions
    const categoryQuestions = PEDRAM_MODE_QUESTIONS[category as keyof typeof PEDRAM_MODE_QUESTIONS] || [];
    const updatedAnswers = { ...analystQuestionAnswers };
    
    categoryQuestions.forEach(question => {
      if (updatedAnswers[question]) {
        delete updatedAnswers[question];
      }
    });
    
    setAnalystQuestionAnswers(updatedAnswers);
    
    console.log(`Reset workflow for ${category}`);
  };

  // Add workflow tracking state
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>({
    'Finances': {
      analyst: { status: 'pending', iteration: 0 },
      associate: { status: 'pending', iteration: 0 },
      followUp: { status: 'pending', iteration: 0 },
      iterations: [{ index: 0, questions: [], isComplete: false }],
      activeIteration: 0
    },
    'Market Research': {
      analyst: { status: 'pending', iteration: 0 },
      associate: { status: 'pending', iteration: 0 },
      followUp: { status: 'pending', iteration: 0 },
      iterations: [{ index: 0, questions: [], isComplete: false }],
      activeIteration: 0
    }
  });

  // Track the active workflow step for each category
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<Record<string, 'analyst' | 'associate' | 'followUp'>>({
    'Finances': 'analyst',
    'Market Research': 'analyst'
  });

  // Handle workflow step click
  const handleWorkflowStepClick = (category: string, step: 'analyst' | 'associate' | 'followUp') => {
    // Only allow clicking on steps that are not pending
    const stepStatus = workflowStatus[category][step].status;
    if (stepStatus === 'pending') return;
    
    setActiveWorkflowStep(prev => ({
      ...prev,
      [category]: step
    }));
  };

  // Add a function to remove a specific follow-up question
  const removeFollowUpQuestion = (categoryName: string, questionIndex: number) => {
    setFollowUpQuestions(prev => {
      // Get the current questions for this category
      const questions = [...(prev[categoryName] || [])];
      
      // Remove the question at the specified index
      questions.splice(questionIndex, 1);
      
      // If there are no more questions, remove the category entirely
      if (questions.length === 0) {
        const updatedFollowUpQuestions = { ...prev };
        delete updatedFollowUpQuestions[categoryName];
        return updatedFollowUpQuestions;
      }
      
      // Otherwise, update with the filtered questions
      return {
        ...prev,
        [categoryName]: questions
      };
    });
  };

  // Add new state for follow-up analysis
  const [followUpAnalysisInProgress, setFollowUpAnalysisInProgress] = useState<Record<string, boolean>>({
    'Finances': false,
    'Market Research': false
  });

  const [followUpAnalysisResults, setFollowUpAnalysisResults] = useState<Record<string, { 
    analysis: string; 
    isLoading: boolean; 
    error?: string 
  }>>({});

  // Function to analyze follow-up answers
  const analyzeFollowUpAnswers = async (category: string) => {
    try {
      // Update state to show loading
      setFollowUpAnalysisInProgress(prev => ({ ...prev, [category]: true }));
      
      setFollowUpAnalysisResults(prev => ({
        ...prev,
        [category]: {
          analysis: '',
          isLoading: true
        }
      }));
      
      // Get the follow-up questions for this category
      const followUpQuestionsForCategory = followUpQuestions[category] || [];
      
      // Prepare data object with all questions and answers
      const questionsData = {
        question: `Analyze the follow-up questions and answers for ${category}`,
        files,
        model: "default" // This will use both PDF_MODEL and EXCEL_MODEL internally
      };
      
      // Call the analyze API endpoint
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(questionsData)
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Clean the response to remove thinking sections
      const cleanedAnalysis = cleanAIResponse(result.answer);
      
      // Update state with the analysis
      setFollowUpAnalysisResults(prev => ({
        ...prev,
        [category]: {
          analysis: cleanedAnalysis,
          isLoading: false
        }
      }));
      
      // Update workflow status for follow-up analysis completed
      setWorkflowStatus(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          followUp: { 
            status: 'complete', 
            iteration: prev[category].followUp.iteration 
          }
        }
      }));
      
      // Set the followUpAnalysisInProgress to false
      setFollowUpAnalysisInProgress(prev => ({ ...prev, [category]: false }));
      
      return cleanedAnalysis;
    } catch (error) {
      console.error(`Error analyzing follow-up answers for ${category}:`, error);
      
      // Update state to show error
      setFollowUpAnalysisResults(prev => ({
        ...prev,
        [category]: {
          analysis: '',
          isLoading: false,
          error: 'Failed to analyze follow-up answers. Please try again.'
        }
      }));
      
      // Update workflow status for error
      setWorkflowStatus(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          followUp: { 
            status: 'error', 
            iteration: prev[category].followUp.iteration 
          }
        }
      }));
      
      // Set the followUpAnalysisInProgress to false
      setFollowUpAnalysisInProgress(prev => ({ ...prev, [category]: false }));
      
      return null;
    }
  };

  // Function to handle Re-Evaluate click
  const handleReEvaluate = async (category: string) => {
    try {
      // Get the follow-up questions and answers
      const followUpQuestionsForCategory = followUpQuestions[category] || [];
      
      // Get the follow-up answers
      const followUpAnswersForCategory: Record<string, any> = {};
      followUpQuestionsForCategory.forEach(question => {
        if (analystQuestionAnswers[question]) {
          followUpAnswersForCategory[question] = analystQuestionAnswers[question];
        }
      });
      
      // Get the original questions and answers
      const originalQuestions = PEDRAM_MODE_QUESTIONS[category as keyof typeof PEDRAM_MODE_QUESTIONS]
        .filter(q => !followUpQuestionsForCategory.includes(q));
      
      const originalAnswers: Record<string, any> = {};
      originalQuestions.forEach(question => {
        if (analystQuestionAnswers[question]) {
          originalAnswers[question] = analystQuestionAnswers[question];
        }
      });
      
      // Call process-follow-up API to re-evaluate with both sets of questions
      const response = await fetch('/api/process-follow-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category,
          originalQuestions,
          followUpQuestions: followUpQuestionsForCategory,
          originalAnswers,
          followUpAnswers: followUpAnswersForCategory
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Update associate analysis with the consolidated analysis
      setAssociateAnalysis(prev => ({
        ...prev,
        [category]: {
          analysis: result.analysis,
          isLoading: false
        }
      }));
      
      // Switch back to the associate view
      setActiveWorkflowStep(prev => ({
        ...prev,
        [category]: 'associate'
      }));
      
      // Auto-expand associate section
      toggleBox(`${category}-associate`);
      
      console.log(`Re-evaluated analysis for ${category} with follow-up answers`);
    } catch (error) {
      console.error(`Error re-evaluating for ${category}:`, error);
    }
  };

  // Add new state for manual answers
  const [manualAnswers, setManualAnswers] = useState<Record<string, string>>({});

  // Function to handle saving manual answers
  const handleSaveManualAnswer = (question: string, answer: string, category: string) => {
    // Update the manualAnswers state
    setManualAnswers(prev => ({
      ...prev,
      [question]: answer
    }));
    
    // Store this answer in the analystQuestionAnswers state with follow-up metadata
    setAnalystQuestionAnswers(prev => ({
      ...prev,
      [question]: {
        question,
        answer,
        isLoading: false,
        isFollowUp: true,
        iterationIndex: workflowStatus[category].activeIteration || 0
      }
    }));
    
    console.log(`Saved manual answer for question: ${question}`);
  };

  // Function to process only follow-up questions with the Analyst
  const processFollowUpWithAnalyst = async (category: string) => {
    try {
      const questions = followUpQuestions[category] || [];
      if (questions.length === 0) return;
      
      // Calculate the current iteration index
      const currentIterationIndex = workflowStatus[category].activeIteration || 0;
      
      // Mark as sent
      setSentToAnalyst(prev => ({
        ...prev,
        [category]: true
      }));
      
      // Process each follow-up question
      for (const question of questions) {
        // Skip if there's already a non-empty answer
        if (analystQuestionAnswers[question]?.answer) continue;
        
        console.log(`Processing follow-up question: ${question}`);
        
        // Update state to show loading
        setAnalystQuestionAnswers(prev => ({
          ...prev,
          [question]: {
            ...prev[question],
            isLoading: true,
            isFollowUp: true,
            iterationIndex: currentIterationIndex
          }
        }));
        
        try {
          // Prepare file contents for API
          const fileContents = files.map(file => {
            return {
              name: file.name,
              type: file.type,
              content: file.content || 'Content not available'
            };
          });
          
          // Add specific instructions to ensure we get a direct answer without thinking
          const instructions = `
You are answering a specific follow-up question in an investment analysis.
Focus ONLY on answering the question directly based on the documents.
DO NOT include your reasoning process or thinking steps.
DO NOT explain your methodology.
DO NOT include any meta-analysis about how you're approaching the question.
`;
          
          // Call the analyze API endpoint with explicit instructions
          const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              question: question,
              files: fileContents,
              instructions: instructions,
              // Send recommended file types hint to help the arbiter
              recommended: ['excel', 'pdf'] 
            })
          });
          
          console.log(`%c[Follow-Up Analysis] Processing question "${question}" using all models (PDF, Excel, and Arbiter)`, 
            'background: #e6f7ff; color: #0066cc; font-weight: bold; padding: 2px 5px; border-radius: 3px;');
          
          if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
          }
          
          const result = await response.json();
          
          // Clean the answer to remove thinking sections and keep only structured content
          const cleanAnswer = cleanAIResponse(result.answer);
          
          // Update state with the clean answer
          setAnalystQuestionAnswers(prev => ({
            ...prev,
            [question]: {
              ...prev[question],
              answer: cleanAnswer,
              isLoading: false,
              error: undefined
            }
          }));
        } catch (error) {
          console.error(`Error processing follow-up question: ${question}`, error);
          
          // Update state with the error
          setAnalystQuestionAnswers(prev => ({
            ...prev,
            [question]: {
              ...prev[question],
              isLoading: false,
              error: `Failed to process question: ${error}`
            }
          }));
        }
      }
      
      // Mark the category as complete
      setAnalystCompleted(prev => ({
        ...prev,
        [category]: true
      }));
      
      // Check if all follow-up questions have been answered
      const allAnswered = questions.every(q => analystQuestionAnswers[q]?.answer);
      
      if (allAnswered) {
        // Update workflow status
        setWorkflowStatus(prev => ({
          ...prev,
          [category]: {
            ...prev[category],
            analyst: { 
              status: 'complete', 
              iteration: currentIterationIndex 
            },
            followUp: { 
              status: 'complete', 
              iteration: prev[category].followUp.iteration 
            }
          }
        }));
      }
      
      console.log(`Completed processing follow-up questions for ${category}`);
    } catch (error) {
      console.error(`Error in processFollowUpWithAnalyst for ${category}:`, error);
    }
  };

  // Return statement at the end of the component
  return (
    <div className="max-w-5xl mx-auto pb-12">
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
            
            {/* Pedram Mode Toggle */}
            <PedramModeToggle pedramMode={pedramMode} setPedramMode={handleSetPedramMode} />
            
            {/* Benchmark Toggle */}
            <BenchmarkToggle 
              benchmarkEnabled={benchmarkEnabled} 
              setBenchmarkEnabled={handleSetBenchmarkEnabled}
              onOpenBenchmarkSelector={handleOpenBenchmarkSelector}
              selectedCompanyName={getSelectedBenchmarkName()}
            />
            
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
          {!pedramMode && (
            <button 
              onClick={() => setIsTemplateModalOpen(true)}
              className="flex items-center gap-2 bg-[#F15A29] text-white px-4 py-2 rounded-lg hover:bg-[#D94315]"
            >
              <PlusCircle size={18} />
              <span>{selectedQuestionIds.length === 0 ? 'Select Questions' : 'Add or Remove Questions'}</span>
            </button>
          )}
          
          {pedramMode && (
            <button 
              onClick={resetPedramMode}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              <RefreshCw size={18} />
              <span>Reset Analysis</span>
            </button>
          )}
          
          {selectedQuestionIds.length > 0 && !pedramMode && (
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
        
        {loading > 0 && !pedramMode && (
          <div className="flex items-center gap-2 text-blue-600 mb-4 mt-4">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-1"></div>
            <span>Analyzing {loading} question{loading > 1 ? 's' : ''}...</span>
          </div>
        )}
        
        {error && !pedramMode && (
          <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-4 mt-4">
            {error}
          </div>
        )}
      </div>

      {pedramMode ? (
        <div>
          {/* Top-level question for Pedram Mode with Ask Pedram button */}
          <div className="mb-8 p-5 bg-purple-50 border-2 border-purple-200 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <h2 className="text-xl font-semibold text-purple-800">Should this company go to the next stage?</h2>
                {modelInfo.pedram.id.includes(":thinking") && (
                  <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                    Thinking Model
                  </span>
                )}
              </div>
              
              <div className="flex items-center">
                {/* Add View Prompt button for Pedram */}
                {pedramDecision.decision && !pedramDecision.isLoading && (
                  <button
                    onClick={() => showPrompt(getPedramPrompt(), "Pedram's Decision Prompt")}
                    className="flex items-center px-3 py-2 bg-gray-200 text-gray-700 border border-gray-300 rounded-md text-sm font-medium mr-3 hover:bg-gray-300 transition-colors"
                  >
                    <Eye size={16} className="mr-1" />
                    <span>View Prompt</span>
                  </button>
                )}
                
                <button
                  onClick={processPedramDecision}
                  disabled={!canAskPedram()}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    !canAskPedram()
                      ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                      : pedramDecision.isLoading
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {pedramDecision.isLoading 
                    ? (
                      <span className="flex items-center">
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                        Analyzing...
                      </span>
                    ) 
                    : pedramDecision.decision 
                      ? 'Refresh Decision' 
                      : 'Ask Partner'}
                </button>
              </div>
            </div>
            
            {/* Descriptive text about the function */}
            {!pedramDecision.isLoading && !pedramDecision.decision && !pedramDecision.error && (
              <p className="mt-2 text-sm text-purple-600">
                The Partner will review the financial and market analyses to determine if this investment opportunity should proceed to the next stage.
              </p>
            )}
            
            {/* Pedram's Decision Display */}
            {pedramDecision.isLoading ? (
              <div className="flex flex-col items-center space-y-4 mt-6 p-6 bg-white rounded-lg border border-purple-200">
                <div className="animate-spin h-8 w-8 border-3 border-purple-600 border-t-transparent rounded-full"></div>
                <p className="text-purple-600 font-medium">Partner is making the final investment decision...</p>
                {modelInfo.pedram.id.includes(":thinking") && (
                  <p className="text-sm text-purple-500 italic">Using the thinking model to provide a detailed investment analysis</p>
                )}
              </div>
            ) : pedramDecision.error ? (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                <p className="font-medium">Error:</p>
                <p>{pedramDecision.error}</p>
              </div>
            ) : pedramDecision.decision ? (
              <div className="mt-4 bg-white rounded-lg border border-purple-200 overflow-hidden shadow-md">
                <div className="prose prose-sm max-w-none p-6">
                  {renderPedramDecision(pedramDecision.decision)}
                </div>
                
                {/* Add BenchmarkComparisonRenderer */}
                <BenchmarkComparisonRenderer content={pedramDecision.decision} />
              </div>
            ) : null}
          </div>
          
          {/* Render custom boxes for Pedram Mode */}
          {categories.map(category => renderPedramModeBox(category))}
        </div>
      ) : selectedQuestionIds.length === 0 ? (
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

      {/* Question Selection Modal - Only open if not in Pedram Mode */}
      {!pedramMode && (
        <QuestionSelectionModal
          isOpen={isSelectionModalOpen}
          onClose={() => setIsSelectionModalOpen(false)}
          onSubmit={handleQuestionSelection}
          initialSelections={selectedQuestionIds}
          customQuestions={customQuestions}
          onCustomQuestionAdd={handleCustomQuestionAdd}
        />
      )}

      {/* Template Selection Modal - Only open if not in Pedram Mode */}
      {!pedramMode && (
        <TemplateSelectionModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          onSelectTemplate={handleTemplateSelection}
          onSelectCustom={handleCustomSelection}
        />
      )}

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

      {/* Benchmark Selection Modal */}
      <BenchmarkSelectionModal
        isOpen={isBenchmarkModalOpen}
        onClose={() => setIsBenchmarkModalOpen(false)}
        onSelect={handleSelectBenchmark}
        companies={BENCHMARK_COMPANIES}
        selectedCompanyId={selectedBenchmarkId}
      />

      {/* Add the Prompt Modal */}
      <PromptModal
        isOpen={promptModalOpen}
        onClose={() => setPromptModalOpen(false)}
        title={promptModalTitle}
        prompt={currentPrompt}
      />
    </div>
  );
};

export default InvestmentMemoMain; 