import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const chatService = {
  async sendMessage(message, files) {
    try {
      // Create context from files with content
      const context = files
        .filter(file => file.content)
        .map(file => `Document: ${file.name}\n${file.content}\n---\n`)
        .join('\n');

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an AI assistant analyzing these documents:\n\n${context}\n\nProvide answers based on the document content. If the information isn't in the documents, say so.`
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Chat error:', error);
      throw new Error('Failed to get AI response');
    }
  }
};