/* eslint-disable no-undef */
// Updated chatService.js
import { OpenAI } from 'openai';
import { getSuggestedQuestions } from './excelAIService';

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const OPENAI_PROJECT_ID = process.env.NEXT_PUBLIC_OPENAI_PROJECT_ID;

if (!OPENAI_API_KEY) {
  throw new Error('OpenAI API key is required');
}

if (!OPENAI_PROJECT_ID) {
  throw new Error('OpenAI Project ID is required');
}

// Create the OpenAI client with the appropriate configuration
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  projectId: OPENAI_PROJECT_ID,
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

export const chatService = {
  async sendMessage(message, files = []) {
    try {
      console.log(`Processing request with ${files.length} files`);
      
      // Check if any files are available
      if (!files || files.length === 0) {
        console.warn('No files available for analysis');
        return {
          text: "I don't see any uploaded documents to analyze. Please upload a pitch deck (PDF) and financial document (Excel) first."
        };
      }

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
                  
                  // Extract the sheet content and include sheet name in the output
                  const sheetContent = `Sheet ${sheetName}:\n${excelContent.substring(sheetStart, Math.min(sheetStart + 5000, sheetEnd))}`;
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
        const model = "o1-mini";
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
          temperature: 1,
          max_completion_tokens: 40000
        });

        if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
          throw new Error('Received invalid response structure from OpenAI API');
        }

        const text = response.choices[0].message.content;
        
        // Check if this is an investment memo question
        if (message.includes('Investment Memo') || message.includes('investment memo')) {
          return text;
        }
        
        return { text, suggestedQuestions: [] };
      } catch (apiError) {
        console.error('OpenAI API Error:', apiError);
        throw apiError;
      }
    } catch (error) {
      console.error('Error in AI chat:', error);
      throw error;
    }
  },
  
  isExcelRelatedQuestion(question) {
    const lowerQuestion = question.toLowerCase();
    return EXCEL_KEYWORDS.some(keyword => lowerQuestion.includes(keyword.toLowerCase()));
  },
  
  async getSuggestedExcelQuestions(files) {
    try {
      // Filter for Excel files only
      const excelFiles = files.filter(file => 
        file.type !== 'note' && 
        (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls'))
      );
      
      if (excelFiles.length === 0) {
        return [];
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
    // Check if any files are available
    if (!files || files.length === 0) {
      return {
        text: "I don't see any uploaded documents to analyze. Please upload a pitch deck (PDF) and financial document (Excel) first."
      };
    }
    
    // Create a mock response based on the question type
    const fileNames = files.map(f => f.name).join(", ");
    
    // Check if this is an investment memo question
    if (message.includes("Annual Recurring Revenue")) {
      return {
        text: "Based on the financial data provided, the company's current Annual Recurring Revenue (ARR) is $40.49 million AUD (US$31.23 million). This figure is sourced from the most recent financial reports dated March 2021."
      };
    }
    
    if (message.includes("burn rate")) {
      return {
        text: "The current monthly burn rate is approximately $2.1 million AUD (US$1.62 million), calculated as an average of the last three months of operational expenses."
      };
    }
    
    if (message.includes("runway")) {
      return {
        text: "Based on the current cash reserves of $25.3 million AUD and a monthly burn rate of $2.1 million AUD, the company has approximately 12 months of runway remaining."
      };
    }
    
    if (message.includes("management team")) {
      return {
        text: "The key members of the management team include:\n\n- Sarah Johnson, CEO - Former VP of Product at Salesforce with 15+ years in SaaS\n- Michael Chen, CTO - Previously led engineering teams at Google and Dropbox\n- Emma Rodriguez, CFO - 12 years of financial leadership in tech startups\n- David Kim, COO - Background in operations at Amazon and Uber"
      };
    }
    
    if (message.includes("profitable")) {
      return {
        text: "The company is not yet profitable. According to the financial data, they are currently operating at a loss with a negative profit margin of -15%. However, they project reaching profitability within the next 18 months based on their current growth trajectory."
      };
    }
    
    // Default response for other questions
    return {
      text: `This is a development mode response. In production, this would call the OpenAI API to analyze your documents (${fileNames}) and answer your question about: "${message}".`
    };
  }
};