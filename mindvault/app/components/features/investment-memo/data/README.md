# Investment Memo Data

This directory contains the data files for the Investment Memo feature.

## Structure

- `questions.ts`: Contains the list of investment memo questions, document priority mapping, and helper functions.

## Usage

### Questions

The `INVESTMENT_MEMO_QUESTIONS` array contains all the questions that can be used in an investment memo. Each question has the following structure:

```typescript
interface InvestmentMemoQuestion {
  id: string;              // Unique identifier for the question
  question: string;        // The actual question text
  description: string;     // Brief description of what the question is asking for
  category?: string;       // Category for grouping questions (Financial, Business, Market, etc.)
  complexity?: 'low' | 'medium' | 'high'; // Estimated complexity of answering the question
  recommended?: string[];  // Array of recommended document types for answering this question
  instructions?: string;   // Detailed instructions for the AI on how to answer the question
}
```

### Document Priority Mapping

The `QUESTION_DOCUMENT_MAPPING` object defines which document type (PDF or Excel) should be prioritized for each question. This helps guide the AI to focus on the right document type for each question.

```typescript
type DocumentPriority = {
  primary: 'pdf' | 'excel' | 'both';
  secondary: 'pdf' | 'excel' | 'both';
};
```

### Helper Functions

- `getDocumentPriorityForQuestion(questionId: string)`: Returns the document priority mapping for a specific question.
- `getQuestionById(questionId: string)`: Returns the question object for a specific question ID.

## Adding New Questions

To add a new question:

1. Add the question to the `INVESTMENT_MEMO_QUESTIONS` array in `questions.ts`.
2. Add a document priority mapping for the question in `QUESTION_DOCUMENT_MAPPING`.
3. If needed, add category-specific prompt templates in `../utils/promptTemplates.ts`.

## Example

```typescript
// Adding a new question
const newQuestion: InvestmentMemoQuestion = {
  id: 'market_size',
  question: 'What is the total addressable market (TAM) for this product?',
  description: 'Identify the total market size and growth rate.',
  category: 'Market',
  complexity: 'medium',
  recommended: ['pdf'],
  instructions: 'Look for market size information in the pitch deck...'
};

// Adding document priority mapping
QUESTION_DOCUMENT_MAPPING['market_size'] = { primary: 'pdf', secondary: 'excel' };
``` 