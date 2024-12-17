import React, { useState, useEffect } from 'react';
import { AIChatHistory } from './AIChatHistory';
import { InvestmentMemo } from './InvestmentMemo';
import { NotesRepository } from './NotesRepository';
import { Upload } from 'lucide-react';
import { Note } from '../App';

interface MainLayoutProps {
    refreshNotes: () => Promise<Note[]>;
    notes: Note[];
}

const MainLayout: React.FC<MainLayoutProps> = ({ refreshNotes, notes }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [activeTab, setActiveTab] = useState<'chat' | 'memo'>('memo');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files);
            console.log('New files being added:', newFiles);
            setFiles(prevFiles => {
                const updatedFiles = [...prevFiles, ...newFiles];
                console.log('Updated files state:', updatedFiles);
                return updatedFiles;
            });
        }
    };

    const handleDeleteFile = (fileToDelete: File) => {
        console.log('Deleting file:', fileToDelete);
        setFiles(files.filter(file => file !== fileToDelete));
    };

    useEffect(() => {
        console.log('Current files in MainLayout:', files);
    }, [files]);

    return (
        <div className="flex h-screen">
            <div className="flex-1 flex flex-col">
                <div className="border-b p-4 flex justify-between items-center">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`px-4 py-2 rounded-md transition-colors ${
                                activeTab === 'chat'
                                    ? 'bg-[#E20074] text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            Chat Mode
                        </button>
                        <button
                            onClick={() => setActiveTab('memo')}
                            className={`px-4 py-2 rounded-md transition-colors ${
                                activeTab === 'memo'
                                    ? 'bg-[#E20074] text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            Investment Memo
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            id="file-upload"
                            name="file-upload"
                            className="hidden"
                            onChange={handleFileChange}
                            multiple
                            accept=".pdf,.doc,.docx,.txt"
                        />
                        <label
                            htmlFor="file-upload"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer transition-colors"
                        >
                            <Upload size={18} />
                            Upload Files
                        </label>
                        {files.length > 0 && (
                            <span className="text-sm text-gray-600">
                                {files.length} file{files.length !== 1 ? 's' : ''} uploaded
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex-1 p-6 overflow-auto">
                    {activeTab === 'chat' ? (
                        <AIChatHistory files={files} />
                    ) : (
                        <InvestmentMemo 
                            files={files} 
                            onNotesUpdate={async () => {
                                await refreshNotes();
                            }}
                        />
                    )}
                </div>
            </div>
            <div className="w-80 border-l p-6 overflow-auto">
                <NotesRepository 
                    notes={notes} 
                    onNotesChange={async () => {
                        await refreshNotes();
                    }}
                    files={files}
                    onDeleteFile={(file) => {
                        console.log('Deleting file:', file);
                        setFiles(prevFiles => prevFiles.filter(f => f !== file));
                    }}
                />
            </div>
        </div>
    );
};

export default MainLayout; 