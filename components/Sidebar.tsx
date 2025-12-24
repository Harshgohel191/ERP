'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  Settings, 
  FileText,
  Target,
  Calendar,
  DollarSign
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Pipeline', href: '/pipeline', icon: TrendingUp },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Revenue', href: '/revenue', icon: DollarSign },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200">
      <div className="p-6">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">LeadERP</h1>
            <p className="text-sm text-gray-500">Tech Service Pipeline</p>
          </div>
        </div>
      </div>

      <nav className="px-4 pb-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>


      <div className="px-4 pb-4">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
          <h3 className="text-sm font-medium">Quick Actions</h3>
          <p className="text-xs mt-1 opacity-90">Navigate to leads section</p>
          <div className="mt-3 space-y-2">
            <Link href="/dashboard" className="block w-full text-center bg-white bg-opacity-20 hover:bg-opacity-30 text-xs py-2 px-3 rounded-md transition-colors">
              View Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Today's Summary</h3>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>New Leads</span>
              <span className="font-medium">12</span>
            </div>
            <div className="flex justify-between">
              <span>Follow-ups</span>
              <span className="font-medium">5</span>
            </div>
            <div className="flex justify-between">
              <span>Proposals Sent</span>
              <span className="font-medium">3</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
