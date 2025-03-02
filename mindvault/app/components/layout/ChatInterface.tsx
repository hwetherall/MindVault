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
      // Call chat service to get AI response
      const response = await chatService.sendMessage(messageText, files);
      
      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: typeof response === 'string' ? response : response?.text || 'Sorry, I could not process that.',
        sender: 'assistant',
        timestamp: new Date()
      };

      // Add assistant message to chat
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting chat response:', error);
      
      // Create error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, an error occurred while processing your request.',
        sender: 'assistant',
        timestamp: new Date()
      };

      // Add error message to chat
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles clicking on a suggested question
   */
  const handleSuggestedQuestionClick = (question: string) => {
    handleSendMessage(null, question);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-700 rounded">
        {messages.length === 0 ? (
          <div className="text-center text-gray-300 my-8">
            <p>Ask the AI assistant about the uploaded documents</p>
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message.id}
              className={`mb-4 ${
                message.sender === 'user' ? 'text-right' : 'text-left'
              }`}
            >
              <div
                className={`inline-block max-w-3xl rounded-lg p-3 ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 border border-gray-600 text-white'
                }`}
              >
                {message.sender === 'assistant' ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{message.content}</p>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex items-center text-gray-300 mt-4">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce mr-1"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce mr-1" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
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
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-full text-sm border border-gray-600"
              onClick={() => handleSuggestedQuestionClick(question.text)}
            >
              {question.text}
            </button>
          ))}
        </div>
      )}

      {/* Chat input */}
      <form onSubmit={handleSendMessage} className="mt-4">
        <div className="flex">
          <input
            type="text"
            className="flex-1 p-3 bg-gray-700 border border-gray-600 text-white rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message..."
            value={currentMessage}
            onChange={e => setCurrentMessage(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700 transition-colors disabled:bg-blue-400"
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