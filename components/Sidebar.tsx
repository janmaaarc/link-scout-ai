import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Settings, Users, PlayCircle, Clock, ScanSearch, X, Activity, LogOut, Sun, Moon } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  scanFrequency: number; // in minutes
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  lastScanTime: number; // New prop to trigger reset
  darkMode: boolean;
  toggleTheme: () => void;
  onAutoScan?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  scanFrequency, 
  isOpen, 
  onClose, 
  onLogout, 
  lastScanTime,
  darkMode,
  toggleTheme,
  onAutoScan
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads Sheet', icon: Users },
    { id: 'logs', label: 'System Logs', icon: Activity },
    { id: 'config', label: 'Workflow Config', icon: Settings },
  ];

  // Timer Logic
  const [secondsLeft, setSecondsLeft] = useState(scanFrequency * 60);

  // Reset timer when config changes OR when a manual scan is triggered
  useEffect(() => {
    setSecondsLeft(scanFrequency * 60);
  }, [scanFrequency, lastScanTime]);

  // Countdown effect
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          return scanFrequency * 60; // Reset loop locally
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [scanFrequency]);

  // Notify parent of auto-scan when timer hits reset point (approx)
  useEffect(() => {
    if (secondsLeft === scanFrequency * 60 && onAutoScan) {
      // Only trigger if we are "looping" not just initializing. 
      // However, initialization also sets it to max. 
      // To avoid infinite loop on mount, we can check if it was 1 before.
      // Simplification: We rely on the interval check in the previous effect, 
      // but since we can't call side effects in setState updater, we watch secondsLeft.
      // Actually, let's catch it right before reset.
    }
    if (secondsLeft === 1 && onAutoScan) {
        onAutoScan();
    }
  }, [secondsLeft, onAutoScan]);

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
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0
      `}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ScanSearch className="w-7 h-7 text-blue-600" />
            <div>
              <span className="font-bold text-lg text-gray-900 dark:text-white leading-tight block">LinkScout AI</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-wider uppercase">Vanguard Ops</span>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button onClick={onClose} className="lg:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
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
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <PlayCircle className="w-5 h-5 animate-pulse text-white" />
                <span className="font-semibold text-sm text-white">System Active</span>
              </div>
              <Clock className="w-4 h-4 text-blue-200" />
            </div>
            
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs text-blue-100">Next scan in:</span>
              <span className="font-mono font-bold text-lg leading-none text-white">
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

          <div className="flex items-center space-x-2">
            <button 
              onClick={onLogout}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-10 h-10 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};