import React, { useState } from 'react';
import { chatService } from '../services/chatService';
import { ChevronDown, ChevronUp, Edit2, Save, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react';

interface FinalReviewProps {
    files: any[];
    onComplete: (passed: boolean, decision: 'invest' | 'pass') => void;
}

interface Answer {
    content: string;
    isEdited: boolean;
}

const FINAL_REVIEW_QUESTIONS = [
    {
        id: 'investment-thesis',
        question: 'What is the core investment thesis for this opportunity?',
        description: 'Summarize the key reasons why this could be a compelling investment.'
    },
    {
        id: 'risks-mitigations',
        question: 'What are the critical risks and proposed mitigation strategies?',
        description: 'Outline major risks and how they can be addressed or mitigated.'
    },
    {
        id: 'valuation',
        question: 'Is the current valuation justified given the company\'s stage and potential?',
        description: 'Analyze the valuation metrics and comparable companies.'
    },
    {
        id: 'next-milestones',
        question: 'What are the key milestones and metrics to track post-investment?',
        description: 'Define specific metrics and milestones for monitoring progress.'
    },
    {
        id: 'recommendation',
        question: 'What is the final investment recommendation?',
        description: 'Provide a clear recommendation with supporting rationale.'
    }
] as const;

export const FinalReview: React.FC<FinalReviewProps> = ({ files, onComplete }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [answers, setAnswers] = useState<Record<string, Answer>>({});
    const [error, setError] = useState<string | null>(null);
    const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>({});
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editedAnswer, setEditedAnswer] = useState<string>('');
    const [decision, setDecision] = useState<'invest' | 'pass' | null>(null);

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

            for (const { id, question } of FINAL_REVIEW_QUESTIONS) {
                const prompt = `
                    Based on the available documents, please provide a final review analysis for this question:
                    ${question}
                    
                    Guidelines:
                    1. Synthesize insights from all previous analysis stages
                    2. Be specific and data-driven in your assessment
                    3. Consider both short-term and long-term implications
                    4. Provide clear, actionable conclusions
                    5. If making a recommendation, clearly state the rationale
                    
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

                // If this is the recommendation question, analyze the sentiment
                if (id === 'recommendation') {
                    const sentimentPrompt = `
                        Based on this investment recommendation:
                        "${response}"
                        
                        Provide your response in the following JSON format:
                        {
                            "decision": "invest" or "pass",
                            "confidence": number between 0 and 1
                        }
                        
                        IMPORTANT: Respond ONLY with the JSON object, no additional text.
                    `;

                    const sentimentResponse = await chatService.sendMessage(sentimentPrompt, []);
                    
                    if (sentimentResponse) {
                        try {
                            const sentiment = JSON.parse(sentimentResponse.trim());
                            setDecision(sentiment.decision);
                        } catch (error) {
                            console.error('Error parsing sentiment response:', error);
                        }
                    }
                }
            }

            setAnswers(newAnswers);

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

        const question = FINAL_REVIEW_QUESTIONS.find(q => q.id === id)?.question;
        if (!question) return;

        try {
            const prompt = `
                Based on the available documents, please provide a final review analysis for this question:
                ${question}
                
                Guidelines:
                1. Synthesize insights from all previous analysis stages
                2. Be specific and data-driven in your assessment
                3. Consider both short-term and long-term implications
                4. Provide clear, actionable conclusions
                5. If making a recommendation, clearly state the rationale
                
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

            // If regenerating the recommendation, update the decision
            if (id === 'recommendation') {
                const sentimentPrompt = `
                    Based on this investment recommendation:
                    "${response}"
                    
                    Provide your response in the following JSON format:
                    {
                        "decision": "invest" or "pass",
                        "confidence": number between 0 and 1
                    }
                    
                    IMPORTANT: Respond ONLY with the JSON object, no additional text.
                `;

                const sentimentResponse = await chatService.sendMessage(sentimentPrompt, []);
                
                if (sentimentResponse) {
                    try {
                        const sentiment = JSON.parse(sentimentResponse.trim());
                        setDecision(sentiment.decision);
                    } catch (error) {
                        console.error('Error parsing sentiment response:', error);
                    }
                }
            }

        } catch (error) {
            console.error('Error regenerating answer:', error);
            setError('Error regenerating answer. Please try again.');
        }
    };

    const handleDecision = (finalDecision: 'invest' | 'pass') => {
        setDecision(finalDecision);
        onComplete(true, finalDecision);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-[#1A1F2E] border-b-2 border-[#E20074] pb-2">
                    Final Review
                </h2>
                <p className="mt-4 text-gray-600">
                    Review all analyses and make a final investment decision.
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
                {isAnalyzing ? 'Analyzing Documents...' : 'Start Final Review'}
            </button>

            <div className="space-y-6">
                {FINAL_REVIEW_QUESTIONS.map(({ id, question, description }) => (
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

            {Object.keys(answers).length === FINAL_REVIEW_QUESTIONS.length && (
                <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold mb-4 text-center text-xl">
                        Make Your Investment Decision
                    </h3>
                    {decision && (
                        <div className={`mb-6 p-4 rounded-lg text-center ${
                            decision === 'invest'
                                ? 'bg-green-50 border border-green-200 text-green-800'
                                : 'bg-red-50 border border-red-200 text-red-800'
                        }`}>
                            <p className="font-medium">
                                AI Recommendation: {decision === 'invest' ? 'Invest' : 'Pass'}
                            </p>
                        </div>
                    )}
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => handleDecision('invest')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-md transition-colors ${
                                decision === 'invest'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                            }`}
                        >
                            <ThumbsUp size={20} />
                            Invest
                        </button>
                        <button
                            onClick={() => handleDecision('pass')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-md transition-colors ${
                                decision === 'pass'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                        >
                            <ThumbsDown size={20} />
                            Pass
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}; 