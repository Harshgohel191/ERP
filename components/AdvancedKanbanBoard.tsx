'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { AdvancedDealCard } from './AdvancedDealCard'
import { Lead } from '@/types/lead'


interface PipelineStage {
  id: string
  name: string
  color: string
  textColor: string
}

const PIPELINE_STAGES: PipelineStage[] = [
  { id: 'INCOMING', name: 'New Leads', color: 'bg-gray-100', textColor: 'text-gray-800' },
  { id: 'QUALIFIED', name: 'Qualified', color: 'bg-blue-100', textColor: 'text-blue-800' },
  { id: 'TECH_AUDIT', name: 'Discovery', color: 'bg-purple-100', textColor: 'text-purple-800' },
  { id: 'PROPOSAL_SENT', name: 'Proposal', color: 'bg-yellow-100', textColor: 'text-yellow-800' },
  { id: 'NEGOTIATION', name: 'Negotiation', color: 'bg-orange-100', textColor: 'text-orange-800' },
  { id: 'CLOSED_WON', name: 'Won', color: 'bg-green-100', textColor: 'text-green-800' },
  { id: 'LOST', name: 'Lost', color: 'bg-red-100', textColor: 'text-red-800' }
]

interface AdvancedKanbanBoardProps {
  leads: Lead[]
  onDealClick: (deal: Lead) => void
}

export function AdvancedKanbanBoard({ leads, onDealClick }: AdvancedKanbanBoardProps) {
  const getStageDeals = (stage: string) => {
    return leads.filter(lead => lead.status === stage)
  }

  const getStageValue = (stage: string) => {
    return leads
      .filter(lead => lead.status === stage)
      .reduce((total, lead) => total + (lead.estimatedLtv || 0), 0)
  }

  return (
    <div className="grid grid-cols-7 gap-4 h-full overflow-x-auto">
      {PIPELINE_STAGES.map((stage) => {
        const stageDeals = getStageDeals(stage.id)
        const stageValue = getStageValue(stage.id)
        
        return (
          <PipelineColumn
            key={stage.id}
            stage={stage}
            deals={stageDeals}
            stageValue={stageValue}
            onDealClick={onDealClick}
          />
        )
      })}
    </div>
  )
}

interface PipelineColumnProps {
  stage: typeof PIPELINE_STAGES[0]
  deals: Lead[]
  stageValue: number
  onDealClick: (deal: Lead) => void
}

function PipelineColumn({ stage, deals, stageValue, onDealClick }: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  })

  return (
    <div className={`flex flex-col min-w-80 ${isOver ? 'bg-blue-50' : ''}`}>
      {/* Column Header */}
      <div className={`${stage.color} ${stage.textColor} p-3 rounded-t-lg border-b-2 border-gray-200`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">{stage.name}</h3>
          <span className="bg-white bg-opacity-70 text-xs px-2 py-1 rounded-full font-medium">
            {deals.length}
          </span>
        </div>
        <div className="text-xs opacity-75">
          Value: ${stageValue.toLocaleString()}
        </div>
      </div>

      {/* Deals Container */}
      <div 
        ref={setNodeRef}
        className={`flex-1 p-3 bg-gray-50 rounded-b-lg min-h-96 ${
          isOver ? 'bg-blue-100' : ''
        }`}
      >
        <SortableContext items={deals.map(deal => deal.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {deals.map((deal) => (
              <AdvancedDealCard
                key={deal.id}
                deal={deal}
                onClick={() => onDealClick(deal)}
              />
            ))}
          </div>
        </SortableContext>
        
        {deals.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-8">
            No deals in this stage
          </div>
        )}
      </div>
    </div>
  )
}
