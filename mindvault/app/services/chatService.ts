/**
 * Service for handling chat interactions with AI
 */

interface ChatResponse {
  text: string;
  sources?: {
    fileName: string;
    relevance: number;
  }[];
}

/**
 * Simulates sending a message to an AI and getting a response
 */
const sendMessage = async (message: string, files: any[] = []): Promise<ChatResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock responses based on keywords in the message
  const lowerMessage = message.toLowerCase();
  
  // Check if any files are referenced in the message
  const fileReferences = files.filter(file => 
    lowerMessage.includes(file.name.toLowerCase())
  );
  
  // Generate sources if files are referenced
  const sources = fileReferences.map(file => ({
    fileName: file.name,
    relevance: Math.random() * 0.5 + 0.5 // Random relevance between 0.5 and 1.0
  }));
  
  // Generate response based on message content
  let responseText = '';
  
  if (lowerMessage.includes('arr') || lowerMessage.includes('annual recurring revenue')) {
    responseText = "Based on the documents, the company's ARR is $12.5M with a growth rate of 85% YoY.";
  } else if (lowerMessage.includes('burn rate')) {
    responseText = "The company's current burn rate is approximately $800K per month, which gives them a runway of about 18 months at current cash levels.";
  } else if (lowerMessage.includes('revenue') || lowerMessage.includes('monetization')) {
    responseText = "The company generates revenue through a SaaS subscription model with three tiers: Basic ($49/mo), Professional ($99/mo), and Enterprise (custom pricing). The majority of revenue (65%) comes from the Professional tier.";
  } else if (lowerMessage.includes('competitor') || lowerMessage.includes('competition')) {
    responseText = "The main competitors are:\n\n1. **TechCorp** - Larger player with 15% market share\n2. **InnoSystems** - Similar sized company focusing on the enterprise segment\n3. **QuickSolve** - New entrant with a freemium model\n\nThe company differentiates through superior customer service and more flexible integration options.";
  } else if (lowerMessage.includes('risk')) {
    responseText = "Key risks identified in the documents:\n\n- Increasing customer acquisition costs (up 30% YoY)\n- Potential regulatory changes in EU markets\n- Technical debt in core platform\n- Key person risk with the CTO\n- New competitor entering the market with significant funding";
  } else {
    responseText = "I've analyzed the documents and can provide insights on the company's financials, market position, team, and growth strategy. What specific aspect would you like to know more about?";
  }
  
  return {
    text: responseText,
    sources: sources.length > 0 ? sources : undefined
  };
};

export const chatService = {
  sendMessage
}; 