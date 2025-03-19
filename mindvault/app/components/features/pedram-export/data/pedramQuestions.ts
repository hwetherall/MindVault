import { InvestmentMemoQuestion } from "../../investment-memo/types";

export interface PedramQuestion extends Omit<InvestmentMemoQuestion, 'id'> {
  question: string;
  model: string;
  instructionType: 'custom' | 'predefined';
  instructions?: string;
  category: string;
  description: string;
}

export const PEDRAM_QUESTIONS: PedramQuestion[] = [
  {
    question: "What is the company's current market position?",
    model: "deepseek-r1-distill-llama-70b",
    instructionType: "custom",
    category: "Market",
    description: "Analyze the company's current market position and competitive landscape"
  },
  {
    question: "Analyze the financial metrics and growth trajectory.",
    model: "deepseek-r1-distill-llama-70b",
    instructionType: "predefined",
    instructions: "Focus on key financial metrics including revenue, growth rate, and market size. Analyze historical performance and future projections.",
    category: "Financial",
    description: "Evaluate financial performance and growth metrics"
  }
]; 