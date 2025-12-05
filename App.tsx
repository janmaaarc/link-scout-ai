import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { LeadsManager } from './pages/LeadsManager';
import { WorkflowConfigPage } from './pages/WorkflowConfig';
import { SystemLogs } from './pages/SystemLogs';
import { Lead, WorkflowConfig, Stats, LeadStatus, EnrichmentStatus } from './types';
import { Menu, ScanSearch } from 'lucide-react';

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
  scanFrequencyMinutes: 60, // Changed from 10 to 60 for safety
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [config, setConfig] = useState<WorkflowConfig>(INITIAL_CONFIG);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        return <Dashboard stats={stats} />;
      case 'leads':
        return <LeadsManager leads={leads} setLeads={setLeads} config={config} />;
      case 'logs':
        return <SystemLogs />;
      case 'config':
        return <WorkflowConfigPage config={config} setConfig={setConfig} />;
      default:
        return <Dashboard stats={stats} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-2">
          <ScanSearch className="w-6 h-6 text-blue-600" />
          <span className="font-bold text-lg text-gray-900">LinkScout AI</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        scanFrequency={config.scanFrequencyMinutes}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 lg:ml-64 p-4 md:p-8 overflow-y-auto w-full">
        {renderContent()}
      </main>
    </div>
  );
}