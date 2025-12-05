import React, { useState } from 'react';
import { Lead, LeadStatus, EnrichmentStatus } from '../types';
import { X, ExternalLink, Mail, Phone, MapPin, Calendar, Sparkles, Copy, Check, Send, User } from 'lucide-react';
import { generateDraftEmail } from '../services/geminiService';

interface LeadDetailDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateLead: (updatedLead: Lead) => void;
}

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({ lead, isOpen, onClose, onUpdateLead }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'outreach'>('details');
  const [draftEmail, setDraftEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!lead) return null;

  const handleGenerateEmail = async () => {
    setIsGenerating(true);
    const draft = await generateDraftEmail(lead.name, lead.company, lead.postContent);
    setDraftEmail(draft);
    setIsGenerating(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(draftEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60] transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white dark:bg-gray-800 shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out border-l border-gray-200 dark:border-gray-700 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" />
              {lead.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{lead.title} @ {lead.company}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button 
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Lead Details
          </button>
          <button 
            onClick={() => setActiveTab('outreach')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'outreach' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            AI Outreach
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'details' ? (
            <>
              {/* Status Badge */}
              <div className="flex justify-between items-center">
                 <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Status</span>
                 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                    ${lead.status === LeadStatus.QUALIFIED ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' :
                      lead.status === LeadStatus.DISQUALIFIED ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                    }`}>
                    {lead.status}
                  </span>
              </div>

              {/* Contact Info */}
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 space-y-3 border border-gray-100 dark:border-gray-700">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact Information</h3>
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Mail className="w-4 h-4 mr-3 text-gray-400" />
                  {lead.email || <span className="text-gray-400 italic">Not enriched yet</span>}
                </div>
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <Phone className="w-4 h-4 mr-3 text-gray-400" />
                  {lead.phone || <span className="text-gray-400 italic">Not enriched yet</span>}
                </div>
                <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <MapPin className="w-4 h-4 mr-3 text-gray-400" />
                  {lead.location || 'Unknown'}
                </div>
                 <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <ExternalLink className="w-4 h-4 mr-3 text-blue-500" />
                  <a href={lead.linkedinUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate">
                    {lead.linkedinUrl}
                  </a>
                </div>
              </div>

              {/* AI Analysis */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
                  <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                  Gemini Analysis
                </h3>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-900 dark:text-purple-300">Relevance Score</span>
                    <span className="text-lg font-bold text-purple-700 dark:text-purple-400">{lead.aiScore}/100</span>
                  </div>
                  <p className="text-sm text-purple-800 dark:text-purple-200 leading-relaxed">
                    {lead.aiReasoning}
                  </p>
                </div>
              </div>

              {/* Original Post */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Original LinkedIn Post</h3>
                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {lead.postContent}
                </div>
                <div className="text-xs text-gray-400 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  Posted on: {new Date(lead.postDate).toLocaleDateString()}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-center py-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <Sparkles className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300">AI Draft Assistant</h3>
                <p className="text-xs text-blue-700 dark:text-blue-400 px-4 mt-1">
                  Generate a hyper-personalized outreach email based on {lead.name.split(' ')[0]}'s specific post context.
                </p>
                <button
                  onClick={handleGenerateEmail}
                  disabled={isGenerating}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center mx-auto"
                >
                  {isGenerating ? 'Drafting...' : 'Generate Draft'}
                  {!isGenerating && <Sparkles className="w-3 h-3 ml-2" />}
                </button>
              </div>

              {draftEmail && (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Draft Content</h3>
                    <button 
                      onClick={copyToClipboard}
                      className="text-xs flex items-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      {copied ? <Check className="w-3 h-3 mr-1 text-green-500" /> : <Copy className="w-3 h-3 mr-1" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <textarea 
                    value={draftEmail}
                    onChange={(e) => setDraftEmail(e.target.value)}
                    className="w-full h-64 p-4 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-gray-800 dark:text-gray-200"
                  />
                  <button className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm flex items-center justify-center transition-colors">
                    <Send className="w-4 h-4 mr-2" />
                    Send via Email Client
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};