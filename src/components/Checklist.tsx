import React, { useState, useEffect } from 'react';
import { X, Save, CheckSquare } from 'lucide-react';

interface ChecklistItem {
    questionNumber: number;
    questionText: string;
    reason: string;
    suggestions: string;
    notes: string;
}

interface ChecklistModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: Array<{
        questionNumber: number;
        questionText: string;
        reason: string;
        suggestions: string;
    }>;
    onSaveNotes: (notes: Array<{ question: string; answer: string }>) => void;
    onRegenerateAll: () => void;
    onRegeneratePartial: (questionIndices: number[]) => void;
}

export const ChecklistModal: React.FC<ChecklistModalProps> = ({
    isOpen,
    onClose,
    items,
    onSaveNotes,
    onRegenerateAll,
    onRegeneratePartial,
}) => {
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showRegenerateOptions, setShowRegenerateOptions] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setChecklistItems(items.map(item => ({
                ...item,
                notes: ''
            })));
        }
    }, [isOpen, items]);

    if (!isOpen || items.length === 0) return null;

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            const formattedNotes = checklistItems.map(item => (
                `Question ${item.questionNumber}: ${item.questionText}\n\n` +
                `Missing Information: ${item.reason}\n\n` +
                `Required Data:\n• ${item.suggestions}\n\n` +
                `Notes:\n${item.notes}\n\n` +
                `-------------------\n`
            )).join('\n');

            const timestamp = new Date().toLocaleString();
            await onSaveNotes([{
                question: `Investment Memo Updates - ${timestamp}`,
                answer: formattedNotes
            }]);

            setShowRegenerateOptions(true);
        } catch (error) {
            console.error('Error saving notes:', error);
            alert('Error saving notes. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (showRegenerateOptions) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg w-full max-w-md p-6">
                    <h2 className="text-xl font-bold text-[#1A1F2E] mb-4">
                        How would you like to regenerate the memo?
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Choose how you want to update your Investment Memo with the new information.
                    </p>
                    <div className="space-y-4">
                        <button
                            onClick={() => {
                                onRegeneratePartial(checklistItems.map(item => item.questionNumber - 1));
                                setShowRegenerateOptions(false);
                                onClose();
                            }}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#E20074] text-white rounded-md hover:bg-[#B4005C] transition-colors"
                        >
                            Regenerate Improved Sections Only
                        </button>
                        <button
                            onClick={() => {
                                onRegenerateAll();
                                setShowRegenerateOptions(false);
                                onClose();
                            }}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-[#E20074] text-[#E20074] rounded-md hover:bg-pink-50 transition-colors"
                        >
                            Regenerate Entire Memo
                        </button>
                        <button
                            onClick={() => {
                                setShowRegenerateOptions(false);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] overflow-y-auto m-4">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <CheckSquare className="text-[#E20074]" size={24} />
                            <h2 className="text-xl font-bold text-[#1A1F2E]">
                                Required Information
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:text-[#E20074] transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {checklistItems.map((item, index) => (
                            <div key={index} className="border rounded-lg p-4">
                                <h3 className="font-semibold text-gray-800 mb-2">
                                    Question {item.questionNumber}: {item.questionText}
                                </h3>
                                <div className="mb-4 text-gray-600">
                                    <p className="mb-2">{item.reason}</p>
                                    <div className="bg-yellow-50 p-3 rounded-md">
                                        <p className="font-medium mb-1">Required Data:</p>
                                        <p className="whitespace-pre-line">• {item.suggestions}</p>
                                    </div>
                                </div>
                                <textarea
                                    value={item.notes}
                                    onChange={(e) => {
                                        const newItems = [...checklistItems];
                                        newItems[index].notes = e.target.value;
                                        setChecklistItems(newItems);
                                    }}
                                    placeholder="Enter your findings here..."
                                    className="w-full h-32 p-3 border rounded-md focus:ring-2 focus:ring-[#E20074] focus:border-transparent"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 bg-[#E20074] text-white rounded-md hover:bg-[#B4005C] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <Save size={18} />
                            {isSaving ? 'Saving...' : 'Save to Repository'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}; 