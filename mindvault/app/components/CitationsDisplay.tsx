import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

interface Citation {
  fileId: string;
  filename: string;
  text: string;
}

interface CitationsDisplayProps {
  citations: Citation[];
}

const CitationsDisplay: React.FC<CitationsDisplayProps> = ({ citations }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      <div 
        className="flex justify-between items-center p-3 cursor-pointer"
        onClick={toggleExpansion}
      >
        <h4 className="text-sm font-semibold text-gray-700">
          Citations ({citations.length})
        </h4>
        <button className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
          {isExpanded ? (
            <>
              <span>Hide citations</span>
              <ChevronUp className="h-4 w-4 ml-1" />
            </>
          ) : (
            <>
              <span>View citations</span>
              <ChevronDown className="h-4 w-4 ml-1" />
            </>
          )}
        </button>
      </div>
      
      {isExpanded && (
        <div className="p-3 border-t border-gray-200 space-y-3">
          {citations.map((citation, index) => (
            <div key={index} className="p-2 bg-gray-50 rounded text-sm">
              <div className="flex justify-between mb-1">
                <span className="font-medium text-gray-700">{citation.filename}</span>
                <span className="text-xs text-gray-500">ID: {citation.fileId}</span>
              </div>
              <div className="text-gray-600 text-sm bg-white p-2 rounded border border-gray-200">
                {citation.text}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CitationsDisplay; 