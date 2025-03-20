import React, { useState } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, Edit2 } from 'lucide-react';

interface PromptPlaygroundProps {
  answer: {
    modelUsed?: string;
    timeTaken?: number;
    messageLength?: number;
    answerLength?: number;
    finalInstructions?: string;
    documentContext?: string;
    finalPrompt?: string;
    rawOutput?: string;
  };
  onRegenerate: () => void;
  onInstructionsChange?: (value: string) => void;
  currentInstructions?: string;
}

const PromptPlayground: React.FC<PromptPlaygroundProps> = ({
  answer,
  onRegenerate,
  onInstructionsChange,
  currentInstructions
}) => {
  // Track each playground section independently
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    finalInstructions: false,
    documentContext: false,
    finalPrompt: false,
    aiOutput: false
  });
  // Track editing state for instructions
  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  // Track edited instruction values
  const [editedInstructions, setEditedInstructions] = useState(currentInstructions || answer?.finalInstructions || '');

  // Initialize edited values when answer or currentInstructions changes
  React.useEffect(() => {
    setEditedInstructions(currentInstructions || answer?.finalInstructions || '');
  }, [answer, currentInstructions]);

  // Toggle individual playground section
  const togglePlaygroundSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Add handlers for instruction editing
  const handleInstructionEdit = () => {
    setIsEditingInstructions(true);
  };

  const handleInstructionSave = () => {
    if (onInstructionsChange) {
      onInstructionsChange(editedInstructions);
    }
    setIsEditingInstructions(false);
  };

  const handleInstructionChange = (value: string) => {
    setEditedInstructions(value);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <h4 className="text-sm font-semibold text-gray-700 mb-4">Prompt Playground</h4>
        <div className="space-y-4">
          {/* Model and Metrics */}
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex items-center justify-center text-sm">
              <div className="flex items-center space-x-6">
                <div className="flex items-center">
                  <span className="text-gray-600 font-medium">Model:</span>
                  <span className="ml-2 text-blue-600">{answer.modelUsed || 'Not specified'}</span>
                </div>
                <div className="text-gray-300">|</div>
                <div className="flex items-center">
                  <span className="text-gray-600 font-medium">Time:</span>
                  <span className="ml-2 text-green-600">{answer.timeTaken ? `${(answer.timeTaken / 1000).toFixed(2)}s` : 'N/A'}</span>
                </div>
                <div className="text-gray-300">|</div>
                <div className="flex items-center">
                  <span className="text-gray-600 font-medium">Input:</span>
                  <span className="ml-2 text-purple-600">{answer.messageLength ? `${answer.messageLength} tokens` : 'N/A'}</span>
                </div>
                <div className="text-gray-300">|</div>
                <div className="flex items-center">
                  <span className="text-gray-600 font-medium">Output:</span>
                  <span className="ml-2 text-amber-600">{answer.answerLength ? `${answer.answerLength} tokens` : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Final Instructions */}
          <div className="rounded-lg border border-gray-200 shadow-sm">
            <div 
              className="flex justify-between items-center cursor-pointer px-6 py-4" 
              onClick={() => togglePlaygroundSection('finalInstructions')}
            >
              <h4 className="text-sm font-semibold text-gray-700">Final Instructions</h4>
              <div className="flex items-center gap-3">
                {!expandedSections.finalInstructions && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent section toggle
                      setIsEditingInstructions(true);
                      togglePlaygroundSection('finalInstructions');
                    }}
                    className="text-blue-600 hover:text-blue-800 p-1"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                )}
                <button className="text-gray-600 hover:text-gray-800 text-sm flex items-center">
                  {expandedSections.finalInstructions ? (
                    <>
                      <span>Hide</span>
                      <ChevronUp className="h-4 w-4 ml-1" />
                    </>
                  ) : (
                    <>
                      <span>Show</span>
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
            {expandedSections.finalInstructions && (
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                {isEditingInstructions ? (
                  <div className="space-y-4">
                    <div className="relative border rounded-lg bg-white shadow-sm">
                      <textarea
                        value={editedInstructions}
                        onChange={(e) => {
                          setEditedInstructions(e.target.value);
                          // Auto-adjust height
                          e.target.style.height = 'auto';
                          e.target.style.height = `${Math.min(Math.max(e.target.scrollHeight, 300), 600)}px`;
                        }}
                        className="w-full p-4 text-sm font-mono bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
                        placeholder="Enter final instructions..."
                        style={{
                          minHeight: '300px',
                          maxHeight: '600px',
                          resize: 'none',
                          overflowY: 'auto'
                        }}
                      />
                    </div>
                    <div className="flex justify-end items-center">
                      <button
                        onClick={() => {
                          setIsEditingInstructions(false);
                          setEditedInstructions(currentInstructions || answer?.finalInstructions || '');
                        }}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (onInstructionsChange) {
                            onInstructionsChange(editedInstructions);
                          }
                          setIsEditingInstructions(false);
                        }}
                        className="ml-3 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                      >
                        Save Instructions
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative border rounded-lg bg-white shadow-sm">
                      <pre className="p-4 text-sm font-mono text-gray-800 whitespace-pre-wrap" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        {currentInstructions || answer?.finalInstructions || 'No instructions available'}
                      </pre>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => setIsEditingInstructions(true)}
                        className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit Instructions
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Document Context */}
          <div className="rounded-lg border border-gray-200 shadow-sm">
            <div 
              className="flex justify-between items-center cursor-pointer px-6 py-4" 
              onClick={() => togglePlaygroundSection('documentContext')}
            >
              <h4 className="text-sm font-semibold text-gray-700">Document Context</h4>
              <button className="text-gray-600 hover:text-gray-800 text-sm flex items-center">
                {expandedSections.documentContext ? (
                  <>
                    <span>Hide</span>
                    <ChevronUp className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    <span>Show</span>
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </>
                )}
              </button>
            </div>
            {expandedSections.documentContext && (
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap max-h-[400px] overflow-y-auto">{answer.documentContext || 'No context available'}</pre>
              </div>
            )}
          </div>

          {/* Final Prompt */}
          <div className="rounded-lg border border-gray-200 shadow-sm">
            <div 
              className="flex justify-between items-center cursor-pointer px-6 py-4" 
              onClick={() => togglePlaygroundSection('finalPrompt')}
            >
              <h4 className="text-sm font-semibold text-gray-700">Final Prompt</h4>
              <button className="text-gray-600 hover:text-gray-800 text-sm flex items-center">
                {expandedSections.finalPrompt ? (
                  <>
                    <span>Hide</span>
                    <ChevronUp className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    <span>Show</span>
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </>
                )}
              </button>
            </div>
            {expandedSections.finalPrompt && (
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap max-h-[500px] overflow-y-auto">{answer.finalPrompt || 'No prompt available'}</pre>
              </div>
            )}
          </div>

          {/* AI Output */}
          <div className="rounded-lg border border-gray-200 shadow-sm">
            <div 
              className="flex justify-between items-center cursor-pointer px-6 py-4" 
              onClick={() => togglePlaygroundSection('aiOutput')}
            >
              <h4 className="text-sm font-semibold text-gray-700">AI Output</h4>
              <button className="text-gray-600 hover:text-gray-800 text-sm flex items-center">
                {expandedSections.aiOutput ? (
                  <>
                    <span>Hide</span>
                    <ChevronUp className="h-4 w-4 ml-1" />
                  </>
                ) : (
                  <>
                    <span>Show</span>
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </>
                )}
              </button>
            </div>
            {expandedSections.aiOutput && (
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap max-h-[600px] overflow-y-auto">{answer.rawOutput || 'No output available'}</pre>
              </div>
            )}
          </div>

          {/* Add Regenerate button at the bottom */}
          <div className="flex justify-end mt-4">
            <button
              onClick={onRegenerate}
              disabled={isEditingInstructions}
              className={`flex items-center text-sm px-4 py-2 rounded-lg ${
                isEditingInstructions
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
              } transition-colors`}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate Answer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptPlayground; 