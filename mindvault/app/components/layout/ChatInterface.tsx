import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { chatService } from '../../services/chatService';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface SuggestedQuestion {
  id: string;
  text: string;
}

interface ChatInterfaceProps {
  files: any[];
  suggestedQuestions?: SuggestedQuestion[];
}

interface ChatResponse {
  text: string;
  [key: string]: any;
}

/**
 * Chat interface component for interacting with the AI assistant
 */
const ChatInterface: React.FC<ChatInterfaceProps> = ({ files, suggestedQuestions = [] }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Handles sending a message to the AI assistant
   */
  const handleSendMessage = async (e: React.FormEvent | null, text?: string) => {
    if (e) e.preventDefault();
    
    const messageText = text || currentMessage;
    if (!messageText.trim()) return;

    // Create user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      // Check if we have any files
      if (!files || files.length === 0) {
        // Create 'no files' response message
        const noFilesMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: 'Please upload at least one document (pitch deck PDF and financial data Excel file) to analyze.',
          sender: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, noFilesMessage]);
        setIsLoading(false);
        return;
      }
      
      // Pass the full file objects to the chat service instead of just IDs
      const response = await chatService.sendMessage(messageText, files);
      
      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: typeof response === 'string' ? response : response.text,
        sender: 'assistant',
        timestamp: new Date()
      };

      // Add assistant message to chat
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, there was an error processing your request. Please try again.',
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles clicking a suggested question
   */
  const handleSuggestedQuestionClick = (question: string) => {
    handleSendMessage(null, question);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div className="innovera-chat-container flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-secondary">No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`flex flex-col ${
                message.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 shadow-sm ${
                  message.sender === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-background-secondary border-2 border-border-medium text-text-primary'
                }`}
              >
                {message.sender === 'assistant' ? (
                  <div className="prose max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{message.content}</p>
                )}
              </div>
              <div className="text-xs text-text-secondary mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex items-center justify-center text-text-secondary mt-4">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce mr-1"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce mr-1" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions */}
      {suggestedQuestions.length > 0 && (
        <div className="my-4 flex flex-wrap gap-2">
          {suggestedQuestions.map(question => (
            <button
              key={question.id}
              className="px-3 py-1 bg-background-secondary hover:bg-gray-200 text-text-primary rounded-full text-sm border-2 border-border-medium shadow-sm"
              onClick={() => handleSuggestedQuestionClick(question.text)}
            >
              {question.text}
            </button>
          ))}
        </div>
      )}

      {/* Chat input */}
      <form onSubmit={handleSendMessage} className="mt-4">
        <div className="flex shadow-md">
          <input
            type="text"
            className="flex-1 p-3 bg-white border-2 border-border-medium text-text-primary rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Type your message..."
            value={currentMessage}
            onChange={e => setCurrentMessage(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-white rounded-r-lg hover:bg-primary-dark transition-colors disabled:opacity-70 border-y-2 border-r-2 border-primary"
            disabled={isLoading || !currentMessage.trim()}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface; 