import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { message, notes } = req.body;

        // Create context from notes
        const context = notes
            .map((note: any) => `${note.title}:\n${note.content}`)
            .join('\n\n');

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { 
                    role: "system", 
                    content: "You are a helpful assistant analyzing investment documents. Provide clear, concise answers based on the available information." 
                },
                { 
                    role: "user", 
                    content: `Context:\n${context}\n\nQuestion: ${message}` 
                }
            ],
        });

        const aiResponse = completion.choices[0]?.message?.content || 'No response generated';
        return res.status(200).json({ response: aiResponse });
    } catch (error) {
        console.error('Error in chat API:', error);
        return res.status(500).json({ 
            message: 'Error processing request',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
} 