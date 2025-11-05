/**
 * Error handling utilities
 * Provides user-friendly error messages and error types
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';

export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  API_ERROR = 'API_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  CONTEXT_LENGTH_ERROR = 'CONTEXT_LENGTH_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ErrorResponse {
  error: string;
  type: ErrorType;
  message: string;
  suggestion?: string;
  details?: string;
  fallback?: boolean;
}

/**
 * Get user-friendly error message and suggestion
 */
function getErrorInfo(error: Error | unknown, context?: string): { message: string; suggestion: string; type: ErrorType } {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Rate limit / capacity errors
  if (lowerMessage.includes('rate_limit') || lowerMessage.includes('capacity') || lowerMessage.includes('429')) {
    return {
      message: 'The AI service is currently busy. Please try again in a moment.',
      suggestion: 'Wait 30 seconds and try again. If the issue persists, try using Fast Mode.',
      type: ErrorType.RATE_LIMIT_ERROR
    };
  }

  // Context length errors
  if (lowerMessage.includes('context length') || lowerMessage.includes('maximum context length') || lowerMessage.includes('token limit')) {
    return {
      message: 'The documents are too large to process in a single request.',
      suggestion: 'Try asking about a more specific section of the documents, or use smaller documents.',
      type: ErrorType.CONTEXT_LENGTH_ERROR
    };
  }

  // Authentication errors
  if (lowerMessage.includes('authentication') || lowerMessage.includes('api key') || lowerMessage.includes('401') || lowerMessage.includes('unauthorized')) {
    return {
      message: 'Authentication failed. Please check your API configuration.',
      suggestion: 'Verify that your API keys are correctly configured in the environment variables.',
      type: ErrorType.AUTHENTICATION_ERROR
    };
  }

  // Model not found errors
  if (lowerMessage.includes('not found') || lowerMessage.includes('model not found') || lowerMessage.includes('404')) {
    return {
      message: 'The requested AI model is not available.',
      suggestion: 'Try a different model or check if the model name is correct.',
      type: ErrorType.API_ERROR
    };
  }

  // Network errors
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('connection')) {
    return {
      message: 'Network connection error. Please check your internet connection.',
      suggestion: 'Check your internet connection and try again. If the problem persists, the service may be temporarily unavailable.',
      type: ErrorType.NETWORK_ERROR
    };
  }

  // Timeout errors
  if (lowerMessage.includes('timeout') || lowerMessage.includes('aborted')) {
    return {
      message: 'The request took too long to process.',
      suggestion: 'Try using Fast Mode for quicker responses, or ask a simpler question.',
      type: ErrorType.TIMEOUT_ERROR
    };
  }

  // Default error
  return {
    message: 'An unexpected error occurred while processing your request.',
    suggestion: 'Please try again. If the problem persists, try rephrasing your question or using Fast Mode.',
    type: ErrorType.UNKNOWN_ERROR
  };
}

/**
 * Create error response for API routes
 */
export function createErrorResponse(
  error: Error | unknown,
  statusCode: number = 500,
  context?: string
): NextResponse<ErrorResponse> {
  const errorInfo = getErrorInfo(error, context);
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Log the error
  logger.error(`Error in ${context || 'API route'}`, error, { type: errorInfo.type });

  return NextResponse.json(
    {
      error: errorInfo.message,
      type: errorInfo.type,
      message: errorInfo.message,
      suggestion: errorInfo.suggestion,
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    },
    { status: statusCode }
  );
}

/**
 * Create fallback response (for graceful degradation)
 */
export function createFallbackResponse(
  operation: string,
  fallbackContent: string,
  error?: Error | unknown
): NextResponse<{ answer?: string; analysis?: string; decision?: string; fallback: boolean; error?: string }> {
  if (error) {
    logger.warn(`Using fallback response for ${operation}`, { error: error instanceof Error ? error.message : String(error) });
  }

  const response: any = { fallback: true };
  
  if (operation.includes('analyze') || operation.includes('question')) {
    response.answer = fallbackContent;
  } else if (operation.includes('associate')) {
    response.analysis = fallbackContent;
  } else if (operation.includes('pedram') || operation.includes('decision')) {
    response.decision = fallbackContent;
  }

  if (error) {
    response.error = error instanceof Error ? error.message : String(error);
  }

  return NextResponse.json(response, { status: 200 });
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error | unknown): boolean {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const lowerMessage = errorMessage.toLowerCase();

  // Retryable errors
  const retryablePatterns = [
    'rate_limit',
    'capacity',
    'timeout',
    'network',
    'connection',
    '429',
    '503',
    '502'
  ];

  return retryablePatterns.some(pattern => lowerMessage.includes(pattern));
}

/**
 * Validation error helper
 */
export function createValidationError(field: string, message: string): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: `Validation error: ${field}`,
      type: ErrorType.VALIDATION_ERROR,
      message,
      suggestion: `Please provide a valid ${field}.`
    },
    { status: 400 }
  );
}

