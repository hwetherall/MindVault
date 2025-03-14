import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Check for API key - using server-side environment variable
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

// Extract project ID from the API key if it's a project-based key
// Project-based keys start with "sk-proj-"
if (apiKey.startsWith('sk-proj-')) {
  // The project ID is embedded in the key
  // We don't need to extract it, the OpenAI client will handle it
  console.log('Using project-based API key');
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey
});

export const maxDuration = 60; // Set maximum duration to 5 minutes
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { content, targetLanguage } = await request.json();

    if (targetLanguage !== 'ja') {
      throw new Error('Unsupported target language');
    }

    // Prepare the content for batch translation
    const textToTranslate = [
      { type: 'title', text: content.title },
      { type: 'description', text: content.description },
      ...content.questions.map((q: any) => ({
        type: 'question',
        id: q.id,
        text: q.question,
        description: q.description
      })),
      ...content.answers.map((a: any) => ({
        type: 'answer',
        id: a.id,
        text: a.content
      }))
    ];

    // Create a single prompt for batch translation
    const prompt = `
      Translate the following content from English to Japanese. 
      Maintain the same formatting, including markdown syntax and special sections like "TL;DR:" and "DETAILS:".
      You MUST NOT translate any numbers, currency, technical terms, company names, file names, or any other specific information. Keep quotation marks as is.
      Return the translations in JSON format with the following structure:
      {
        "title": "translated title",
        "description": "translated description",
        "questions": [
          {
            "id": "original id",
            "text": "translated question",
            "description": "translated description"
          }
        ],
        "answers": [
          {
            "id": "original id",
            "text": "translated content"
          }
        ]
      }

      Content to translate:
      ${JSON.stringify(textToTranslate, null, 2)}
    `;

    const completion = await openai.chat.completions.create({
      model: "o3-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional translator specializing in business and technical content translation between English and Japanese."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const translatedContent = JSON.parse(completion.choices[0].message.content || '{}');

    // Process and structure the translated content
    const result = {
      title: translatedContent.title || content.title,
      description: translatedContent.description || content.description,
      questions: content.questions.map((q: any) => {
        const translated = translatedContent.questions?.find((tq: any) => tq.id === q.id);
        return {
          id: q.id,
          question: translated?.text || q.question,
          description: translated?.description || q.description
        };
      }),
      answers: content.answers.map((a: any) => {
        const translated = translatedContent.answers?.find((ta: any) => ta.id === a.id);
        return {
          id: a.id,
          content: translated?.text || a.content
        };
      })
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed', details: (error as Error).message },
      { status: 500 }
    );
  }
} 