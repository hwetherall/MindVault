import React, { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

interface PromptEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptData: {
    prompt: string;
    rawResponse: string;
    includedDocuments: Array<{name: string, type: string}>;
    stats: {
      model: string;
      time: number;
      promptTokens: number;
      completionTokens: number;
    };
  };
}

const PromptEngineModal: React.FC<PromptEngineModalProps> = ({ 
  isOpen, 
  onClose, 
  promptData 
}) => {
  const [activeTab, setActiveTab] = useState('prompt');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalTokens = promptData.stats.promptTokens + promptData.stats.completionTokens;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Prompt Engine</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b">
          <button 
            onClick={() => setActiveTab('prompt')} 
            className={`px-4 py-2 font-medium ${activeTab === 'prompt' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-gray-800'}`}
          >
            Prompt
          </button>
          <button 
            onClick={() => setActiveTab('response')} 
            className={`px-4 py-2 font-medium ${activeTab === 'response' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-gray-800'}`}
          >
            Response
          </button>
          <button 
            onClick={() => setActiveTab('stats')} 
            className={`px-4 py-2 font-medium ${activeTab === 'stats' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-gray-800'}`}
          >
            Stats
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'prompt' && (
            <div>
              <div className="flex justify-between mb-2">
                <h3 className="text-sm font-semibold">Prompt Input</h3>
                <button 
                  onClick={() => copyToClipboard(promptData.prompt)}
                  className="text-blue-600 text-sm flex items-center"
                >
                  {copied ? <Check size={16} className="mr-1" /> : <Copy size={16} className="mr-1" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <SyntaxHighlighter 
                language="markdown" 
                style={docco} 
                customStyle={{borderRadius: '0.375rem'}}
              >
                {promptData.prompt}
              </SyntaxHighlighter>
              
              {promptData.includedDocuments && promptData.includedDocuments.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold mb-2">Included Documents</h3>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {promptData.includedDocuments.map((doc, index) => (
                        <li key={index}>
                          {doc.name} ({doc.type})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'response' && (
            <div>
              <div className="flex justify-between mb-2">
                <h3 className="text-sm font-semibold">AI Output</h3>
                <button 
                  onClick={() => copyToClipboard(promptData.rawResponse)}
                  className="text-blue-600 text-sm flex items-center"
                >
                  {copied ? <Check size={16} className="mr-1" /> : <Copy size={16} className="mr-1" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <SyntaxHighlighter 
                language="markdown" 
                style={docco} 
                customStyle={{borderRadius: '0.375rem'}}
              >
                {promptData.rawResponse}
              </SyntaxHighlighter>
            </div>
          )}
          
          {activeTab === 'stats' && (
            <div>
              <h3 className="text-sm font-semibold mb-4">Performance Statistics</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-xs font-medium text-gray-500 mb-1">Model</h4>
                  <p className="text-lg font-medium">{promptData.stats.model}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="text-xs font-medium text-gray-500 mb-1">Processing Time</h4>
                  <p className="text-lg font-medium">{promptData.stats.time.toFixed(2)}s</p>
                </div>
              </div>
              
              <h4 className="text-sm font-medium mt-6 mb-2">Token Usage</h4>
              <div className="mb-6">
                <div className="bg-gray-100 h-6 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full" 
                    style={{width: `${(promptData.stats.promptTokens / totalTokens) * 100}%`}}
                  ></div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <div>
                    <span className="font-medium">Prompt: </span>
                    <span>{promptData.stats.promptTokens} tokens</span>
                  </div>
                  <div>
                    <span className="font-medium">Completion: </span>
                    <span>{promptData.stats.completionTokens} tokens</span>
                  </div>
                  <div>
                    <span className="font-medium">Total: </span>
                    <span>{totalTokens} tokens</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                <h4 className="text-xs font-medium text-blue-800 mb-2">Estimated Cost</h4>
                <p className="text-sm">
                  Prompt tokens: ${(promptData.stats.promptTokens * 0.000001).toFixed(5)} @ $0.001/1K tokens<br />
                  Completion tokens: ${(promptData.stats.completionTokens * 0.000002).toFixed(5)} @ $0.002/1K tokens<br />
                  <span className="font-medium">Total: ${((promptData.stats.promptTokens * 0.000001) + (promptData.stats.completionTokens * 0.000002)).toFixed(5)}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptEngineModal; 