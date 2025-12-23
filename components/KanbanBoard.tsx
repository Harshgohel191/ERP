
'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { LeadCard } from '@/components/LeadCard'
import { Lead } from '@/types/lead'

interface KanbanColumnProps {
  stage: string
  title: string
  leads: Lead[]
  color: string
  onLeadClick: (lead: Lead) => void
}

export function KanbanColumn({ stage, title, leads, color, onLeadClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  })

  const getStageStyle = (stage: string) => {
    switch (stage) {
      case 'INCOMING': return 'pipeline-stage-incoming'
      case 'QUALIFIED': return 'pipeline-stage-qualified'
      case 'TECH_AUDIT': return 'pipeline-stage-tech-audit'
      case 'PROPOSAL_SENT': return 'pipeline-stage-proposal'
      case 'NEGOTIATION': return 'pipeline-stage-negotiation'
      case 'CLOSED_WON': return 'pipeline-stage-closed-won'
      case 'LOST': return 'pipeline-stage-lost'
      default: return ''
    }
  }

  return (
    <div className="flex-1 min-w-80">
      <div className={`rounded-lg p-4 ${getStageStyle(stage)}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">{title}</h3>
          <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded-full">
            {leads.length}
          </span>
        </div>
        
        <div 
          ref={setNodeRef}
          className={`min-h-96 space-y-2 transition-colors ${
            isOver ? 'bg-white bg-opacity-50 rounded-lg p-2' : ''
          }`}
        >
          <SortableContext items={leads.map(lead => lead.id)} strategy={verticalListSortingStrategy}>
            {leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onClick={() => onLeadClick(lead)}
              />
            ))}
          </SortableContext>
          
          {leads.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              No leads in this stage
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface KanbanBoardProps {
  leads: Lead[]
  onLeadClick: (lead: Lead) => void
}

export function KanbanBoard({ leads, onLeadClick }: KanbanBoardProps) {


  const pipelineStages = [
    { stage: 'INCOMING', title: 'Incoming', color: 'blue' },
    { stage: 'QUALIFIED', title: 'Qualified', color: 'purple' },
    { stage: 'TECH_AUDIT', title: 'Tech Audit', color: 'orange' },
    { stage: 'PROPOSAL_SENT', title: 'Proposal Sent', color: 'cyan' },
    { stage: 'NEGOTIATION', title: 'Negotiation', color: 'orange' },
  ]

  const getLeadsByStage = (stage: string) => {
    // Filter to show only active leads (not CLOSED_WON or LOST)
    return leads.filter(lead => lead.status === stage)
  }

  const checkStaleProposal = (lead: Lead) => {
    if (lead.status === 'PROPOSAL_SENT') {
      const daysSinceProposal = Math.floor(
        (Date.now() - new Date(lead.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysSinceProposal > 3
    }
    return false
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {pipelineStages.map(({ stage, title, color }) => (
        <KanbanColumn
          key={stage}
          stage={stage}
          title={title}
          leads={getLeadsByStage(stage)}
          color={color}
          onLeadClick={onLeadClick}
        />
      ))}
    </div>
  )
}
