import React, { useState, useEffect } from 'react';
import { KeyIcon } from './Icons';
import { getApiKey, setApiKey } from '../services/grokService';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [apiKey, setApiKeyLocal] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load API key from localStorage or environment
    // Security note: Keys are stored in clear text in localStorage.
    // This is standard for client-side apps where users manage their own keys.
    const storedKey = localStorage.getItem('xai_api_key');
    const currentKey = storedKey || getApiKey() || '';
    setApiKeyLocal(currentKey);
  }, []);

  const handleSave = () => {
    if (apiKey.trim()) {
      // Save to localStorage
      localStorage.setItem('xai_api_key', apiKey.trim());
      // Set in service
      setApiKey(apiKey.trim());
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1500);
    }
  };

  const handleClear = () => {
    localStorage.removeItem('xai_api_key');
    setApiKeyLocal('');
    setApiKey('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <KeyIcon className="w-6 h-6" />
          API-inställningar
        </h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            xAI API-nyckel
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKeyLocal(e.target.value)}
              placeholder="xai-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full p-3 bg-gray-900 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none pr-20"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm bg-gray-700 rounded hover:bg-gray-600 transition-colors"
            >
              {showKey ? 'Dölj' : 'Visa'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Hämta din API-nyckel från{' '}
            <a
              href="https://console.x.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              console.x.ai
            </a>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            🔒 Din API-nyckel sparas lokalt i din webbläsare och skickas aldrig till någon annan än xAI.
          </p>
        </div>

        <div className="bg-gray-900 p-3 rounded-md mb-4 text-sm text-gray-300">
          <p className="mb-2">
            <strong>Rekommenderade modeller:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>
              <strong>grok-4-fast-reasoning</strong> - Bäst balans mellan kvalitet och kostnad för bildanalys
            </li>
            <li>
              <strong>grok-4-fast-non-reason</strong> - Snabbast och billigast för enkla uppgifter
            </li>
            <li>
              <strong>grok-imagine-4</strong> - För bildgenerering med "Spicy Mode"
            </li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="flex-1 px-4 py-3 bg-blue-600 rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
          >
            {saved ? '✓ Sparad!' : 'Spara'}
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-3 bg-red-700 rounded-md hover:bg-red-600 font-semibold transition-colors"
          >
            Rensa
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 bg-gray-700 rounded-md hover:bg-gray-600 font-semibold transition-colors"
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
