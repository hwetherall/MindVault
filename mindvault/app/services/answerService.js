/* eslint-disable no-undef */
import { extractTimeSeriesForChart, extractMultipleMetricsForChart, detectChartType, extractARRFromQuarterlyData } from './excelChartService';

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

/**
 * Extracts financial metrics mentioned in a question
 * @param {string} question - The user's question
 * @returns {Array<string>} Array of mentioned metrics
 */
const extractMentionedMetrics = (question) => {
  if (!question) return [];
  
  const questionLower = question.toLowerCase();
  const metrics = [];
  
  // Common financial metrics to check for
  const metricKeywords = {
    'arr': ['arr', 'annual recurring revenue', 'recurring revenue'],
    'revenue': ['revenue', 'sales', 'income'],
    'growth rate': ['growth rate', 'growth', 'cagr', 'yoy', 'year over year', 'year-over-year'],
    'burn rate': ['burn rate', 'burn', 'cash burn'],
    'margin': ['margin', 'gross margin', 'profit margin'],
    'mrr': ['mrr', 'monthly recurring revenue'],
    'runway': ['runway', 'cash runway'],
    'ltv': ['ltv', 'lifetime value', 'customer lifetime value', 'clv'],
    'cac': ['cac', 'customer acquisition cost', 'acquisition cost'],
    'churn': ['churn', 'churn rate', 'attrition'],
    'arpu': ['arpu', 'average revenue per user']
  };
  
  // Check for each metric
  Object.entries(metricKeywords).forEach(([metric, keywords]) => {
    if (keywords.some(keyword => questionLower.includes(keyword))) {
      metrics.push(metric);
    }
  });
  
  console.log(`Extracted metrics from question: ${metrics.join(', ')}`);
  return metrics;
};

/**
 * Generates chart data based on the question and available files
 * @param {string} question - The user's question
 * @param {Array} files - Array of file objects
 * @returns {Object|null} Chart data object or null if no suitable data found
 */
