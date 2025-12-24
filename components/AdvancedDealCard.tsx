'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TrendingUp, Users, Calendar, DollarSign, Star } from 'lucide-react'
import { Lead } from '@/types/lead'

interface AdvancedDealCardProps {
  deal: Lead
  onClick: () => void
}

export function AdvancedDealCard({ deal, onClick }: AdvancedDealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getDaysInStage = () => {
    // Calculate days since created (simplified)
    const created = new Date(deal.createdAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-all ${
        isDragging ? 'rotate-2 scale-105' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-sm text-gray-900 truncate">
            {deal.company || deal.name}
          </h4>
          <p className="text-xs text-gray-600 mt-1">{deal.name}</p>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(deal.leadScore)}`}>
          {deal.leadScore}
        </div>
      </div>

      {/* Value */}
      <div className="flex items-center space-x-2 mb-3">
        <DollarSign className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-900">
          ${(deal.estimatedLtv || 0).toLocaleString()}
        </span>
      </div>

      {/* Source & Days */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {deal.source}
        </span>
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Calendar className="w-3 h-3" />
          <span>{getDaysInStage()}d</span>
        </div>
      </div>

      {/* Activities Preview */}
      <div className="mb-3">
        {deal.activities.length > 0 && (
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <Users className="w-3 h-3" />
            <span>{deal.activities.length} activities</span>
          </div>
        )}
      </div>

      {/* Risk Indicators */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1">
          {deal.leadScore < 50 && (
            <div className="w-2 h-2 bg-red-400 rounded-full" title="Low Score" />
          )}
          {getDaysInStage() > 30 && (
            <div className="w-2 h-2 bg-yellow-400 rounded-full" title="Long Time in Stage" />
          )}
          {(deal.estimatedLtv || 0) > 50000 && (
            <div className="w-2 h-2 bg-green-400 rounded-full" title="High Value" />
          )}
        </div>
        
        {deal.leadScore >= 80 && (
          <Star className="w-3 h-3 text-yellow-400 fill-current" />
        )}
      </div>
    </div>
  )
}
