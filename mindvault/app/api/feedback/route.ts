/**
 * API route for collecting user feedback on answers
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../../utils/logger';

export interface FeedbackRequest {
  questionId: string;
  answerId?: string;
  feedback: 'positive' | 'negative' | 'flag';
  comment?: string;
  answerText?: string;
  questionText?: string;
}

/**
 * Store feedback (in production, this would save to a database)
 */
async function storeFeedback(feedback: FeedbackRequest): Promise<void> {
  // In production, save to database
  // For now, just log it
  logger.info('User feedback received', {
    questionId: feedback.questionId,
    feedback: feedback.feedback,
    hasComment: !!feedback.comment
  });

  // In production, you might save to Supabase or another database:
  // await supabase.from('feedback').insert({
  //   question_id: feedback.questionId,
  //   answer_id: feedback.answerId,
  //   feedback_type: feedback.feedback,
  //   comment: feedback.comment,
  //   created_at: new Date().toISOString()
  // });
}

export async function POST(req: NextRequest) {
  const requestLogger = logger;
  requestLogger.setRequestId(requestLogger.generateRequestId());

  try {
    const body: FeedbackRequest = await req.json();
    const { questionId, feedback, comment, answerId } = body;

    if (!questionId || !feedback) {
      return NextResponse.json(
        { error: 'questionId and feedback are required' },
        { status: 400 }
      );
    }

    if (!['positive', 'negative', 'flag'].includes(feedback)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      );
    }

    await storeFeedback(body);

    requestLogger.info('Feedback stored successfully', { questionId, feedback });

    return NextResponse.json({ 
      success: true,
      message: 'Thank you for your feedback!' 
    });
  } catch (error) {
    requestLogger.processingError('feedback', error);
    return NextResponse.json(
      { error: 'Failed to store feedback' },
      { status: 500 }
    );
  }
}

/**
 * Get feedback statistics (for admin/debugging)
 */
export async function GET(req: NextRequest) {
  const requestLogger = logger;
  requestLogger.setRequestId(requestLogger.generateRequestId());

  try {
    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get('questionId');

    // In production, fetch from database
    // For now, return empty stats
    return NextResponse.json({
      questionId,
      totalFeedback: 0,
      positive: 0,
      negative: 0,
      flags: 0
    });
  } catch (error) {
    requestLogger.processingError('feedback-get', error);
    return NextResponse.json(
      { error: 'Failed to retrieve feedback' },
      { status: 500 }
    );
  }
}

