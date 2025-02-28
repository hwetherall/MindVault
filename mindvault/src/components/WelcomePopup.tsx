import React from 'react';
import { PedramAvatar } from './PedramAvatar';

interface WelcomePopupProps {
  isVisible: boolean;
  onClose: () => void;
}

const WelcomePopup: React.FC<WelcomePopupProps> = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <div className="flex items-center gap-4 mb-4">
          <PedramAvatar className="w-16 h-16" />
          <h2 className="text-xl font-bold">Welcome! I'm Pedram</h2>
        </div>
        
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            As your dedicated AI investment analyst, I specialize in helping investors 
            like you make well-informed decisions through comprehensive company analysis 
            and due diligence.
          </p>
          
          <p className="text-gray-700 font-medium">
            Let's get started with your analysis:
          </p>
          
          <ol className="list-decimal list-inside space-y-3">
            <li className="text-gray-700">
              <span className="font-medium">Upload Documents:</span>
              <br />
              <span className="text-sm ml-5">Add financial statements, presentations, or any company materials to your Repository</span>
            </li>
            <li className="text-gray-700">
              <span className="font-medium">Interactive Analysis:</span>
              <br />
              <span className="text-sm ml-5">Engage in detailed discussions about the company's business model, financials, and strategy</span>
            </li>
            <li className="text-gray-700">
              <span className="font-medium">Investment Memo:</span>
              <br />
              <span className="text-sm ml-5">Generate a structured analysis covering key investment aspects and considerations</span>
            </li>
          </ol>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-[#1A1F2E] text-white py-2 px-4 rounded hover:bg-[#2A2F3E] transition-colors"
        >
          Let's Begin
        </button>
      </div>
    </div>
  );
};

export default WelcomePopup; 