'use client'

import { Filter, X } from 'lucide-react'

interface FilterState {
  source: string
  leadScore: number
  dealValue: number
  assignedTo: string
  stage: string
}

interface PipelineFiltersProps {
  filters: FilterState
  onFilterChange: (filters: Partial<FilterState>) => void
  onClearFilters: () => void
}

export function PipelineFilters({ filters, onFilterChange, onClearFilters }: PipelineFiltersProps) {
  const sources = ['Website', 'Referral', 'LinkedIn', 'Cold Call', 'Email', 'Social Media']
  const stages = ['INCOMING', 'QUALIFIED', 'TECH_AUDIT', 'PROPOSAL_SENT', 'NEGOTIATION', 'CLOSED_WON', 'LOST']
  const assignees = ['Sales Team', 'Account Executive', 'Solutions Architect', 'Development Team']

  const hasActiveFilters = Object.values(filters).some(value => 
    typeof value === 'string' ? value !== '' : value > 0
  )

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-700">Pipeline Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700"
          >
            <X className="w-3 h-3" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Source Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Source
          </label>
          <select
            value={filters.source}
            onChange={(e) => onFilterChange({ source: e.target.value })}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Sources</option>
            {sources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        </div>

        {/* Stage Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Stage
          </label>
          <select
            value={filters.stage}
            onChange={(e) => onFilterChange({ stage: e.target.value })}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Stages</option>
            {stages.map(stage => (
              <option key={stage} value={stage}>
                {stage.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        {/* Lead Score Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Min Lead Score: {filters.leadScore}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            value={filters.leadScore}
            onChange={(e) => onFilterChange({ leadScore: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Deal Value Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Min Deal Value: ${filters.dealValue.toLocaleString()}
          </label>
          <input
            type="range"
            min="0"
            max="100000"
            step="5000"
            value={filters.dealValue}
            onChange={(e) => onFilterChange({ dealValue: parseInt(e.target.value) })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Assigned To Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Assigned To
          </label>
          <select
            value={filters.assignedTo}
            onChange={(e) => onFilterChange({ assignedTo: e.target.value })}
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Assignees</option>
            {assignees.map(assignee => (
              <option key={assignee} value={assignee}>{assignee}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.source && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Source: {filters.source}
              <button
                onClick={() => onFilterChange({ source: '' })}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.stage && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Stage: {filters.stage.replace('_', ' ')}
              <button
                onClick={() => onFilterChange({ stage: '' })}
                className="ml-1 text-green-600 hover:text-green-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.leadScore > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Score: {filters.leadScore}+
              <button
                onClick={() => onFilterChange({ leadScore: 0 })}
                className="ml-1 text-yellow-600 hover:text-yellow-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.dealValue > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Value: ${filters.dealValue.toLocaleString()}+
              <button
                onClick={() => onFilterChange({ dealValue: 0 })}
                className="ml-1 text-purple-600 hover:text-purple-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
