'use client';

import React, { createContext, useContext, useState } from 'react';
import { useNotesContext } from './NotesContext';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface AIContextType {
    messages: Message[];
    sendMessage: (message: Message) => Promise<void>;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const { notes } = useNotesContext();

    const sendMessage = async (message: Message) => {
        try {
            setMessages(prev => [...prev, message]);
            
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message.content,
                    notes: notes,
                }),
            });

            const data = await response.json();
            
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response
            }]);
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Error processing your request. Please try again.'
            }]);
        }
    };

    console.log('AIProvider rendering with messages:', messages);

    return (
        <AIContext.Provider value={{ messages, sendMessage }}>
            {children}
        </AIContext.Provider>
    );
};

export const useAIContext = () => {
    const context = useContext(AIContext);
    console.log('useAIContext called, context:', context);
    if (context === undefined) {
        throw new Error('useAIContext must be used within an AIProvider');
    }
    return context;
}; 