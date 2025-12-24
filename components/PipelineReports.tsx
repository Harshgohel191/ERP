'use client'

import { X, TrendingUp, BarChart3, PieChart, Download } from 'lucide-react'
import { Lead } from '@/types/lead'

interface PipelineReportsProps {
  leads: Lead[]
  onClose: () => void
}

export function PipelineReports({ leads, onClose }: PipelineReportsProps) {
  const calculateReports = () => {
    const totalValue = leads.reduce((sum, lead) => sum + (lead.estimatedLtv || 0), 0)
    const totalLeads = leads.length
    
    // Pipeline velocity (average days to close)
    const closedDeals = leads.filter(lead => ['CLOSED_WON', 'LOST'].includes(lead.status))
    const avgDaysToClose = closedDeals.length > 0 
      ? closedDeals.reduce((sum, deal) => {
          const created = new Date(deal.createdAt)
          const updated = new Date(deal.updatedAt)
          const diffTime = Math.abs(updated.getTime() - created.getTime())
          return sum + Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        }, 0) / closedDeals.length
      : 0

    // Stage conversion rates
    const stages = ['INCOMING', 'QUALIFIED', 'TECH_AUDIT', 'PROPOSAL_SENT', 'NEGOTIATION', 'CLOSED_WON']
    const stageCounts = stages.reduce((acc, stage) => {
      acc[stage] = leads.filter(lead => lead.status === stage).length
      return acc
    }, {} as Record<string, number>)

    // Source performance
    const sourcePerformance = leads.reduce((acc, lead) => {
      if (!acc[lead.source]) {
        acc[lead.source] = { count: 0, value: 0, avgScore: 0, scores: [] }
      }
      acc[lead.source].count++
      acc[lead.source].value += lead.estimatedLtv || 0
      acc[lead.source].scores.push(lead.leadScore)
      return acc
    }, {} as Record<string, { count: number, value: number, avgScore: number, scores: number[] }>)

    // Calculate average scores
    Object.keys(sourcePerformance).forEach(source => {
      const scores = sourcePerformance[source].scores
      sourcePerformance[source].avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
    })

    return {
      totalValue,
      totalLeads,
      avgDaysToClose,
      stageCounts,
      sourcePerformance,
      conversionRate: totalLeads > 0 ? ((stageCounts['CLOSED_WON'] || 0) / totalLeads * 100) : 0
    }
  }

  const reports = calculateReports()

  const exportReport = () => {
    const csvData = [
      ['Metric', 'Value'],
      ['Total Pipeline Value', `$${reports.totalValue.toLocaleString()}`],
      ['Total Leads', reports.totalLeads.toString()],
      ['Average Days to Close', reports.avgDaysToClose.toFixed(1)],
      ['Conversion Rate', `${reports.conversionRate.toFixed(1)}%`],
      [''],
      ['Stage Breakdown', 'Count'],
      ...Object.entries(reports.stageCounts).map(([stage, count]) => [
        stage.replace('_', ' '), count.toString()
      ]),
      [''],
      ['Source Performance', 'Count', 'Total Value', 'Avg Score'],
      ...Object.entries(reports.sourcePerformance).map(([source, data]) => [
        source, data.count.toString(), `$${data.value.toLocaleString()}`, data.avgScore.toFixed(1)
      ])
    ]

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pipeline-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Pipeline Reports</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={exportReport}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Export Report"
            >
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
      </div>

      <div className="p-4 space-y-6">
        {/* Key Metrics */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            Key Metrics
          </h4>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Pipeline Value</div>
              <div className="text-xl font-bold text-gray-900">
                ${reports.totalValue.toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Avg Days to Close</div>
              <div className="text-xl font-bold text-gray-900">
                {reports.avgDaysToClose.toFixed(1)} days
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Conversion Rate</div>
              <div className="text-xl font-bold text-gray-900">
                {reports.conversionRate.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Stage Distribution */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <PieChart className="w-4 h-4 mr-2" />
            Stage Distribution
          </h4>
          <div className="space-y-2">
            {Object.entries(reports.stageCounts).map(([stage, count]) => (
              <div key={stage} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {stage.replace('_', ' ')}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ 
                        width: `${Math.max((count / reports.totalLeads) * 100, 5)}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-6 text-right">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Source Performance */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Source Performance
          </h4>
          <div className="space-y-3">
            {Object.entries(reports.sourcePerformance)
              .sort(([,a], [,b]) => b.value - a.value)
              .slice(0, 5)
              .map(([source, data]) => (
                <div key={source} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{source}</span>
                    <span className="text-xs text-gray-600">{data.count} deals</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    Value: ${data.value.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    Avg Score: {data.avgScore.toFixed(0)}
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Forecast */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">30-Day Forecast</h4>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3">
            <div className="text-sm text-gray-600 mb-1">Expected Closures</div>
            <div className="text-lg font-bold text-gray-900">
              {Math.round(reports.totalLeads * 0.15)} deals
            </div>
            <div className="text-sm text-gray-600">
              Revenue: ${Math.round(reports.totalValue * 0.2).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
