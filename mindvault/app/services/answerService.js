/* eslint-disable no-undef */
// Remove direct OpenAI import as we'll use our API endpoint
// import { OpenAI } from 'openai';
import { getSuggestedQuestions } from './excelAIService';

// Keywords that might indicate an Excel-related question
const EXCEL_KEYWORDS = [
  'excel', 'spreadsheet', 'financial', 'financials', 'finance',
  'revenue', 'profit', 'margin', 'budget', 'forecast',
  'sales', 'growth', 'expense', 'cash', 'flow', 'balance',
  'sheet', 'income', 'statement', 'ratio', 'metric',
  'trend', 'projection', 'quarterly', 'annual'
];

// Helper function to clean thinking tags from responses
function removeThinkingContent(text) {
  // Remove <think>...</think> blocks completely
  let cleanedText = text.replace(/<think>[\s\S]*?<\/think>/g, '');
  
  // Remove just <think> tags if they don't have a closing tag
  cleanedText = cleanedText.replace(/<think>/g, '');
  
  // Remove lookahead/thinking phrases
  const thinkingPhrases = [
    'I need to analyze', 'let me check', 'let me examine', 'I should look for',
    'First, I\'ll', 'Now I need to', 'I\'ll search for', 'I need to figure out',
    'Let\'s start by', 'I\'ll begin by', 'Let me start by', 'I should analyze',
    'Alright, I need to', 'Looking at the documents', 'I need to search for'
  ];
  
  // Remove paragraphs that start with thinking phrases
  for (const phrase of thinkingPhrases) {
    const regex = new RegExp(`(^|\\n)${phrase}[^\\n]*\\n`, 'gi');
    cleanedText = cleanedText.replace(regex, '\n');
  }
  
  // Clean up any excessive newlines
  cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n');
  
  return cleanedText.trim();
}

// Helper function to call our secure API endpoint
async function callOpenAI(messages, model = "deepseek-r1-distill-llama-70b", temperature = 1, max_completion_tokens = 100000) {
  try {
    // Ensure we don't exceed model's max token limit
    const safe_max_tokens = Math.min(max_completion_tokens, 120000);
    
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model,
        temperature,
        max_completion_tokens: safe_max_tokens
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling AI API:', error);
    throw error;
  }
}

