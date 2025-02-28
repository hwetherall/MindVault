import React, { useState } from 'react';
import { chatService } from '../services/chatService';
import { ChevronDown, ChevronUp, Edit2, Save, RefreshCw } from 'lucide-react';

interface DeepDiveProps {
    files: any[];
    onComplete: (passed: boolean) => void;
}

interface Answer {
    content: string;
    isEdited: boolean;
}

const DEEP_DIVE_QUESTIONS = [
    {
        id: 'scalability',
        question: 'How scalable is the current product, team, and operations to meet the next phase of growth?',
        description: 'Evaluate the company\'s ability to scale its operations, technology, and team.'
    },
    {
        id: 'financials',
        question: 'What are the current and projected cash flow needs, and how long will this funding round sustain the business?',
        description: 'Analyze detailed financial projections and cash flow requirements.'
    },
    {
        id: 'acquisition',
        question: 'What customer acquisition strategies have been most effective so far, and what is the payback period on these efforts?',
        description: 'Examine customer acquisition costs, strategies, and ROI metrics.'
    },
    {
        id: 'team',
        question: 'How strong is the team, and what key hires or organizational changes are necessary to achieve the next growth targets?',
        description: 'Assess team capabilities, experience, and hiring needs.'
    },
    {
        id: 'challenges',
        question: 'What regulatory, technical, or operational hurdles could limit success at scale, and how is the company preparing to address them?',
        description: 'Identify and evaluate potential obstacles to growth.'
    }
] as const;

export const DeepDive: React.FC<DeepDiveProps> = ({ files, onComplete }) => {
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

            for (const { id, question } of DEEP_DIVE_QUESTIONS) {
                const prompt = `
                    Based on the available documents, please provide a comprehensive deep dive analysis for this question:
                    ${question}
                    
                    Guidelines:
                    1. Provide an in-depth analysis with specific evidence and data points
                    2. Include quantitative metrics and benchmarks where applicable
                    3. Structure the response with clear sections and bullet points
                    4. Identify both strengths and potential areas of concern
                    5. Make specific recommendations for improvement or further investigation
                    6. If information is missing, specify what additional data would be helpful
                    
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
            const allAnswered = DEEP_DIVE_QUESTIONS.every(
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

        const question = DEEP_DIVE_QUESTIONS.find(q => q.id === id)?.question;
        if (!question) return;

        try {
            const prompt = `
                Based on the available documents, please provide a comprehensive deep dive analysis for this question:
                ${question}
                
                Guidelines:
                1. Provide an in-depth analysis with specific evidence and data points
                2. Include quantitative metrics and benchmarks where applicable
                3. Structure the response with clear sections and bullet points
                4. Identify both strengths and potential areas of concern
                5. Make specific recommendations for improvement or further investigation
                6. If information is missing, specify what additional data would be helpful
                
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
                    Deep Dive Analysis
                </h2>
                <p className="mt-4 text-gray-600">
                    This stage involves an in-depth analysis of key operational and strategic aspects of the company.
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
                {isAnalyzing ? 'Analyzing Documents...' : 'Start Deep Dive Analysis'}
            </button>

            <div className="space-y-6">
                {DEEP_DIVE_QUESTIONS.map(({ id, question, description }) => (
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

            {Object.keys(answers).length === DEEP_DIVE_QUESTIONS.length && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-semibold mb-2">
                        Deep Dive Complete
                    </h3>
                    <p className="text-sm text-gray-600">
                        You have completed the deep dive analysis. You can now proceed to the Final Review stage to make your investment decision.
                    </p>
                </div>
            )}
        </div>
    );
}; 