const generateChartData = (question, files) => {
  // Skip chart generation if no files are available
  if (!files || files.length === 0) {
    console.log("Chart generation: No files available for chart data");
    return null;
  }
  
  // Define the EXACT questions that should have charts (from questions.ts)
  const ARR_QUESTION = "What is the current Annual Recurring Revenue (ARR) of the company?";
  const BURN_RATE_QUESTION = "What is the current monthly cash burn rate?";
  
  // Normalize questions by removing extra spaces, punctuation and converting to lowercase
  const normalizeText = (text) => {
    return text.toLowerCase().replace(/[.,?!;:]/g, '').replace(/\s+/g, ' ').trim();
  };
  
  const normalizedQuestion = normalizeText(question);
  const normalizedArrQuestion = normalizeText(ARR_QUESTION);
  const normalizedBurnRateQuestion = normalizeText(BURN_RATE_QUESTION);
  
  // Check for question match (allowing for minor differences and contextual text)
  const isArrQuestion = normalizedQuestion.includes(normalizedArrQuestion);
  const isBurnRateQuestion = normalizedQuestion.includes(normalizedBurnRateQuestion);
  
  console.log("Normalized user question:", normalizedQuestion);
  console.log("Normalized ARR question:", normalizedArrQuestion);
  console.log("Normalized Burn Rate question:", normalizedBurnRateQuestion);
  console.log("ARR question match:", isArrQuestion);
  console.log("Burn Rate question match:", isBurnRateQuestion);
  
  // Only proceed with chart generation for these specific questions
  if (!isArrQuestion && !isBurnRateQuestion) {
    console.log("Chart generation: Question does not match the ARR or Burn Rate questions");
    return null;
  }
  
  // Detect which specific chart to show
  let chartType = '';
  if (isArrQuestion) {
    chartType = 'arr';
    console.log("Chart generation: ARR chart requested");
  } else if (isBurnRateQuestion) {
    chartType = 'burn rate';
    console.log("Chart generation: Burn Rate chart requested");
  }
  
  // Filter to just Excel files
  const excelFiles = files.filter(file => 
    file.name.toLowerCase().endsWith('.xlsx') || 
    file.name.toLowerCase().endsWith('.xls') || 
    file.name.toLowerCase().includes('excel')
  );
  
  console.log(`Chart generation: Found ${excelFiles.length} Excel files`);
  
  // Special handling for ARR questions
  if (chartType === 'arr') {
    // Try to find the Historical Metric file for ARR data
    const historicalMetricFile = excelFiles.find(file => 
      file.name.toLowerCase().includes('historical') && 
      file.name.toLowerCase().includes('metric')
    );
    
    if (historicalMetricFile) {
      console.log(`Chart generation: Found dedicated Historical Metric file: ${historicalMetricFile.name}`);
      const chartData = extractTimeSeriesForChart(historicalMetricFile.content, 'arr');
      
      if (chartData && chartData.title && chartData.title.toLowerCase().includes('recurring revenue')) {
        console.log("Chart generation: Successfully extracted ARR data from Historical Metric file");
        console.log("Chart data structure:", chartData.type, chartData.title, 
                   "datasets:", chartData.data.datasets.length, 
                   "points:", chartData.data.datasets[0]?.data.length);
        return chartData;
      }
    }
    
    // If Historical Metric file didn't work, try all Excel files
    for (const file of excelFiles) {
      console.log(`Chart generation: Checking ${file.name} for ARR data`);
      const arrChartData = extractTimeSeriesForChart(file.content, 'arr');
      
      if (arrChartData && arrChartData.title && arrChartData.title.toLowerCase().includes('recurring revenue')) {
        console.log(`Chart generation: Successfully extracted ARR data from ${file.name}`);
        console.log("Chart data structure:", arrChartData.type, arrChartData.title, 
                   "datasets:", arrChartData.data.datasets.length, 
                   "points:", arrChartData.data.datasets[0]?.data.length);
        return arrChartData;
      }
    }
  }
  
  // Special handling for Burn Rate questions
  if (chartType === 'burn rate') {
    // Look for burn rate data in all Excel files
    for (const file of excelFiles) {
      console.log(`Chart generation: Checking ${file.name} for burn rate data`);
      const burnChartData = extractTimeSeriesForChart(file.content, 'burn rate');
      
      if (burnChartData) {
        console.log(`Chart generation: Successfully extracted burn rate data from ${file.name}`);
        console.log("Chart data structure:", burnChartData.type, burnChartData.title, 
                   "datasets:", burnChartData.data.datasets.length, 
                   "points:", burnChartData.data.datasets[0]?.data.length);
        return burnChartData;
      }
    }
  }
  
  console.log("Chart generation: Could not generate chart data");
  return null;
};

// Add token estimation function
function estimateTokens(text, model = "deepseek-r1-distill-llama-70b") {
  if (!text) return 0;
  
  // Count words (more accurate than character count)
  const wordCount = text.split(/\s+/).length;
  
  // Different models have different token ratios
  const tokenRatio = model.includes("llama-3.1-8b") ? 1.3 : 
                     model.includes("deepseek") ? 1.4 : 
                     1.35; // Default ratio
  
  // Estimate base tokens from words
  const estimatedTokens = Math.ceil(wordCount * tokenRatio);
  
  // Add extra for code blocks which tend to use more tokens
  let codeBlockTokens = 0;
  
  // Find all code blocks using regex
  const codeBlockRegex = /```[\s\S]*?```/g;
  let match;
  
  // Use exec in a loop to find all matches
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const codeBlock = match[0];
    // Code tends to use more tokens per character
    codeBlockTokens += Math.ceil(codeBlock.length / 3);
  }
  
  return estimatedTokens + codeBlockTokens;
}

