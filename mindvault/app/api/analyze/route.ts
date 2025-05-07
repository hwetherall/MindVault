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
Specify which document(s) and sections you used to find the answer.

# Analysis
- Provide 3-5 bullet points with key findings from your analysis
- Each bullet should be concise and focused on a specific insight
- Include relevant figures, dates, or metrics when available

# Conclusion
Provide a 1-2 sentence direct answer to the question. Be specific and include exact figures when available.

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
            content: `You are a financial analyst assistant, specializing in analyzing ${modelType.toUpperCase()} files to extract information and insights. Your task is to answer questions based ONLY on the ${modelType.toUpperCase()} documents provided. Always structure your response with Source, Analysis (bullet points), and Conclusion sections as specified.` 
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

Follow the exact same output format structure:

# Source
Specify which document(s) and sections you used to find the answer.

# Analysis
- Provide 3-5 bullet points with key findings from your combined analysis
- Each bullet should be concise and focused on a specific insight
- Include relevant figures, dates, or metrics when available

# Conclusion
Provide a 1-2 sentence direct answer to the question. Be specific and include exact figures when available.
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
          { role: 'system', content: 'You are a financial arbitration expert, tasked with evaluating and combining insights from specialized AI models to produce the most accurate and comprehensive response.' },
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
      // Process the question through both specialized models concurrently
      const [excelResponse, pdfResponse] = await Promise.all([
        processWithModel(question, files, instructions, 'excel', EXCEL_MODEL, apiKey),
        processWithModel(question, files, instructions, 'pdf', PDF_MODEL, apiKey)
      ]);
      
      console.log('[Analyze] Successfully processed question with both models');
      
      // Use the arbiter model to evaluate and combine the responses
      const finalAnswer = await arbitrateResults(
        question,
        excelResponse,
        pdfResponse,
        recommendedTypes,
        apiKey
      );
      
      console.log('[Analyze] Successfully arbitrated model responses');
      
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