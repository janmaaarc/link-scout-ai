import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, UserCheck, MessageSquare, Zap, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { Stats, SystemHealth } from '../types';

interface DashboardProps {
  stats: Stats;
  darkMode?: boolean;
}

const mockHealth: SystemHealth = {
  scraperStatus: 'RATE_LIMITED',
  databaseStatus: 'CONNECTED',
  lastHeartbeat: '2 mins ago',
  errorRate: 2.4
};

export const Dashboard: React.FC<DashboardProps> = ({ stats, darkMode }) => {
  const [dateRange, setDateRange] = useState<'7d' | '14d' | '30d'>('7d');

  // Dynamic data generation based on selected range
  const chartData = useMemo(() => {
    switch (dateRange) {
      case '14d':
        return Array.from({ length: 14 }, (_, i) => {
          const day = i + 1;
          const j = day % 10;
          const k = day % 100;
          let suffix = "th";
          if (j === 1 && k !== 11) suffix = "st";
          if (j === 2 && k !== 12) suffix = "nd";
          if (j === 3 && k !== 13) suffix = "rd";
          return {
            name: `Day ${day}`,
            leads: Math.floor(Math.random() * 50) + 10,
            qualified: Math.floor(Math.random() * 30) + 5,
          };
        });
      case '30d':
        return Array.from({ length: 15 }, (_, i) => { // Show every 2 days effectively for cleaner UI
          const day = i * 2 + 1;
          const j = day % 10;
          const k = day % 100;
          let suffix = "th";
          if (j === 1 && k !== 11) suffix = "st";
          if (j === 2 && k !== 12) suffix = "nd";
          if (j === 3 && k !== 13) suffix = "rd";
          
          return {
            name: `${day}${suffix}`,
            leads: Math.floor(Math.random() * 60) + 15,
            qualified: Math.floor(Math.random() * 40) + 8,
          };
        });
      case '7d':
      default:
        return [
          { name: 'Mon', leads: 40, qualified: 24 },
          { name: 'Tue', leads: 30, qualified: 13 },
          { name: 'Wed', leads: 20, qualified: 18 },
          { name: 'Thu', leads: 27, qualified: 19 },
          { name: 'Fri', leads: 18, qualified: 10 },
          { name: 'Sat', leads: 23, qualified: 15 },
          { name: 'Sun', leads: 34, qualified: 20 },
        ];
    }
  }, [dateRange]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pr-4 lg:pr-0 gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Automation Overview</h1>
        <div className="flex items-center space-x-2">
          <span className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
            mockHealth.scraperStatus === 'ONLINE' 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
          }`}>
            <Activity className="w-4 h-4" />
            <span>{mockHealth.scraperStatus}</span>
          </span>
          <span className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-sm font-medium">
             <CheckCircle className="w-4 h-4" />
             <span>DB: {mockHealth.databaseStatus}</span>
          </span>
        </div>
      </div>

      {/* Stats Grid - 4 Columns on Mobile with very tight gap */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-6 mb-8">
        <StatCard 
          label="Total Scanned" 
          value={stats.totalScanned} 
          icon={Users} 
          color="bg-blue-500" 
        />
        <StatCard 
          label="AI Qualified" 
          value={stats.qualified} 
          icon={UserCheck} 
          color="bg-green-500" 
        />
        <StatCard 
          label="Enriched" 
          value={stats.enriched} 
          icon={Zap} 
          color="bg-purple-500" 
        />
        <StatCard 
          label="Msgs Sent" 
          value={stats.messagesSent} 
          icon={MessageSquare} 
          color="bg-indigo-500" 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Lead Velocity Chart */}
        <div className="xl:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors h-[400px] flex flex-col">
          <div className="flex flex-row justify-between items-center mb-6">
             <h2 className="text-lg font-bold text-gray-900 dark:text-white">Lead Velocity</h2>
             <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value as any)}
              className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
             >
               <option value="7d">Last 7 Days</option>
               <option value="14d">Last 14 Days</option>
               <option value="30d">Last 30 Days</option>
             </select>
          </div>
          <div className="flex-1 w-full min-h-0">
             <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorQualified" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#374151" : "#E5E7EB"} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#1F2937' : '#FFFFFF', 
                    borderColor: darkMode ? '#374151' : '#E5E7EB',
                    borderRadius: '0.5rem',
                    color: darkMode ? '#F3F4F6' : '#111827'
                  }}
                  itemStyle={{ color: darkMode ? '#E5E7EB' : '#111827' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorLeads)" 
                  name="Total Leads"
                />
                <Area 
                  type="monotone" 
                  dataKey="qualified" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorQualified)" 
                  name="Qualified"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Health Widget */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">System Health</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500 dark:text-gray-400">Scraper Success Rate</span>
                <span className="font-bold text-gray-900 dark:text-white">92%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500 dark:text-gray-400">Error Rate</span>
                <span className="font-bold text-red-500">{mockHealth.errorRate}%</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: `${Math.min(mockHealth.errorRate, 100)}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500 dark:text-gray-400">API Usage (Apollo)</span>
                <span className="font-bold text-yellow-600 dark:text-yellow-400">1,240 / 5,000</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                 <span className="text-gray-500 dark:text-gray-400">Last Heartbeat</span>
                 <span className="font-mono text-gray-900 dark:text-white">{mockHealth.lastHeartbeat}</span>
              </div>
            </div>
             <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300">
                <div className="flex items-start">
                   <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                   <p>Scraper running in safe mode. Rate limit buffer active.</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};