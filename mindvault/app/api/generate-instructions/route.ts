import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Try to initialize OpenAI client, but provide fallback if environment variable is missing
let client: OpenAI | null = null;
try {
  client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
} catch (error) {
  console.error('Error initializing OpenAI client:', error);
}

const META_PROMPT = `
Given a task description or existing prompt, produce a detailed system prompt to guide a language model in completing the task effectively.

# Guidelines

- Understand the Task: Grasp the main objective, goals, requirements, constraints, and expected output.
- Reasoning Before Conclusions**: Encourage reasoning steps before any conclusions are reached. ATTENTION! If the user provides examples where the reasoning happens afterward, REVERSE the order! NEVER START EXAMPLES WITH CONCLUSIONS!
    - Reasoning Order: Call out reasoning portions of the prompt and conclusion parts (specific fields by name). For each, determine the ORDER in which this is done, and whether it needs to be reversed.
    - Conclusion, classifications, or results should ALWAYS appear last.
- Examples: Include high-quality examples if helpful, using placeholders [in brackets] for complex elements.
   - What kinds of examples may need to be included, how many, and whether they are complex enough to benefit from placeholders.
- Clarity and Conciseness: Use clear, specific language. Avoid unnecessary instructions or bland statements.
- Formatting: Use markdown features for readability. DO NOT USE \`\`\` CODE BLOCKS UNLESS SPECIFICALLY REQUESTED.
- Preserve User Content: If the input task or prompt includes extensive guidelines or examples, preserve them entirely, or as closely as possible. If they are vague, consider breaking down into sub-steps. Keep any details, guidelines, examples, variables, or placeholders provided by the user.
- Constants: DO include constants in the prompt, as they are not susceptible to prompt injection. Such as guides, rubrics, and examples.
- Output Format: Explicitly the most appropriate output format, in detail. This should include length and syntax (e.g. short sentence, paragraph, JSON, etc.)
    - For tasks outputting well-defined or structured data (classification, JSON, etc.) bias toward outputting a JSON.
    - JSON should never be wrapped in code blocks (\`\`\`) unless explicitly requested.

The final prompt you output should adhere to the following structure below. Do not include any additional commentary, only output the completed system prompt. SPECIFICALLY, do not include any additional messages at the start or end of the prompt. (e.g. no "---"). DO NOT define an output format. This is defined by another prompt.

[Concise instruction describing the task - this should be the first line in the prompt, no section header]

[Additional details as needed.]

[Optional sections with headings or bullet points for detailed steps.]

# Steps [optional]

[optional: a detailed breakdown of the steps necessary to accomplish the task]

# Notes [optional]

[optional: edge cases, details, and an area to call or repeat out specific important considerations]
`.trim();

// Fallback instructions for when OpenAI API is unavailable
const generateFallbackInstructions = (taskOrPrompt: string): string => {
  return `Analyze the provided document to identify key information related to ${taskOrPrompt}.

Focus on extracting relevant data points, metrics, and insights that would be valuable for venture capital analysis.

# Steps
1. Identify the main topic or focus area
2. Extract key metrics and data points
3. Analyze strengths and weaknesses
4. Summarize findings in a structured format

# Notes
- Be concise and factual in your analysis
- Prioritize financial and market information
- Highlight unique value propositions or competitive advantages`;
};

export async function POST(request: Request) {
  try {
    const { taskOrPrompt } = await request.json();

    // If OpenAI client is not initialized, return fallback instructions
    if (!client) {
      console.log('Using fallback instructions generation (OpenAI client not available)');
      return NextResponse.json({ 
        instructions: generateFallbackInstructions(taskOrPrompt),
        fallback: true
      });
    }

    try {
      const completion = await client.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: META_PROMPT,
          },
          {
            role: "user",
            content: "Task, Goal, or Current Prompt:\n" + taskOrPrompt,
          },
        ],
      });

      return NextResponse.json({ 
        instructions: completion.choices[0].message.content || '' 
      });
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      // Return fallback if OpenAI API call fails
      return NextResponse.json({ 
        instructions: generateFallbackInstructions(taskOrPrompt),
        fallback: true
      });
    }
  } catch (error) {
    console.error('Error generating instructions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate instructions',
        instructions: generateFallbackInstructions('the document'),
        fallback: true
      },
      { status: 200 } // Return 200 with fallback instead of 500
    );
  }
} 