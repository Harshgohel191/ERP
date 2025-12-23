'use client'

import { useState } from 'react'
import { Lead, PipelineStats } from '@/types/lead'
import { 
  X, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Users,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Filter
} from 'lucide-react'

interface ReportsPanelProps {
  leads: Lead[]
  onClose: () => void
}

export function ReportsPanel({ leads, onClose }: ReportsPanelProps) {
  const [activeTab, setActiveTab] = useState('overview')

  // Calculate pipeline statistics
  const calculateStats = (): PipelineStats => {
    const totalPipelineValue = leads.reduce((sum, lead) => {
      return sum + (lead.estimatedLtv || 0)
    }, 0)

    const projectedMRR = leads.reduce((sum, lead) => {
      return sum + (lead.monthlySubscriptionFee || 0)
    }, 0)

    const closedWonLeads = leads.filter(lead => lead.status === 'CLOSED_WON')
    const totalLeads = leads.length
    const leadConversionRate = totalLeads > 0 ? (closedWonLeads.length / totalLeads) * 100 : 0

    const dealsByStage = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const leadsBySource = leads.reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate weighted forecast
    const weightedForecast = leads.reduce((sum, lead) => {
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
      return sum + (ltv * (probabilityMap[lead.status] || 0))
    }, 0)

    const averageDealSize = leads.length > 0 ? totalPipelineValue / leads.length : 0
    const averageLeadScore = leads.length > 0 ? leads.reduce((sum, lead) => sum + lead.leadScore, 0) / leads.length : 0

    return {
      totalPipelineValue,
      projectedMRR,
      leadConversionRate,
      weightedForecast,
      dealsByStage: dealsByStage as any,
      leadsBySource,
      averageDealSize,
      averageLeadScore,
    }
  }

  const stats = calculateStats()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'pipeline', name: 'Pipeline', icon: TrendingUp },
    { id: 'conversion', name: 'Conversion', icon: Target },
    { id: 'sources', name: 'Sources', icon: PieChart },
  ]

  return (
    <div className="w-96 bg-white shadow-lg border-l border-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Reports & Analytics</h2>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Pipeline Value</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalPipelineValue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Projected MRR</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.projectedMRR)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Weighted Forecast</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.weightedForecast)}</p>
              </div>
              <Target className="w-8 h-8 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Key Performance Indicators</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Lead Conversion Rate</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatPercentage(stats.leadConversionRate)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Average Deal Size</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatCurrency(stats.averageDealSize)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Average Lead Score</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {stats.averageLeadScore.toFixed(1)}/100
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Total Leads</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {leads.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pipeline Tab */}
        {activeTab === 'pipeline' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Pipeline Distribution</h3>
            {Object.entries(stats.dealsByStage).map(([stage, count]) => (
              <div key={stage} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900">{stage.replace('_', ' ')}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{count} leads</span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(count / leads.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Conversion Tab */}
        {activeTab === 'conversion' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Conversion Funnel</h3>
            <div className="space-y-2">
              {[
                { stage: 'INCOMING', count: stats.dealsByStage.INCOMING || 0 },
                { stage: 'QUALIFIED', count: stats.dealsByStage.QUALIFIED || 0 },
                { stage: 'TECH_AUDIT', count: stats.dealsByStage.TECH_AUDIT || 0 },
                { stage: 'PROPOSAL_SENT', count: stats.dealsByStage.PROPOSAL_SENT || 0 },
                { stage: 'NEGOTIATION', count: stats.dealsByStage.NEGOTIATION || 0 },
                { stage: 'CLOSED_WON', count: stats.dealsByStage.CLOSED_WON || 0 },
              ].map((stage, index) => {
                const conversionRate = index === 0 ? 100 : 
                  stats.dealsByStage.INCOMING ? 
                  (stage.count / stats.dealsByStage.INCOMING) * 100 : 0
                
                return (
                  <div key={stage.stage} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {stage.stage.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-600">
                        {stage.count} ({conversionRate.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${conversionRate}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Sources Tab */}
        {activeTab === 'sources' && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Lead Sources</h3>
            {Object.entries(stats.leadsBySource).map(([source, count]) => {
              const percentage = (count / leads.length) * 100
              return (
                <div key={source} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">{source}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{count} leads</span>
                    <span className="text-sm font-medium text-gray-600">
                      ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
