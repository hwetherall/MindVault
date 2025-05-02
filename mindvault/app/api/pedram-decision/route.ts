import { NextRequest, NextResponse } from 'next/server';
import { callOpenRouterAPI } from '../openrouter-client';
import fs from 'fs';
import path from 'path';

/**
 * API route to provide the final Pedram decision based on both associate analyses
 */
export async function POST(req: NextRequest) {
  try {
    // Get the request body
    const body = await req.json();
    const { financeAnalysis, marketAnalysis, files, model, benchmarkEnabled, benchmarkCompanyId } = body;
    
    // Use the model specified in the request, or default to grok-3-beta if not provided
    const modelToUse = model || "x-ai/grok-3-beta";
    
    console.log(`Using model: ${modelToUse} for Pedram decision`);
    
    if (!financeAnalysis || !marketAnalysis) {
      return NextResponse.json(
        { error: 'Both finance and market analyses are required' },
        { status: 400 }
      );
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
    
    // Load benchmark data if enabled
    let benchmarkContent = '';
    let benchmarkCompanyName = 'the benchmark company';
    
    if (benchmarkEnabled) {
      try {
        // Use the benchmark.json file from the components directory
        const benchmarkPath = path.join(process.cwd(), 'app', 'components', 'features', 'investment-memo', 'data', 'benchmark.json');
        const benchmarkData = JSON.parse(fs.readFileSync(benchmarkPath, 'utf8'));
        
        // Get company name from ID (only Stop2 actually works)
        if (benchmarkCompanyId === 'stop2') {
          benchmarkCompanyName = 'Stop2';
        } else if (benchmarkCompanyId === 'industry_average') {
          benchmarkCompanyName = 'Industry Average';
        } else if (benchmarkCompanyId === 'learnify') {
          benchmarkCompanyName = 'Learnify';
        } else if (benchmarkCompanyId === 'edupath') {
          benchmarkCompanyName = 'EduPath';
        } else if (benchmarkCompanyId === 'traininghub') {
          benchmarkCompanyName = 'TrainingHub';
        }
        
        benchmarkContent = `
## BENCHMARK DATA
The following is data about a competitor company called ${benchmarkCompanyName}, which is being used for benchmark comparison against Go1.

${JSON.stringify(benchmarkData, null, 2)}
`;
      } catch (error) {
        console.error('Error loading benchmark data:', error);
        benchmarkContent = 'Error loading benchmark data.';
      }
    }
    
    // Construct the prompt for the AI
    const prompt = `
You are Pedram, a highly experienced VC Partner at a prestigious Silicon Valley firm. You are making the final decision about whether to move forward with this investment opportunity.

You have two analyses from your associates:

FINANCE ANALYSIS:
${financeAnalysis}

MARKET ANALYSIS:
${marketAnalysis}

For context, here is some information from the company's pitch deck:
${pitchDeckContent}
${benchmarkEnabled ? benchmarkContent : ''}

Based on this information, provide your decision on whether this company should move to the next stage. Structure your response as follows:

## Reasons to Move Forward
- Provide 3-5 compelling reasons why this company might be a good investment
- Be specific, referencing insights from both analyses
- Focus on the strongest points that support moving forward

## Reasons Not to Move Forward
- Provide 3-5 significant concerns or red flags about this investment
- Be specific, referencing insights from both analyses
- Focus on the most critical issues that could be deal-breakers

${benchmarkEnabled ? `
## Benchmark Comparison
Compare Go1 to ${benchmarkCompanyName} across various criteria:
- Compare financial metrics (ARR, growth rate, valuation, burn rate, runway)
- Compare market positioning and strategy
- Compare funding history and efficiency
- Identify which company is stronger/weaker in each area
- Provide a conclusion about their relative competitive positions
` : ''}

## Decision
Clearly state your decision on whether the company should proceed to the next stage. This should be a definitive "Yes" or "No" with a brief explanation of your reasoning.

## Key Questions
Provide 2-3 incisive, high-quality questions that should be asked before making a final commitment. These should be thoughtful questions that Marc Andreessen or Peter Thiel might ask - questions that cut to the heart of the business model, market opportunity, or competitive advantage.

IMPORTANT: Do not include any introduction or summary paragraph at the beginning of your response. Start directly with the "Reasons to Move Forward" section.

Make your assessment direct, insightful, and decisive as a top-tier VC partner would.
`;
    
    // Use the shared OpenRouter API client with the specified model
    const decision = await callOpenRouterAPI([
      { role: 'system', content: 'You are Pedram, a highly experienced VC Partner making the final investment decision. Skip any introduction and start directly with the structured analysis.' },
      { role: 'user', content: prompt }
    ], modelToUse, 0.4, 2000);
    
    return NextResponse.json({ decision });
  } catch (error) {
    console.error('Error processing Pedram decision:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process Pedram decision';
    console.error('Error message:', errorMessage);
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 