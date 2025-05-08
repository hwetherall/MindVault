import { NextRequest, NextResponse } from 'next/server';
import { callOpenRouterAPI } from '../openrouter-client';

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
The available information suggests further investigation is needed. Please try again later or use the Analyst feature as an alternative.

## Recommended Next Steps
Additional Analyst Research Required
1. What are the key financial metrics for this company over the past 3 years?
2. What is the competitive landscape and how does this company differentiate?
3. What is the total addressable market and expected growth rate?`;
};

/**
 * API route to analyze analyst answers from a VC associate perspective using OpenRouter API
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  console.log('[Associate Analysis] Request received');
  
  try {
    // Get the request body
    const body = await req.json();
    const { category, questions, answers, files } = body;
    
    console.log(`[Associate Analysis] Processing ${category} request with ${questions?.length || 0} questions`);
    
    if (!category || !questions || !answers) {
      return NextResponse.json(
        { error: 'Category, questions, and answers are required' },
        { status: 400 }
      );
    }
    
    // Group questions by original and follow-up
    const originalQuestions: string[] = [];
    const followUpQuestions: string[] = [];
    
    questions.forEach((question: string) => {
      const answer = answers[question];
      if (answer && answer.isFollowUp) {
        followUpQuestions.push(question);
      } else {
        originalQuestions.push(question);
      }
    });
    
    // Prepare questions and answers for the prompt
    let questionsAndAnswers = '';
    
    // First add original questions
    originalQuestions.forEach((question: string, index: number) => {
      const answer = answers[question] || { answer: 'No answer provided' };
      
      questionsAndAnswers += `
Original Question ${index + 1}: ${question}

Original Answer ${index + 1}:
${answer.answer || 'No answer provided'}
-------------------
`;
    });
    
    // Then add follow-up questions if any exist
    if (followUpQuestions.length > 0) {
      questionsAndAnswers += `
FOLLOW-UP QUESTIONS AND ANSWERS:
`;
      
      followUpQuestions.forEach((question: string, index: number) => {
        const answer = answers[question] || { answer: 'No answer provided' };
        
        questionsAndAnswers += `
Follow-up Question ${index + 1}: ${question}

Follow-up Answer ${index + 1}:
${answer.answer || 'No answer provided'}
-------------------
`;
      });
    }
    
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
    
    // Add information about follow-up questions to the prompt
    const followUpContext = followUpQuestions.length > 0 
      ? `\nNOTE: The analyst has provided follow-up information based on previous questions. Please evaluate the COMPLETE set of information (original + follow-up answers) when making your assessment.` 
      : '';
    
    // Construct the prompt for the AI
    const prompt = `
You are a highly skilled VC associate at a top-tier firm like Sequoia or A16Z. You've been asked to review an analyst's work on this investment opportunity.

The main question being addressed is: "${mainQuestion}"${followUpContext}

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
- NEVER use headings or subheadings within each main section. Write in plain text with optional bold formatting.
- DO NOT use "###" or "##" for headings within the main sections.

Provide your review in a formal, structured format WITHOUT any conversational elements. Do NOT include any introductions like "Dear Senior Partner" or explanatory paragraphs about what you're going to do. 

Start your analysis immediately with the heading structures below:

## Sense Check
Assessment: [Good/Needs Improvement]
[Direct analysis of logical consistency without any internal headings, focusing ONLY on ${category} aspects]

## Completeness Check
Score: [1-10]/10
[Thorough analysis of information completeness with clear justification for score]
[List specific information gaps or inconsistencies]
[Identify key metrics or data points that are missing]
[If score is below 8, be explicit about what critical information is needed]

## Quality Check
[Based ONLY on the information provided about ${category}

## Recommended Next Steps
[Based on your analysis above, recommend ONE of the following options:]
${category === 'Finances' 
  ? '1. If score is 8 or higher AND the information is logically consistent: "Proceed to Partner Review - Financial analysis is sufficient for investment decision."'
  : '1. If score is 8 or higher AND the information is logically consistent: "Proceed to Partner Review - Market analysis is sufficient for investment decision."'}
2. If score is below 8 OR information is inconsistent: "Additional Analyst Research Required" followed by up to THREE specific follow-up questions you would ask the analyst to address the most critical information gaps.

Make your analysis focused, concise, and direct. Do not include ANY salutations, introductions, or conclusion paragraphs.
`;
    
    try {
      console.log('[Associate Analysis] Calling OpenRouter API');
      // Use the shared OpenRouter API client
      const analysis = await callOpenRouterAPI([
        { 
          role: 'system', 
          content: 'You are a skilled VC associate providing structured analysis of investment opportunities without conversational elements. Focus ONLY on the specific domain you are analyzing (Finances or Market Research) and do not mention or be concerned about missing information from other domains. NEVER include your reasoning process, self-corrections, or thought processes in your response. Only provide your final analysis in the required format without any intermediate thinking.'
        },
        { role: 'user', content: prompt }
      ], 'anthropic/claude-3.7-sonnet');
      
      const processingTime = (Date.now() - startTime) / 1000;
      console.log(`[Associate Analysis] Success - Processing time: ${processingTime}s`);
      
      return NextResponse.json({ analysis });
    } catch (openRouterError) {
      // Handle OpenRouter API errors by providing a fallback response
      console.error('[Associate Analysis] OpenRouter API error:', openRouterError);
      
      // Generate a fallback response
      const fallbackAnalysis = generateFallbackResponse(category);
      
      // Log the fallback response
      console.log('[Associate Analysis] Providing fallback response due to OpenRouter API error');
      
      // Return the fallback response with a 200 status
      return NextResponse.json({ 
        analysis: fallbackAnalysis,
        fallback: true
      });
    }
  } catch (error) {
    const processingTime = (Date.now() - startTime) / 1000;
    console.error(`[Associate Analysis] Error (${processingTime}s):`, error);
    
    // @ts-ignore
    const errorMessage = error instanceof Error ? error.message : 'Failed to process associate analysis';
    console.error('[Associate Analysis] Error message:', errorMessage);
    
    return NextResponse.json(
      { 
        error: errorMessage,
        fallback: true,
        // @ts-ignore
        analysis: generateFallbackResponse(error.category || 'this domain') 
      },
      { status: 200 } // Return 200 with fallback content instead of 500
    );
  }
} 