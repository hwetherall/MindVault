/**
 * Service for handling notes operations
 */

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

// Mock storage for notes
let notes: Note[] = [
  {
    id: '1',
    title: 'Initial Research',
    content: 'The company shows strong growth potential in the B2B SaaS market.',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15'),
    tags: ['research', 'saas']
  },
  {
    id: '2',
    title: 'Team Analysis',
    content: 'The founding team has strong technical backgrounds and previous startup experience.',
    createdAt: new Date('2023-01-20'),
    updatedAt: new Date('2023-01-22'),
    tags: ['team', 'founders']
  }
];

/**
 * Retrieves all notes
 */
const getNotes = async (): Promise<Note[]> => {
  return [...notes];
};

/**
 * Retrieves a note by ID
 */
const getNoteById = async (id: string): Promise<Note | undefined> => {
  return notes.find(note => note.id === id);
};

/**
 * Creates a new note
 */
const createNote = async (noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> => {
  const newNote: Note = {
    id: Date.now().toString(),
    ...noteData,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  notes.push(newNote);
  return newNote;
};

/**
 * Updates an existing note
 */
const updateNote = async (id: string, noteData: Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Note | undefined> => {
  const noteIndex = notes.findIndex(note => note.id === id);
  
  if (noteIndex === -1) {
    return undefined;
  }
  
  const updatedNote: Note = {
    ...notes[noteIndex],
    ...noteData,
    updatedAt: new Date()
  };
  
  notes[noteIndex] = updatedNote;
  return updatedNote;
};

/**
 * Deletes a note by ID
 */
const deleteNote = async (id: string): Promise<boolean> => {
  const initialLength = notes.length;
  notes = notes.filter(note => note.id !== id);
  return notes.length < initialLength;
};

/**
 * Clears all notes and files
 */
const clearRepository = async (): Promise<void> => {
  notes = [];
};

export const notesService = {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  clearRepository
}; 