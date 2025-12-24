'use client'

import { TrendingUp, TrendingDown, DollarSign, Users, Target, Clock } from 'lucide-react'
import { Lead } from '@/types/lead'

interface PipelineMetricsProps {
  leads: Lead[]
}

export function PipelineMetrics({ leads }: PipelineMetricsProps) {
  const calculateMetrics = () => {
    const totalValue = leads.reduce((sum, lead) => sum + (lead.estimatedLtv || 0), 0)
    const totalLeads = leads.length
    const avgDealSize = totalLeads > 0 ? totalValue / totalLeads : 0
    
    const qualifiedLeads = leads.filter(lead => 
      ['QUALIFIED', 'TECH_AUDIT', 'PROPOSAL_SENT', 'NEGOTIATION'].includes(lead.status)
    )
    
    const wonDeals = leads.filter(lead => lead.status === 'CLOSED_WON')
    const lostDeals = leads.filter(lead => lead.status === 'LOST')
    
    const winRate = totalLeads > 0 ? (wonDeals.length / totalLeads) * 100 : 0
    const conversionRate = totalLeads > 0 ? (qualifiedLeads.length / totalLeads) * 100 : 0
    
    const avgLeadScore = totalLeads > 0 
      ? leads.reduce((sum, lead) => sum + lead.leadScore, 0) / totalLeads 
      : 0

    // Calculate weighted pipeline value
    const weights = {
      'INCOMING': 0.1,
      'QUALIFIED': 0.25,
      'TECH_AUDIT': 0.5,
      'PROPOSAL_SENT': 0.7,
      'NEGOTIATION': 0.85,
      'CLOSED_WON': 1.0
    }
    
    const weightedPipelineValue = leads.reduce((sum, lead) => {
      const weight = weights[lead.status as keyof typeof weights] || 0
      return sum + ((lead.estimatedLtv || 0) * weight)
    }, 0)

    return {
      totalValue,
      totalLeads,
      avgDealSize,
      winRate,
      conversionRate,
      avgLeadScore,
      weightedPipelineValue,
      qualifiedLeadsCount: qualifiedLeads.length,
      wonDealsCount: wonDeals.length,
      lostDealsCount: lostDeals.length
    }
  }

  const metrics = calculateMetrics()

  const metricCards = [
    {
      title: 'Total Pipeline Value',
      value: `$${metrics.totalValue.toLocaleString()}`,
      subtext: `Weighted: $${metrics.weightedPipelineValue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Active Deals',
      value: metrics.totalLeads.toString(),
      subtext: `${metrics.qualifiedLeadsCount} qualified`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Win Rate',
      value: `${metrics.winRate.toFixed(1)}%`,
      subtext: `${metrics.wonDealsCount} won / ${metrics.lostDealsCount} lost`,
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Conversion Rate',
      value: `${metrics.conversionRate.toFixed(1)}%`,
      subtext: 'Lead to qualified',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Avg Deal Size',
      value: `$${metrics.avgDealSize.toLocaleString()}`,
      subtext: 'Per deal',
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      title: 'Avg Lead Score',
      value: metrics.avgLeadScore.toFixed(0),
      subtext: 'Quality score',
      icon: Target,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    }
  ]

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 p-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricCards.map((metric, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`w-4 h-4 ${metric.color}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {metric.value}
            </div>
            <div className="text-sm font-medium text-gray-700 mb-1">
              {metric.title}
            </div>
            <div className="text-xs text-gray-500">
              {metric.subtext}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
