import React, { useState } from 'react';
import { chatService } from '../services/chatService';
import { ChevronDown, ChevronUp, Edit2, Save, RefreshCw } from 'lucide-react';

interface InitialReviewProps {
    files: any[];
    onComplete: (passed: boolean) => void;
}

interface Answer {
    content: string;
    isEdited: boolean;
}

const INITIAL_REVIEW_QUESTIONS = [
    {
        id: 'market',
        question: 'What is the total addressable market (TAM) and growth potential for this product?',
        description: 'Analyze the market size, growth rate, and potential market share.'
    },
    {
        id: 'technology',
        question: 'What unique technological advantages or IP does the company possess?',
        description: 'Evaluate the company\'s technological differentiation and intellectual property.'
    },
    {
        id: 'economics',
        question: 'What are the unit economics and path to profitability?',
        description: 'Assess the company\'s revenue model, cost structure, and profitability metrics.'
    },
    {
        id: 'competition',
        question: 'How strong is the competition and what is the competitive advantage?',
        description: 'Analyze the competitive landscape and the company\'s sustainable advantages.'
    },
    {
        id: 'risks',
        question: 'What are the key risks and mitigation strategies?',
        description: 'Identify major business risks and evaluate mitigation plans.'
    }
] as const;

export const InitialReview: React.FC<InitialReviewProps> = ({ files, onComplete }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [answers, setAnswers] = useState<Record<string, Answer>>({});
    const [error, setError] = useState<string | null>(null);
    const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>({});
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editedAnswer, setEditedAnswer] = useState<string>('');

    const toggleAnswer = (id: string) => {
        setExpandedAnswers(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleEdit = (id: string) => {
        setEditingId(id);
        setEditedAnswer(answers[id]?.content || '');
    };

    const handleSave = (id: string) => {
        if (editedAnswer.trim()) {
            setAnswers(prev => ({
                ...prev,
                [id]: {
                    content: editedAnswer,
                    isEdited: true
                }
            }));
        }
        setEditingId(null);
        setEditedAnswer('');
    };

    const analyzeDocuments = async () => {
        if (!files || files.length === 0) {
            setError('Please add some documents to analyze first!');
            return;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            const newAnswers: Record<string, Answer> = {};

            for (const { id, question } of INITIAL_REVIEW_QUESTIONS) {
                const prompt = `
                    Based on the available documents, please provide a detailed analysis for this question:
                    ${question}
                    
                    Guidelines:
                    1. Provide a comprehensive analysis with specific evidence from the documents
                    2. Include relevant data points and metrics when available
                    3. Structure the response with clear sections and bullet points
                    4. If information is missing, specify what additional data would be helpful
                    5. Keep the response focused and actionable
                    
                    Format the response with clear sections and use markdown-style formatting.
                `;

                const response = await chatService.sendMessage(prompt, files);
                
                if (!response) {
                    throw new Error('No response received from chat service');
                }

                newAnswers[id] = {
                    content: response,
                    isEdited: false
                };
            }

            setAnswers(newAnswers);
            
            // Check if all questions have been answered
            const allAnswered = INITIAL_REVIEW_QUESTIONS.every(
                ({ id }) => newAnswers[id] && newAnswers[id].content.trim().length > 0
            );
            
            if (allAnswered) {
                onComplete(true);
            }

        } catch (error) {
            console.error('Error analyzing documents:', error);
            setError('Error analyzing documents. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const regenerateAnswer = async (id: string) => {
        if (!files || files.length === 0) {
            setError('Please add some documents to analyze first!');
            return;
        }

        const question = INITIAL_REVIEW_QUESTIONS.find(q => q.id === id)?.question;
        if (!question) return;

        try {
            const prompt = `
                Based on the available documents, please provide a detailed analysis for this question:
                ${question}
                
                Guidelines:
                1. Provide a comprehensive analysis with specific evidence from the documents
                2. Include relevant data points and metrics when available
                3. Structure the response with clear sections and bullet points
                4. If information is missing, specify what additional data would be helpful
                5. Keep the response focused and actionable
                
                Format the response with clear sections and use markdown-style formatting.
            `;

            const response = await chatService.sendMessage(prompt, files);
            
            if (!response) {
                throw new Error('No response received from chat service');
            }

            setAnswers(prev => ({
                ...prev,
                [id]: {
                    content: response,
                    isEdited: false
                }
            }));

        } catch (error) {
            console.error('Error regenerating answer:', error);
            setError('Error regenerating answer. Please try again.');
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-[#1A1F2E] border-b-2 border-[#E20074] pb-2">
                    Initial Review Analysis
                </h2>
                <p className="mt-4 text-gray-600">
                    This stage involves a detailed analysis of the company's key aspects to determine investment potential.
                </p>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 rounded-md text-red-600">
                    {error}
                </div>
            )}

            <button
                onClick={analyzeDocuments}
                disabled={isAnalyzing}
                className={`px-6 py-3 rounded-md mb-6 transition-colors ${
                    isAnalyzing 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-[#E20074] hover:bg-[#B4005C]'
                } text-white font-medium`}
            >
                {isAnalyzing ? 'Analyzing Documents...' : 'Start Initial Review'}
            </button>

            <div className="space-y-6">
                {INITIAL_REVIEW_QUESTIONS.map(({ id, question, description }) => (
                    <div 
                        key={id}
                        className={`p-6 rounded-lg border ${
                            !answers[id]
                                ? 'border-gray-200 bg-white'
                                : answers[id].isEdited
                                ? 'border-green-200 bg-green-50'
                                : 'border-gray-200 bg-white'
                        }`}
                    >
                        <button
                            onClick={() => toggleAnswer(id)}
                            className="w-full flex justify-between items-center text-left"
                        >
                            <div>
                                <h3 className="font-semibold text-gray-800 mb-1">
                                    {question}
                                    {answers[id]?.isEdited && (
                                        <span className="ml-2 text-sm text-green-600">(edited)</span>
                                    )}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {description}
                                </p>
                            </div>
                            {answers[id] && (
                                <div className="flex items-center gap-2 text-gray-500">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            regenerateAnswer(id);
                                        }}
                                        className="p-1 hover:text-[#E20074]"
                                        title="Regenerate answer"
                                    >
                                        <RefreshCw size={18} />
                                    </button>
                                    {editingId !== id && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(id);
                                            }}
                                            className="p-1 hover:text-[#E20074]"
                                            title="Edit answer"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                    )}
                                    {expandedAnswers[id] ? (
                                        <ChevronUp className="w-5 h-5" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5" />
                                    )}
                                </div>
                            )}
                        </button>
                        
                        {answers[id] && (
                            <div className={`mt-3 overflow-hidden transition-all duration-200 ease-in-out ${
                                expandedAnswers[id] 
                                    ? 'max-h-[5000px] opacity-100'
                                    : 'max-h-0 opacity-0'
                            }`}>
                                {editingId === id ? (
                                    <div className="mt-4">
                                        <textarea
                                            value={editedAnswer}
                                            onChange={(e) => setEditedAnswer(e.target.value)}
                                            className="w-full h-96 p-4 border rounded-md focus:ring-2 focus:ring-[#E20074] focus:border-transparent"
                                        />
                                        <div className="flex justify-end gap-2 mt-2">
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleSave(id)}
                                                className="flex items-center gap-2 px-4 py-2 bg-[#E20074] text-white rounded-md hover:bg-[#B4005C] transition-colors"
                                            >
                                                <Save size={18} />
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                                        {answers[id].content}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {!answers[id] && (
                            <p className="text-gray-400 italic mt-3">
                                {isAnalyzing ? 'Analyzing...' : 'Analysis not yet generated'}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {Object.keys(answers).length === INITIAL_REVIEW_QUESTIONS.length && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-semibold mb-2">
                        Initial Review Complete
                    </h3>
                    <p className="text-sm text-gray-600">
                        You have completed the initial review stage. You can now proceed to the Deep Dive stage for a more detailed analysis.
                    </p>
                </div>
            )}
        </div>
    );
}; 