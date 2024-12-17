import React, { useState } from 'react';
import { X, Eye } from 'lucide-react';

interface Note {
    id: string;
    title: string;
    content: string;
}

interface NotesRepositoryProps {
    notes: Note[];
    onNotesChange: () => Promise<void>;
    files: File[];
    onDeleteFile: (file: File) => void;
}

export const NotesRepository: React.FC<NotesRepositoryProps> = ({
    notes,
    onNotesChange,
    files,
    onDeleteFile
}) => {
    const [viewContent, setViewContent] = useState<{ isOpen: boolean; content: string; title: string }>({
        isOpen: false,
        content: '',
        title: ''
    });

    const handleView = async (file: File) => {
        try {
            const text = await file.text();
            setViewContent({
                isOpen: true,
                content: text,
                title: file.name
            });
        } catch (error) {
            console.error('Error reading file:', error);
            alert('Unable to read file content');
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4 border-b-2 border-[#E20074] pb-2">
                Notes Repository
            </h2>
            
            <div className="space-y-2">
                {files.map((file, index) => (
                    <div key={index} className="flex justify-between items-center">
                        <span>{file.name}</span>
                        <div className="flex items-center">
                            <button 
                                onClick={() => handleView(file)}
                                className="text-gray-400 hover:text-[#E20074] p-1"
                            >
                                <Eye size={16} />
                            </button>
                            <button 
                                onClick={() => onDeleteFile(file)}
                                className="text-gray-400 hover:text-red-500 p-1"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal for viewing content */}
            {viewContent.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-lg w-full max-w-2xl m-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold">{viewContent.title}</h3>
                            <button 
                                onClick={() => setViewContent(prev => ({ ...prev, isOpen: false }))}
                                className="px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 rounded"
                            >
                                Close
                            </button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto">
                            <pre className="whitespace-pre-wrap">{viewContent.content}</pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}; 