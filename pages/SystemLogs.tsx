import React, { useState } from 'react';
import { SystemLog, LogSeverity } from '../types';
import { AlertCircle, Info, AlertTriangle, XCircle, Search, RefreshCw } from 'lucide-react';
import { generateMockLogs } from '../services/mockDataService';

export const SystemLogs: React.FC = () => {
  const [logs] = useState<SystemLog[]>(generateMockLogs());
  const [filter, setFilter] = useState('ALL');

  const getIcon = (severity: LogSeverity) => {
    switch (severity) {
      case LogSeverity.INFO: return <Info className="w-4 h-4 text-blue-500" />;
      case LogSeverity.WARNING: return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case LogSeverity.ERROR: return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case LogSeverity.CRITICAL: return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getBadgeColor = (severity: LogSeverity) => {
    switch (severity) {
      case LogSeverity.INFO: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case LogSeverity.WARNING: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case LogSeverity.ERROR: return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      case LogSeverity.CRITICAL: return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pr-12 lg:pr-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Logs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Monitor VPS backend activities and errors.</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors">
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors">
        <div className="relative w-full sm:flex-1">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input 
                type="text" 
                placeholder="Search logs..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
        </div>
        <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-sm transition-colors"
        >
            <option value="ALL">All Levels</option>
            <option value="ERROR">Errors Only</option>
            <option value="WARNING">Warnings</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap md:whitespace-normal">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300 font-medium border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 w-32">Timestamp</th>
                <th className="px-6 py-4 w-24">Level</th>
                <th className="px-6 py-4 w-32">Service</th>
                <th className="px-6 py-4">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(log.severity)}`}>
                      {getIcon(log.severity)}
                      <span>{log.severity}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">
                    {log.service}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900 dark:text-gray-100 whitespace-normal">{log.message}</div>
                    {log.details && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded inline-block whitespace-normal">
                          {log.details}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};