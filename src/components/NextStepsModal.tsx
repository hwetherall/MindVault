import React, { useState, useEffect } from 'react';
import { X, ArrowRight, AlertCircle, CheckCircle, Brain, CheckSquare, FileDown } from 'lucide-react';
import { PedramAvatar } from './PedramAvatar';
import { ChecklistModal } from './Checklist';
import jsPDF from 'jspdf';

interface NextStepsModalProps {
    isOpen: boolean;
    onClose: () => void;
    analysis: {
        isComplete: boolean;
        incompleteQuestions: Array<{
            questionIndex: number;
            question: string;
            reason: string;
            suggestions: string[];
        }>;
    };
    onProceedToNextRound?: () => void;
    currentRound: 'round1' | 'round2';
    isLoading: boolean;
    onSaveNotes: (notes: Array<{ question: string; answer: string }>) => void;
    currentAnswers: Array<{ content: string }>;
    allAnswers?: Array<{ content: string }>; // For storing Round 1 answers when in Round 2
    onRegenerateAll: () => void;
    onRegeneratePartial: (questionIndices: number[]) => void;
}

export const NextStepsModal: React.FC<NextStepsModalProps> = ({
    isOpen,
    onClose,
    analysis,
    onProceedToNextRound,
    currentRound,
    isLoading,
    onSaveNotes,
    currentAnswers,
    allAnswers,
    onRegenerateAll,
    onRegeneratePartial,
}) => {
    const [showChecklist, setShowChecklist] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (isLoading) {
            setProgress(0);
            const timer = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 95) {
                        clearInterval(timer);
                        return 95;
                    }
                    return prev + 1;
                });
            }, 100); // Will take ~9.5 seconds to reach 95%

            return () => clearInterval(timer);
        }
    }, [isLoading]);

    const exportToPDF = () => {
        const pdf = new jsPDF();
        let yPosition = 20;
        const pageWidth = pdf.internal.pageSize.width;
        const margin = 20;
        const contentWidth = pageWidth - 2 * margin;

        // Helper function to add text with word wrap
        const addWrappedText = (text: string, y: number) => {
            const lines = pdf.splitTextToSize(text, contentWidth);
            pdf.text(lines, margin, y);
            return y + (lines.length * 7); // Return new Y position
        };

        // Add title
        pdf.setFontSize(20);
        pdf.text('Investment Memo Report', margin, yPosition);
        yPosition += 15;

        // Add Round 1
        pdf.setFontSize(16);
        pdf.text('Round 1 Due Diligence', margin, yPosition);
        yPosition += 10;

        pdf.setFontSize(12);
        const round1Questions = [
            "What is the total addressable market (TAM) and growth potential for this product?",
            "What unique technological advantages or IP does the company possess?",
            "What are the unit economics and path to profitability?",
            "How strong is the competition and what is the competitive advantage?",
            "What are the key risks and mitigation strategies?"
        ];

        // Add Round 1 Q&A
        round1Questions.forEach((question, index) => {
            const answer = allAnswers ? allAnswers[index]?.content : currentAnswers[index]?.content;
            
            if (yPosition > pdf.internal.pageSize.height - 20) {
                pdf.addPage();
                yPosition = 20;
            }

            pdf.setFont("helvetica", 'bold');
            yPosition = addWrappedText(`Q${index + 1}: ${question}`, yPosition);
            yPosition += 5;

            pdf.setFont("helvetica", 'normal');
            yPosition = addWrappedText(answer || 'No answer provided', yPosition);
            yPosition += 10;
        });

        // If we're in Round 2, add Round 2 Q&A
        if (allAnswers) {
            pdf.addPage();
            yPosition = 20;

            pdf.setFontSize(16);
            pdf.text('Round 2 Due Diligence', margin, yPosition);
            yPosition += 10;

            pdf.setFontSize(12);
            const round2Questions = [
                "How scalable is the current product, team, and operations to meet the next phase of growth?",
                "What are the current and projected cash flow needs, and how long will this funding round sustain the business?",
                "What customer acquisition strategies have been most effective so far, and what is the payback period on these efforts?",
                "How strong is the team, and what key hires or organizational changes are necessary to achieve the next growth targets?",
                "What regulatory, technical, or operational hurdles could limit success at scale, and how is the company preparing to address them?"
            ];

            round2Questions.forEach((question, index) => {
                if (yPosition > pdf.internal.pageSize.height - 20) {
                    pdf.addPage();
                    yPosition = 20;
                }

                pdf.setFont("helvetica", 'bold');
                yPosition = addWrappedText(`Q${index + 1}: ${question}`, yPosition);
                yPosition += 5;

                pdf.setFont("helvetica", 'normal');
                yPosition = addWrappedText(currentAnswers[index]?.content || 'No answer provided', yPosition);
                yPosition += 10;
            });
        }

        // Save the PDF
        const timestamp = new Date().toLocaleString().replace(/[/\\?%*:|"<>]/g, '-');
        pdf.save(`Investment-Memo-${timestamp}.pdf`);
    };

    const handleRegeneratePartial = () => {
        const items = getChecklistItems();
        const indices = items.map(item => item.questionNumber - 1);
        onRegeneratePartial(indices);
        onClose();
    };

    const handleRegenerateAll = () => {
        onRegenerateAll();
        onClose();
    };

    if (!isOpen) return null;

    const loadingMessages = [
        "Analyzing your investment memo...",
        "Reviewing the completeness of answers...",
        "Identifying areas for improvement...",
        "Preparing personalized feedback...",
    ];

    const getAllSuggestions = () => {
        return analysis.incompleteQuestions.reduce((acc: string[], question) => {
            return [...acc, ...question.suggestions];
        }, []);
    };

    const getChecklistItems = () => {
        // Group suggestions by question
        return analysis.incompleteQuestions.map(question => ({
            questionNumber: question.questionIndex + 1,
            questionText: question.question,
            reason: question.reason,
            suggestions: question.suggestions.join('\n• '), // Combine suggestions into bullet points
        }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-[#1A1F2E]">
                            Pedram's Analysis
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1 hover:text-[#E20074] transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex flex-col items-center mb-6">
                        <PedramAvatar />
                        {!isLoading && (
                            <p className="text-gray-600 text-center max-w-lg">
                                Hi! I'm Pedram, your Innovation Expert. I've reviewed your investment memo and here's my assessment.
                            </p>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="space-y-6 py-8">
                            <div className="flex flex-col items-center">
                                <div className="animate-pulse flex items-center justify-center w-16 h-16 bg-[#E20074] bg-opacity-10 rounded-full mb-4">
                                    <Brain className="text-[#E20074] w-8 h-8 animate-bounce" />
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-lg font-medium text-gray-700">
                                        Pedram is thinking...
                                    </p>
                                    <div className="relative w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                            className="absolute top-0 left-0 h-full bg-[#E20074] transition-all duration-100 ease-out"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <p className="text-sm text-gray-500 animate-fade-in-out">
                                        {loadingMessages[Math.floor((Date.now() / 2000) % loadingMessages.length)]}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : analysis.isComplete ? (
                        <div className="space-y-4">
                            <div className="p-4 bg-green-50 rounded-lg flex items-start gap-3">
                                <CheckCircle className="text-green-600 mt-1" size={20} />
                                <div>
                                    <p className="text-green-800 font-medium mb-2">
                                        Excellent work on your due diligence!
                                    </p>
                                    <p className="text-green-700">
                                        You've done a thorough job gathering and analyzing the key information for this round. Your answers demonstrate a good understanding of the investment opportunity.
                                    </p>
                                </div>
                            </div>
                            
                            <button
                                onClick={exportToPDF}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                            >
                                <FileDown size={18} />
                                Export Investment Memo PDF
                            </button>

                            {currentRound === 'round1' && (
                                <div className="mt-6">
                                    <p className="text-gray-600 mb-4">
                                        I recommend proceeding to Round 2 due diligence, where we'll dive deeper into operational and scaling aspects.
                                    </p>
                                    <button
                                        onClick={onProceedToNextRound}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#E20074] text-white rounded-md hover:bg-[#B4005C] transition-colors"
                                    >
                                        Proceed to Round 2 Due Diligence
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            )}
                            
                            {currentRound === 'round2' && (
                                <div className="p-4 bg-blue-50 rounded-lg mt-4">
                                    <p className="text-blue-800">
                                        Congratulations! You've completed a comprehensive due diligence process. You now have a solid foundation for making an informed investment decision.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="p-4 bg-yellow-50 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="text-yellow-700 mt-1" size={20} />
                                    <div>
                                        <p className="text-yellow-800 font-medium mb-2">
                                            You're making good progress, but let's strengthen a few areas
                                        </p>
                                        <p className="text-yellow-700">
                                            I've identified some points where additional information would really strengthen your investment analysis.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {analysis.incompleteQuestions.map((item, index) => (
                                <div key={index} className="border rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-800 mb-2">
                                        Question {item.questionIndex + 1}: {item.question}
                                    </h3>
                                    <p className="text-gray-600 mb-3">{item.reason}</p>
                                    <div className="space-y-2">
                                        <p className="font-medium text-gray-700">Here's where to look:</p>
                                        <ul className="list-disc list-inside text-gray-600 space-y-1">
                                            {item.suggestions.map((suggestion, idx) => (
                                                <li key={idx}>{suggestion}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!analysis.isComplete && !isLoading && (
                        <div className="mt-6 flex justify-center">
                            <button
                                onClick={() => setShowChecklist(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-[#E20074] text-white rounded-md hover:bg-[#B4005C] transition-colors"
                            >
                                <CheckSquare size={18} />
                                Create Checklist
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <ChecklistModal
                isOpen={showChecklist}
                onClose={() => setShowChecklist(false)}
                items={getChecklistItems()}
                onSaveNotes={onSaveNotes}
                onRegenerateAll={onRegenerateAll}
                onRegeneratePartial={onRegeneratePartial}
            />
        </div>
    );
}; 