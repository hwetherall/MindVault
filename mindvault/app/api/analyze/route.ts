import { NextRequest, NextResponse } from 'next/server';

// Define specialized model endpoints
const EXCEL_MODEL = "meta-llama/llama-4-maverick-17b-128e-instruct"; // Optimized for numerical data (128k context, 8192 max completion)
const PDF_MODEL = "llama-3.3-70b-versatile"; // Optimized for text comprehension (updated to use 128k context)
const ARBITER_MODEL = "qwen-qwq-32b"; // For result evaluation and synthesis

// Model-specific maximum completion token limits
const MODEL_MAX_TOKENS: Record<string, number> = {
  [EXCEL_MODEL]: 8000, // Setting to 8000 to stay safely under the 8192 limit
  [PDF_MODEL]: 20000,
  [ARBITER_MODEL]: 20000,
  "default": 8000 // Fallback value for any unspecified models
};

// File type processing map
const FILE_TYPE_MODELS: Record<string, string> = {
  'excel': EXCEL_MODEL,
  'pdf': PDF_MODEL
};

// Fallback response function for when API calls fail
const generateFallbackResponse = (question: string): string => {
  return `# Source
Unable to access documents due to authentication issues.

# Analysis
- Authentication with the document storage service failed
- This could be due to environment variable configuration issues
- Access to Supabase storage might require reconfiguration
- The application can still function with manually uploaded documents

# Conclusion
To analyze this question properly, please upload documents directly or check the system configuration for Supabase authentication.`;
};

/**
 * Process a question through a specific model with type-specific files
 */
async function processWithModel(
  question: string, 
  files: any[], 
  instructions: string, 
  modelType: string, 
  modelName: string, 
  apiKey: string
): Promise<string> {
  // Filter files based on the model type
  const filteredFiles = files.filter(file => {
    if (modelType === 'excel') {
      // For Excel model, only include Excel files
      return file.type.toLowerCase().includes('excel') || 
             file.name.toLowerCase().endsWith('.xlsx') || 
             file.name.toLowerCase().endsWith('.xls') ||
             file.name.toLowerCase().endsWith('.csv');
    } else if (modelType === 'pdf') {
      // For PDF model, only include PDF files
      return file.type.toLowerCase().includes('pdf') || 
             file.name.toLowerCase().endsWith('.pdf');
    }
    return false;
  });
  
  console.log(`[Analyze] ${modelType.toUpperCase()} model processing ${filteredFiles.length} files`);
  
  // If no files match this model type, return a simple response
  if (filteredFiles.length === 0) {
    return `# Source
No ${modelType.toUpperCase()} files were provided.

# Analysis
- No ${modelType.toUpperCase()} files were available for analysis
- This model specializes in ${modelType.toUpperCase()} file types
- Consider uploading relevant ${modelType.toUpperCase()} files for more complete analysis

# Conclusion
Unable to provide insights as no ${modelType.toUpperCase()} files were provided for this question.`;
  }
  
  // Content size limit takes into account the context window of each model (both now 128k)
  const contentSizeLimitPerFile = 25000;
  
  // Prepare document content for the prompt
  let documentContent = '';
  
  // Limit document content to avoid exceeding context length
  filteredFiles.forEach((file: any, index: number) => {
    const filePreview = `
Document ${index + 1}: ${file.name}
Type: ${file.type}
Content:
${file.content.substring(0, contentSizeLimitPerFile)}
${file.content.length > contentSizeLimitPerFile ? '... (content truncated)' : ''}
-------------------
`;
    documentContent += filePreview;
  });
  
  // Construct the prompt for the AI
  const prompt = `
${instructions}

You are specialized in analyzing ${modelType.toUpperCase()} files. Focus ONLY on the information present in these files.

Here are the ${modelType.toUpperCase()} documents to analyze:
${documentContent}

Question: ${question}

Your answer MUST be structured in the following format:

# Source
List the specific documents and sections you referenced. Do not include headings or subheadings within this section. Use regular text, with bolding for emphasis when needed. For example, use "**Excel/Financial model_SE_Dec_2022.xlsx**" not "## Excel File:"

# Analysis
- Provide 3-5 bullet points with key findings
- Each bullet should be concise and focused
- Include relevant figures, dates, or metrics
- Use bold (**text**) for emphasis of important figures
- DO NOT use headings or subheadings within the analysis section

# Conclusion
Provide a 1-2 sentence direct answer to the question. Be specific and include exact figures when available. Do not use headings within this section.

DO NOT include your thinking process or explain your approach. Focus only on providing the requested sections with relevant information found in the documents.
`;

  try {
    // Make the request to the Groq API
    const apiUrl = process.env.GROQ_API_BASE_URL || 'https://api.groq.com/openai/v1';
    console.log(`[Analyze] Calling Groq API with model: ${modelName}`);
    
    // Get the appropriate max_tokens value for the model (max completion tokens) or use default
    const maxTokens = MODEL_MAX_TOKENS[modelName] || MODEL_MAX_TOKENS.default;
    console.log(`[Analyze] Using max_tokens: ${maxTokens} for model: ${modelName}`);
    
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { 
            role: 'system', 
            content: `You are a financial analyst assistant, specializing in analyzing ${modelType.toUpperCase()} files to extract information and insights. Your task is to answer questions based ONLY on the ${modelType.toUpperCase()} documents provided. 

Always structure your response with Source, Analysis (bullet points), and Conclusion sections as specified. 

IMPORTANT FORMATTING RULES:
1. NEVER include headings or subheadings within your main sections. For example, in the Source section, don't use "## Excel File:" - just use bold formatting like "**Excel file.xlsx**".
2. In the Analysis section, use bullet points with concise insights. No additional headings within this section.
3. In the Conclusion section, provide a direct 1-2 sentence answer without any headings.
4. NEVER include your reasoning process, self-corrections, or thought processes in your response.
5. Only provide your final analysis in the required format without any intermediate thinking.` 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: maxTokens,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`[Analyze] Groq API error with ${modelType} model:`, errorData);
      throw new Error(`API error with ${modelType} model: ${JSON.stringify(errorData)}`);
    }
    
    const result = await response.json();
    return result.choices[0].message.content;
  } catch (error) {
    console.error(`[Analyze] Error processing with ${modelType} model:`, error);
    throw error;
  }
}

