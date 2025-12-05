import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-1.5 sm:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-start text-center sm:text-left sm:space-x-4 transition-colors h-full">
      <div className={`p-1.5 sm:p-3 rounded-md sm:rounded-lg ${color} bg-opacity-10 dark:bg-opacity-20 mb-1 sm:mb-0 shrink-0`}>
        <Icon className={`w-3.5 h-3.5 sm:w-6 sm:h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div className="w-full min-w-0">
        <p className="text-[9px] sm:text-sm text-gray-500 dark:text-gray-400 font-medium leading-tight truncate px-0.5 sm:px-0 mb-0.5">{label}</p>
        <p className="text-sm sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight truncate">{value}</p>
      </div>
    </div>
  );
};