'use client'


import { useState, useEffect } from 'react'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { Sidebar } from '@/components/Sidebar'
import { KanbanBoard } from '@/components/KanbanBoard'
import { DashboardHeader } from '@/components/DashboardHeader'
import { LeadDetailsPanel } from '@/components/LeadDetailsPanel'
import { ReportsPanel } from '@/components/ReportsPanel'
import { PipelineStats } from '@/components/PipelineStats'
import { RevenueAnalytics } from '@/components/RevenueAnalytics'


import { Lead } from '@/types/lead'


export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showReports, setShowReports] = useState(false)


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


        <DashboardHeader 
          onShowReports={() => setShowReports(!showReports)}
          showReports={showReports}
        />
        
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
          

          {showReports && (
            <ReportsPanel 
              leads={leads}
              onClose={() => setShowReports(false)}
            />
          )}
        </div>
        
        {/* Revenue Analytics Section */}
        <RevenueAnalytics leads={leads} />
      </div>
      


    </div>
  )
}