/**
 * Arbitrate between two model responses and generate a combined answer
 */
async function arbitrateResults(
  question: string,
  excelResponse: string,
  pdfResponse: string,
  recommendedTypes: string[],
  apiKey: string
): Promise<string> {
  try {
    const apiUrl = process.env.GROQ_API_BASE_URL || 'https://api.groq.com/openai/v1';
    console.log(`[Analyze] Calling Groq API with arbiter model: ${ARBITER_MODEL}`);
    
    // Get the appropriate max_tokens value for the arbiter model
    const maxTokens = MODEL_MAX_TOKENS[ARBITER_MODEL] || MODEL_MAX_TOKENS.default;
    console.log(`[Analyze] Using max_tokens: ${maxTokens} for arbiter model`);
    
    // Create the arbitration prompt
    const arbitrationPrompt = `
You are an expert financial analyst tasked with evaluating and combining the insights from two specialized AI assistants.

Question from user: "${question}"

Recommended file types for this question: ${recommendedTypes.join(', ')}

RESPONSE FROM EXCEL SPECIALIST (analyzed only Excel/CSV files):
${excelResponse}

RESPONSE FROM PDF SPECIALIST (analyzed only PDF files):
${pdfResponse}

Your task:
1. Evaluate which response contains more accurate and relevant information for the question.
2. Give preference to the Excel analysis for financial/numerical questions.
3. Give preference to the PDF analysis for market/qualitative questions.
4. Identify unique insights from each model's response.
5. Create a comprehensive final answer that incorporates the best elements from both responses.
6. If one model had no relevant files to analyze, rely more heavily on the response from the other model.

IMPORTANT FORMATTING RULES:
1. Follow the exact same output format structure below
2. NEVER include headings or subheadings within your main sections
3. For the Source section, list documents with bolding for emphasis, but no headings
4. For the Analysis section, use bullet points only, no subheadings
5. For the Conclusion, provide a direct answer with no additional headings

# Source
List the specific documents and sections you referenced. Do not include headings or subheadings within this section. Use bold text for emphasis when needed.

# Analysis
- Provide 3-5 bullet points with key findings from your combined analysis
- Each bullet should be concise and focused on a specific insight
- Include relevant figures, dates, or metrics when available

# Conclusion
Provide a 1-2 sentence direct answer to the question. Be specific and include exact figures when available. No headings within this section.
`;

    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: ARBITER_MODEL,
        messages: [
          { role: 'system', content: 'You are a financial arbitration expert, tasked with evaluating and combining insights from specialized AI models to produce the most accurate and comprehensive response. Never include headings within each main section of your response. Use plain text with optional bold formatting (**text**) for emphasis, but do not add internal headings or subheadings within Source, Analysis, or Conclusion sections.' },
          { role: 'user', content: arbitrationPrompt }
        ],
        temperature: 0.2,
        max_tokens: maxTokens,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Analyze] Groq API error with arbiter model:', errorData);
      throw new Error(`API error with arbiter model: ${JSON.stringify(errorData)}`);
    }
    
    const result = await response.json();
    return result.choices[0].message.content;
  } catch (error) {
    console.error('[Analyze] Error during arbitration:', error);
    throw error;
  }
}