export const answerService = {
  async sendMessage(message, files = [], fastMode = false) {
    try {
      console.log(`Processing request with ${files.length} files, fastMode: ${fastMode}`);
      
      // Start timing the request
      const startTime = Date.now();
      
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

        // Record raw response text
        const rawResponse = responseText;
        
        // Clean the response to remove thinking content
        responseText = removeThinkingContent(responseText);
        
        // Calculate time taken
        const timeTaken = Date.now() - startTime;
        
        // Check if this is an investment memo question
        if (message.includes('Investment Memo') || message.includes('investment memo')) {
          return {
            text: responseText,
            modelUsed: model,
            timeTaken,
            messageLength: estimateTokens(fullMessage, model),
            answerLength: estimateTokens(responseText, model),
            documentContext: contextMessage,
            finalPrompt: fullMessage,
            rawOutput: rawResponse
          };
        }
        
        // Try to generate chart data if appropriate
        console.log("Generating chart data for the question:", message);

        // Define the EXACT questions that should have charts (from questions.ts)
        const ARR_QUESTION = "What is the current Annual Recurring Revenue (ARR) of the company?";
        const BURN_RATE_QUESTION = "What is the current monthly cash burn rate?";

        // Normalize questions by removing extra spaces, punctuation and converting to lowercase
        const normalizeText = (text) => {
          return text.toLowerCase().replace(/[.,?!;:]/g, '').replace(/\s+/g, ' ').trim();
        };

        const normalizedMessage = normalizeText(message);
        const normalizedArrQuestion = normalizeText(ARR_QUESTION);
        const normalizedBurnRateQuestion = normalizeText(BURN_RATE_QUESTION);

        // Check for question match (allowing for minor differences and contextual text)
        const isArrQuestion = normalizedMessage.includes(normalizedArrQuestion);
        const isBurnRateQuestion = normalizedMessage.includes(normalizedBurnRateQuestion);

        // Debug message matching
        console.log("Normalized user message:", normalizedMessage);
        console.log("Normalized ARR question:", normalizedArrQuestion);
        console.log("Normalized Burn Rate question:", normalizedBurnRateQuestion);
        console.log("ARR question match:", isArrQuestion);
        console.log("Burn Rate question match:", isBurnRateQuestion);

        // First check if the response text contains quarterly ARR data
        let chartData = null;
        
        if (isArrQuestion) {
          console.log("Chart data: Checking for quarterly ARR data in response text for ARR question");
          chartData = extractARRFromQuarterlyData(responseText);
          
          if (chartData) {
            console.log("Chart data: Created chart from quarterly ARR data in response text");
          } else {
            // Try standard chart data extraction from Excel files
            console.log("Chart data: Extracting from Excel files for ARR question");
            chartData = generateChartData(message, files);
          }
        } else if (isBurnRateQuestion) {
          // For burn rate question, use standard extraction
          console.log("Chart data: Extracting burn rate data from Excel files");
          chartData = generateChartData(message, files);
        } else {
          // No charts for other questions
          console.log("Chart data: No matching question for chart generation");
          chartData = null;
        }
        
        console.log("Chart data generation result:", chartData ? "Chart created" : "No chart data found");
        if (chartData) {
          console.log("Chart data details:", 
                     "type:", chartData.type, 
                     "title:", chartData.title, 
                     "datasets:", chartData.data.datasets.length, 
                     "points:", chartData.data.datasets[0]?.data.length);
        }
        
        // Return response with all metrics
        const responseObject = { 
          text: responseText, 
          suggestedQuestions: [],
          chartData: chartData,
          modelUsed: model,
          timeTaken,
          messageLength: estimateTokens(fullMessage, model),
          answerLength: estimateTokens(responseText, model),
          documentContext: contextMessage,
          finalPrompt: fullMessage,
          rawOutput: rawResponse
        };
        
        console.log("Final response object:", responseObject);
        return responseObject;
      } catch (apiError) {
        console.error('DeepSeek API Error:', apiError);
        
        // Return a more user-friendly error message with metrics
        return {
          text: "I apologize, but I encountered an issue while analyzing your documents. This could be due to the complexity or size of the files. You might try asking about a more specific aspect of the documents.",
          error: apiError.message,
          modelUsed: model,
          timeTaken: Date.now() - startTime,
          messageLength: estimateTokens(fullMessage, model),
          answerLength: 0,
          documentContext: contextMessage,
          finalPrompt: fullMessage,
          rawOutput: ""
        };
      }
    } catch (error) {
      console.error('Error in AI chat:', error);
      
      // Return user-friendly error with metrics
      return {
        text: "I'm sorry, but I encountered a technical issue while processing your request. Please try again or ask a more specific question about your documents.",
        error: error.message,
        modelUsed: fastMode ? "llama-3.1-8b-instant" : "deepseek-r1-distill-llama-70b",
        timeTaken: Date.now() - startTime,
        messageLength: estimateTokens(message, model),
        answerLength: 0,
        documentContext: "",
        finalPrompt: message,
        rawOutput: ""
      };
    }
  },
};