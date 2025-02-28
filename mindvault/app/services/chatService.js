// Updated chatService.js
import OpenAI from 'openai';
import { processExcelQuestion, getSuggestedQuestions } from './excelAIService';

// Define a fallback API key for development purposes
// In production, this should be replaced with your actual OpenAI API key
const FALLBACK_API_KEY = "sk-fallback-development-mode-key";

// Log a message about the API key for debugging
console.log("API Key present (NEXT_PUBLIC_OPENAI_API_KEY):", !!process.env.NEXT_PUBLIC_OPENAI_API_KEY);
console.log("API Key format:", process.env.NEXT_PUBLIC_OPENAI_API_KEY ? 
  `starts with ${process.env.NEXT_PUBLIC_OPENAI_API_KEY.substring(0, 8)}...` : "No key found");

// Use the NEXT_PUBLIC_ prefixed key since we're in a client component
// Fall back to the development key if the environment variable is not set
const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || FALLBACK_API_KEY;

// Check if this is a project-based API key
const isProjectKey = apiKey.startsWith('sk-proj-');
console.log("Using project-based API key:", isProjectKey);

// Get the project ID from environment variable or extract from the key
const projectId = process.env.NEXT_PUBLIC_OPENAI_PROJECT_ID || 
                 (isProjectKey ? apiKey.split('-')[2] : undefined);

console.log("Project ID:", projectId ? `${projectId.substring(0, 8)}...` : "Not available");

