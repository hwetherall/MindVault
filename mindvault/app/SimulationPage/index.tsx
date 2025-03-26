'use client';

import React, { useState, useEffect } from 'react';
import { filesService } from '../services/filesService';
import { ChevronDown, ChevronUp, Home } from 'lucide-react';
import Link from 'next/link';
import SimulationPlanner from './components/SimulationPlanner';
import EvidencePanel from './components/EvidencePanel';
import ScenarioPanel from './components/ScenarioPanel';
import SummaryPanel from './components/SummaryPanel';

const SimulationPage = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const loadedFiles = await filesService.getFiles();
        setFiles(loadedFiles);
      } catch (error) {
        console.error('Error loading files:', error);
      }
    };

    loadFiles();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Simulation</h1>
          <Link 
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <SimulationPlanner />
          <div className="grid grid-cols-2 gap-6">
            <EvidencePanel />
            <ScenarioPanel />
          </div>
          <SummaryPanel />
        </div>

        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-4"
          >
            {isCollapsed ? (
              <>
                <ChevronDown className="w-5 h-5" />
                <span>Show Documents</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-5 h-5" />
                <span>Hide Documents</span>
              </>
            )}
          </button>

          {!isCollapsed && (
            <div className="space-y-4">
              {files.length === 0 ? (
                <p className="text-gray-500">No documents uploaded yet.</p>
              ) : (
                files.map((file) => (
                  <div
                    key={file.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{file.name}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(file.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimulationPage; 