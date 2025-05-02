import React from 'react';
import { X } from 'lucide-react';

export interface BenchmarkCompany {
  id: string;
  name: string;
  description: string;
}

interface BenchmarkSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (companyId: string) => void;
  companies: BenchmarkCompany[];
  selectedCompanyId: string | null;
}

const BenchmarkSelectionModal: React.FC<BenchmarkSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  companies,
  selectedCompanyId
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Select Benchmark Company</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <p className="text-gray-600 mb-4">
          Select a company to benchmark against. Benchmarking helps evaluate Go1's performance against competitors or industry standards.
        </p>
        
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {companies.map((company) => (
            <div
              key={company.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedCompanyId === company.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
              onClick={() => onSelect(company.id)}
            >
              <div className="font-medium text-gray-900 mb-1">{company.name}</div>
              <div className="text-sm text-gray-600">{company.description}</div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default BenchmarkSelectionModal; 