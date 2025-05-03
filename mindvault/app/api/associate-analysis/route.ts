import { NextRequest, NextResponse } from 'next/server';
import { callOpenRouterAPI } from '../openrouter-client';

/**
 * API route to analyze analyst answers from a VC associate perspective using OpenRouter API
 */
export async function POST(req: NextRequest) {
  try {
    // Get the request body
    const body = await req.json();
    const { category, questions, answers, files } = body;
    
    if (!category || !questions || !answers) {
      return NextResponse.json(
        { error: 'Category, questions, and answers are required' },
        { status: 400 }
      );
    }
    
    // Prepare questions and answers for the prompt
    let questionsAndAnswers = '';
    questions.forEach((question: string, index: number) => {
      const answer = answers[question] || { answer: 'No answer provided' };
      
      questionsAndAnswers += `
Question ${index + 1}: ${question}

Answer ${index + 1}:
${answer.answer || 'No answer provided'}
-------------------
`;
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
    
    // Construct the prompt for the AI
    const prompt = `
You are a highly skilled VC associate at a top-tier firm like Sequoia or A16Z. You've been asked to review an analyst's work on this investment opportunity.

The main question being addressed is: "${mainQuestion}"

Below are the analyst's findings based on the company's documents:

${questionsAndAnswers}

For context, here is some information from the company's pitch deck:
${pitchDeckContent}

IMPORTANT INSTRUCTION:
- Focus SOLELY on the topic at hand (${category}).
- Do NOT mention or be concerned about missing information from other domains (like finances, team, product, etc.) outside your specific focus area.
- If working on Finances, only evaluate financial information without worrying about market data.
- If working on Market Research, only evaluate market information without worrying about financial metrics.
- Your job is domain-specific expertise, not cross-domain analysis.

Provide your review in a formal, structured format WITHOUT any conversational elements. Do NOT include any introductions like "Dear Senior Partner" or explanatory paragraphs about what you're going to do. 

Start your analysis immediately with the heading structures below:

## Sense Check
Assessment: [Good/Needs Improvement]
[Direct analysis of logical consistency without any introductory text, focusing ONLY on ${category} aspects]

## Completeness Check
Score: [1-10]/10
[Analysis of whether there's enough evidence to answer the main question about ${category}]
[If the score is below 8, specify what additional ${category} information would be needed]

## Quality Check
[Based ONLY on the information provided about ${category}, your assessment of strengths and risks]

Make your analysis focused, concise, and direct. Do not include ANY salutations, introductions, or conclusion paragraphs.
`;
    
    // Use the shared OpenRouter API client
    const analysis = await callOpenRouterAPI([
      { 
        role: 'system', 
        content: 'You are a skilled VC associate providing structured analysis of investment opportunities without conversational elements. Focus ONLY on the specific domain you are analyzing (Finances or Market Research) and do not mention or be concerned about missing information from other domains.'
      },
      { role: 'user', content: prompt }
    ], 'x-ai/grok-3-beta');
    
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error processing associate analysis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process associate analysis';
    console.error('Error message:', errorMessage);
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 