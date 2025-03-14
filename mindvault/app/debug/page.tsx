'use client';

import { useState, useEffect } from 'react';

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDebugInfo() {
      try {
        setLoading(true);
        const response = await fetch('/api/debug');
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        setDebugInfo(data);
        setError(null);
      } catch (err) {
        setError((err as Error).message);
        console.error('Debug fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDebugInfo();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API Configuration Debug</h1>
      
      {loading && <p className="text-gray-600">Loading configuration information...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {debugInfo && (
        <div className="bg-gray-100 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Environment Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded shadow">
              <p className="font-medium">Node Environment:</p>
              <p className="text-gray-700">{debugInfo.environment}</p>
            </div>
            
            <div className="bg-white p-4 rounded shadow">
              <p className="font-medium">Vercel Environment:</p>
              <p className="text-gray-700">{debugInfo.vercelEnvironment}</p>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold mb-4">OpenAI Configuration</h2>
          
          <div className="bg-white p-4 rounded shadow mb-4">
            <p className="font-medium">API Key Present:</p>
            <p className={`${debugInfo.apiKeyPresent ? 'text-green-600' : 'text-red-600'} font-bold`}>
              {debugInfo.apiKeyPresent ? 'Yes' : 'No'}
            </p>
          </div>
          
          {debugInfo.apiKeyPresent && (
            <>
              <div className="bg-white p-4 rounded shadow mb-4">
                <p className="font-medium">API Key Type:</p>
                <p className="text-gray-700">{debugInfo.apiKeyType}</p>
              </div>
              
              <div className="bg-white p-4 rounded shadow mb-4">
                <p className="font-medium">API Key Sample:</p>
                <p className="text-gray-700 font-mono">{debugInfo.apiKeySample}</p>
              </div>
            </>
          )}
          
          <div className="bg-white p-4 rounded shadow mb-4">
            <p className="font-medium">OpenAI Client Initialized:</p>
            <p className={`${debugInfo.openaiInitialized ? 'text-green-600' : 'text-red-600'} font-bold`}>
              {debugInfo.openaiInitialized ? 'Yes' : 'No'}
            </p>
          </div>
          
          {debugInfo.openaiInitialized && (
            <div className="bg-white p-4 rounded shadow mb-4">
              <p className="font-medium">Models Available:</p>
              <p className={`${debugInfo.modelsAvailable ? 'text-green-600' : 'text-red-600'} font-bold`}>
                {debugInfo.modelsAvailable ? 'Yes' : 'No'}
              </p>
              
              {debugInfo.modelsAvailable && (
                <div className="mt-2">
                  <p className="font-medium">Sample Models:</p>
                  <ul className="list-disc list-inside text-gray-700">
                    {debugInfo.modelSamples.map((model: string) => (
                      <li key={model}>{model}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          <div className="bg-white p-4 rounded shadow">
            <p className="font-medium">Timestamp:</p>
            <p className="text-gray-700">{new Date(debugInfo.timestamp).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
} 