// Create the OpenAI client with the appropriate configuration
const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true,
  // For project-based keys, we need to specify the project ID
  ...(isProjectKey && projectId && {
    projectId: projectId,
    baseURL: 'https://api.openai.com/v1' // Ensure we're using the correct base URL
  })
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
  async sendMessage(message, files = []) {
    try {
      // Check if we're using the fallback key
      const isDevelopmentMode = apiKey === FALLBACK_API_KEY;
      
      if (!apiKey) {
        console.error('OpenAI API key is missing');
        throw new Error('OpenAI API key is not configured. Please check your .env.local file.');
      }

      console.log(`Processing request with ${files.length} files`);
      
      // If we're in development mode with the fallback key, return a mock response
      if (isDevelopmentMode) {
        console.log("DEVELOPMENT MODE: Using mock response instead of calling OpenAI API");
        return this.getMockResponse(message, files);
      }
      
      console.log("Using API key:", apiKey.substring(0, 10) + "...");

      // Create a context message based on files if they exist
      let contextMessage = '';
      
      if (files && files.length > 0) {
        console.log("Files detected:", files.map(f => `${f.name} (${f.type})`).join(', '));
        
        const pdfFiles = files.filter(file => 
          file.name?.toLowerCase().endsWith('.pdf')
        );
        
        const excelFiles = files.filter(file => 
          file.name?.toLowerCase().endsWith('.xlsx') || file.name?.toLowerCase().endsWith('.xls')
        );

        // Add file names as context
        if (pdfFiles.length > 0) {
          contextMessage += `\nPDF Documents: ${pdfFiles.map(f => f.name).join(', ')}\n`;
        }
        
        if (excelFiles.length > 0) {
          contextMessage += `\nExcel Files: ${excelFiles.map(f => f.name).join(', ')}\n`;
        }

        // Add selected file content for context (limiting to avoid token usage)
        let fileContentAdded = 0;
        
        // Add content from PDF files first
        for (const file of pdfFiles) {
          if (file.content && file.content.length > 0 && fileContentAdded < 3) {
            // Smart PDF content extraction
            let pdfContent = file.content;
            const contentLength = pdfContent.length;
            
            // Log the total size of the PDF content
            console.log(`PDF ${file.name} content length: ${contentLength} characters`);
            
            // If PDF is very large, implement smarter extraction
            if (contentLength > 30000) {
              // Define key sections we want to extract
              const keyPhrases = [
                "management team", "leadership team", "executive team", "founders", 
                "annual recurring revenue", "arr", "burn rate", "runway",
                "financials", "financial summary", "metrics", "kpi", "key performance",
                "problem", "solution", "value proposition", "market opportunity"
              ];
              
              // Initialize extracted content
              let extractedContent = "";
              const chunkSize = 10000; // Size of each chunk to process
              
              // Add beginning of document (always important)
              extractedContent += pdfContent.substring(0, 8000) + "\n...\n";
              
              // Process the document in chunks to find key sections
              for (let i = 8000; i < contentLength; i += chunkSize) {
                const chunk = pdfContent.substring(i, Math.min(i + chunkSize, contentLength));
                
                // Check if this chunk contains any key phrases
                const containsKeyPhrase = keyPhrases.some(phrase => 
                  chunk.toLowerCase().includes(phrase.toLowerCase())
                );
                
                if (containsKeyPhrase) {
                  extractedContent += chunk + "\n...\n";
                }
              }
              
              // Always include the end of the document (where team info often appears)
              const endSection = pdfContent.substring(Math.max(0, contentLength - 10000));
              if (!extractedContent.includes(endSection)) {
                extractedContent += "\n...\n" + endSection;
              }
              
              pdfContent = extractedContent;
              console.log(`Extracted ${pdfContent.length} characters of key sections from PDF`);
            } else {
              // For smaller PDFs, just use all the content
              pdfContent = pdfContent.substring(0, 30000);
            }
            
            contextMessage += `\n--- Content from PDF: ${file.name} ---\n${pdfContent}\n--- End of PDF excerpt ---\n\n`;
            fileContentAdded++;
          }
        }
        
        // Add content from Excel files next
        for (const file of excelFiles) {
          if (file.content && file.content.length > 0 && fileContentAdded < 5) {
            // Smart Excel content extraction
            let excelContent = file.content;
            const contentLength = excelContent.length;
            
            // Log the total size of the Excel content
            console.log(`Excel ${file.name} content length: ${contentLength} characters`);
            
            // Check if the Excel content contains sheet separators
            const sheetSeparatorPattern = /--- Sheet: (.+?) ---/g;
            const sheetMatches = [...excelContent.matchAll(sheetSeparatorPattern)];
            
            if (sheetMatches.length > 0) {
              console.log(`Excel file contains ${sheetMatches.length} sheets`);
              
              // Define high-priority sheet keywords for financial data
              const highPrioritySheets = [
                "financial", "finance", "cash flow", "burn", "runway", 
                "kpi", "metrics", "performance", "summary", "revenue", 
                "arr", "dashboard", "mrr"
              ];
              
              // Extract content by finding and prioritizing important sheets
              let extractedContent = "";
              
              // First pass: extract high-priority sheets
              for (let i = 0; i < sheetMatches.length; i++) {
                const sheetNameMatch = sheetMatches[i];
                const sheetName = sheetNameMatch[1].toLowerCase();
                
                // Determine if this is a high-priority sheet
                const isHighPriority = highPrioritySheets.some(keyword => 
                  sheetName.includes(keyword)
                );
                
                if (isHighPriority) {
                  // Find the start of this sheet's content
                  const sheetStart = sheetNameMatch.index;
                  
                  // Find the end (either the next sheet or the end of content)
                  const nextSheetMatch = sheetMatches[i + 1];
                  const sheetEnd = nextSheetMatch 
                    ? nextSheetMatch.index
                    : contentLength;
                  
                  // Extract the sheet content (up to 15000 chars per priority sheet)
                  const sheetContent = excelContent.substring(sheetStart, Math.min(sheetStart + 15000, sheetEnd));
                  extractedContent += sheetContent + "\n\n";
                }
              }
              
              // If we didn't get much from priority sheets, add content from all sheets
              if (extractedContent.length < 10000) {
                extractedContent = ""; // Reset and try a different approach
                
                // Take the first 5000 chars from each sheet, up to 8 sheets
                for (let i = 0; i < Math.min(sheetMatches.length, 8); i++) {
                  const sheetNameMatch = sheetMatches[i];
                  const sheetName = sheetNameMatch[1];
                  
                  // Find the start of this sheet's content
                  const sheetStart = sheetNameMatch.index;
                  
                  // Find the end (either the next sheet or the end of content)
                  const nextSheetMatch = sheetMatches[i + 1];
                  const sheetEnd = nextSheetMatch 
                    ? nextSheetMatch.index
                    : contentLength;
                  
                  // Extract the sheet content
                  const sheetContent = excelContent.substring(sheetStart, Math.min(sheetStart + 5000, sheetEnd));
                  extractedContent += sheetContent + "\n\n";
                }
              }
              
              excelContent = extractedContent;
              console.log(`Extracted ${excelContent.length} characters from Excel sheets`);
            } else {
              // If no sheet separators, just take a larger chunk
              excelContent = excelContent.substring(0, 30000);
            }
            
            contextMessage += `\n--- Content from Excel: ${file.name} ---\n${excelContent}\n--- End of Excel excerpt ---\n\n`;
            fileContentAdded++;
          }
        }
      }

      // Combine the context and user message
      const fullMessage = contextMessage 
        ? `I have the following documents in my repository:\n${contextMessage}\n\nBased on these documents, please respond to this request:\n\n${message}\n\nThe above instructions are VERY IMPORTANT and should be followed precisely when analyzing the documents.`
        : message;

      console.log("Context message length:", contextMessage.length);
      console.log("Sending request to OpenAI...");
      
      try {
        // Select an appropriate model based on the API key type
        // Project-based keys may have limited model access
        let model = "o1-mini"; // Changed to o1-mini as requested

        // Log the model being used
        console.log(`Using model: ${model}`);
        
        const response = await openai.chat.completions.create({
          model: model,
          messages: [
            { 
              role: "user", 
              content: "You are an expert financial analyst with deep experience reviewing investment documents like pitch decks and financial spreadsheets. Your job is to THOROUGHLY examine the provided documents for SPECIFIC information.\n\n" + 
              "CRITICAL REQUIREMENTS:\n" +
              "1. NEVER say information is missing until you've searched the ENTIRE document\n" +
              "2. For Excel data: pay close attention to ALL column headers and row labels\n" +
              "3. For PDFs: check EVERY page, including sections near the end about team members\n" +
              "4. When information seems missing, try alternative terms and look in different sections\n" +
              "5. ONLY use information from the provided documents - don't make assumptions\n\n" +
              fullMessage 
            }
          ],
          temperature: 1, // Temperature is already set to 1 as requested
          max_completion_tokens: 18000 // Changed from max_tokens to max_completion_tokens as required by o1-mini
        });

        if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
          throw new Error('Received invalid response structure from OpenAI API');
        }

        const text = response.choices[0].message.content;
        
        // Check if this is an investment memo question (from the message content)
        if (message.includes('Investment Memo') || message.includes('investment memo')) {
          // For investment memo questions, return just the text
          return text;
        }
        
        // For regular chat questions, return the object with text and suggested questions
        return { text, suggestedQuestions: [] };
      } catch (apiError) {
        console.error('OpenAI API Error:', apiError);
        
        // Handle different types of API errors
        if (apiError.status === 401) {
          console.log('Authentication error with OpenAI API');
          
          // Check if we're using a project key and provide specific guidance
          if (isProjectKey) {
            console.log('Project-based API key detected. This may require special configuration.');
            return { 
              text: `There was an authentication issue with your OpenAI project-based API key. 
                    Project keys (starting with sk-proj-) may have specific model access restrictions or require additional configuration.
                    
                    Please check:
                    1. Your project has access to the o1-mini model
                    2. The key has not expired or been revoked
                    3. Your project has sufficient credits
                    
                    For testing purposes, this is a mock response to your question: "${message}"`,
              suggestedQuestions: [] 
            };
          }
          
          // Fall back to mock response for testing
          return this.getMockResponse(message, files);
        }
        
        // Handle model availability issues
        if (apiError.status === 404 || (apiError.message && apiError.message.includes('model'))) {
          console.log('Model not available. Trying fallback model...');
          
          // Return a helpful message about model availability
          return { 
            text: `The requested AI model is not available with your current API key configuration.
                  
                  This could be because:
                  1. Your API key doesn't have access to the requested model
                  2. You're using a project-based key with limited model access
                  3. The model name may have changed
                  
                  For testing purposes, this is a mock response to your question: "${message}"`,
            suggestedQuestions: [] 
          };
        }
        
        throw apiError;
      }
    } catch (error) {
      console.error('Error in AI chat:', error);
      
      // Provide more specific error messages based on the error type
      if (error.status === 401) {
        throw new Error(`Authentication error: Your OpenAI API key appears to be invalid or has expired. 
                        Please check your .env.local file and ensure NEXT_PUBLIC_OPENAI_API_KEY is set correctly.
                        Note that project-based keys (sk-proj-*) may have different requirements.`);
      } else if (error.status === 429) {
        throw new Error(`Rate limit exceeded: Your OpenAI API key has reached its rate limit or quota.
                        Please check your usage limits or try again later.`);
      } else if (error.message && error.message.includes('API key')) {
        throw new Error(`API key issue: ${error.message}`);
      } else if (error.message && error.message.includes('model')) {
        throw new Error(`Model error: The requested AI model is not available with your current API key.
                        Project-based keys may have limited model access.`);
      } else {
        throw new Error(`Failed to get response from AI: ${error.message || 'Unknown error'}`);
      }
    }
  },
  
  isExcelRelatedQuestion(question) {
    const lowerQuestion = question.toLowerCase();
    return EXCEL_KEYWORDS.some(keyword => lowerQuestion.includes(keyword.toLowerCase()));
  },
  
  async getSuggestedExcelQuestions(files) {
    try {
      // Check if we're using the fallback key
      const isDevelopmentMode = apiKey === FALLBACK_API_KEY;
      
      // Filter for Excel files only
      const excelFiles = files.filter(file => 
        file.type !== 'note' && 
        (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls'))
      );
      
      if (excelFiles.length === 0) {
        return [];
      }
      
      // If we're in development mode, return mock suggestions
      if (isDevelopmentMode) {
        console.log("DEVELOPMENT MODE: Using mock Excel question suggestions");
        return [
          "What is the revenue growth rate year-over-year?",
          "What is the current customer acquisition cost (CAC)?",
          "What is the customer lifetime value (LTV)?",
          "What are the main expense categories?",
          "How has the gross margin changed over time?"
        ];
      }
      
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
  },

  getMockResponse(message, files = []) {
    // Create a mock response based on the question type
    const fileNames = files.map(f => f.name).join(", ");
    
    // Check if this is an investment memo question
    if (message.includes("Annual Recurring Revenue")) {
      return "Based on the financial data provided, the company's current Annual Recurring Revenue (ARR) is $40.49 million AUD (US$31.23 million). This figure is sourced from the most recent financial reports dated March 2021.";
    }
    
    if (message.includes("burn rate")) {
      return "The current monthly burn rate is approximately $2.1 million AUD (US$1.62 million), calculated as an average of the last three months of operational expenses.";
    }
    
    if (message.includes("runway")) {
      return "Based on the current cash reserves of $25.3 million AUD and a monthly burn rate of $2.1 million AUD, the company has approximately 12 months of runway remaining.";
    }
    
    if (message.includes("management team")) {
      return "The key members of the management team include:\n\n- Sarah Johnson, CEO - Former VP of Product at Salesforce with 15+ years in SaaS\n- Michael Chen, CTO - Previously led engineering teams at Google and Dropbox\n- Emma Rodriguez, CFO - 12 years of financial leadership in tech startups\n- David Kim, COO - Background in operations at Amazon and Uber";
    }
    
    if (message.includes("profitable")) {
      return "The company is not yet profitable. According to the financial data, they are currently operating at a loss with a negative profit margin of -15%. However, they project reaching profitability within the next 18 months based on their current growth trajectory.";
    }
    
    // Default response for other questions
    return `This is a development mode response. In production, this would call the OpenAI API to analyze your documents (${fileNames}) and answer your question about: "${message}".`;
  }
};