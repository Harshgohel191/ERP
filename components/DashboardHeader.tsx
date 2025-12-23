'use client'

import { 
  Bell, 
  Search, 
  Settings, 
  Plus, 
  BarChart3,
  X
} from 'lucide-react'


interface DashboardHeaderProps {
  onShowReports: () => void
  showReports: boolean
  onAddLead: () => void
}


export function DashboardHeader({ onShowReports, showReports, onAddLead }: DashboardHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search leads, companies, deals..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-96"
            />
          </div>
          
          <div className="flex items-center space-x-2">

            <button 
              onClick={onAddLead}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Lead</span>
            </button>
            
            <button 
              onClick={onShowReports}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                showReports 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Reports</span>
            </button>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Today's Progress:</span>
            <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
              8/10 goals
            </div>
          </div>
          
          <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>
          
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">JD</span>
          </div>
        </div>
      </div>
    </header>
  )
}
