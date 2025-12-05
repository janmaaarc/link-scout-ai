import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { LeadsManager } from './pages/LeadsManager';
import { WorkflowConfigPage } from './pages/WorkflowConfig';
import { SystemLogs } from './pages/SystemLogs';
import { Login } from './pages/Login';
import { Lead, WorkflowConfig, Stats, LeadStatus, EnrichmentStatus } from './types';
import { Menu, ScanSearch, Moon, Sun } from 'lucide-react';

// Mock initial data
const INITIAL_LEADS: Lead[] = [
  {
    id: '1',
    name: 'Sarah Connor',
    title: 'VP of Operations',
    company: 'SkyNet Systems',
    linkedinUrl: '#',
    postUrl: '#',
    postContent: 'We are urgently looking for a new automation platform for our global logistics.',
    postDate: new Date().toISOString(),
    foundAt: new Date().toISOString(),
    aiScore: 92,
    aiReasoning: 'Strong buying intent signaled by "urgently looking" and "automation platform".',
    isRelevant: true,
    enrichmentStatus: EnrichmentStatus.ENRICHED,
    status: LeadStatus.CONTACTED,
    email: 'sarah.c@skynet.com',
    phone: '+1 (555) 000-0000',
    location: 'Los Angeles, CA'
  }
];

const INITIAL_CONFIG: WorkflowConfig = {
  keywords: ['looking for automation', 'hiring engineers', 'need help with zapier'],
  negativeKeywords: ['recruiter', 'job seeking', 'looking for job', 'hiring junior'],
  scanFrequencyMinutes: 60,
  minAiScore: 75,
  enrichmentEnabled: true,
  autoMessage: false,
  targetLocations: ['United States', 'United Kingdom'],
  useResidentialProxies: true,
  separateScoutAccount: true,
  
  // Tech Stack Initials
  n8nWebhookUrl: 'https://n8n.internal/webhook/linkedin-leads',
  postgresConnection: '',
  redisConnection: ''
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [config, setConfig] = useState<WorkflowConfig>(INITIAL_CONFIG);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // State to track when the last scan happened, used to reset the timer
  const [lastScanTime, setLastScanTime] = useState(Date.now());

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const session = localStorage.getItem('linkscout_auth');
    if (session === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    localStorage.setItem('linkscout_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('linkscout_auth');
    setIsAuthenticated(false);
  };

  // Derived stats
  const stats: Stats = {
    totalScanned: leads.length + 142, // + historical mock
    qualified: leads.filter(l => l.status !== LeadStatus.DISQUALIFIED).length + 40,
    enriched: leads.filter(l => l.enrichmentStatus === EnrichmentStatus.ENRICHED).length + 20,
    messagesSent: leads.filter(l => l.status === LeadStatus.CONTACTED).length + 12
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard stats={stats} darkMode={darkMode} />;
      case 'leads':
        return <LeadsManager 
          leads={leads} 
          setLeads={setLeads} 
          config={config} 
          onScanTrigger={() => setLastScanTime(Date.now())}
        />;
      case 'logs':
        return <SystemLogs />;
      case 'config':
        return <WorkflowConfigPage config={config} setConfig={setConfig} />;
      default:
        return <Dashboard stats={stats} darkMode={darkMode} />;
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        {/* Absolute toggle for Login Page */}
        <button 
          onClick={toggleTheme}
          className="fixed top-4 right-4 p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors z-50"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <Login onLogin={handleLogin} />
      </>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 flex-col lg:flex-row transition-colors duration-200">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
        <div className="flex items-center">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 mr-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-2">
            <ScanSearch className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-lg text-gray-900 dark:text-white">LinkScout AI</span>
          </div>
        </div>
        
        {/* Mobile Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        scanFrequency={config.scanFrequencyMinutes}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
        lastScanTime={lastScanTime}
      />

      <main className="flex-1 lg:ml-64 p-4 md:p-8 overflow-y-auto w-full relative">
        {/* Desktop Theme Toggle - Positioned Upper Right */}
        <div className="hidden lg:block absolute top-6 right-8 z-20">
          <button 
            onClick={toggleTheme}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all"
            title="Toggle Theme"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {renderContent()}
      </main>
    </div>
  );
}