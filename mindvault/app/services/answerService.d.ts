interface File {
  name: string;
  type: string;
  content?: string;
  excelData?: {
    metadata?: {
      sheets?: string[];
    };
  };
}

interface Response {
  text: string;
  suggestedQuestions?: string[];
}

export const answerService: {
  sendMessage(message: string, files?: File[], fastMode?: boolean, model?: string): Promise<Response>;
  isExcelRelatedQuestion(question: string): boolean;
  getSuggestedExcelQuestions(files: File[]): Promise<string[]>;
  getMockResponse(message: string, files?: File[]): Response;
}; 