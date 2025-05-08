import { NextRequest, NextResponse } from 'next/server';
import { callOpenRouterAPI } from '../openrouter-client';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log('[Process Follow-Up] Request received');
  
  try {
    // Get the request body
    const body = await req.json();
    const { category, originalQuestions, followUpQuestions, originalAnswers, followUpAnswers } = body;
    
    if (!category || !originalQuestions || !followUpQuestions || !originalAnswers || !followUpAnswers) {
      return NextResponse.json(
        { error: 'Required parameters are missing' },
        { status: 400 }
      );
    }
    
    console.log(`[Process Follow-Up] Processing ${followUpQuestions.length} follow-up questions for ${category}`);
    
    // Prepare the data for the consolidation prompt
    let questionsAndAnswers = '';
    
    // Add original questions and answers
    questionsAndAnswers += '## ORIGINAL ANALYSIS:\n\n';
    originalQuestions.forEach((question: string, index: number) => {
      const answer = originalAnswers[question] || { answer: 'No answer provided' };
      
      questionsAndAnswers += `
Original Question ${index + 1}: ${question}

Original Answer ${index + 1}:
${answer.answer || 'No answer provided'}
-------------------
`;
    });
    
    // Add follow-up questions and answers
    questionsAndAnswers += '\n\n## FOLLOW-UP ANALYSIS:\n\n';
    followUpQuestions.forEach((question: string, index: number) => {
      const answer = followUpAnswers[question] || { answer: 'No answer provided' };
      
      questionsAndAnswers += `
Follow-up Question ${index + 1}: ${question}

Follow-up Answer ${index + 1}:
${answer.answer || 'No answer provided'}
-------------------
`;
    });
    
    // Build the prompt for consolidation
    const prompt = `
As an AI investment analyst, your task is to consolidate original investment research with follow-up analysis into a comprehensive, cohesive document.

CATEGORY: ${category}

${questionsAndAnswers}

Your task is to create a consolidated analysis that:
1. Combines the original analysis with the follow-up information
2. Resolves any contradictions between the original and follow-up information
3. Creates a complete, coherent analysis that flows naturally
4. Preserves all key insights from both the original and follow-up research
5. Avoids unnecessary repetition

Structure your response in the following format for EACH original question:

## CONSOLIDATED ANSWER FOR: [Original Question]

[Your consolidated answer that incorporates both the original information and relevant follow-up details]

Maintain the original formatting, including headers, bullet points, and section divisions where appropriate.
`;
    
    try {
      console.log('[Process Follow-Up] Calling OpenRouter API');
      // Use the shared OpenRouter API client
      const consolidatedAnalysis = await callOpenRouterAPI([
        { 
          role: 'system', 
          content: 'You are an AI investment analyst specializing in consolidating investment research. Your goal is to create cohesive, comprehensive analysis by merging original research with follow-up information into a logical, well-structured document that maintains all key insights while avoiding repetition.'
        },
        { role: 'user', content: prompt }
      ], 'anthropic/claude-3.7-sonnet');
      
      const processingTime = (Date.now() - startTime) / 1000;
      console.log(`[Process Follow-Up] Success - Processing time: ${processingTime}s`);
      
      return NextResponse.json({ 
        consolidatedAnalysis,
        processingTime
      });
    } catch (error) {
      console.error('[Process Follow-Up] Error calling OpenRouter API:', error);
      return NextResponse.json(
        { error: 'Failed to process follow-up questions. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Process Follow-Up] Error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
} 