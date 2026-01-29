import React from 'react';
import { Filter } from 'lucide-react';

interface RankingFiltersProps {
  sortBy: 'votes' | 'views';
  timeRange: 'all' | 'yearly' | 'monthly' | 'weekly' | 'daily';
  onSortByChange: (sortBy: 'votes' | 'views') => void;
  onTimeRangeChange: (timeRange: 'all' | 'yearly' | 'monthly' | 'weekly' | 'daily') => void;
}

export default function RankingFilters({
  sortBy,
  timeRange,
  onSortByChange,
  onTimeRangeChange
}: RankingFiltersProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-orange-500" />
        <h2 className="text-lg font-semibold">Filters</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as 'votes' | 'views')}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
          >
            <option value="votes">Votes</option>
            <option value="views">Views</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Range
          </label>
          <select
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value as 'all' | 'yearly' | 'monthly' | 'weekly' | 'daily')}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
          >
            <option value="all">All Time</option>
            <option value="yearly">Past Year</option>
            <option value="monthly">Past Month</option>
            <option value="weekly">Past Week</option>
            <option value="daily">Today</option>
          </select>
        </div>
      </div>
    </div>
  );
}