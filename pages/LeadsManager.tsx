
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Lead, LeadStatus, EnrichmentStatus, WorkflowConfig } from '../types';
import { ExternalLink, Mail, Phone, FileSpreadsheet, CheckCircle, XCircle, Loader2, Database, ArrowRight, Trash2, Search, Filter, Plus, Download, AlertTriangle, ChevronLeft, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { generateMockLead, simulateEnrichment } from '../services/mockDataService';
import { analyzePostWithGemini } from '../services/geminiService';
import { ToastType } from '../components/Toast';
import { LeadDetailDrawer } from '../components/LeadDetailDrawer';
import { AddLeadModal } from '../components/AddLeadModal';

// CSV escape helper
const escapeCSV = (value: string | number | undefined): string => {
  if (value === undefined || value === null) return '';
  const str = String(value);
  // Escape quotes and wrap in quotes if contains comma, newline, or quote
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

interface LeadsManagerProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  config: WorkflowConfig;
  onScanTrigger: () => void;
  lastScanTime: number;
  showToast: (message: string, type: ToastType) => void;
}

export const LeadsManager: React.FC<LeadsManagerProps> = ({ leads, setLeads, config, onScanTrigger, lastScanTime, showToast }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(3); // Mock pending count
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Detail Drawer State
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; leadId: string | null; leadName: string }>({
    isOpen: false,
    leadId: null,
    leadName: ''
  });

  // FIX: Track component mount status to prevent memory leaks/errors on unmount
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Filter Logic - Memoized for performance
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        lead.name.toLowerCase().includes(searchLower) ||
        lead.company.toLowerCase().includes(searchLower) ||
        lead.title.toLowerCase().includes(searchLower) ||
        lead.postContent.toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leads, searchQuery, statusFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Check if a scan happened recently (Updated to 60 minutes/1 hour)
  const isRecentScan = lastScanTime > 0 && (Date.now() - lastScanTime) < 1000 * 60 * 60;
  const minsSinceScan = lastScanTime > 0 ? Math.floor((Date.now() - lastScanTime) / 60000) : 0;

  const runManualScan = async () => {
    setIsScanning(true);
    showToast("Scanning started (Scout Mode Active)...", "info");
    const scanTimestamp = new Date().toISOString(); // Capture exact timestamp
    onScanTrigger(); // Reset the system timer immediately
    
    // 1. Simulate finding multiple new posts (1-3 leads)
    const batchSize = Math.floor(Math.random() * 3) + 1;
    await new Promise(resolve => setTimeout(resolve, 1500)); // Little delay for realism
    
    const newLeadsBatch: Lead[] = [];
    for (let i = 0; i < batchSize; i++) {
        // Explicitly override foundAt with the scan timestamp
        const mock = generateMockLead();
        mock.foundAt = scanTimestamp;
        newLeadsBatch.push(mock);
    }
    
    // 2. Add to list as processing
    if (isMounted.current) {
      setLeads(prev => [...newLeadsBatch, ...prev]);
    }

    // Process each found lead
    for (const newLead of newLeadsBatch) {
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
    }

    if (isMounted.current) {
      setIsScanning(false);
      showToast(`Scan complete. Found ${batchSize} new profiles.`, "success");
    }
  };

  const handleBatchSync = async () => {
    setIsSyncing(true);

    // Get qualified leads to sync
    const leadsToSync = leads.filter(l =>
      l.status === LeadStatus.QUALIFIED ||
      l.status === LeadStatus.CONTACTED ||
      l.status === LeadStatus.REPLIED
    );

    if (leadsToSync.length === 0) {
      showToast("No qualified leads to sync.", "info");
      setIsSyncing(false);
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const lead of leadsToSync) {
      try {
        const response = await fetch('/api/writeToSheet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(lead),
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
          console.error('Failed to sync lead:', lead.id);
        }
      } catch (error) {
        errorCount++;
        console.error('Error syncing lead:', lead.id, error);
      }
    }

    if (isMounted.current) {
      setPendingSyncCount(0);
      setIsSyncing(false);

      if (errorCount === 0) {
        showToast(`Successfully synced ${successCount} leads to Google Sheets!`, "success");
      } else if (successCount > 0) {
        showToast(`Synced ${successCount} leads. ${errorCount} failed.`, "info");
      } else {
        showToast("Failed to sync leads. Check your Google Sheets configuration.", "error");
      }
    }
  };

  const exportToCSV = () => {
    const headers = ["Name", "Company", "Title", "Email", "Phone", "AI Score", "Status", "LinkedIn URL", "Found At"];
    const csvContent = [
      headers.join(","),
      ...filteredLeads.map(l => [
        escapeCSV(l.name),
        escapeCSV(l.company),
        escapeCSV(l.title),
        escapeCSV(l.email),
        escapeCSV(l.phone),
        escapeCSV(l.aiScore),
        escapeCSV(l.status),
        escapeCSV(l.linkedinUrl),
        escapeCSV(l.foundAt)
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast(`Exported ${filteredLeads.length} leads to CSV.`, "success");
  };

  const handleApprove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: LeadStatus.QUALIFIED } : l));
    showToast("Lead Qualified manually.", "success");
  };

  const handleDisqualify = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: LeadStatus.DISQUALIFIED } : l));
    showToast("Lead Disqualified.", "info");
  };

  const handleDelete = (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    setDeleteConfirm({ isOpen: true, leadId: lead.id, leadName: lead.name });
  };

  const confirmDelete = () => {
    if (deleteConfirm.leadId) {
      setLeads(prev => prev.filter(l => l.id !== deleteConfirm.leadId));
      showToast("Lead deleted.", "error");
    }
    setDeleteConfirm({ isOpen: false, leadId: null, leadName: '' });
  };

  const cancelDelete = () => {
    setDeleteConfirm({ isOpen: false, leadId: null, leadName: '' });
  };

  const openDrawer = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
  };

  const handleAddManualLead = (lead: Lead) => {
    setLeads(prev => [lead, ...prev]);
    showToast("Lead added successfully.", "success");
  };

  return (
    <>
      <div className="space-y-3 lg:space-y-3">
        {/* Header Actions */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center space-y-4 xl:space-y-0 pr-4 lg:pr-0">
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
          
          {/* Action Buttons: 3-column grid on mobile (Top row: Sync, CSV, Add), Manual Scan full width below */}
          <div className="grid grid-cols-3 gap-4 w-full sm:flex sm:flex-wrap sm:w-auto">
             <button 
              onClick={handleBatchSync}
              disabled={isSyncing || pendingSyncCount === 0}
              className={`col-span-1 w-full sm:w-auto sm:flex-none flex items-center justify-center space-x-2 px-3 py-2 border rounded-lg font-medium transition-colors text-sm ${
                pendingSyncCount > 0 
                ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50' 
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
              }`}
            >
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              <span className="whitespace-nowrap">
                {isSyncing ? "Syncing" : `Sync (${pendingSyncCount})`}
              </span>
            </button>
            <button
              onClick={exportToCSV}
               className="col-span-1 w-full sm:w-auto sm:flex-none flex items-center justify-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm"
            >
              <Download className="w-4 h-4" />
              <span className="whitespace-nowrap">CSV</span>
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="col-span-1 w-full sm:w-auto sm:flex-none flex items-center justify-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="whitespace-nowrap">Add Lead</span>
            </button>
            
            <div className="relative group col-span-3 sm:flex-none w-full sm:w-auto">
              <button 
                onClick={runManualScan}
                disabled={isScanning}
                className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium disabled:opacity-50 shadow-sm w-full transition-colors text-sm
                  ${isRecentScan 
                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-900/60' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                {isScanning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isRecentScan ? (
                  <>
                     {/* Tablet/Desktop: Show Alert Triangle */}
                     <AlertTriangle className="w-4 h-4 hidden sm:block" />
                     {/* Mobile: Show normal icon, hide alert icon */}
                     <ExternalLink className="w-4 h-4 sm:hidden" />
                  </>
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
                
                <span className="whitespace-nowrap">{isScanning ? "Scanning..." : "Manual Scan"}</span>
                
                {/* Mobile Only: Show time ago inside button */}
                {isRecentScan && !isScanning && (
                   <span className="sm:hidden ml-1 text-xs opacity-75 font-semibold">
                     ({minsSinceScan}m ago)
                   </span>
                )}
              </button>
              
              {/* Tablet/Desktop Warning Tooltip */}
              {isRecentScan && (
                <div className={`absolute z-20 w-auto text-center
                  hidden sm:block
                  sm:left-full sm:top-1/2 sm:-translate-y-1/2 sm:ml-3
                  lg:hidden lg:group-hover:block
                  lg:left-1/2 lg:-translate-x-1/2 lg:top-full lg:mt-2 lg:ml-0 lg:translate-y-0
                `}>
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-gray-800 px-2 py-1 rounded border border-amber-100 dark:border-gray-700 shadow-lg whitespace-nowrap">
                    ⚠️ Recent scan {minsSinceScan}m ago
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4 transition-colors">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors text-sm"
            />
          </div>
          <div className="relative w-full md:w-56">
            <Filter className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none transition-colors cursor-pointer text-sm"
            >
              <option value="ALL">All Status</option>
              <option value={LeadStatus.QUALIFIED}>Qualified</option>
              <option value={LeadStatus.DISQUALIFIED}>Disqualified</option>
              <option value={LeadStatus.NEW}>New</option>
            </select>
            <div className="absolute right-3 top-3 pointer-events-none">
              <ChevronLeft className="w-4 h-4 text-gray-400 -rotate-90" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/90 text-gray-600 dark:text-gray-300 font-medium border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-3 whitespace-nowrap text-sm">Status</th>
                  <th className="px-6 py-3 min-w-[240px] text-sm">Lead Info</th>
                  <th className="px-6 py-3 min-w-[300px] max-w-md text-sm">Post Context</th>
                  <th className="px-6 py-3 whitespace-nowrap text-sm">AI Score</th>
                  <th className="px-6 py-3 min-w-[200px] text-sm">Contact</th>
                  <th className="px-6 py-3 text-right text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                       <div className="flex flex-col items-center justify-center">
                          <Search className="w-8 h-8 mb-2 opacity-20" />
                          <p>No leads found matching your filters.</p>
                       </div>
                    </td>
                  </tr>
                ) : (
                  paginatedLeads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      onClick={() => openDrawer(lead)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-5 whitespace-nowrap align-top">
                        <div className="flex flex-col gap-1.5">
                          <span className={`inline-flex self-start items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                            ${lead.status === LeadStatus.QUALIFIED ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' :
                              lead.status === LeadStatus.DISQUALIFIED ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800' :
                              'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                            }`}>
                            {lead.status}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500" title={`Scanned at: ${new Date(lead.foundAt).toLocaleString()}`}>
                             <Clock className="w-3 h-3" />
                             <span>{new Date(lead.foundAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="font-semibold text-base text-gray-900 dark:text-white truncate mb-0.5">{lead.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{lead.title}</div>
                        <div className="text-sm text-blue-600 dark:text-blue-400 font-medium truncate mt-0.5">{lead.company}</div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 xl:line-clamp-2 leading-relaxed mb-1" title={lead.postContent}>
                          "{lead.postContent}"
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap align-top">
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`text-lg font-bold ${
                            lead.aiScore > 75 ? 'text-green-600 dark:text-green-400' : lead.aiScore > 40 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {lead.aiScore}
                          </span>
                          {lead.aiScore > 0 && (
                            lead.isRelevant ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        {lead.enrichmentStatus === EnrichmentStatus.ENRICHED ? (
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 truncate">
                              <Mail className="w-3.5 h-3.5 mr-2 text-gray-400 flex-shrink-0" />
                              <span className="truncate">{lead.email}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 truncate">
                              <Phone className="w-3.5 h-3.5 mr-2 text-gray-400 flex-shrink-0" />
                              <span className="truncate">{lead.phone}</span>
                            </div>
                          </div>
                        ) : lead.enrichmentStatus === EnrichmentStatus.PENDING ? (
                           <span className="text-sm text-gray-400 dark:text-gray-500 italic">Enrichment Pending...</span>
                        ) : (
                           <span className="text-sm text-red-400">Enrichment Failed</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right align-top">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={(e) => handleApprove(e, lead.id)}
                            className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          
                          <button 
                            onClick={(e) => handleDisqualify(e, lead.id)}
                            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                          
                          <button
                            onClick={(e) => handleDelete(e, lead)}
                            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 group-hover/delete:text-red-600 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            aria-label={`Delete ${lead.name}`}
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
          
          {/* Pagination Controls */}
          {filteredLeads.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredLeads.length)}</span> of <span className="font-medium">{filteredLeads.length}</span> results
              </div>
              <div className="flex items-center space-x-2 mx-auto sm:mx-0">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <LeadDetailDrawer 
        lead={selectedLead} 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        onUpdateLead={(updated) => {
          setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
        }}
      />

      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddManualLead}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Lead?</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete <span className="font-semibold">{deleteConfirm.leadName}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
