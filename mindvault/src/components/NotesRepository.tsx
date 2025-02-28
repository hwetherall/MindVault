import React, { useState } from 'react';
import { X, Eye, FileText, File as FileIcon, FolderOpen, Table as TableIcon } from 'lucide-react';

interface Note {
    id: string;
    title: string;
    content: string;
}

interface NotesRepositoryProps {
    notes: Note[];
    onNotesChange: () => Promise<void>;
    files: File[];
    onDeleteFile: (file: File | Note) => void;
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

    const isEmpty = files.length === 0 && notes.length === 0;

    const getFileIcon = (fileName: string) => {
        if (fileName.toLowerCase().endsWith('.pdf')) {
            return <FileIcon size={16} className="text-red-500" />;
        } else if (fileName.toLowerCase().endsWith('.xlsx') || fileName.toLowerCase().endsWith('.xls')) {
            return <TableIcon size={16} className="text-green-500" />;
        }
        return <FileText size={16} className="text-blue-500" />;
    };

    return (
        <div className="flex flex-col">
            <h2 className="text-xl font-bold mb-6 text-[#1A1F2E] border-b-2 border-[#E20074] pb-2">
                Notes Repository
            </h2>
            
            {isEmpty ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <FolderOpen size={48} className="text-gray-300 mb-4" />
                    <p className="text-center text-sm font-medium">
                        The Notes Repository is lonely
                    </p>
                    <p className="text-center text-xs text-gray-400 mt-1">
                        Why not add some files or notes below?
                    </p>
                </div>
            ) : (
                <div className="space-y-1">
                    {files.map((file, index) => (
                        <div 
                            key={index} 
                            className="group flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                {getFileIcon(file.name)}
                                <span className="text-sm text-gray-700 truncate">
                                    {file.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleView(file)}
                                    className="p-1.5 rounded-full hover:bg-[#E20074] hover:text-white transition-colors"
                                    title="View content"
                                >
                                    <Eye size={14} />
                                </button>
                                <button 
                                    onClick={() => onDeleteFile(file)}
                                    className="p-1.5 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                                    title="Delete file"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {notes.map((note) => (
                        <div 
                            key={note.id} 
                            className="group flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <FileText size={16} className="text-[#E20074]" />
                                <span className="text-sm text-gray-700 truncate">
                                    {note.title}
                                </span>
                            </div>
                            <button 
                                onClick={() => onDeleteFile(note)}
                                className="p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-colors"
                                title="Delete note"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {viewContent.isOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-full max-w-2xl m-4 shadow-xl">
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center gap-2">
                                {getFileIcon(viewContent.title)}
                                <h3 className="font-bold text-gray-800">
                                    {viewContent.title}
                                </h3>
                            </div>
                            <button 
                                onClick={() => setViewContent(prev => ({ ...prev, isOpen: false }))}
                                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            <pre className="whitespace-pre-wrap font-sans text-gray-700">
                                {viewContent.content}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}; 