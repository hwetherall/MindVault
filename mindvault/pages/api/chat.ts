import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAI } from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? '';

if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is required');
}

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { message, notes } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        // Create context from notes
        const context = Array.isArray(notes) 
            ? notes
                .map((note: any) => `${note.title}:\n${note.content}`)
                .join('\n\n')
            : '';

        // Combine system instructions with user message for o3-mini
        const systemInstructions = "You are a helpful assistant analyzing investment documents. Provide clear, concise answers based on the available information.";
        const userMessage = `${systemInstructions}\n\nContext:\n${context}\n\nQuestion: ${message}`;

        const completion = await openai.chat.completions.create({
            model: "o3-mini",
            messages: [
                { 
                    role: "user", // Only using user role
                    content: userMessage
                }
            ],
            temperature: 1,
            max_tokens: 8000,
        });

        const aiResponse = completion.choices[0]?.message?.content || 'No response generated';
        return res.status(200).json({ response: aiResponse });
    } catch (error: any) {
        console.error('Error in chat API:', error);
        
        // Handle different types of errors
        if (error.name === 'APIError') {
            return res.status(500).json({ 
                message: 'Error from OpenAI API',
                error: error.message,
                type: 'api_error'
            });
        } else if (error.name === 'AuthenticationError') {
            console.error('API key error - check your environment variables');
            return res.status(500).json({ 
                message: 'Authentication error with AI service',
                type: 'auth_error'
            });
        } else if (error.name === 'RateLimitError') {
            return res.status(429).json({ 
                message: 'Rate limit exceeded with AI service',
                type: 'rate_limit_error'
            });
        } else if (error.name === 'TimeoutError' || error.code === 'ETIMEDOUT') {
            return res.status(504).json({ 
                message: 'Request to AI service timed out',
                type: 'timeout_error'
            });
        }
        
        // General errors
        return res.status(500).json({ 
            message: 'Error processing request',
            error: error instanceof Error ? error.message : 'Unknown error',
            type: 'general_error'
        });
    }
}