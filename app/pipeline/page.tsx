'use client'

import { useState, useEffect } from 'react'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { Sidebar } from '@/components/Sidebar'
import { AdvancedKanbanBoard } from '@/components/AdvancedKanbanBoard'
import { PipelineMetrics } from '@/components/PipelineMetrics'
import { PipelineFilters } from '@/components/PipelineFilters'
import { PipelineReports } from '@/components/PipelineReports'
import { DealDetailsModal } from '@/components/DealDetailsModal'
import { Lead } from '@/types/lead'

interface FilterState {
  source: string
  leadScore: number
  dealValue: number
  assignedTo: string
  stage: string
}

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [selectedDeal, setSelectedDeal] = useState<Lead | null>(null)
  const [showDealModal, setShowDealModal] = useState(false)
  const [showReports, setShowReports] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    source: '',
    leadScore: 0,
    dealValue: 0,
    assignedTo: '',
    stage: ''
  })
  const [isLoading, setIsLoading] = useState(true)

  // Load leads on component mount
  useEffect(() => {
    loadLeads()
  }, [])

  // Apply filters whenever leads or filters change
  useEffect(() => {
    applyFilters()
  }, [leads, filters])

  const loadLeads = async () => {
    try {
      const response = await fetch('/api/leads')
      const data = await response.json()
      setLeads(data.leads || [])
    } catch (error) {
      console.error('Failed to load leads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...leads]

    if (filters.source) {
      filtered = filtered.filter(lead => 
        lead.source.toLowerCase().includes(filters.source.toLowerCase())
      )
    }

    if (filters.leadScore > 0) {
      filtered = filtered.filter(lead => lead.leadScore >= filters.leadScore)
    }

    if (filters.dealValue > 0) {
      filtered = filtered.filter(lead => (lead.estimatedLtv || 0) >= filters.dealValue)
    }

    if (filters.assignedTo) {
      filtered = filtered.filter(lead => 
        lead.activities.some(activity => 
          activity.notes.includes(filters.assignedTo)
        )
      )
    }

    if (filters.stage) {
      filtered = filtered.filter(lead => lead.status === filters.stage)
    }

    setFilteredLeads(filtered)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const leadId = active.id as string
    const newStage = over.id as string

    // Find the lead
    const lead = leads.find(l => l.id === leadId)
    if (!lead) return

    // Update local state optimistically
    setLeads(prev => prev.map(l => 
      l.id === leadId ? { ...l, status: newStage as any } : l
    ))

    try {
      // Update in database
      const response = await fetch(`/api/leads/${leadId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage })
      })

      if (!response.ok) {
        // Revert on error
        setLeads(prev => prev.map(l => 
          l.id === leadId ? { ...l, status: lead.status } : l
        ))
      } else {
        // Trigger automation based on stage
        await handleStageAutomation(leadId, newStage, lead)
      }
    } catch (error) {
      console.error('Failed to update lead stage:', error)
      // Revert on error
      setLeads(prev => prev.map(l => 
        l.id === leadId ? { ...l, status: lead.status } : l
      ))
    }
  }

  const handleStageAutomation = async (leadId: string, newStage: string, lead: Lead) => {
    const automationRules = {
      'QUALIFIED': async () => {
        // Auto-assign to sales rep
        await fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId,
            type: 'auto_assignment',
            notes: `Lead automatically assigned to sales team for qualification`
          })
        })
      },
      'TECH_AUDIT': async () => {
        // Create technical audit task
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId,
            title: 'Technical Audit & Discovery',
            description: `Conduct comprehensive technical audit for ${lead.company || lead.name}`,
            assignedTo: 'Solutions Architect',
            priority: 'high'
          })
        })
      },
      'PROPOSAL_SENT': async () => {
        // Schedule follow-up task
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId,
            title: 'Proposal Follow-up',
            description: 'Follow up on proposal sent - check for questions or objections',
            assignedTo: 'Account Executive',
            priority: 'medium'
          })
        })
      },
      'CLOSED_WON': async () => {
        // Trigger onboarding process
        await fetch('/api/leads/' + leadId + '/convert', {
          method: 'POST'
        })
      }
    }

    if (automationRules[newStage as keyof typeof automationRules]) {
      await automationRules[newStage as keyof typeof automationRules]()
    }
  }

  const handleDealClick = (lead: Lead) => {
    setSelectedDeal(lead)
    setShowDealModal(true)
  }

  const handleCloseDealModal = () => {
    setSelectedDeal(null)
    setShowDealModal(false)
  }

  const handleUpdateDeal = (updatedLead: Lead) => {
    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l))
    setSelectedDeal(updatedLead)
  }

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const clearFilters = () => {
    setFilters({
      source: '',
      leadScore: 0,
      dealValue: 0,
      assignedTo: '',
      stage: ''
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Pipeline Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales Pipeline</h1>
              <p className="text-sm text-gray-600">Advanced pipeline management for SaaS deals</p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowReports(!showReports)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Pipeline Reports
              </button>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{filteredLeads.length}</span> deals in pipeline
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline Metrics */}
        <PipelineMetrics leads={filteredLeads} />
        
        <div className="flex-1 flex">
          <div className="flex-1">
            {/* Filters */}
            <PipelineFilters 
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
            />
            
            {/* Advanced Kanban Board */}
            <div className="p-6">
              <DndContext onDragEnd={handleDragEnd}>
                <AdvancedKanbanBoard 
                  leads={filteredLeads} 
                  onDealClick={handleDealClick}
                />
              </DndContext>
            </div>
          </div>
          
          {/* Pipeline Reports Side Panel */}
          {showReports && (
            <PipelineReports 
              leads={filteredLeads}
              onClose={() => setShowReports(false)}
            />
          )}
        </div>
      </div>
      
      {/* Deal Details Modal */}
      {selectedDeal && (
        <DealDetailsModal
          deal={selectedDeal}
          isOpen={showDealModal}
          onClose={handleCloseDealModal}
          onUpdate={handleUpdateDeal}
        />
      )}
    </div>
  )
}
