import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Settings, Users, PlayCircle, Clock, ScanSearch, X, Activity } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  scanFrequency: number; // in minutes
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, scanFrequency, isOpen, onClose }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads Sheet', icon: Users },
    { id: 'logs', label: 'System Logs', icon: Activity },
    { id: 'config', label: 'Workflow Config', icon: Settings },
  ];

  // Timer Logic
  const [secondsLeft, setSecondsLeft] = useState(scanFrequency * 60);

  // Reset timer when config changes
  useEffect(() => {
    setSecondsLeft(scanFrequency * 60);
  }, [scanFrequency]);

  // Countdown effect
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) return scanFrequency * 60; // Reset loop
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [scanFrequency]);

  // Format time MM:SS or HH:MM:SS
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercentage = (secondsLeft / (scanFrequency * 60)) * 100;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0
      `}>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ScanSearch className="w-7 h-7 text-blue-600" />
            <div>
              <span className="font-bold text-lg text-gray-900 leading-tight block">LinkScout AI</span>
              <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">Vanguard Ops</span>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button onClick={onClose} className="lg:hidden p-1 rounded-md hover:bg-gray-100 text-gray-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                onClose(); // Close on mobile when clicked
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <PlayCircle className="w-5 h-5 animate-pulse" />
                <span className="font-semibold text-sm">System Active</span>
              </div>
              <Clock className="w-4 h-4 text-blue-200" />
            </div>
            
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs text-blue-100">Next scan in:</span>
              <span className="font-mono font-bold text-lg leading-none">
                {formatTime(secondsLeft)}
              </span>
            </div>

            <div className="w-full bg-blue-900 bg-opacity-30 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-white h-1.5 rounded-full transition-all duration-1000 ease-linear" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            
            <div className="mt-2 text-[10px] text-blue-200 text-center opacity-80">
              Freq: Every {scanFrequency} mins
            </div>
          </div>
        </div>
      </div>
    </>
  );
};