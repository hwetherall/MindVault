import { NextRequest, NextResponse } from 'next/server';
import { callOpenRouterAPI } from '../openrouter-client';
import { buildAssociatePrompt, getAssociateSystemMessage } from '../../prompts/associate';
import { createErrorResponse, createFallbackResponse } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';

/**
 * Fallback response when OpenRouter API fails
 */
const generateFallbackResponse = (category: string) => {
  return `## Sense Check
Assessment: Needs Improvement

Due to technical limitations, I couldn't complete a full analysis. The system is experiencing temporary connectivity issues with our AI provider.

## Completeness Check
Score: 5/10

Additional information needed:
- Complete financial metrics (if reviewing Finances)
- Market size and growth data (if reviewing Market Research)
- Competitive landscape analysis

## Quality Check
The available information suggests further investigation is needed. Please try again later or use the Analyst feature as an alternative.`;
};

/**
 * API route to analyze analyst answers from a VC associate perspective using OpenRouter API
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestLogger = logger;
  requestLogger.setRequestId(requestLogger.generateRequestId());
  requestLogger.processingStart('associate-analysis');
  
  try {
    // Get the request body
    const body = await req.json();
    const { category, questions, answers, files } = body;
    
    requestLogger.info(`Processing ${category} associate analysis`, { questionCount: questions?.length || 0 });
    
    if (!category || !questions || !answers) {
      return NextResponse.json(
        { error: 'Category, questions, and answers are required' },
        { status: 400 }
      );
    }
    
    // Prepare questions and answers for the prompt
    const questionsAndAnswers = questions.map((question: string) => {
      const answer = answers[question] || { answer: 'No answer provided' };
      return {
        question,
        answer: answer.answer || 'No answer provided'
      };
    });
    
    // Get pitch deck content if available
    let pitchDeckContent = 'No pitch deck found.';
    if (files && files.length > 0) {
      // Look for pitch deck file
      const pitchDeckFile = files.find((file: any) => 
        file.name.toLowerCase().includes('pitch') || 
        file.name.toLowerCase().includes('deck') || 
        file.name.toLowerCase().includes('presentation')
      );
      
      if (pitchDeckFile) {
        pitchDeckContent = `
Pitch Deck: ${pitchDeckFile.name}
${pitchDeckFile.content ? pitchDeckFile.content.substring(0, 3000) + '...' : 'Content not available'}
`;
      }
    }
    
    // Get the main question based on category
    const mainQuestion = category === 'Finances' 
      ? 'Is this company financially viable?' 
      : 'Is this market worthwhile entering?';
    
    // Construct the prompt using standardized template
    const prompt = buildAssociatePrompt({
      category: category as 'Finances' | 'Market Research',
      mainQuestion,
      questionsAndAnswers,
      pitchDeckContent
    });
    
    try {
      requestLogger.apiCall('openrouter.ai', 'POST', { category, model: 'x-ai/grok-3-beta' });
      
      // Use the shared OpenRouter API client
      const analysis = await callOpenRouterAPI([
        { 
          role: 'system', 
          content: getAssociateSystemMessage(category)
        },
        { role: 'user', content: prompt }
      ], 'x-ai/grok-3-beta');
      
      const processingTime = Date.now() - startTime;
      requestLogger.processingComplete('associate-analysis', processingTime);
      requestLogger.apiResponse('openrouter.ai', 200, processingTime);
      
      return NextResponse.json({ analysis });
    } catch (openRouterError) {
      requestLogger.processingError('associate-analysis', openRouterError);
      
      // Generate a fallback response
      const fallbackAnalysis = generateFallbackResponse(category);
      
      return createFallbackResponse('associate-analysis', fallbackAnalysis, openRouterError);
    }
  } catch (error) {
    requestLogger.processingError('associate-analysis', error);
    return createErrorResponse(error, 500, 'associate-analysis');
  }
} 