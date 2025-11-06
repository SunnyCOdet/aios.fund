'use client';

import { useState, useEffect } from 'react';
import { Key, Save, Eye, EyeOff } from 'lucide-react';

export default function ApiKeySettings() {
  const [geminiKey, setGeminiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load saved API key from localStorage
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setGeminiKey(savedKey);
    }
  }, []);

  const handleSave = () => {
    if (geminiKey.trim()) {
      localStorage.setItem('gemini_api_key', geminiKey.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleClear = () => {
    localStorage.removeItem('gemini_api_key');
    setGeminiKey('');
  };

  return (
    <div className="glass-effect rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Key className="w-5 h-5 text-gray-400" />
        <h3 className="text-lg font-bold text-white">Gemini AI Settings</h3>
      </div>
      
      <p className="text-xs text-gray-400 mb-3">
        Enter your Google Gemini API key to enable AI-powered market analysis.
        <a 
          href="https://makersuite.google.com/app/apikey" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-white hover:underline ml-1"
        >
          Get your free API key
        </a>
      </p>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type={showKey ? 'text' : 'password'}
            placeholder="Enter Gemini API key..."
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-black/30 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white border border-white/[0.1] pr-10"
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg font-semibold transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saved ? 'Saved!' : 'Save'}
        </button>
        {geminiKey && (
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-800 text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

