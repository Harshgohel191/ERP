'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Lead } from '@/types/lead'
import { 
  Building2, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign,
  AlertCircle,
  Clock
} from 'lucide-react'

interface LeadCardProps {
  lead: Lead
  onClick: () => void
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Calculate weighted forecast based on stage
  const getWeightedForecast = (lead: Lead) => {
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

  // Check if proposal is stale (>3 days)
  const isProposalStale = () => {
    if (lead.status === 'PROPOSAL_SENT') {
      const daysSinceProposal = Math.floor(
        (Date.now() - new Date(lead.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysSinceProposal > 3
    }
    return false
  }

  // Get lead score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'lead-score-high'
    if (score >= 50) return 'lead-score-medium'
    return 'lead-score-low'
  }

  const weightedForecast = getWeightedForecast(lead)
  const needsFollowUp = isProposalStale()

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`lead-card ${
        isDragging ? 'dragging' : ''
      } ${needsFollowUp ? 'lead-card-need-followup' : ''}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 text-sm leading-tight">
            {lead.name}
          </h4>
          {lead.company && (
            <p className="text-xs text-gray-500 flex items-center mt-1">
              <Building2 className="w-3 h-3 mr-1" />
              {lead.company}
            </p>
          )}
        </div>
        
        <div className="flex flex-col items-end space-y-1">
          <span className={`text-xs px-2 py-1 rounded-full ${getScoreColor(lead.leadScore)}`}>
            Score: {lead.leadScore}
          </span>
          {needsFollowUp && (
            <div className="flex items-center text-red-600 text-xs">
              <AlertCircle className="w-3 h-3 mr-1" />
              <span className="font-medium">Follow-up</span>
            </div>
          )}
        </div>
      </div>

      {/* Source and Lead Score */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
          {lead.source}
        </span>
        <div className="text-xs text-gray-500">
          {new Date(lead.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Financial Information */}
      {lead.estimatedLtv && lead.estimatedLtv > 0 && (
        <div className="mb-2 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">LTV:</span>
            <span className="font-medium">${lead.estimatedLtv.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Weighted:</span>
            <span className="font-medium text-blue-600">
              ${weightedForecast.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Technical Requirements Preview */}
      {lead.technicalRequirements && (
        <div className="mb-2">
          <p className="text-xs text-gray-600 line-clamp-2">
            {lead.technicalRequirements}
          </p>
        </div>
      )}

      {/* Footer with additional info */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
        <div className="flex items-center">
          <Calendar className="w-3 h-3 mr-1" />
          <span>{new Date(lead.updatedAt).toLocaleDateString()}</span>
        </div>
        
        {lead.monthlySubscriptionFee && (
          <div className="flex items-center text-green-600">
            <DollarSign className="w-3 h-3 mr-1" />
            <span>${lead.monthlySubscriptionFee}/mo</span>
          </div>
        )}
      </div>

      {/* Follow-up warning */}
      {needsFollowUp && (
        <div className="mt-2 bg-red-100 border border-red-200 rounded p-2">
          <div className="flex items-center text-red-700 text-xs">
            <Clock className="w-3 h-3 mr-1" />
            <span>Proposal sent more than 3 days ago</span>
          </div>
        </div>
      )}
    </div>
  )
}
