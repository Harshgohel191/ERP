'use client'

import { Lead } from '@/types/lead'
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Target,
  Award,
  Calendar,
  Building2
} from 'lucide-react'

interface RevenueAnalyticsProps {
  leads: Lead[]
}

export function RevenueAnalytics({ leads }: RevenueAnalyticsProps) {
  // Filter only won leads
  const wonLeads = leads.filter(lead => lead.status === 'CLOSED_WON')
  
  // Calculate revenue metrics
  const totalRevenue = wonLeads.reduce((sum, lead) => sum + (lead.estimatedLtv || 0), 0)
  const totalMRR = wonLeads.reduce((sum, lead) => sum + (lead.monthlySubscriptionFee || 0), 0)
  const totalARR = totalMRR * 12
  const totalOneTimeFees = wonLeads.reduce((sum, lead) => sum + (lead.oneTimeFee || 0), 0)
  
  // Calculate additional metrics
  const averageDealSize = wonLeads.length > 0 ? totalRevenue / wonLeads.length : 0
  const conversionRate = leads.length > 0 ? (wonLeads.length / leads.length) * 100 : 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date))
  }

  return (
    <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-green-100 p-2 rounded-lg">
            <Award className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Revenue Analytics</h2>
            <p className="text-sm text-gray-600">Won deals and SaaS revenue metrics</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">{wonLeads.length}</div>
          <div className="text-sm text-gray-600">Won Deals</div>
        </div>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Revenue */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Revenue (LTV)</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">Lifetime value of won deals</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Monthly Recurring Revenue */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Monthly Recurring Revenue</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalMRR)}</p>
              <p className="text-xs text-gray-500 mt-1">Current MRR from subscriptions</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Annual Recurring Revenue */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Annual Recurring Revenue</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalARR)}</p>
              <p className="text-xs text-gray-500 mt-1">MRR × 12 months</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Average Deal Size */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Average Deal Size</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(averageDealSize)}</p>
              <p className="text-xs text-gray-500 mt-1">Per won deal</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* One-time vs Recurring Revenue Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Revenue Breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">One-time Fees</span>
              </div>
              <span className="text-sm font-medium">{formatCurrency(totalOneTimeFees)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-600">Annual Subscription Value</span>
              </div>
              <span className="text-sm font-medium">{formatCurrency(totalARR)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Performance Metrics</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Conversion Rate</span>
              <span className="text-sm font-medium text-green-600">{conversionRate.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Won Deals</span>
              <span className="text-sm font-medium">{wonLeads.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Pipeline</span>
              <span className="text-sm font-medium text-blue-600">{leads.length - wonLeads.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Won Deals List */}
      {wonLeads.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Recent Won Deals</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {wonLeads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-medium text-gray-900">{lead.name}</h4>
                      {lead.company && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-600 flex items-center">
                            <Building2 className="w-3 h-3 mr-1" />
                            {lead.company}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center mt-1 space-x-4">
                      <span className="text-xs text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        Won: {formatDate(lead.updatedAt)}
                      </span>
                      <span className="text-xs text-gray-500">Source: {lead.source}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(lead.estimatedLtv || 0)}
                    </div>
                    {lead.monthlySubscriptionFee && lead.monthlySubscriptionFee > 0 && (
                      <div className="text-xs text-green-600">
                        +{formatCurrency(lead.monthlySubscriptionFee)}/mo
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {wonLeads.length > 5 && (
              <div className="p-4 text-center">
                <span className="text-sm text-gray-500">
                  +{wonLeads.length - 5} more won deals
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {wonLeads.length === 0 && (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm border border-gray-200">
          <Award className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Won Deals Yet</h3>
          <p className="text-gray-600">Won deals and revenue will appear here once you start closing deals.</p>
        </div>
      )}
    </div>
  )
}
