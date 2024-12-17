import React from 'react';
import { useAIContext } from '../context/AIContext';

interface AIChatHistoryProps {
    files: File[];
}

export const AIChatHistory: React.FC<AIChatHistoryProps> = ({ files }) => {
    const { messages } = useAIContext();

    return (
        <div className="flex flex-col h-full p-4 overflow-y-auto">
            <div className="space-y-4">
                {messages.map((message, index) => (
                    <div key={index} className={`p-4 rounded ${
                        message.role === 'assistant' ? 'bg-gray-100' : 'bg-blue-100'
                    }`}>
                        {message.content}
                    </div>
                ))}
            </div>
        </div>
    );
}; 