/**
 * API route to analyze documents and answer questions using multiple Groq API models
 */
export async function POST(req: NextRequest) {
  try {
    // Get the request body
    const body = await req.json();
    const { question, files, instructions, recommended } = body;
    
    console.log(`[Analyze] Processing question: "${question}"`);
    console.log(`[Analyze] Files provided: ${files?.length || 0}`);
    
    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }
    
    // Get API key from environment variables
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('[Analyze] GROQ_API_KEY is not configured');
      // Return fallback response instead of error
      return NextResponse.json({ 
        answer: generateFallbackResponse(question),
        fallback: true
      });
    }
    
    // Extract recommended file types (default to empty array if not provided)
    const recommendedTypes = recommended || [];
    
    try {
      // Process the question through both specialized models but handle errors individually
      const excelPromise = processWithModel(question, files, instructions, 'excel', EXCEL_MODEL, apiKey)
        .catch(error => {
          console.error(`[Analyze] Excel model processing failed:`, error);
          return `# Source
Excel model processing failed due to service unavailability.

# Analysis
- The Excel analysis service is currently unavailable
- This could be due to temporary API issues
- The application is still able to analyze PDF documents

# Conclusion
Unable to analyze Excel documents due to service unavailability. Please rely on the PDF analysis or try again later.`;
        });

      const pdfPromise = processWithModel(question, files, instructions, 'pdf', PDF_MODEL, apiKey)
        .catch(error => {
          console.error(`[Analyze] PDF model processing failed:`, error);
          return `# Source
PDF model processing failed due to service unavailability.

# Analysis
- The PDF analysis service is currently unavailable
- This could be due to temporary API issues
- The application is still able to analyze Excel documents

# Conclusion
Unable to analyze PDF documents due to service unavailability. Please rely on the Excel analysis or try again later.`;
        });
      
      // Wait for both promises to settle (either resolve or reject)
      const [excelResponse, pdfResponse] = await Promise.all([excelPromise, pdfPromise]);
      
      console.log('[Analyze] Successfully processed question with available models');
      
      // Use the arbiter model to evaluate and combine the responses
      const finalAnswer = await arbitrateResults(
        question,
        excelResponse,
        pdfResponse,
        recommendedTypes,
        apiKey
      ).catch(error => {
        console.error('[Analyze] Arbiter model processing failed:', error);
        // If arbiter fails, return a combined response ourselves
        return `# Source
Combined results from available document analyses.

# Analysis
- Analysis was performed on available documents
- Excel analysis: ${excelResponse.includes('failed') ? 'Unavailable due to service issues' : 'Available'}
- PDF analysis: ${pdfResponse.includes('failed') ? 'Unavailable due to service issues' : 'Available'}
- Some document types may have been unavailable for analysis

# Conclusion
${!excelResponse.includes('failed') ? excelResponse.split('# Conclusion')[1].trim() : 
  !pdfResponse.includes('failed') ? pdfResponse.split('# Conclusion')[1].trim() : 
  'Analysis was limited due to service availability issues. Please try again later.'}`;
      });
      
      console.log('[Analyze] Successfully processed responses');
      
      return NextResponse.json({ answer: finalAnswer });
    } catch (apiError) {
      console.error('[Analyze] Error in multi-model processing:', apiError);
      return NextResponse.json({ 
        answer: generateFallbackResponse(question),
        fallback: true
      });
    }
  } catch (error) {
    console.error('[Analyze] Error processing document analysis:', error);
    
    // Return a fallback response instead of an error
    return NextResponse.json({ 
      answer: generateFallbackResponse("your question"),
      fallback: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 