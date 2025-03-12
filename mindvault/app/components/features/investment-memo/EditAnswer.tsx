import React, { useState } from 'react';
import { Bold, Italic, List, Code, Heading, X, Save } from 'lucide-react';

interface EditAnswerProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * Enhanced component for editing answers with markdown support
 */
const EditAnswer: React.FC<EditAnswerProps> = ({
  value,
  onChange,
  onSave,
  onCancel
}) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  
  // Insert markdown formatting at cursor position
  const insertFormatting = (formatting: string, surroundSelection: boolean = true) => {
    const textarea = document.getElementById('answer-editor') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    let newText;
    if (surroundSelection) {
      // Surround selected text with formatting (e.g., **selected text**)
      newText = value.substring(0, start) + 
                formatting + selectedText + formatting + 
                value.substring(end);
      
      // Set new cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + formatting.length, 
          end + formatting.length
        );
      }, 0);
    } else {
      // Insert formatting and placeholder at cursor position
      newText = value.substring(0, start) + formatting + value.substring(end);
      
      // Set new cursor position after inserted text
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + formatting.length, 
          start + formatting.length
        );
      }, 0);
    }
    
    onChange(newText);
  };
  
  // Formatting button handlers
  const handleBold = () => insertFormatting('**');
  const handleItalic = () => insertFormatting('*');
  const handleHeading = () => insertFormatting('### ');
  const handleList = () => insertFormatting('- ', false);
  const handleCode = () => insertFormatting('`');
  
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'edit' 
              ? 'bg-white border-b-2 border-blue-500 text-blue-600' 
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
          onClick={() => setActiveTab('edit')}
        >
          Edit
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'preview' 
              ? 'bg-white border-b-2 border-blue-500 text-blue-600' 
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </button>
      </div>
      
      {/* Formatting toolbar - only show when in edit mode */}
      {activeTab === 'edit' && (
        <div className="flex items-center space-x-1 p-2 bg-gray-50 border-b">
          <button 
            onClick={handleBold}
            className="p-1 rounded hover:bg-gray-200" 
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button 
            onClick={handleItalic}
            className="p-1 rounded hover:bg-gray-200" 
            title="Italic"
          >
            <Italic size={16} />
          </button>
          <button 
            onClick={handleHeading}
            className="p-1 rounded hover:bg-gray-200" 
            title="Heading"
          >
            <Heading size={16} />
          </button>
          <button 
            onClick={handleList}
            className="p-1 rounded hover:bg-gray-200" 
            title="List"
          >
            <List size={16} />
          </button>
          <button 
            onClick={handleCode}
            className="p-1 rounded hover:bg-gray-200" 
            title="Code"
          >
            <Code size={16} />
          </button>
          <div className="text-xs text-gray-400 ml-2">
            Supports markdown formatting
          </div>
        </div>
      )}
      
      {/* Edit view */}
      {activeTab === 'edit' && (
        <textarea
          id="answer-editor"
          className="w-full p-4 min-h-[200px] focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Edit the answer here..."
        />
      )}
      
      {/* Preview view - would require ReactMarkdown implementation */}
      {activeTab === 'preview' && (
        <div className="p-4 min-h-[200px] prose prose-sm max-w-none">
          {/* This would need ReactMarkdown, but we're just showing raw text for now */}
          <div className="whitespace-pre-wrap">{value}</div>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex justify-end p-2 bg-gray-50 border-t">
        <button
          onClick={onCancel}
          className="flex items-center text-sm px-3 py-1 mr-2 rounded text-gray-600 hover:bg-gray-200"
        >
          <X size={16} className="mr-1" />
          Cancel
        </button>
        <button
          onClick={onSave}
          className="flex items-center text-sm px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
        >
          <Save size={16} className="mr-1" />
          Save
        </button>
      </div>
    </div>
  );
};

export default EditAnswer; 