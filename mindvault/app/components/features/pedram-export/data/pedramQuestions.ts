export interface PedramQuestion {
  question: string;
  model: string;
  instructionType: 'custom' | 'predefined';
  instructions?: string;
}

export const PEDRAM_QUESTIONS: PedramQuestion[] = [
  {
    question: "What is the company's current market position?",
    model: "deepseek-r1-distill-llama-70b",
    instructionType: "custom"
  },
  {
    question: "Analyze the financial metrics and growth trajectory.",
    model: "deepseek-r1-distill-llama-70b",
    instructionType: "predefined",
    instructions: "Focus on key financial metrics including revenue, growth rate, and market size. Analyze historical performance and future projections."
  }
]; 