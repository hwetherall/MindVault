import { NextRequest, NextResponse } from 'next/server';
import { callOpenRouterAPI } from '../openrouter-client';
import { buildPedramPrompt, PEDRAM_SYSTEM_MESSAGE } from '../../prompts/pedram';
import { createErrorResponse } from '../../utils/errorHandler';
import { logger } from '../../utils/logger';
import fs from 'fs';
import path from 'path';

/**
 * API route to provide the final Pedram decision based on both associate analyses
 */
export async function POST(req: NextRequest) {
  const requestLogger = logger;
  requestLogger.setRequestId(requestLogger.generateRequestId());
  requestLogger.processingStart('pedram-decision');
  
  try {
    // Get the request body
    const body = await req.json();
    const { financeAnalysis, marketAnalysis, files, model, benchmarkEnabled, benchmarkCompanyId } = body;
    
    // Use the model specified in the request, or default to grok-3-beta if not provided
    const modelToUse = model || "x-ai/grok-3-beta";
    
    requestLogger.info(`Processing Pedram decision`, { model: modelToUse, benchmarkEnabled });
    
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
    
    // Get benchmark company name from ID
    let benchmarkCompanyName = 'the benchmark company';
    let benchmarkData: any = undefined;
    
    if (benchmarkEnabled && benchmarkCompanyId) {
      const nameMap: Record<string, string> = {
        'stop2': 'Stop2',
        'industry_average': 'Industry Average',
        'learnify': 'Learnify',
        'edupath': 'EduPath',
        'traininghub': 'TrainingHub'
      };
      benchmarkCompanyName = nameMap[benchmarkCompanyId] || 'the benchmark company';
      
      try {
        const benchmarkPath = path.join(process.cwd(), 'app', 'components', 'features', 'investment-memo', 'data', 'benchmark.json');
        benchmarkData = JSON.parse(fs.readFileSync(benchmarkPath, 'utf8'));
      } catch (error) {
        requestLogger.warn('Failed to load benchmark data', { error: error instanceof Error ? error.message : String(error) });
      }
    }
    
    // Construct the prompt using standardized template
    const prompt = buildPedramPrompt({
      financeAnalysis,
      marketAnalysis,
      pitchDeckContent,
      benchmarkEnabled,
      benchmarkData,
      benchmarkCompanyName: benchmarkEnabled ? benchmarkCompanyName : undefined
    });
    
    const startTime = Date.now();
    requestLogger.apiCall('openrouter.ai', 'POST', { model: modelToUse });
    
    // Use the shared OpenRouter API client with the specified model
    const decision = await callOpenRouterAPI([
      { role: 'system', content: PEDRAM_SYSTEM_MESSAGE },
      { role: 'user', content: prompt }
    ], modelToUse, 0.4, 2000);
    
    const duration = Date.now() - startTime;
    requestLogger.processingComplete('pedram-decision', duration);
    requestLogger.apiResponse('openrouter.ai', 200, duration);
    
    return NextResponse.json({ decision });
  } catch (error) {
    requestLogger.processingError('pedram-decision', error);
    return createErrorResponse(error, 500, 'pedram-decision');
  }
} 