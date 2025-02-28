'use client';

import React, { createContext, useContext, useState } from 'react';

interface Note {
    title: string;
    content: string;
}

interface NotesContextType {
    notes: Note[];
    addNote: (note: Note) => void;
    setNotes: (notes: Note[]) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notes, setNotes] = useState<Note[]>([]);

    const addNote = (note: Note) => {
        setNotes(prev => [...prev, note]);
    };

    return (
        <NotesContext.Provider value={{ notes, addNote, setNotes }}>
            {children}
        </NotesContext.Provider>
    );
};

export const useNotesContext = () => {
    const context = useContext(NotesContext);
    if (context === undefined) {
        throw new Error('useNotesContext must be used within a NotesProvider');
    }
    return context;
}; 