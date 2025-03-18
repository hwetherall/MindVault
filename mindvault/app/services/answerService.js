/* eslint-disable no-undef */
// Remove direct OpenAI import as we'll use our API endpoint
// import { OpenAI } from 'openai';

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
  
  // Remove asterisks at the beginning and end of text blocks
  // This looks for ** at the beginning of lines or at the beginning of the text
  cleanedText = cleanedText.replace(/^(\s*)\*\*\s*/gm, '$1');
  
  // This looks for ** at the end of lines or at the end of the text
  cleanedText = cleanedText.replace(/\s*\*\*(\s*)$/gm, '$1');
  
  // Clean up any excessive newlines
  cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n');
  
  return cleanedText.trim();
}

// Helper function to call our secure API endpoint
async function callLlm(messages, model = "deepseek-r1-distill-llama-70b", temperature = 1, max_completion_tokens = 100000) {
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
  async sendMessage(message, files = [], fastMode = false) {
    try {
      console.log(`Processing request with ${files.length} files, fastMode: ${fastMode}`);
      
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

        // Adjust chunk sizes and limits based on fast mode
        const maxFilesToProcess = fastMode ? 3 : 5;
        const pdfChunkSize = fastMode ? 5000 : 25000;
        const pdfInitialChunk = fastMode ? 5000 : 25000;
        const pdfEndChunk = fastMode ? 5000 : 25000;

        // Add selected file content for context
        let fileContentAdded = 0;
        
        // Add content from PDF files first
        for (const file of pdfFiles) {
          if (file.content && file.content.length > 0 && fileContentAdded < maxFilesToProcess) {
            // Smart PDF content extraction
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
            
            // Add beginning of document
            extractedContent += pdfContent.substring(0, pdfInitialChunk) + "\n...\n";
            
            // Process the document in chunks to find key sections
            for (let i = pdfInitialChunk; i < contentLength; i += pdfChunkSize) {
              const chunk = pdfContent.substring(i, Math.min(i + pdfChunkSize, contentLength));
              
              // Check if this chunk contains any key phrases
              const containsKeyPhrase = keyPhrases.some(phrase => 
                chunk.toLowerCase().includes(phrase.toLowerCase())
              );
              
              if (containsKeyPhrase) {
                extractedContent += chunk + "\n...\n";
              }
            }
            
            // Always include the end of the document (where team info often appears)
            const endSection = pdfContent.substring(Math.max(0, contentLength - pdfEndChunk));
            if (!extractedContent.includes(endSection)) {
              extractedContent += "\n...\n" + endSection;
            }
            
            pdfContent = extractedContent;
            console.log(`Extracted ${pdfContent.length} characters of key sections from PDF`);
            
            contextMessage += `\n--- Content from PDF: ${file.name} ---\n${pdfContent}\n--- End of PDF excerpt ---\n\n`;
            fileContentAdded++;
          }
        }
        
        // Adjust Excel content limits based on fast mode
        const excelMaxSheets = fastMode ? 4 : 8;
        const excelSheetSize = fastMode ? 5000 : 20000;
        const excelPrioritySheetSize = fastMode ? 10000 : 40000;
        const excelFallbackSize = fastMode ? 25000 : 100000;
        
        // Add content from Excel files next
        for (const file of excelFiles) {
          if (file.content && file.content.length > 0 && fileContentAdded < maxFilesToProcess) {
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
                "arr", "dashboard", "mrr", "summ metric", "summ", "summary metric", "historical metric"
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
                  
                  // Extract the sheet content with size based on mode
                  const sheetContent = excelContent.substring(sheetStart, Math.min(sheetStart + excelPrioritySheetSize, sheetEnd));
                  extractedContent += sheetContent + "\n\n";
                }
              }
              
              // If we didn't get much from priority sheets, add content from all sheets
              if (extractedContent.length < (fastMode ? 15000 : 60000)) {
                extractedContent = ""; // Reset and try a different approach
                
                // First check if "Summ Metric" sheet exists and process it first
                const summMetricSheetIndex = sheetMatches.findIndex(match => 
                  match[1].toLowerCase().includes("summ metric") || 
                  match[1].toLowerCase() === "summ" ||
                  match[1].toLowerCase().includes("summary metric")
                );
                
                // Also check for "Historical Metric" sheet
                const historicalMetricSheetIndex = sheetMatches.findIndex(match => 
                  match[1].toLowerCase().includes("historical metric") ||
                  match[1].toLowerCase().includes("historical metrics")
                );
                
                // Process important sheets first with special handling
                const importantSheetIndices = [summMetricSheetIndex, historicalMetricSheetIndex].filter(index => index >= 0);
                
                // Process each important sheet
                for (const sheetIndex of importantSheetIndices) {
                  const sheetNameMatch = sheetMatches[sheetIndex];
                  const sheetName = sheetNameMatch[1];
                  
                  // Find the start of this sheet's content
                  const sheetStart = sheetNameMatch.index;
                  
                  // Find the end (either the next sheet or the end of content)
                  const nextSheetMatch = sheetMatches[sheetIndex + 1];
                  const sheetEnd = nextSheetMatch 
                    ? nextSheetMatch.index
                    : contentLength;
                  
                  // Extract the full sheet content - use a larger size for these critical sheets
                  const importantSheetSize = fastMode ? 15000 : 50000;
                  const sheetContent = `Sheet ${sheetName} (IMPORTANT METRICS):\n${excelContent.substring(sheetStart, Math.min(sheetStart + importantSheetSize, sheetEnd))}`;
                  extractedContent += sheetContent + "\n\n";
                  
                  console.log(`Extracted important sheet "${sheetName}" (${sheetContent.length} characters)`);
                }
                
                // Take content from each sheet based on mode
                for (let i = 0; i < Math.min(sheetMatches.length, excelMaxSheets); i++) {
                  // Skip if this is one of the important sheets we already processed
                  if (importantSheetIndices.includes(i)) continue;
                  
                  const sheetNameMatch = sheetMatches[i];
                  const sheetName = sheetNameMatch[1];
                  
                  // Find the start of this sheet's content
                  const sheetStart = sheetNameMatch.index;
                  
                  // Find the end (either the next sheet or the end of content)
                  const nextSheetMatch = sheetMatches[i + 1];
                  const sheetEnd = nextSheetMatch 
                    ? nextSheetMatch.index
                    : contentLength;
                  
                  // Extract the sheet content with size based on mode
                  const sheetContent = `Sheet ${sheetName}:\n${excelContent.substring(sheetStart, Math.min(sheetStart + excelSheetSize, sheetEnd))}`;
                  extractedContent += sheetContent + "\n\n";
                }
              }
              
              excelContent = extractedContent;
              console.log(`Extracted ${excelContent.length} characters from Excel sheets`);
            } else {
              // If no sheet separators, take a chunk based on mode
              excelContent = excelContent.substring(0, excelFallbackSize);
            }
            
            contextMessage += `\n--- Content from Excel: ${file.name} ---\n${excelContent}\n--- End of Excel excerpt ---\n\n`;
            fileContentAdded++;
          }
        }
      }

      // Combine the context and user message
      const fullMessage = contextMessage 
        ? `I have the following documents in my repository:<documents>\n${contextMessage}\n</documents>\nBased on these documents, please respond to this request:\n\n${message}\n\nThe above instructions are VERY IMPORTANT and should be followed precisely when analyzing the documents.`
        : message;

      console.log("Context message length:", contextMessage.length);
      console.log("Full message length:", fullMessage.length);
      console.log("Sending request to AI API...");
      
      try {
        // Select model based on fast mode
        const model = fastMode ? "llama-3.1-8b-instant" : "deepseek-r1-distill-llama-70b";
        console.log(`Using model: ${model}`);
        
        const response = await callLlm([
          { 
            role: "system", 
            content: "You are an expert financial analyst with deep experience reviewing investment documents like pitch decks and financial spreadsheets. Your job is to THOROUGHLY examine the provided documents for SPECIFIC information. NEVER include your thinking process in your answers or use phrases like 'Let me analyze' or 'I need to check'. Just provide direct, clear responses with the information requested.\n\n" +
            "FORMATTING REQUIREMENTS:\n" +
            "1. Format all large numbers using appropriate suffixes for readability\n" +
            "2. For millions: Use 2 decimal places followed by 'm' (e.g., 40.49m AUD instead of 40,485,584.91 AUD)\n" +
            "3. For billions: Use 2 decimal places followed by 'b' (e.g., 1.25b USD)\n" +
            "4. For thousands: Use 2 decimal places followed by 'k' (e.g., 500.50k EUR)\n" +
            "5. Keep percentages as they are with % symbol (e.g., 12.5%)\n" +
            "6. Bold important financial figures using markdown **bold**"
          },
          { 
            role: "user", 
            content: "CRITICAL REQUIREMENTS:\n" +
            "1. NEVER say information is missing until you've searched the ENTIRE document\n" +
            "2. For Excel data: pay close attention to ALL column headers and row labels\n" +
            "3. For PDFs: check EVERY page, including sections near the end about team members\n" +
            "4. When information seems missing, try alternative terms and look in different sections\n" +
            "5. ONLY use information from the provided documents - don't make assumptions\n" +
            "6. Format large numbers with suffixes (40.49m instead of 40,485,584.91)\n\n" +
            fullMessage 
          }
        ], model, 0.7, fastMode ? 8000 : 100000);

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
};