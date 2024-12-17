import React, { useState, useEffect, useRef } from 'react';
import { AIChatHistory } from './AIChatHistory';
import { InvestmentMemo } from './InvestmentMemo';
import { NotesRepository } from './NotesRepository';
import { Upload, FileDown } from 'lucide-react';
import { Note } from '../App';
import { jsPDF } from 'jspdf';

interface MainLayoutProps {
    refreshNotes: () => Promise<Note[]>;
    notes: Note[];
}

const MainLayout: React.FC<MainLayoutProps> = ({ refreshNotes, notes }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [activeTab, setActiveTab] = useState<'chat' | 'memo'>('memo');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadButtonInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = event.target.files;
        if (fileList && fileList.length > 0) {
            const newFiles = Array.from(fileList);
            setFiles(prevFiles => [...prevFiles, ...newFiles]);
            event.target.value = ''; // Reset input
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        
        if (e.dataTransfer.files) {
            const droppedFiles = Array.from(e.dataTransfer.files);
            setFiles(prevFiles => [...prevFiles, ...droppedFiles]);
        }
    };

    const handleDeleteFile = (fileOrNote: File | Note) => {
        if ('lastModified' in fileOrNote) {
            setFiles(prevFiles => prevFiles.filter(file => file !== fileOrNote));
        }
    };

    const handleUploadClick = () => {
        uploadButtonInputRef.current?.click();
    };

    const handleExportPDF = () => {
        if ((window as any).exportInvestmentMemo) {
            (window as any).exportInvestmentMemo();
        } else {
            alert('Please generate the Investment Memo first before exporting to PDF.');
        }
    };

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
                        {/* Main file input for drag & drop area */}
                        <input
                            type="file"
                            id="file-upload"
                            name="file-upload"
                            className="hidden"
                            onChange={handleFileChange}
                            multiple
                            accept=".pdf,.doc,.docx,.txt,.json,.md"
                            ref={fileInputRef}
                        />
                        <label
                            htmlFor="file-upload"
                            className={`flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md cursor-pointer transition-colors ${
                                isDragging ? 'bg-[#E20074] text-white' : ''
                            }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <Upload size={18} />
                            <span>
                                {isDragging 
                                    ? 'Drop files here'
                                    : 'Select Multiple Files'}
                            </span>
                        </label>
                        {/* Separate file input for Upload File button */}
                        <input
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            multiple
                            accept=".pdf,.doc,.docx,.txt,.json,.md"
                            ref={uploadButtonInputRef}
                        />
                        {files.length > 0 && (
                            <span className="text-sm text-gray-600">
                                {files.length} file{files.length !== 1 ? 's' : ''} uploaded
                            </span>
                        )}
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors"
                        >
                            <FileDown size={18} />
                            Export PDF
                        </button>
                    </div>
                </div>
                <div className="flex-1 flex">
                    <div className="flex-1 overflow-y-auto p-6">
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
                    <div className="w-80 border-l flex flex-col">
                        <div className="p-4 border-b bg-white">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {/* handle insert note */}}
                                    className="flex-1 bg-[#E20074] text-white py-2 rounded hover:bg-[#B4005C] transition-colors"
                                >
                                    Insert Note
                                </button>
                                <button
                                    onClick={handleUploadClick}
                                    className="flex-1 bg-[#E20074] text-white py-2 rounded hover:bg-[#B4005C] transition-colors"
                                >
                                    Upload File
                                </button>
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <NotesRepository 
                                notes={notes} 
                                onNotesChange={async () => {
                                    await refreshNotes();
                                    return;
                                }}
                                files={files}
                                onDeleteFile={handleDeleteFile}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MainLayout;