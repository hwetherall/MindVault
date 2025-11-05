import { NextRequest, NextResponse } from 'next/server';
import { buildAnalystPrompt, ANALYST_SYSTEM_MESSAGE } from '../../prompts/analyst';
import { DocumentFile } from '../../prompts/shared';
import { validateAnswer, formatAnswerFallback } from '../../utils/outputValidator';
import { formatAnswerNumbers } from '../../utils/numberFormatter';
import { createErrorResponse, createFallbackResponse } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import { cache, withCache } from '../../utils/cache';
import { prepareDocumentsForQuestion } from '../../utils/documentChunker';

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
 * API route to analyze documents and answer questions using Groq API
 */
export async function POST(req: NextRequest) {
  const requestLogger = logger;
  requestLogger.setRequestId(requestLogger.generateRequestId());
  
  try {
    // Get the request body
    const body = await req.json();
    const { question, files, instructions, model } = body;
    
    // Debug logging for file content
    console.log(`[API /analyze] Received request with ${files?.length || 0} files`);
    if (files && files.length > 0) {
      files.forEach((file: any, index: number) => {
        const contentLength = file.content ? file.content.length : 0;
        console.log(`[API /analyze] File ${index + 1}: ${file.name}, type: ${file.type}, content length: ${contentLength}`);
        if (!file.content || contentLength === 0) {
          console.warn(`[API /analyze] WARNING: File ${file.name} has no content!`);
        } else {
          console.log(`[API /analyze] File ${file.name} content preview (first 200 chars): ${file.content.substring(0, 200)}...`);
        }
      });
    } else {
      console.warn(`[API /analyze] WARNING: No files received in request!`);
    }
    
    requestLogger.processingStart('analyze', { question: question.substring(0, 100), fileCount: files?.length || 0 });
    
    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }
    
    // Get API key from environment variables
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      requestLogger.error('GROQ_API_KEY is not configured');
      return createFallbackResponse('analyze', generateFallbackResponse(question));
    }
    
    // Use the model from the request or fallback to the environment variable
    const modelToUse = model || process.env.GROQ_API_MODEL || 'deepseek-r1-distill-llama-70b';
    
    // Prepare document files for prompt
    let documentFiles: DocumentFile[] = (files || []).map((file: any) => ({
      name: file.name,
      type: file.type,
      content: file.content || ''
    }));
    
    // Debug logging after mapping
    console.log(`[API /analyze] Mapped ${documentFiles.length} document files`);
    documentFiles.forEach((file, index) => {
      const contentLength = file.content ? file.content.length : 0;
      console.log(`[API /analyze] Mapped file ${index + 1}: ${file.name}, content length: ${contentLength}`);
    });

    // Use intelligent chunking for large documents
    const totalSize = documentFiles.reduce((sum, file) => sum + (file.content?.length || 0), 0);
    if (totalSize > 10000) {
      requestLogger.info('Using document chunking for large documents', { totalSize });
      documentFiles = prepareDocumentsForQuestion(documentFiles, question, {
        maxChunkSize: 5000,
        overlapSize: 200
      });
    }
    
    // Check cache first
    const cacheKey = cache.generateKey(question, documentFiles);
    const cachedAnswer = cache.get<string>(cacheKey);
    
    if (cachedAnswer) {
      requestLogger.info('Cache hit for analyze request', { question: question.substring(0, 50) });
      return NextResponse.json({ answer: cachedAnswer, cached: true });
    }
    
    // Construct the prompt using standardized template
    const prompt = buildAnalystPrompt(question, documentFiles, instructions);
    
    try {
      const startTime = Date.now();
      // Make the request to the Groq API
      const apiUrl = process.env.GROQ_API_BASE_URL || 'https://api.groq.com/openai/v1';
      requestLogger.apiCall(apiUrl, 'POST', { model: modelToUse });
      
      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: [
            { role: 'system', content: ANALYST_SYSTEM_MESSAGE },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 20000,
        }),
      });
      
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        requestLogger.apiError(apiUrl, new Error(`API returned ${response.status}`), { status: response.status, errorData });
        return createFallbackResponse('analyze', generateFallbackResponse(question), new Error(`API error: ${response.status}`));
      }
      
      const result = await response.json();
      let answer = result.choices[0].message.content;
      
      // Validate and format answer
      const validation = validateAnswer(answer);
      if (!validation.isValid) {
        requestLogger.warn('Answer validation failed, reformatting', { errors: validation.errors, warnings: validation.warnings });
        answer = formatAnswerFallback(answer);
      } else if (validation.warnings.length > 0) {
        requestLogger.warn('Answer validation warnings', { warnings: validation.warnings });
      }
      
      // Format numbers in the answer
      answer = formatAnswerNumbers(answer);
      
      // Cache the answer (cache for 1 hour)
      cache.set(cacheKey, answer, 60 * 60 * 1000);
      
      requestLogger.processingComplete('analyze', duration);
      requestLogger.apiResponse(apiUrl, response.status, duration);
      
      return NextResponse.json({ answer, validation: validation.warnings.length > 0 ? { warnings: validation.warnings } : undefined });
    } catch (apiError) {
      requestLogger.processingError('analyze', apiError);
      return createFallbackResponse('analyze', generateFallbackResponse(question), apiError);
    }
  } catch (error) {
    requestLogger.processingError('analyze', error);
    return createErrorResponse(error, 500, 'analyze');
  }
} 