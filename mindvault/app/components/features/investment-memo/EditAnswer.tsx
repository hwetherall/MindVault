import React, { useState } from 'react';
import { Bold, Italic, List, Code, Heading, X, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface EditAnswerProps {
  summary: string;
  details: string;
  onChangeSummary: (value: string) => void;
  onChangeDetails: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * Enhanced component for editing answers with markdown support
 */
const EditAnswer: React.FC<EditAnswerProps> = ({
  summary,
  details,
  onChangeSummary,
  onChangeDetails,
  onSave,
  onCancel
}) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  
  // Insert markdown formatting at cursor position
  const insertFormatting = (formatting: string, surroundSelection: boolean = true, isDetails: boolean = false) => {
    const textareaId = isDetails ? 'details-editor' : 'summary-editor';
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
    if (!textarea) return;
    
    const value = isDetails ? details : summary;
    const onChange = isDetails ? onChangeDetails : onChangeSummary;
    
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
  
  // Formatting button handlers for both editors
  const createFormattingHandlers = (isDetails: boolean) => ({
    handleBold: () => insertFormatting('**', true, isDetails),
    handleItalic: () => insertFormatting('*', true, isDetails),
    handleHeading: () => insertFormatting('### ', true, isDetails),
    handleList: () => insertFormatting('- ', false, isDetails),
    handleCode: () => insertFormatting('`', true, isDetails),
  });

  const summaryHandlers = createFormattingHandlers(false);
  const detailsHandlers = createFormattingHandlers(true);
  
  const FormattingToolbar = ({ isDetails }: { isDetails: boolean }) => {
    const handlers = isDetails ? detailsHandlers : summaryHandlers;
    
    return (
      <div className="flex items-center space-x-1 p-2 bg-gray-50 border-b">
        <button 
          onClick={handlers.handleBold}
          className="p-1 rounded hover:bg-gray-200" 
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button 
          onClick={handlers.handleItalic}
          className="p-1 rounded hover:bg-gray-200" 
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button 
          onClick={handlers.handleHeading}
          className="p-1 rounded hover:bg-gray-200" 
          title="Heading"
        >
          <Heading size={16} />
        </button>
        <button 
          onClick={handlers.handleList}
          className="p-1 rounded hover:bg-gray-200" 
          title="List"
        >
          <List size={16} />
        </button>
        <button 
          onClick={handlers.handleCode}
          className="p-1 rounded hover:bg-gray-200" 
          title="Code"
        >
          <Code size={16} />
        </button>
        <div className="text-xs text-gray-400 ml-2">
          Supports markdown formatting
        </div>
      </div>
    );
  };
  
  return (
    <div className="border rounded-lg overflow-hidden space-y-4">
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
      
      {/* Edit view */}
      {activeTab === 'edit' && (
        <>
          {/* Summary Section */}
          <div className="border rounded-lg">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h3 className="font-medium text-gray-700">Summary</h3>
            </div>
            {activeTab === 'edit' && <FormattingToolbar isDetails={false} />}
            <textarea
              id="summary-editor"
              className="w-full p-4 min-h-[100px] focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={summary}
              onChange={(e) => onChangeSummary(e.target.value)}
              placeholder="Edit the summary here..."
            />
          </div>

          {/* Details Section */}
          <div className="border rounded-lg">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h3 className="font-medium text-gray-700">Details</h3>
            </div>
            {activeTab === 'edit' && <FormattingToolbar isDetails={true} />}
            <textarea
              id="details-editor"
              className="w-full p-4 min-h-[200px] focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={details}
              onChange={(e) => onChangeDetails(e.target.value)}
              placeholder="Edit the details here..."
            />
          </div>
        </>
      )}
      
      {/* Preview view */}
      {activeTab === 'preview' && (
        <>
          <div className="border rounded-lg">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h3 className="font-medium text-gray-700">Summary</h3>
            </div>
            <div className="p-4 prose prose-sm max-w-none">
              <ReactMarkdown>{summary}</ReactMarkdown>
            </div>
          </div>

          <div className="border rounded-lg">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <h3 className="font-medium text-gray-700">Details</h3>
            </div>
            <div className="p-4 prose prose-sm max-w-none">
              <ReactMarkdown>{details}</ReactMarkdown>
            </div>
          </div>
        </>
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