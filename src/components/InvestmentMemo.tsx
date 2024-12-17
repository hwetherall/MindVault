import React, { useState } from 'react';
import { chatService } from '../services/chatService';
import { ChevronDown, ChevronUp, Edit2, Save, FileDown, RefreshCw, HelpCircle } from 'lucide-react';
import { NextStepsModal } from './NextStepsModal';
import { ConfirmationModal } from './ConfirmationModal';
import { notesService } from '../services/notesService';
import { ChecklistModal } from './ChecklistModal';

const ROUND_1_QUESTIONS = [
    "What is the total addressable market (TAM) and growth potential for this product?",
    "What unique technological advantages or IP does the company possess?",
    "What are the unit economics and path to profitability?",
    "How strong is the competition and what is the competitive advantage?",
    "What are the key risks and mitigation strategies?"
] as const;

const ROUND_2_QUESTIONS = [
    "How scalable is the current product, team, and operations to meet the next phase of growth?",
    "What are the current and projected cash flow needs, and how long will this funding round sustain the business?",
    "What customer acquisition strategies have been most effective so far, and what is the payback period on these efforts?",
    "How strong is the team, and what key hires or organizational changes are necessary to achieve the next growth targets?",
    "What regulatory, technical, or operational hurdles could limit success at scale, and how is the company preparing to address them?"
] as const;

// Helper function to format the text with basic HTML
const formatAnswer = (text: string) => {
    if (!text) return null;

    // Split into paragraphs (double newlines)
    const paragraphs = text.split('\n\n').filter(Boolean);
    
    return paragraphs.map((paragraph, i) => {
        // Handle headers (lines starting with ###)
        if (paragraph.startsWith('###')) {
            const lines = paragraph.split('\n');
            const headerText = lines[0].replace('###', '').trim();
            const remainingContent = lines.slice(1).join('\n');
            
            return (
                <div key={i} className="mb-4">
                    <h3 className="text-xl font-bold mb-2">{headerText}</h3>
                    {remainingContent && (
                        <div className="text-gray-700">
                            {formatLines(remainingContent)}
                        </div>
                    )}
                </div>
            );
        }

        // Handle regular paragraphs
        return (
            <div key={i} className="mb-4 text-gray-700">
                {formatLines(paragraph)}
            </div>
        );
    });
};

// Helper function to format individual lines
const formatLines = (content: string) => {
    const lines = content.split('\n');
    
    return (
        <div className="space-y-1">
            {lines.map((line, index) => {
                // Process bold text (text between ** **)
                const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                
                return (
                    <div key={index}>
                        <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
                    </div>
                );
            })}
        </div>
    );
};

interface Answer {
    content: string;
    isEdited: boolean;
}

interface InvestmentMemoProps {
    files: any[];
    onNotesUpdate?: () => void;
}