export const answerService = {
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

        // Add selected file content for context (with expanded limits for DeepSeek model)
        let fileContentAdded = 0;
        
        // Add content from PDF files first - increased to process up to 5 files
        for (const file of pdfFiles) {
          if (file.content && file.content.length > 0 && fileContentAdded < 5) {
            // Smart PDF content extraction with increased chunk sizes
            let pdfContent = file.content;
            const contentLength = pdfContent.length;
            
            // Log the total size of the PDF content
            console.log(`PDF ${file.name} content length: ${contentLength} characters`);
            
            // Define key sections we want to extract
            const keyPhrases = [
              "management team", "leadership team", "executive team", "founders", 
              "annual recurring revenue", "arr", "burn rate", "runway",
              "financials", "financial summary", "metrics", "kpi", "key performance",
              "problem", "solution", "value proposition", "market opportunity"
            ];
            
            // Initialize extracted content
            let extractedContent = "";
            const chunkSize = 15000; // Increased chunk size for DeepSeek model
            
            // Add beginning of document (increased to capture more content)
            extractedContent += pdfContent.substring(0, 15000) + "\n...\n";
            
            // Process the document in chunks to find key sections
            for (let i = 15000; i < contentLength; i += chunkSize) {
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
            // Increased size to capture more content
            const endSection = pdfContent.substring(Math.max(0, contentLength - 15000));
            if (!extractedContent.includes(endSection)) {
              extractedContent += "\n...\n" + endSection;
            }
            
            pdfContent = extractedContent;
            console.log(`Extracted ${pdfContent.length} characters of key sections from PDF`);
            
            contextMessage += `\n--- Content from PDF: ${file.name} ---\n${pdfContent}\n--- End of PDF excerpt ---\n\n`;
            fileContentAdded++;
          }
        }
        
        // Add content from Excel files next - keeping at 5 files
        for (const file of excelFiles) {
          if (file.content && file.content.length > 0 && fileContentAdded < 6) {
            // Smart Excel content extraction with larger extraction sizes
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
              
              // First pass: extract high-priority sheets with increased character limits
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
                  
                  // Extract the sheet content with increased character limit
                  const sheetContent = excelContent.substring(sheetStart, Math.min(sheetStart + 20000, sheetEnd));
                  extractedContent += sheetContent + "\n\n";
                }
              }
              
              // If we didn't get much from priority sheets, add content from all sheets
              if (extractedContent.length < 30000) { // Increased threshold
                extractedContent = ""; // Reset and try a different approach
                
                // Take more content from each sheet, and include more sheets
                for (let i = 0; i < Math.min(sheetMatches.length, 8); i++) { // Increased to 8 sheets
                  const sheetNameMatch = sheetMatches[i];
                  const sheetName = sheetNameMatch[1];
                  
                  // Find the start of this sheet's content
                  const sheetStart = sheetNameMatch.index;
                  
                  // Find the end (either the next sheet or the end of content)
                  const nextSheetMatch = sheetMatches[i + 1];
                  const sheetEnd = nextSheetMatch 
                    ? nextSheetMatch.index
                    : contentLength;
                  
                  // Extract the sheet content with increased size
                  const sheetContent = `Sheet ${sheetName}:\n${excelContent.substring(sheetStart, Math.min(sheetStart + 10000, sheetEnd))}`;
                  extractedContent += sheetContent + "\n\n";
                }
              }
              
              excelContent = extractedContent;
              console.log(`Extracted ${excelContent.length} characters from Excel sheets`);
            } else {
              // If no sheet separators, take a larger chunk
              excelContent = excelContent.substring(0, 50000); // Increased to 50k characters
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
      console.log("Sending request to DeepSeek API...");
      
      try {
        const model = "deepseek-r1-distill-llama-70b";
        console.log(`Using model: ${model}`);
        
        const response = await callOpenAI([
          { 
            role: "system", 
            content: "You are an expert financial analyst with deep experience reviewing investment documents like pitch decks and financial spreadsheets. Your job is to THOROUGHLY examine the provided documents for SPECIFIC information. NEVER include your thinking process in your answers or use phrases like 'Let me analyze' or 'I need to check'. Just provide direct, clear responses with the information requested."
          },
          { 
            role: "user", 
            content: "CRITICAL REQUIREMENTS:\n" +
            "1. NEVER say information is missing until you've searched the ENTIRE document\n" +
            "2. For Excel data: pay close attention to ALL column headers and row labels\n" +
            "3. For PDFs: check EVERY page, including sections near the end about team members\n" +
            "4. When information seems missing, try alternative terms and look in different sections\n" +
            "5. ONLY use information from the provided documents - don't make assumptions\n\n" +
            fullMessage 
          }
        ], model, 0.7, 100000); // Reduced temperature for more focused responses

        if (!response || !response.choices || !response.choices[0] || !response.choices[0].message) {
          throw new Error('Received invalid response structure from DeepSeek API');
        }

        // Get the raw response text
        let responseText = response.choices[0].message.content;
        
        // Clean the response to remove thinking content
        responseText = removeThinkingContent(responseText);
        
        // Check if this is an investment memo question
        if (message.includes('Investment Memo') || message.includes('investment memo')) {
          return responseText;
        }
        
        return { text: responseText, suggestedQuestions: [] };
      } catch (apiError) {
        console.error('DeepSeek API Error:', apiError);
        
        // Return a more user-friendly error message
        return {
          text: "I apologize, but I encountered an issue while analyzing your documents. This could be due to the complexity or size of the files. You might try asking about a more specific aspect of the documents.",
          error: apiError.message
        };
      }
    } catch (error) {
      console.error('Error in AI chat:', error);
      
      // Return user-friendly error
      return {
        text: "I'm sorry, but I encountered a technical issue while processing your request. Please try again or ask a more specific question about your documents.",
        error: error.message
      };
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
        sheets: latestExcelFile.excelData?.metadata?.sheets || [],
        metadata: latestExcelFile.excelData?.metadata
      };
      
      return getSuggestedQuestions(contextData);
    } catch (error) {
      console.error('Error generating Excel questions:', error);
      return [];
    }
  }
};