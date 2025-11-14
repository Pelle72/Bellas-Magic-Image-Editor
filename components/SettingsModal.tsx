import React, { useState, useEffect } from 'react';
import { KeyIcon } from './Icons';
import { getApiKey, setApiKey } from '../services/grokService';
import { 
  getHFApiKey, 
  setHFApiKey, 
  getHFCustomEndpoint, 
  setHFCustomEndpoint, 
  clearHFCustomEndpoint,
  getHFCustomInpaintingEndpoint,
  setHFCustomInpaintingEndpoint,
  clearHFCustomInpaintingEndpoint
} from '../services/huggingFaceService';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [apiKey, setApiKeyLocal] = useState('');
  const [hfApiKey, setHFApiKeyLocal] = useState('');
  const [hfCustomEndpoint, setHFCustomEndpointLocal] = useState('');
  const [hfCustomInpaintingEndpoint, setHFCustomInpaintingEndpointLocal] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [showHFKey, setShowHFKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load API keys from localStorage or environment
    // Security note: Keys are stored in clear text in localStorage.
    // This is standard for client-side apps where users manage their own keys.
    const storedKey = localStorage.getItem('xai_api_key');
    const currentKey = storedKey || getApiKey() || '';
    setApiKeyLocal(currentKey);
    
    const storedHFKey = localStorage.getItem('hf_api_key');
    const currentHFKey = storedHFKey || getHFApiKey() || '';
    setHFApiKeyLocal(currentHFKey);
    
    const storedEndpoint = localStorage.getItem('hf_custom_endpoint');
    const currentEndpoint = storedEndpoint || getHFCustomEndpoint() || '';
    setHFCustomEndpointLocal(currentEndpoint);
    
    const storedInpaintingEndpoint = localStorage.getItem('hf_custom_inpainting_endpoint');
    const currentInpaintingEndpoint = storedInpaintingEndpoint || getHFCustomInpaintingEndpoint() || '';
    setHFCustomInpaintingEndpointLocal(currentInpaintingEndpoint);
  }, []);

  const handleSave = () => {
    if (apiKey.trim() || hfApiKey.trim() || hfCustomEndpoint.trim() || hfCustomInpaintingEndpoint.trim()) {
      // Save xAI API key
      if (apiKey.trim()) {
        localStorage.setItem('xai_api_key', apiKey.trim());
        setApiKey(apiKey.trim());
      }
      // Save Hugging Face API key
      if (hfApiKey.trim()) {
        localStorage.setItem('hf_api_key', hfApiKey.trim());
        setHFApiKey(hfApiKey.trim());
      }
      // Save or clear Hugging Face custom endpoint
      if (hfCustomEndpoint.trim()) {
        setHFCustomEndpoint(hfCustomEndpoint.trim());
      } else {
        clearHFCustomEndpoint();
      }
      // Save or clear Hugging Face custom inpainting endpoint
      if (hfCustomInpaintingEndpoint.trim()) {
        setHFCustomInpaintingEndpoint(hfCustomInpaintingEndpoint.trim());
      } else {
        clearHFCustomInpaintingEndpoint();
      }
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1500);
    }
  };

  const handleClear = () => {
    localStorage.removeItem('xai_api_key');
    localStorage.removeItem('hf_api_key');
    clearHFCustomEndpoint();
    clearHFCustomInpaintingEndpoint();
    setApiKeyLocal('');
    setHFApiKeyLocal('');
    setHFCustomEndpointLocal('');
    setHFCustomInpaintingEndpointLocal('');
    setApiKey('');
    setHFApiKey('');
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
            xAI API-nyckel (för bildanalys)
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
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Hugging Face API-nyckel (för bildgenerering)
          </label>
          <div className="relative">
            <input
              type={showHFKey ? 'text' : 'password'}
              value={hfApiKey}
              onChange={(e) => setHFApiKeyLocal(e.target.value)}
              placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full p-3 bg-gray-900 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none pr-20"
            />
            <button
              onClick={() => setShowHFKey(!showHFKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm bg-gray-700 rounded hover:bg-gray-600 transition-colors"
            >
              {showHFKey ? 'Dölj' : 'Visa'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Hämta din API-nyckel från{' '}
            <a
              href="https://huggingface.co/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:underline"
            >
              huggingface.co/settings/tokens
            </a>
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Custom Inference Endpoint (valfritt)
          </label>
          <input
            type="text"
            value={hfCustomEndpoint}
            onChange={(e) => setHFCustomEndpointLocal(e.target.value)}
            placeholder="https://xxxxx.endpoints.huggingface.cloud"
            className="w-full p-3 bg-gray-900 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
          <p className="text-xs text-gray-400 mt-2">
            För text-till-bild generering. Lämna tom för gratis publik API.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Custom Inpainting Endpoint (valfritt)
          </label>
          <input
            type="text"
            value={hfCustomInpaintingEndpoint}
            onChange={(e) => setHFCustomInpaintingEndpointLocal(e.target.value)}
            placeholder="https://xxxxx.endpoints.huggingface.cloud"
            className="w-full p-3 bg-gray-900 rounded-md focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
          <p className="text-xs text-gray-400 mt-2">
            För inpainting/outpainting och NSFW-redigering. Rekommenderad modell: diffusers/stable-diffusion-xl-1.0-inpainting-0.1
            <br />
            <a
              href="https://huggingface.co/inference-endpoints"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:underline"
            >
              Skapa endpoint här
            </a>
          </p>
        </div>

        <div className="bg-gray-900 p-3 rounded-md mb-4 text-sm text-gray-300">
          <p className="text-xs text-gray-400 mb-2">
            <strong>💡 Hybrid AI-användning:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-gray-400">
            <li>
              <strong>Grok 4</strong> - Analyserar och förstår bilder (vision)
            </li>
            <li>
              <strong>Hugging Face</strong> - Genererar och redigerar bilder (Stable Diffusion)
            </li>
            <li>
              <strong>Tillsammans</strong> - Bästa kvalitet + lägre kostnad (60-75% besparing)
            </li>
          </ul>
          <p className="text-xs text-gray-500 mt-2">
            🔒 Dina API-nycklar sparas lokalt i din webbläsare och skickas aldrig till någon annan än respektive tjänst.
          </p>
          {hfCustomEndpoint && (
            <p className="text-xs text-purple-400 mt-2">
              ⚡ Text-till-bild endpoint aktiverad - högre kvalitet tillgängligt
            </p>
          )}
          {hfCustomInpaintingEndpoint && (
            <p className="text-xs text-purple-400 mt-2">
              🎨 Inpainting endpoint aktiverad - NSFW-redigering och högre upplösning tillgängligt
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={!apiKey.trim() && !hfApiKey.trim() && !hfCustomEndpoint.trim() && !hfCustomInpaintingEndpoint.trim()}
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
