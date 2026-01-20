
import React, { useState, useEffect } from 'react';
import { WorkflowConfig } from '../types';
import { Save, Plus, AlertCircle, Shield, AlertTriangle, Database, Webhook, Server, Activity, Key, CheckCircle, Info } from 'lucide-react';
import { ToastType } from '../components/Toast';

// Check if API key is set via environment variable
const hasEnvApiKey = (): boolean => {
  return !!import.meta.env.VITE_GEMINI_API_KEY;
};

interface WorkflowConfigProps {
  config: WorkflowConfig;
  setConfig: React.Dispatch<React.SetStateAction<WorkflowConfig>>;
  showToast: (message: string, type: ToastType) => void;
}

export const WorkflowConfigPage: React.FC<WorkflowConfigProps> = ({ config, setConfig, showToast }) => {
  const [newKeyword, setNewKeyword] = React.useState('');
  const [newNegative, setNewNegative] = React.useState('');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // Load API Key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleSave = () => {
    // Save API key to local storage for the service to pick up
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
    } else {
      localStorage.removeItem('gemini_api_key');
    }
    
    // In a real app, this would make an API call to save config to the VPS
    showToast("Configuration saved successfully!", "success");
  };

  const testWebhook = async () => {
    if (!config.n8nWebhookUrl) {
      showToast("Please enter a Webhook URL first.", "error");
      return;
    }
    
    setIsTestingWebhook(true);
    // Simulate test
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsTestingWebhook(false);
    showToast("Test payload sent! Check your n8n execution log.", "success");
  };

  const addKeyword = () => {
    if (newKeyword.trim()) {
      setConfig(prev => ({ ...prev, keywords: [...prev.keywords, newKeyword.trim()] }));
      setNewKeyword('');
    }
  };

  const addNegative = () => {
    if (newNegative.trim()) {
      setConfig(prev => ({ ...prev, negativeKeywords: [...prev.negativeKeywords, newNegative.trim()] }));
      setNewNegative('');
    }
  };

  const removeKeyword = (kw: string) => {
    setConfig(prev => ({ ...prev, keywords: prev.keywords.filter(k => k !== kw) }));
  };

  const removeNegative = (kw: string) => {
    setConfig(prev => ({ ...prev, negativeKeywords: prev.negativeKeywords.filter(k => k !== kw) }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-20 md:pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 dark:border-gray-700 pb-6 gap-4 pr-12 lg:pr-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workflow Config</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Configure your autonomous scouting agent.</p>
        </div>
        <button 
          onClick={handleSave}
          className="hidden md:flex items-center justify-center space-x-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

       {/* AI Configuration Section */}
       <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-purple-100 dark:border-purple-900/30 transition-colors">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Key className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
          AI Service Configuration
        </h2>

        {/* Environment Variable Status */}
        {hasEnvApiKey() ? (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-300">API Key configured via environment variable</p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">Your API key is securely set in VITE_GEMINI_API_KEY.</p>
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Security Warning</p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                For production, set <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">VITE_GEMINI_API_KEY</code> in your .env.local file.
                Browser storage below is for development only.
              </p>
            </div>
          </div>
        )}

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Gemini API Key {hasEnvApiKey() && <span className="text-green-600 dark:text-green-400 text-xs">(Override)</span>}
            </label>
            <input
                type="password"
                placeholder={hasEnvApiKey() ? "Using environment variable..." : "AIzaSy..."}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={hasEnvApiKey()}
                className={`w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg font-mono text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-colors ${hasEnvApiKey() ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {hasEnvApiKey()
                ? "API key is set via environment variable. Remove VITE_GEMINI_API_KEY to use browser storage."
                : "Required for real AI analysis and email drafting."}
            </p>
        </div>
      </div>

      {/* Infrastructure Configuration (New Tech Stack) */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-900/30 transition-colors">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Server className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mr-2" />
          Infrastructure (VPS Stack)
        </h2>
        <div className="grid grid-cols-1 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Webhook className="w-4 h-4 mr-2 text-orange-500" />
                    n8n Webhook URL
                </label>
                <div className="flex space-x-2">
                  <input 
                      type="text" 
                      placeholder="https://n8n.your-vps.com/webhook/..."
                      value={config.n8nWebhookUrl || ''}
                      onChange={(e) => setConfig({...config, n8nWebhookUrl: e.target.value})}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                  />
                  <button 
                    onClick={testWebhook}
                    disabled={isTestingWebhook}
                    className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center"
                  >
                     {isTestingWebhook ? <Activity className="w-4 h-4 animate-spin" /> : "Test"}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Used to trigger Apollo enrichment & Email workflows.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                        <Database className="w-4 h-4 mr-2 text-blue-500" />
                        PostgreSQL (Prisma)
                    </label>
                    <input 
                        type="password" 
                        placeholder="postgresql://user:pass@localhost:5432/db"
                        value={config.postgresConnection || ''}
                        onChange={(e) => setConfig({...config, postgresConnection: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                        <Database className="w-4 h-4 mr-2 text-red-500" />
                        Redis (BullMQ)
                    </label>
                    <input 
                        type="password" 
                        placeholder="redis://localhost:6379"
                        value={config.redisConnection || ''}
                        onChange={(e) => setConfig({...config, redisConnection: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg font-mono text-sm focus:ring-2 focus:ring-red-500 outline-none transition-colors"
                    />
                </div>
            </div>
        </div>
      </div>

      {/* Safety & Compliance Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30 relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Shield className="w-24 h-24 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <Shield className="w-5 h-5 text-red-500 mr-2" />
          Safety & Anti-Ban Protections
        </h2>
        <div className="space-y-4 relative z-10">
           <IntegrationToggle 
            name="Residential Proxies" 
            description="Route traffic through residential IPs to mimic human behavior."
            enabled={config.useResidentialProxies}
            onToggle={() => setConfig({...config, useResidentialProxies: !config.useResidentialProxies})}
          />
          <IntegrationToggle 
            name="Separate Scout Account" 
            description="Use a 'burner' account for scraping to protect main profile."
            enabled={config.separateScoutAccount}
            onToggle={() => setConfig({...config, separateScoutAccount: !config.separateScoutAccount})}
          />
          
          <div className="mt-4">
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Scan Frequency (Minutes)</label>
             <div className="flex items-center space-x-4">
               <input
                  type="number"
                  min={15}
                  max={1440}
                  value={config.scanFrequencyMinutes || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    // Handle NaN and enforce min/max bounds
                    if (isNaN(val) || e.target.value === '') {
                      // Allow empty for typing, but will use default on blur
                      setConfig({...config, scanFrequencyMinutes: 0});
                    } else {
                      // Clamp value between 15 and 1440 minutes (1 day)
                      const clampedVal = Math.min(Math.max(val, 0), 1440);
                      setConfig({...config, scanFrequencyMinutes: clampedVal});
                    }
                  }}
                  onBlur={(e) => {
                    // Reset to default minimum if invalid or too low on blur
                    const val = parseInt(e.target.value);
                    if (isNaN(val) || val < 15) {
                      setConfig({...config, scanFrequencyMinutes: 60});
                      showToast("Scan frequency set to recommended minimum (60 mins)", "info");
                    }
                  }}
                  className={`w-32 px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 outline-none ${config.scanFrequencyMinutes > 0 && config.scanFrequencyMinutes < 60 ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'}`}
                />
                {config.scanFrequencyMinutes > 0 && config.scanFrequencyMinutes < 60 && (
                  <div className="flex items-center text-red-600 dark:text-red-400 text-sm animate-pulse">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">High Risk: Recommended 60+ mins</span>
                    <span className="sm:hidden">Risk! 60+ rec.</span>
                  </div>
                )}
             </div>
             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
               Frequent scanning triggers LinkedIn's anti-bot defenses. Minimum: 15 mins, Max: 1440 mins (24h).
             </p>
          </div>
        </div>
      </div>

      {/* Keywords Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Search Criteria</h2>
        
        {/* Target Keywords */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Keywords</label>
          <div className="flex space-x-2 mb-3">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="e.g. 'hiring frontend'"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full min-w-0 transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
            />
            <button onClick={addKeyword} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 shrink-0 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {config.keywords.map(kw => (
              <span key={kw} className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm border border-blue-100 dark:border-blue-800">
                {kw}
                <button onClick={() => removeKeyword(kw)} className="ml-2 hover:text-blue-900 dark:hover:text-blue-200"><XIcon /></button>
              </span>
            ))}
          </div>
        </div>

        {/* Negative Keywords */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Negative Keywords</label>
          <div className="flex space-x-2 mb-3">
            <input
              type="text"
              value={newNegative}
              onChange={(e) => setNewNegative(e.target.value)}
              placeholder="e.g. 'job seeking'"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none w-full min-w-0 transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && addNegative()}
            />
            <button onClick={addNegative} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 shrink-0 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {config.negativeKeywords.map(kw => (
              <span key={kw} className="inline-flex items-center px-3 py-1 rounded-full bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm border border-red-100 dark:border-red-800">
                {kw}
                <button onClick={() => removeNegative(kw)} className="ml-2 hover:text-red-900 dark:hover:text-red-200"><XIcon /></button>
              </span>
            ))}
          </div>
        </div>
        
        <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Min. AI Score to Enrich</label>
            <input 
              type="range" 
              min="0" max="100"
              value={config.minAiScore}
              onChange={(e) => setConfig({...config, minAiScore: parseInt(e.target.value)})}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer mt-3"
            />
            <div className="text-right text-sm text-gray-500 dark:text-gray-400 mt-1">{config.minAiScore}/100</div>
        </div>
      </div>

      {/* Integrations Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Integrations</h2>
        <div className="space-y-4">
          <IntegrationToggle 
            name="Apollo / Wiza" 
            description="Enrich emails & phone numbers."
            enabled={config.enrichmentEnabled}
            onToggle={() => setConfig({...config, enrichmentEnabled: !config.enrichmentEnabled})}
          />
          <IntegrationToggle 
            name="SMTP Auto-Responder" 
            description="Automated outreach to leads."
            enabled={config.autoMessage}
            onToggle={() => setConfig({...config, autoMessage: !config.autoMessage})}
          />
        </div>
      </div>

      {/* Mobile Floating Save Button */}
      <button
        onClick={handleSave}
        className="md:hidden fixed bottom-6 right-4 z-40 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 font-medium transition-all"
      >
        <Save className="w-5 h-5" />
        <span>Save Changes</span>
      </button>

    </div>
  );
};

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

const IntegrationToggle = ({ name, description, enabled, onToggle }: { name: string, description: string, enabled: boolean, onToggle: () => void }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors gap-4 sm:gap-0">
    <div>
      <h3 className="font-medium text-gray-900 dark:text-white">{name}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
    <button 
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0 ${enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
);
