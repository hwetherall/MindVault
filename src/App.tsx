import React, { useState, useEffect } from 'react';
import { NotesProvider } from './context/NotesContext';
import { AIProvider } from './context/AIContext';
import MainLayout from './components/MainLayout';
import { notesService } from './services/notesService';
import WelcomePopup from './components/WelcomePopup';

export interface Note {
    id: string;
    title: string;
    content: string;
}

const App: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>([]);

    const refreshNotes = async () => {
        try {
            const updatedNotes = await notesService.getNotes();
            setNotes(updatedNotes);
            return updatedNotes;
        } catch (error) {
            console.error('Error refreshing notes:', error);
            throw error;
        }
    };

    useEffect(() => {
        refreshNotes().catch(console.error);
    }, []);

    return (
        <NotesProvider>
            <AIProvider>
                <MainLayout 
                    refreshNotes={refreshNotes} 
                    notes={notes} 
                />
                <WelcomePopup />
            </AIProvider>
        </NotesProvider>
    );
};

export default App; 