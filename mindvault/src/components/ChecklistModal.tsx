import React from 'react';

interface ChecklistItem {
    questionNumber: number;
    questionText: string;
    reason: string;
    suggestions: string;
}

interface ChecklistModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: ChecklistItem[];
    onSaveNotes: (notes: Array<{ question: string; answer: string }>) => Promise<void>;
    onRegenerateAll: () => void;
    onRegeneratePartial: (indices: number[]) => void;
}

export const ChecklistModal: React.FC<ChecklistModalProps> = ({
    isOpen,
    onClose,
    items,
    onSaveNotes,
    onRegenerateAll,
    onRegeneratePartial
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Action Items Checklist</h2>
                {/* Add your checklist UI here */}
            </div>
        </div>
    );
}; 