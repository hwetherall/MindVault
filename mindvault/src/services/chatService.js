// Updated chatService.js
import OpenAI from 'openai';
import { processExcelQuestion, getSuggestedQuestions } from './excelAIService';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Keywords that might indicate an Excel-related question
const EXCEL_KEYWORDS = [
  'excel', 'spreadsheet', 'financial', 'financials', 'finance',
  'revenue', 'profit', 'margin', 'budget', 'forecast',
  'sales', 'growth', 'expense', 'cash', 'flow', 'balance',
  'sheet', 'income', 'statement', 'ratio', 'metric',
  'trend', 'projection', 'quarterly', 'annual'
];

// Function to prepare Excel content for better AI understanding
const prepareExcelContextForAI = (content) => {
  // Format the Excel content for better AI understanding
  if (!content) return '';
  
  // Add a prefix to help the AI understand this is spreadsheet data
  return `[Excel Spreadsheet Data]:\n${content}`;
};

export const chatService = {
  async sendMessage(message, files, loadingCallback = null) {
    try {
      // Start loading state
      if (loadingCallback) loadingCallback(true);
      
      // Validation
      if (!message) {
        throw new Error('Message is required');
      }
      
      // Check if this is an Excel-related question
      const isExcelQuestion = this.isExcelRelatedQuestion(message);
      const excelFiles = files.filter(file => 
        file.excelData && file.excelData.cacheKey && 
        (file.type.includes('excel') || 
         file.name.toLowerCase().endsWith('.xlsx') || 
         file.name.toLowerCase().endsWith('.xls'))
      );
      
      // If it's an Excel question and we have Excel files, use the specialized Excel service
      if (isExcelQuestion && excelFiles.length > 0) {
        console.log('Processing as Excel question:', message);
        console.log('Excel files:', excelFiles);
        
        try {
          // Get the most recently uploaded Excel file
          const latestExcelFile = excelFiles[0];
          const response = await processExcelQuestion(latestExcelFile.excelData.cacheKey, message);
          
          // Format the answer
          let formattedAnswer = '';
          
          if (response.insights && response.insights.length > 0) {
            formattedAnswer += "## Insights\n";
            response.insights.forEach(insight => {
              formattedAnswer += `- ${insight}\n`;
            });
            formattedAnswer += "\n";
          }
          
          // Add answer from AI or placeholder
          if (response.answer) {
            formattedAnswer += response.answer;
          } else {
            formattedAnswer += "Based on the Excel file analysis, here's what I found:\n\n";
            
            // Add trend information if available
            if (response.supportingData.trends && response.supportingData.trends.length > 0) {
              formattedAnswer += "## Key Trends\n";
              response.supportingData.trends.slice(0, 5).forEach(trend => {
                if (trend.type === 'long-term') {
                  formattedAnswer += `- ${trend.metric} shows a ${trend.trend} trend averaging ${trend.avgGrowthRate.toFixed(1)}% over time\n`;
                } else {
                  formattedAnswer += `- ${trend.metric} is ${trend.trend} by ${Math.abs(trend.growthRate).toFixed(1)}%\n`;
                }
              });
              formattedAnswer += "\n";
            }
          }
          
          // End loading state
          if (loadingCallback) loadingCallback(false);
          
          return formattedAnswer;
        } catch (error) {
          console.error('Error processing Excel question:', error);
          // Fall back to general AI if Excel processing fails
        }
      }
      
      // Create context from files with content for general questions
      const context = files
        .filter(file => file.content)
        .map(file => {
          if (file.type.includes('excel') || file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
            return `Document: ${file.name}\n${prepareExcelContextForAI(file.content)}\n---\n`;
          }
          return `Document: ${file.name}\n${file.content}\n---\n`;
        })
        .join('\n');

      // For o1-mini, we need to combine system instructions with user message
      // since it doesn't support the 'system' role
      const systemInstructions = `You are an AI assistant analyzing these documents:\n\n${context}\n\nProvide answers based on the document content. If the information isn't in the documents, say so.`;
      
      const userMessage = `${systemInstructions}\n\nQuestion: ${message}`;

      const completion = await openai.chat.completions.create({
        model: "o1-mini",
        messages: [
          {
            role: "user",
            content: userMessage
          }
        ],
        temperature: 1,
        max_completion_tokens: 8000
      });

      // End loading state
      if (loadingCallback) loadingCallback(false);
      
      return completion.choices[0].message.content;
    } catch (error) {
      // End loading state on error
      if (loadingCallback) loadingCallback(false);
      
      console.error('Chat error:', error);
      
      // Categorize and handle different error types
      if (error.name === 'APIError') {
        throw new Error(`AI service error: ${error.message}`);
      } else if (error.name === 'AuthenticationError') {
        throw new Error('Authentication error with AI service');
      } else if (error.name === 'RateLimitError') {
        throw new Error('Rate limit exceeded with AI service');
      } else if (error.name === 'TimeoutError' || error.code === 'ETIMEDOUT') {
        throw new Error('Request to AI service timed out');
      }
      
      throw new Error(`Failed to get AI response: ${error.message || 'Unknown error'}`);
    }
  },
  
  isExcelRelatedQuestion(question) {
    const lowerQuestion = question.toLowerCase();
    return EXCEL_KEYWORDS.some(keyword => lowerQuestion.includes(keyword.toLowerCase()));
  },
  
  async getSuggestedExcelQuestions(files) {
    try {
      const excelFiles = files.filter(file => 
        file.excelData && file.excelData.cacheKey && 
        (file.type.includes('excel') || 
         file.name.toLowerCase().endsWith('.xlsx') || 
         file.name.toLowerCase().endsWith('.xls'))
      );
      
      if (excelFiles.length === 0) return [];
      
      // Get the most recently uploaded Excel file
      const latestExcelFile = excelFiles[0];
      
      // Get the context for this file
      const contextData = { 
        sheets: latestExcelFile.excelData.metadata?.sheets || [],
        metadata: latestExcelFile.excelData.metadata
      };
      
      return getSuggestedQuestions(contextData);
    } catch (error) {
      console.error('Error generating Excel questions:', error);
      return [];
    }
  }
};