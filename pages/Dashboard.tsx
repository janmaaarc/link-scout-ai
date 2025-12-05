import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, UserCheck, MessageSquare, Zap, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { Stats, SystemHealth } from '../types';

interface DashboardProps {
  stats: Stats;
  darkMode?: boolean;
}

const data = [
  { name: 'Mon', leads: 40, qualified: 24 },
  { name: 'Tue', leads: 30, qualified: 13 },
  { name: 'Wed', leads: 20, qualified: 18 },
  { name: 'Thu', leads: 27, qualified: 19 },
  { name: 'Fri', leads: 18, qualified: 10 },
  { name: 'Sat', leads: 23, qualified: 15 },
  { name: 'Sun', leads: 34, qualified: 20 },
];

const mockHealth: SystemHealth = {
  scraperStatus: 'RATE_LIMITED',
  databaseStatus: 'CONNECTED',
  lastHeartbeat: '2 mins ago',
  errorRate: 2.4
};

export const Dashboard: React.FC<DashboardProps> = ({ stats, darkMode }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pr-12 lg:pr-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Automation Overview</h1>
        <div className="flex items-center space-x-2">
          <span className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
            mockHealth.scraperStatus === 'ONLINE' 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
          }`}>
             {mockHealth.scraperStatus === 'ONLINE' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
             <span>VPS: {mockHealth.scraperStatus.replace('_', ' ')}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Scanned"
          value={stats.totalScanned}
          icon={Users}
          color="text-blue-600 bg-blue-600"
        />
        <StatCard
          label="AI Qualified"
          value={stats.qualified}
          icon={Zap}
          color="text-yellow-600 bg-yellow-600"
        />
        <StatCard
          label="Enriched Contacts"
          value={stats.enriched}
          icon={UserCheck}
          color="text-green-600 bg-green-600"
        />
        <StatCard
          label="Messages Sent"
          value={stats.messagesSent}
          icon={MessageSquare}
          color="text-purple-600 bg-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Lead Velocity (Last 7 Days)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#374151" : "#E5E7EB"} />
                <XAxis dataKey="name" stroke={darkMode ? "#9CA3AF" : "#6B7280"} />
                <YAxis stroke={darkMode ? "#9CA3AF" : "#6B7280"} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#1F2937' : '#FFFFFF', 
                    borderColor: darkMode ? '#374151' : '#E5E7EB',
                    color: darkMode ? '#F3F4F6' : '#111827'
                  }} 
                  itemStyle={{ color: darkMode ? '#F3F4F6' : '#111827' }}
                />
                <Bar dataKey="leads" name="Total Found" fill={darkMode ? "#4B5563" : "#E5E7EB"} radius={[4, 4, 0, 0]} />
                <Bar dataKey="qualified" name="Qualified" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          {/* Health Check Widget */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">System Health</h2>
                <Activity className="w-5 h-5 text-gray-400" />
             </div>
             
             <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-50 dark:border-gray-700">
                   <div className="text-sm text-gray-600 dark:text-gray-300">PostgreSQL DB</div>
                   <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-md font-medium">Connected</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-50 dark:border-gray-700">
                   <div className="text-sm text-gray-600 dark:text-gray-300">Apollo API</div>
                   <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-md font-medium">98% Success</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-50 dark:border-gray-700">
                   <div className="text-sm text-gray-600 dark:text-gray-300">Scraper Bot</div>
                   <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded-md font-medium">Throttled</span>
                </div>
                
                <div className="pt-2">
                   <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex justify-between">
                      <span>Error Rate</span>
                      <span>{mockHealth.errorRate}%</span>
                   </div>
                   <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                      <div className="bg-orange-400 h-1.5 rounded-full" style={{ width: `${mockHealth.errorRate * 10}%` }}></div>
                   </div>
                </div>
             </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {[
                { time: '2m ago', text: 'Enriched profile: Alice Johnson', type: 'success' },
                { time: '10m ago', text: 'Scan completed: 15 new posts found', type: 'info' },
                { time: '15m ago', text: 'AI disqualified 4 posts (Low Relevance)', type: 'warning' },
                { time: '1h ago', text: 'Scheduled email batch sent (3 emails)', type: 'success' },
              ].map((log, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                    log.type === 'success' ? 'bg-green-500' :
                    log.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{log.text}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};