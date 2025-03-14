import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Check for API key - using server-side environment variable
const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  throw new Error('GROQ_API_KEY is not set in environment variables');
}

// Initialize Groq client
const groq = new Groq({
  apiKey
});

export const maxDuration = 300; // Set maximum duration to 5 minutes
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
        summary: a.summary,
        details: a.details
      }))
    ];

    // Create a single prompt for batch translation
    const prompt = `
      Translate the following content from English to Japanese. 
      Maintain the same formatting, including markdown syntax.
      You MUST NOT translate any numbers, currency, technical terms, company names, file names, or any other specific information. Keep quotation marks and double quotes as is, including their content. 
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
            "summary": "translated summary",
            "details": "translated details"
          }
        ]
      }

      Content to translate:
      ${JSON.stringify(textToTranslate, null, 2)}
    `;

    const completion = await groq.chat.completions.create({
      model: "deepseek-r1-distill-llama-70b",
      messages: [
        {
          role: "system",
          content: "You are a professional translator specializing in business and technical content translation between English and Japanese. You must always return valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 120000 // Staying within Groq's model limits
    });

    let translatedContent;
    try {
      const content = completion.choices[0].message.content || '{}';
      // Try to extract JSON if the response contains it
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : content;
      translatedContent = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.log('Raw response content:', completion.choices[0].message.content);
      throw new Error('Failed to parse translation response');
    }

    // Process and structure the translated content
    const result = {
      title: translatedContent.title || content.title,
      description: translatedContent.description || content.description,
      questions: content.questions.map((q: any) => {
        const translated = translatedContent.questions?.find((tq: any) => tq.id === q.id);
        return {
          id: q.id,
          question: translated?.text || q.question,
          description: translated?.description || q.description,
          category: q.category // Modify if a translated category title is desired
        };
      }), 
      answers: content.answers.reduce((acc: any, a: any) => {
        const translated = translatedContent.answers?.find((ta: any) => ta.id === a.id);
        return {
          ...acc,
          [a.id]: {
            summary: translated?.summary || a.summary,
            details: translated?.details || a.details,
            isEdited: a.isEdited
          }
        };
      }, {})
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