import React from 'react';
import { X } from 'lucide-react';

interface NoteViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    note: {
        title: string;
        content: string;
    } | null;
}

export const NoteViewerModal: React.FC<NoteViewerModalProps> = ({
    isOpen,
    onClose,
    note
}) => {
    if (!isOpen || !note) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] m-4 flex flex-col">
                <div className="p-6 border-b">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-[#1A1F2E]">
                            {note.title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-1 hover:text-[#E20074] transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>
                <div className="p-6 overflow-y-auto flex-grow">
                    <div className="prose max-w-none">
                        {note.content.split('\n').map((line, index) => (
                            <p key={index} className="mb-4">
                                {line}
                            </p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}; 