'use client'

import { useState, useEffect } from 'react'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { Sidebar } from '@/components/Sidebar'
import { KanbanBoard } from '@/components/KanbanBoard'
import { LeadDetailsPanel } from '@/components/LeadDetailsPanel'
import { PipelineStats } from '@/components/PipelineStats'
import { AddLeadModal } from '@/components/AddLeadModal'
import { BulkImportLeads } from '@/components/BulkImportLeads'
import { Lead } from '@/types/lead'

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showAddLeadModal, setShowAddLeadModal] = useState(false)
  const [showBulkImportModal, setShowBulkImportModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load leads on component mount
  useEffect(() => {
    loadLeads()
  }, [])

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
        // Check for automation triggers
        await checkAutomationTriggers(leadId, newStage)
      }
    } catch (error) {
      console.error('Failed to update lead stage:', error)
      // Revert on error
      setLeads(prev => prev.map(l => 
        l.id === leadId ? { ...l, status: lead.status } : l
      ))
    }
  }

  const checkAutomationTriggers = async (leadId: string, newStage: string) => {
    if (newStage === 'TECH_AUDIT') {
      // Create automatic task for dev team
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          title: 'Create System Architecture Roadmap',
          description: 'Auto-generated task: Create comprehensive system architecture roadmap for technical audit',
          assignedTo: 'Development Team',
          priority: 'high'
        })
      })
    }

    if (newStage === 'CLOSED_WON') {
      // Trigger conversion engine
      await fetch('/api/leads/' + leadId + '/convert', {
        method: 'POST'
      })
    }
  }

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead)
  }

  const handleClosePanel = () => {
    setSelectedLead(null)
  }

  const handleUpdateLead = (updatedLead: Lead) => {
    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l))
    setSelectedLead(updatedLead)
  }

  const handleAddLead = () => {
    setShowAddLeadModal(true)
  }

  const handleBulkImport = () => {
    setShowBulkImportModal(true)
  }

  const handleLeadCreated = (newLead: Lead) => {
    setLeads(prev => [newLead, ...prev])
    setShowAddLeadModal(false)
  }

  const handleBulkImportComplete = (importedLeads: Lead[]) => {
    setLeads(prev => [...importedLeads, ...prev])
    setShowBulkImportModal(false)
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
        {/* Leads Header with Add Lead and Bulk Import buttons */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Leads Management</h1>
              <p className="text-sm text-gray-600">Manage and track your sales leads</p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleBulkImport}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <span>Bulk Import</span>
              </button>
              <button 
                onClick={handleAddLead}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <span>Add New Lead</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex">
          <div className="flex-1">
            <PipelineStats leads={leads} />
            
            <div className="p-6">
              <DndContext onDragEnd={handleDragEnd}>
                <KanbanBoard 
                  leads={leads} 
                  onLeadClick={handleLeadClick}
                />
              </DndContext>
            </div>
          </div>
          
          {selectedLead && (
            <LeadDetailsPanel
              lead={selectedLead}
              onClose={handleClosePanel}
              onUpdate={handleUpdateLead}
            />
          )}
        </div>
      </div>
      
      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={showAddLeadModal}
        onClose={() => setShowAddLeadModal(false)}
        onSave={handleLeadCreated}
      />

      {/* Bulk Import Modal */}
      <BulkImportLeads
        isOpen={showBulkImportModal}
        onClose={() => setShowBulkImportModal(false)}
        onImportComplete={handleBulkImportComplete}
      />
    </div>
  )
}
