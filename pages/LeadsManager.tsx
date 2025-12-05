import React, { useState, useEffect, useRef } from 'react';
import { Lead, LeadStatus, EnrichmentStatus, WorkflowConfig } from '../types';
import { ExternalLink, Mail, Phone, MoreHorizontal, FileSpreadsheet, CheckCircle, XCircle, Loader2, Database, ArrowRight, Trash2 } from 'lucide-react';
import { generateMockLead, simulateEnrichment } from '../services/mockDataService';
import { analyzePostWithGemini } from '../services/geminiService';

interface LeadsManagerProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  config: WorkflowConfig;
  onScanTrigger: () => void;
}

export const LeadsManager: React.FC<LeadsManagerProps> = ({ leads, setLeads, config, onScanTrigger }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(3); // Mock pending count
  
  // FIX: Track component mount status to prevent memory leaks/errors on unmount
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const runManualScan = async () => {
    setIsScanning(true);
    onScanTrigger(); // Reset the system timer immediately
    
    // 1. Simulate finding a new post
    const newLead = generateMockLead();
    
    // 2. Add to list as processing
    if (isMounted.current) {
      setLeads(prev => [newLead, ...prev]);
    }

    // 3. AI Analysis with Negative Keywords (Mitigation for Hallucinations)
    const analysis = await analyzePostWithGemini(
      newLead.postContent, 
      config.keywords, 
      config.negativeKeywords
    );
    
    // Check if still mounted after await
    if (!isMounted.current) return;

    let updatedLead = { 
      ...newLead, 
      aiScore: analysis.score, 
      aiReasoning: analysis.reasoning,
      isRelevant: analysis.isRelevant,
      status: analysis.isRelevant ? LeadStatus.QUALIFIED : LeadStatus.DISQUALIFIED
    };

    setLeads(prev => prev.map(l => l.id === newLead.id ? updatedLead : l));
    setPendingSyncCount(prev => prev + 1);

    // 4. If qualified, run Enrichment
    if (analysis.isRelevant && config.enrichmentEnabled) {
      updatedLead = await simulateEnrichment(updatedLead);
      
      // Check if still mounted after 2nd await
      if (!isMounted.current) return;
      
      setLeads(prev => prev.map(l => l.id === newLead.id ? updatedLead : l));
    }

    if (isMounted.current) {
      setIsScanning(false);
    }
  };

  const handleBatchSync = async () => {
    setIsSyncing(true);
    // Simulate API call to Append Rows to Google Sheets
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (isMounted.current) {
      setPendingSyncCount(0);
      setIsSyncing(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Name", "Company", "Title", "Email", "Phone", "AI Score", "Status", "LinkedIn URL"];
    const csvContent = [
      headers.join(","),
      ...leads.map(l => [
        l.name, l.company, l.title, l.email || "", l.phone || "", l.aiScore, l.status, l.linkedinUrl
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleApprove = (id: string) => {
    // Sets status to QUALIFIED (Green)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: LeadStatus.QUALIFIED } : l));
  };

  const handleDisqualify = (id: string) => {
    // Sets status to DISQUALIFIED (Red)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: LeadStatus.DISQUALIFIED } : l));
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      setLeads(prev => prev.filter(l => l.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 pr-12 lg:pr-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leads Database</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
            <div className="flex items-center space-x-1">
                <Database className="w-3 h-3" />
                <span>PostgreSQL</span>
            </div>
            <ArrowRight className="w-3 h-3" />
            <div className="flex items-center space-x-1">
                <FileSpreadsheet className="w-3 h-3 text-green-600 dark:text-green-500" />
                <span className="text-green-700 dark:text-green-400">Google Sheets</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row w-full md:w-auto space-y-2 sm:space-y-0 sm:space-x-3">
           <button 
            onClick={handleBatchSync}
            disabled={isSyncing || pendingSyncCount === 0}
            className={`flex items-center justify-center space-x-2 px-4 py-2 border rounded-lg font-medium transition-colors ${
              pendingSyncCount > 0 
              ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50' 
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
            }`}
          >
            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            <span>
              {isSyncing ? "Syncing..." : `Sync Batch (${pendingSyncCount})`}
            </span>
          </button>
          <button 
            onClick={exportToCSV}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={runManualScan}
            disabled={isScanning}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 shadow-sm"
          >
            {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
            <span>{isScanning ? "Scanning..." : "Manual Scan"}</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap md:whitespace-normal">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300 font-medium border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Lead Info</th>
                <th className="px-6 py-4">Post Context</th>
                <th className="px-6 py-4">AI Analysis</th>
                <th className="px-6 py-4">Contact Data</th>
                <th className="px-6 py-4 w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No leads found yet. Click "Manual Scan" to simulate.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${lead.status === LeadStatus.QUALIFIED ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' :
                          lead.status === LeadStatus.DISQUALIFIED ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                        }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{lead.name}</div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs">{lead.title}</div>
                      <div className="text-blue-600 dark:text-blue-400 text-xs font-medium">{lead.company}</div>
                      <div className="text-gray-400 dark:text-gray-500 text-xs mt-1">{lead.location}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs text-xs text-gray-600 dark:text-gray-300 truncate mb-1" title={lead.postContent}>
                        "{lead.postContent}"
                      </div>
                      <a href={lead.postUrl} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-xs flex items-center">
                        View Post <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className={`text-sm font-bold ${
                          lead.aiScore > 75 ? 'text-green-600 dark:text-green-400' : lead.aiScore > 40 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {lead.aiScore}/100
                        </div>
                        {lead.aiScore > 0 && (
                          lead.isRelevant ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 italic max-w-xs line-clamp-2 md:whitespace-normal">
                        {lead.aiReasoning}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {lead.enrichmentStatus === EnrichmentStatus.ENRICHED ? (
                        <div className="space-y-1">
                          <div className="flex items-center text-xs text-gray-700 dark:text-gray-300">
                            <Mail className="w-3 h-3 mr-1.5 text-gray-400" />
                            {lead.email}
                          </div>
                          <div className="flex items-center text-xs text-gray-700 dark:text-gray-300">
                            <Phone className="w-3 h-3 mr-1.5 text-gray-400" />
                            {lead.phone}
                          </div>
                        </div>
                      ) : lead.enrichmentStatus === EnrichmentStatus.PENDING ? (
                         <span className="text-xs text-gray-400 dark:text-gray-500">Waiting...</span>
                      ) : (
                         <span className="text-xs text-red-400">Failed</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {/* Qualify Button */}
                        <button 
                          onClick={() => handleApprove(lead.id)}
                          className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors p-1 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                          aria-label="Qualify Lead"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        
                        {/* Disqualify Button */}
                        <button 
                          onClick={() => handleDisqualify(lead.id)}
                          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          aria-label="Disqualify Lead"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                        
                        {/* Delete Button */}
                        <button 
                          onClick={() => handleDelete(lead.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          aria-label="Delete Lead"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};