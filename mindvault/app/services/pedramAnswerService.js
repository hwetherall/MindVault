export const pedramAnswerService = {
  async sendMessage(prompt, files, model) {
    // Mock implementation for now
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      text: `Mock response for model ${model}.\nPrompt: ${prompt.slice(0, 100)}...\nFiles analyzed: ${files.length}`,
      modelUsed: model,
      timeTaken: 2000,
      messageLength: prompt.length,
      answerLength: 500,
      documentContext: "Mock document context",
      finalPrompt: prompt,
      rawOutput: "Mock raw output"
    };
  }
}; 