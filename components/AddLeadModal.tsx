import React, { useState } from 'react';
import { Lead, LeadStatus, EnrichmentStatus } from '../types';
import { X, Save, User, Building, MapPin, Linkedin, Calendar, Clock, AlertCircle } from 'lucide-react';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (lead: Lead) => void;
}

// Validation helpers
const isValidLinkedInUrl = (url: string): boolean => {
  if (!url) return true; // Optional field
  const linkedinPattern = /^https?:\/\/(www\.)?linkedin\.com\/(in|company|pub)\/[\w-]+\/?$/i;
  return linkedinPattern.test(url);
};

const sanitizeInput = (input: string): string => {
  // Remove potentially dangerous characters while preserving useful text
  return input.trim().slice(0, 500);
};

interface ValidationErrors {
  name?: string;
  title?: string;
  company?: string;
  linkedinUrl?: string;
  postContent?: string;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    company: '',
    location: '',
    linkedinUrl: '',
    postContent: '',
    postDate: new Date().toISOString().split('T')[0], // Default to YYYY-MM-DD (Today)
    foundAt: new Date().toISOString().slice(0, 16), // Default to YYYY-MM-DDTHH:MM (Now)
  });
  const [errors, setErrors] = useState<ValidationErrors>({});

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    }

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    // Company validation
    if (!formData.company.trim()) {
      newErrors.company = 'Company is required';
    } else if (formData.company.length > 100) {
      newErrors.company = 'Company name must be less than 100 characters';
    }

    // LinkedIn URL validation (optional but must be valid if provided)
    if (formData.linkedinUrl && !isValidLinkedInUrl(formData.linkedinUrl)) {
      newErrors.linkedinUrl = 'Please enter a valid LinkedIn URL';
    }

    // Post content validation
    if (formData.postContent.length > 2000) {
      newErrors.postContent = 'Post content must be less than 2000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const newLead: Lead = {
      id: Math.random().toString(36).substr(2, 9),
      name: sanitizeInput(formData.name),
      title: sanitizeInput(formData.title),
      company: sanitizeInput(formData.company),
      location: sanitizeInput(formData.location),
      linkedinUrl: formData.linkedinUrl.trim(),
      postContent: sanitizeInput(formData.postContent) || "Manual Entry",
      postUrl: '',
      postDate: new Date(formData.postDate).toISOString(),
      foundAt: new Date(formData.foundAt).toISOString(),
      aiScore: 100,
      aiReasoning: 'Manually added by user.',
      isRelevant: true,
      enrichmentStatus: EnrichmentStatus.PENDING,
      status: LeadStatus.NEW,
    };
    onAdd(newLead);
    onClose();
    // Reset form
    setFormData({
      name: '',
      title: '',
      company: '',
      location: '',
      linkedinUrl: '',
      postContent: '',
      postDate: new Date().toISOString().split('T')[0],
      foundAt: new Date().toISOString().slice(0, 16)
    });
    setErrors({});
  };

  const renderError = (field: keyof ValidationErrors) => {
    if (!errors[field]) return null;
    return (
      <p className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {errors[field]}
      </p>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Lead</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  required
                  maxLength={100}
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className={`w-full pl-9 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.name ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="John Doe"
                />
              </div>
              {renderError('name')}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Job Title *</label>
              <input
                required
                maxLength={100}
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.title ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                placeholder="CEO"
              />
              {renderError('title')}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Company *</label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  required
                  maxLength={100}
                  value={formData.company}
                  onChange={e => setFormData({...formData, company: e.target.value})}
                  className={`w-full pl-9 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.company ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="Acme Inc"
                />
              </div>
              {renderError('company')}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
               <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input
                  maxLength={100}
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="New York, NY"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">LinkedIn Profile URL</label>
            <div className="relative">
              <Linkedin className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="url"
                value={formData.linkedinUrl}
                onChange={e => setFormData({...formData, linkedinUrl: e.target.value})}
                className={`w-full pl-9 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none ${errors.linkedinUrl ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            {renderError('linkedinUrl')}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Post Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input 
                  type="date"
                  required
                  value={formData.postDate}
                  onChange={e => setFormData({...formData, postDate: e.target.value})}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Found At (Timestamp)</label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                <input 
                  type="datetime-local"
                  required
                  value={formData.foundAt}
                  onChange={e => setFormData({...formData, foundAt: e.target.value})}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
             <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Post Context / Notes</label>
             <textarea 
                value={formData.postContent}
                onChange={e => setFormData({...formData, postContent: e.target.value})}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
                placeholder="Paste the post content or any notes about why you are adding this lead..."
             />
          </div>

          <div className="pt-4 flex justify-end space-x-3 flex-shrink-0">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center shadow-sm transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};