'use client'

import { Lead } from '@/types/lead'
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Users,
  Clock,
  AlertTriangle
} from 'lucide-react'

interface PipelineStatsProps {
  leads: Lead[]
}


export function PipelineStats({ leads }: PipelineStatsProps) {
  // Filter only active leads (not CLOSED_WON or LOST)
  const activeLeads = leads.filter(lead => lead.status !== 'CLOSED_WON' && lead.status !== 'LOST')

  // Calculate weighted forecast based on stage
  const calculateWeightedForecast = (lead: Lead) => {
    const ltv = lead.estimatedLtv || 0
    const probabilityMap = {
      'PROPOSAL_SENT': 0.7,
      'QUALIFIED': 0.2,
      'NEGOTIATION': 0.8,
      'TECH_AUDIT': 0.5,
      'INCOMING': 0.1,
      'CLOSED_WON': 1.0,
      'LOST': 0.0,
    }
    return ltv * (probabilityMap[lead.status] || 0)
  }

  // Calculate statistics for active leads only
  const totalPipelineValue = activeLeads.reduce((sum, lead) => sum + (lead.estimatedLtv || 0), 0)
  const weightedForecast = activeLeads.reduce((sum, lead) => sum + calculateWeightedForecast(lead), 0)
  const projectedMRR = activeLeads.reduce((sum, lead) => sum + (lead.monthlySubscriptionFee || 0), 0)
  const totalLeads = activeLeads.length
  

  // Conversion rate calculation based on all leads
  const closedWonLeads = leads.filter(lead => lead.status === 'CLOSED_WON')
  const totalAllLeads = leads.length
  const conversionRate = totalAllLeads > 0 ? (closedWonLeads.length / totalAllLeads) * 100 : 0

  // Follow-up alerts for active leads
  const followUpAlerts = activeLeads.filter(lead => {
    if (lead.status === 'PROPOSAL_SENT') {
      const daysSinceProposal = Math.floor(
        (Date.now() - new Date(lead.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysSinceProposal > 3
    }
    return false
  })

  // Tech audit tasks for active leads
  const techAuditLeads = activeLeads.filter(lead => lead.status === 'TECH_AUDIT')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="p-6 border-b border-gray-200 bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Pipeline Value */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Pipeline Value</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPipelineValue)}</p>

              <p className="text-blue-100 text-xs mt-1">
                {totalLeads} active leads
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        {/* Weighted Forecast */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Weighted Forecast</p>
              <p className="text-2xl font-bold">{formatCurrency(weightedForecast)}</p>
              <p className="text-purple-100 text-xs mt-1">
                Probability-adjusted
              </p>
            </div>
            <Target className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        {/* Projected MRR */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Projected MRR</p>
              <p className="text-2xl font-bold">{formatCurrency(projectedMRR)}</p>
              <p className="text-green-100 text-xs mt-1">
                Monthly recurring revenue
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-200" />
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Conversion Rate</p>
              <p className="text-2xl font-bold">{conversionRate.toFixed(1)}%</p>
              <p className="text-orange-100 text-xs mt-1">
                {closedWonLeads.length} of {totalLeads} closed won
              </p>
            </div>
            <Users className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {(followUpAlerts.length > 0 || techAuditLeads.length > 0) && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Follow-up Alerts */}
          {followUpAlerts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">
                    Follow-up Required
                  </h4>
                  <p className="text-sm text-red-600 mt-1">
                    {followUpAlerts.length} proposal{followUpAlerts.length !== 1 ? 's' : ''} older than 3 days
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tech Audit Tasks */}
          {techAuditLeads.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">
                    Tech Audit Pending
                  </h4>
                  <p className="text-sm text-yellow-600 mt-1">
                    {techAuditLeads.length} lead{techAuditLeads.length !== 1 ? 's' : ''} need architecture roadmap
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