export const InvestmentMemo: React.FC<InvestmentMemoProps> = ({ files, onNotesUpdate }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [answers, setAnswers] = useState<Answer[]>(new Array(5).fill({ content: '', isEdited: false }));
    const [error, setError] = useState<string | null>(null);
    const [expandedAnswers, setExpandedAnswers] = useState<boolean[]>(new Array(5).fill(false));
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editedAnswer, setEditedAnswer] = useState<string>('');
    const [questionSet, setQuestionSet] = useState<'round1' | 'round2'>('round1');
    const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
    const [isNextStepsModalOpen, setIsNextStepsModalOpen] = useState(false);
    const [nextStepsAnalysis, setNextStepsAnalysis] = useState<{
        isComplete: boolean;
        incompleteQuestions: Array<{
            questionIndex: number;
            question: string;
            reason: string;
            suggestions: string[];
        }>;
    }>({ isComplete: false, incompleteQuestions: [] });
    const [showGenerateConfirmation, setShowGenerateConfirmation] = useState(false);
    const [isPedramThinking, setIsPedramThinking] = useState(false);
    const [showChecklist, setShowChecklist] = useState(false);
    const [difficulty, setDifficulty] = useState<'normal' | 'easy'>('normal');
    const [round1Answers, setRound1Answers] = useState<Answer[]>([]);
    const [regeneratingQuestions, setRegeneratingQuestions] = useState<number[]>([]);

    const currentQuestions = questionSet === 'round1' ? ROUND_1_QUESTIONS : ROUND_2_QUESTIONS;

    const toggleAnswer = (index: number) => {
        const newExpanded = [...expandedAnswers];
        newExpanded[index] = !newExpanded[index];
        setExpandedAnswers(newExpanded);
    };

    const analyzeDocuments = async () => {
        if (!files || files.length === 0) {
            alert('Please add some documents to analyze first!');
            return;
        }

        setIsAnalyzing(true);
        setError(null);

        try {
            const newAnswers = [...answers];
            
            for (let i = 0; i < currentQuestions.length; i++) {
                console.log('Analyzing question:', i + 1);
                try {
                    const difficultyGuidelines = difficulty === 'easy' 
                        ? `Provide a concise, high-level answer focusing on the key points. Include essential information but don't worry about exhaustive detail. If some information is missing but you can make reasonable assumptions, do so while noting them.`
                        : `Provide a comprehensive and detailed answer. Be thorough in analyzing all aspects of the question. If information is missing, clearly specify what additional data is needed.`;

                    const prompt = `
                        Based on the available documents, please answer this question: ${currentQuestions[i]}
                        
                        ${difficultyGuidelines}
                        
                        Guidelines:
                        1. Provide a clear answer that fits within 2-3 paragraphs
                        2. Focus on the most important information
                        3. Use bullet points for lists rather than long sentences
                        4. Format your response to be clear and readable
                        5. Keep technical details ${difficulty === 'easy' ? 'minimal and accessible' : 'precise and comprehensive'}
                        
                        ${difficulty === 'easy' 
                            ? 'Note: Focus on providing a clear overview rather than exhaustive detail.' 
                            : 'Note: Ensure all aspects of the question are thoroughly addressed.'}
                    `;

                    const response = await chatService.sendMessage(prompt, files);

                    console.log('Response for question', i + 1, ':', response);
                    newAnswers[i] = { content: response || 'No response received', isEdited: false };
                    setAnswers([...newAnswers]);
                } catch (questionError) {
                    console.error(`Error on question ${i + 1}:`, questionError);
                    newAnswers[i] = { 
                        content: `Error analyzing this question: ${questionError.message}`,
                        isEdited: false 
                    };
                    setAnswers([...newAnswers]);
                }
            }
        } catch (error) {
            console.error('Full error:', error);
            setError(`Error analyzing documents: ${error.message || 'Please try again.'}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleEdit = (index: number) => {
        setEditingIndex(index);
        setEditedAnswer(answers[index].content);
    };

    const handleSave = (index: number) => {
        const newAnswers = [...answers];
        newAnswers[index] = {
            content: editedAnswer,
            isEdited: true
        };
        setAnswers(newAnswers);
        setEditingIndex(null);
    };

    const handleQuestionSetChange = (newSet: 'round1' | 'round2') => {
        if (newSet === 'round2' && questionSet === 'round1') {
            setRound1Answers(answers);
        }
        setQuestionSet(newSet);
        setAnswers(new Array(5).fill({ content: '', isEdited: false }));
        setExpandedAnswers(new Array(5).fill(false));
        setEditingIndex(null);
        setEditedAnswer('');
    };

    const regenerateAnswer = async (index: number) => {
        if (!files || files.length === 0) {
            alert('Please add some documents to analyze first!');
            return;
        }

        const newAnswers = [...answers];
        newAnswers[index] = { content: '', isEdited: false };
        setAnswers(newAnswers);
        setRegeneratingIndex(index);

        try {
            const difficultyGuidelines = difficulty === 'easy' 
                ? `Provide a concise, high-level answer focusing on the key points. Include essential information but don't worry about exhaustive detail. If some information is missing but you can make reasonable assumptions, do so while noting them.`
                : `Provide a comprehensive and detailed answer. Be thorough in analyzing all aspects of the question. If information is missing, clearly specify what additional data is needed.`;

            const prompt = `
                Based on the available documents, please answer this question: ${currentQuestions[index]}
                
                ${difficultyGuidelines}
                
                Guidelines:
                1. Provide a clear answer that fits within 2-3 paragraphs
                2. Focus on the most important information
                3. Use bullet points for lists rather than long sentences
                4. Format your response to be clear and readable
                5. Keep technical details ${difficulty === 'easy' ? 'minimal and accessible' : 'precise and comprehensive'}
                
                ${difficulty === 'easy' 
                    ? 'Note: Focus on providing a clear overview rather than exhaustive detail.' 
                    : 'Note: Ensure all aspects of the question are thoroughly addressed.'}
            `;

            const response = await chatService.sendMessage(prompt, files);

            newAnswers[index] = { 
                content: response || 'No response received',
                isEdited: false
            };
            setAnswers([...newAnswers]);
        } catch (error) {
            console.error(`Error regenerating answer ${index + 1}:`, error);
            newAnswers[index] = { 
                content: `Error analyzing this question: ${error.message}`,
                isEdited: false
            };
            setAnswers([...newAnswers]);
        } finally {
            setRegeneratingIndex(null);
        }
    };

    const analyzeCompleteness = async () => {
        const hasAnswers = answers.some(answer => answer.content !== '');
        
        if (!hasAnswers) {
            setShowGenerateConfirmation(true);
            return;
        }

        setIsPedramThinking(true);
        setIsNextStepsModalOpen(true);

        const difficultyGuidelines = difficulty === 'easy' 
            ? `Be lenient in your evaluation. If an answer provides basic information that addresses the core question, consider it complete. Focus on whether the essential points are covered rather than requiring extensive detail.`
            : `Be thorough in your evaluation. Ensure each answer provides comprehensive information with specific details, data, and clear explanations.`;

        const prompt = `
            You are an AI assistant helping to analyze the completeness of investment memo answers.
            Your task is to review the answers and determine if they are complete enough to proceed.
            
            ${difficultyGuidelines}
            
            Questions and Answers:
            ${currentQuestions.map((q, i) => `
                Question ${i + 1}: ${q}
                Answer: ${answers[i].content}
            `).join('\n\n')}
            
            Analyze the completeness of each answer and respond ONLY with a JSON object in exactly this format:
            {
                "isComplete": true/false,
                "incompleteQuestions": [
                    {
                        "questionIndex": number (0-4),
                        "question": "exact question text",
                        "reason": "explanation of what's missing",
                        "suggestions": ["specific suggestion 1", "specific suggestion 2"]
                    }
                ]
            }

            If all answers are complete, return isComplete: true and an empty array for incompleteQuestions.
            If any answers are incomplete, return isComplete: false and include those questions in the incompleteQuestions array.
            
            IMPORTANT: Respond ONLY with the JSON object, no additional text or explanation.
        `;

        try {
            const response = await chatService.sendMessage(prompt, []);
            let analysis;
            
            try {
                // Add null check for response
                if (!response) {
                    throw new Error('No response received from chat service');
                }
                
                // Try to parse the JSON response
                analysis = JSON.parse(response.trim());
                
                // Validate the expected structure
                if (typeof analysis !== 'object' || analysis === null) {
                    throw new Error('Response is not an object');
                }
                
                if (typeof analysis.isComplete !== 'boolean') {
                    throw new Error('isComplete is not a boolean');
                }
                
                if (!Array.isArray(analysis.incompleteQuestions)) {
                    throw new Error('incompleteQuestions is not an array');
                }

                // Validate each incomplete question if there are any
                analysis.incompleteQuestions.forEach((q: any, idx: number) => {
                    if (typeof q.questionIndex !== 'number' ||
                        typeof q.question !== 'string' ||
                        typeof q.reason !== 'string' ||
                        !Array.isArray(q.suggestions)) {
                        throw new Error(`Invalid incomplete question at index ${idx}`);
                    }
                });
                
                setNextStepsAnalysis(analysis);
            } catch (parseError) {
                console.error('Error parsing AI response:', parseError);
                console.log('Raw AI response:', response);
                setNextStepsAnalysis({
                    isComplete: false,
                    incompleteQuestions: [{
                        questionIndex: 0,
                        question: "Error in analysis",
                        reason: "There was an error processing the AI response. Please try again.",
                        suggestions: ["Refresh the page and try again", "If the error persists, contact support"]
                    }]
                });
            }
        } catch (error) {
            console.error('Error getting AI response:', error);
            setNextStepsAnalysis({
                isComplete: false,
                incompleteQuestions: [{
                    questionIndex: 0,
                    question: "Error in analysis",
                    reason: "There was an error communicating with the AI. Please try again.",
                    suggestions: ["Check your internet connection", "Refresh the page and try again"]
                }]
            });
        } finally {
            setIsPedramThinking(false);
        }
    };

    const handleSaveNotes = async (notes: Array<{ question: string; answer: string }>) => {
        try {
            // Save each note individually with a formatted title
            for (const note of notes) {
                const formatTitle = (text: string): string => {
                    let cleanText = text
                        .replace(/^(Include|Provide|Add|Complete|Create|Analyze|Review|Update|Develop)\s+/i, '')
                        .replace(/^(the|a|an)\s+/i, '');
                    
                    let shortText = cleanText.slice(0, 30).split(' ').slice(0, -1).join(' ');
                    
                    if (cleanText.length > shortText.length) {
                        shortText += '...';
                    }
                    
                    return `Action Item: ${shortText}`;
                };

                const title = formatTitle(note.question);
                await notesService.createNote(title, note.answer);
            }

            // Ensure the refresh happens after all notes are saved
            if (onNotesUpdate) {
                await onNotesUpdate();
            }

            // Show success message after everything is updated
            alert('Notes saved successfully to repository!');
        } catch (error) {
            console.error('Error saving notes:', error);
            alert('Error saving notes to repository. Please try again.');
            throw error; // Re-throw to let the ChecklistModal know there was an error
        }
    };

    const regeneratePartialMemo = async (questionIndices: number[]) => {
        setIsAnalyzing(true);
        setError(null);
        setRegeneratingQuestions(questionIndices);

        try {
            const newAnswers = [...answers];
            
            for (const index of questionIndices) {
                console.log('Regenerating question:', index + 1);
                try {
                    const difficultyGuidelines = difficulty === 'easy' 
                        ? `Provide a concise, high-level answer focusing on the key points...`
                        : `Provide a comprehensive and detailed answer...`;

                    const prompt = `
                        Based on the available documents, please answer this question: ${currentQuestions[index]}
                        ${difficultyGuidelines}
                        Guidelines:
                        1. Provide a clear answer that fits within 2-3 paragraphs
                        2. Focus on the most important information
                        3. Use bullet points for lists rather than long sentences
                        4. Format your response to be clear and readable
                        5. Keep technical details ${difficulty === 'easy' ? 'minimal and accessible' : 'precise and comprehensive'}
                        Note: Focus on providing a clear overview rather than exhaustive detail.
                    `;

                    const response = await chatService.sendMessage(prompt, files);

                    newAnswers[index] = { 
                        content: response || 'No response received',
                        isEdited: false 
                    };
                    setAnswers([...newAnswers]);
                } catch (questionError) {
                    console.error(`Error on question ${index + 1}:`, questionError);
                    newAnswers[index] = { 
                        content: `Error analyzing this question: ${questionError.message}`,
                        isEdited: false 
                    };
                    setAnswers([...newAnswers]);
                }
            }
        } catch (error) {
            console.error('Error regenerating sections:', error);
            setError(`Error regenerating sections: ${error.message || 'Please try again.'}`);
        } finally {
            setIsAnalyzing(false);
            setRegeneratingQuestions([]);
            setIsNextStepsModalOpen(false);
            setTimeout(() => {
                analyzeCompleteness();
            }, 500);
        }
    };

    const getChecklistItems = () => {
        // Group suggestions by question
        return nextStepsAnalysis.incompleteQuestions.map(question => ({
            questionNumber: question.questionIndex + 1,
            questionText: question.question,
            reason: question.reason,
            suggestions: question.suggestions.join('\n• '), // Combine suggestions into bullet points
        }));
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[#1A1F2E] border-b-2 border-[#E20074] pb-2">
                    Investment Memo
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={analyzeCompleteness}
                        className="flex items-center gap-2 px-4 py-2 bg-[#E20074] text-white rounded-md hover:bg-[#B4005C] transition-colors"
                    >
                        <HelpCircle size={18} />
                        Ask Pedram
                    </button>
                    <button
                        onClick={() => {}}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors"
                    >
                        <FileDown size={18} />
                        Export PDF
                    </button>
                </div>
            </div>
            
            <div className="mb-6 flex gap-4">
                <select
                    value={questionSet}
                    onChange={(e) => handleQuestionSetChange(e.target.value as 'round1' | 'round2')}
                    className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-[#E20074] focus:border-transparent"
                >
                    <option value="round1">Round 1 Due Diligence</option>
                    <option value="round2">Round 2 Due Diligence</option>
                </select>

                <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as 'normal' | 'easy')}
                    className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-[#E20074] focus:border-transparent"
                >
                    <option value="normal">Normal Mode</option>
                    <option value="easy">Easy Mode</option>
                </select>
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
                {isAnalyzing ? 'Analyzing Documents...' : 'Generate Investment Memo'}
            </button>

            <div className="space-y-6 overflow-auto">
                {currentQuestions.map((question, index) => (
                    <div 
                        key={index}
                        className={`p-6 rounded-lg border ${
                            regeneratingQuestions.includes(index)
                                ? 'border-[#E20074] bg-pink-50 animate-pulse'
                                : isAnalyzing && !answers[index].content
                                ? 'border-[#E20074] bg-pink-50'
                                : answers[index].isEdited
                                ? 'border-green-200 bg-green-50'
                                : 'border-gray-200 bg-white'
                        }`}
                    >
                        <button
                            onClick={() => toggleAnswer(index)}
                            className="w-full flex justify-between items-center text-left"
                        >
                            <h3 className="font-semibold text-gray-800">
                                {index + 1}. {question}
                                {answers[index].isEdited && (
                                    <span className="ml-2 text-sm text-green-600">(edited)</span>
                                )}
                            </h3>
                            {answers[index].content && (
                                <div className="flex items-center gap-2 text-gray-500">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            regenerateAnswer(index);
                                        }}
                                        className="p-1 hover:text-[#E20074]"
                                        title="Regenerate answer"
                                    >
                                        <RefreshCw size={18} />
                                    </button>
                                    {editingIndex !== index && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(index);
                                            }}
                                            className="p-1 hover:text-[#E20074]"
                                            title="Edit answer"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                    )}
                                    {expandedAnswers[index] ? (
                                        <ChevronUp className="w-5 h-5" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5" />
                                    )}
                                </div>
                            )}
                        </button>
                        
                        {answers[index].content && (
                            <div className={`mt-3 overflow-hidden transition-all duration-200 ease-in-out ${
                                expandedAnswers[index] 
                                    ? 'max-h-[5000px] opacity-100'
                                    : 'max-h-0 opacity-0'
                            }`}>
                                {editingIndex === index ? (
                                    <div className="mt-4">
                                        <textarea
                                            value={editedAnswer}
                                            onChange={(e) => setEditedAnswer(e.target.value)}
                                            className="w-full h-96 p-4 border rounded-md focus:ring-2 focus:ring-[#E20074] focus:border-transparent"
                                        />
                                        <div className="flex justify-end gap-2 mt-2">
                                            <button
                                                onClick={() => setEditingIndex(null)}
                                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleSave(index)}
                                                className="flex items-center gap-2 px-4 py-2 bg-[#E20074] text-white rounded-md hover:bg-[#B4005C] transition-colors"
                                            >
                                                <Save size={18} />
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-600 leading-relaxed max-w-none">
                                        {formatAnswer(answers[index].content)}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {!answers[index].content && (
                            <p className="text-gray-400 italic mt-3">
                                {regeneratingQuestions.includes(index) ? 'Regenerating answer...' :
                                 isAnalyzing ? 'Analyzing...' : 
                                 regeneratingIndex === index ? 'Regenerating Response, sit tight' :
                                 'Analysis not yet generated'}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            <NextStepsModal
                isOpen={isNextStepsModalOpen}
                onClose={() => setIsNextStepsModalOpen(false)}
                analysis={nextStepsAnalysis}
                onProceedToNextRound={() => {
                    handleQuestionSetChange('round2');
                    setIsNextStepsModalOpen(false);
                }}
                currentRound={questionSet}
                isLoading={isPedramThinking}
                onSaveNotes={handleSaveNotes}
                currentAnswers={answers}
                allAnswers={questionSet === 'round2' ? round1Answers : undefined}
                onRegenerateAll={analyzeDocuments}
                onRegeneratePartial={regeneratePartialMemo}
            />

            <ConfirmationModal
                isOpen={showGenerateConfirmation}
                onClose={() => setShowGenerateConfirmation(false)}
                onConfirm={() => {
                    analyzeDocuments();
                }}
                title="Investment Memo Not Generated"
                message="The Investment Memo hasn't been generated yet. Would you like to generate it now?"
                confirmText="Generate"
                cancelText="Cancel"
            />

            <ChecklistModal
                isOpen={showChecklist}
                onClose={() => setShowChecklist(false)}
                items={getChecklistItems()}
                onSaveNotes={handleSaveNotes}
                onRegenerateAll={analyzeDocuments}
                onRegeneratePartial={regeneratePartialMemo}
            />
        </div>
    );
}; 