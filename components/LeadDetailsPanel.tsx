'use client'

import { useState } from 'react'
import { Lead } from '@/types/lead'
import { 
  X, 
  Building2, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign,
  Edit3,
  Plus,
  Activity,
  Clock,
  TrendingUp,
  FileText
} from 'lucide-react'

interface LeadDetailsPanelProps {
  lead: Lead
  onClose: () => void
  onUpdate: (lead: Lead) => void
}

export function LeadDetailsPanel({ lead, onClose, onUpdate }: LeadDetailsPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: lead.name,
    company: lead.company || '',
    source: lead.source,
    technicalRequirements: lead.technicalRequirements || '',
    leadScore: lead.leadScore,
    oneTimeFee: lead.oneTimeFee || 0,
    monthlySubscriptionFee: lead.monthlySubscriptionFee || 0,
  })

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          estimatedLtv: editForm.oneTimeFee + (editForm.monthlySubscriptionFee * 12)
        })
      })

      if (response.ok) {
        const updatedLead = await response.json()
        onUpdate(updatedLead)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Failed to update lead:', error)
    }
  }

  const handleCancel = () => {
    setEditForm({
      name: lead.name,
      company: lead.company || '',
      source: lead.source,
      technicalRequirements: lead.technicalRequirements || '',
      leadScore: lead.leadScore,
      oneTimeFee: lead.oneTimeFee || 0,
      monthlySubscriptionFee: lead.monthlySubscriptionFee || 0,
    })
    setIsEditing(false)
  }

  const addActivity = async (type: string, notes: string) => {
    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          type,
          notes
        })
      })

      if (response.ok) {
        // Refresh lead data
        const updatedResponse = await fetch(`/api/leads/${lead.id}`)
        const updatedLead = await updatedResponse.json()
        onUpdate(updatedLead)
      }
    } catch (error) {
      console.error('Failed to add activity:', error)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 50) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div className="w-96 bg-white shadow-lg border-l border-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Lead Details</h2>
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h3>
          
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  value={editForm.company}
                  onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <select
                  value={editForm.source}
                  onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Website">Website</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Referral">Referral</option>
                  <option value="Cold Call">Cold Call</option>
                  <option value="Email">Email</option>
                  <option value="Trade Show">Trade Show</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lead Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editForm.leadScore}
                  onChange={(e) => setEditForm({ ...editForm, leadScore: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Technical Requirements</label>
                <textarea
                  value={editForm.technicalRequirements}
                  onChange={(e) => setEditForm({ ...editForm, technicalRequirements: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="text-lg font-medium text-gray-900">{lead.name}</span>
              </div>
              
              {lead.company && (
                <div className="flex items-center text-gray-600">
                  <Building2 className="w-4 h-4 mr-2" />
                  <span>{lead.company}</span>
                </div>
              )}
              
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Source: {lead.source}</span>
              </div>
              
              <div className="flex items-center">
                <span className={`text-sm px-3 py-1 rounded-full ${getScoreColor(lead.leadScore)}`}>
                  Score: {lead.leadScore}/100
                </span>
              </div>
              
              {lead.technicalRequirements && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Technical Requirements</h4>
                  <p className="text-sm text-gray-600">{lead.technicalRequirements}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Financial Information */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Financial Information</h3>
          
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">One-time Fee ($)</label>
                <input
                  type="number"
                  value={editForm.oneTimeFee}
                  onChange={(e) => setEditForm({ ...editForm, oneTimeFee: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Subscription ($)</label>
                <input
                  type="number"
                  value={editForm.monthlySubscriptionFee}
                  onChange={(e) => setEditForm({ ...editForm, monthlySubscriptionFee: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="bg-blue-50 p-3 rounded-md">
                <div className="text-sm text-blue-800">
                  <strong>Estimated LTV:</strong> ${(editForm.oneTimeFee + (editForm.monthlySubscriptionFee * 12)).toLocaleString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {lead.oneTimeFee && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">One-time Fee:</span>
                  <span className="font-medium">${lead.oneTimeFee.toLocaleString()}</span>
                </div>
              )}
              
              {lead.monthlySubscriptionFee && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Monthly Subscription:</span>
                  <span className="font-medium">${lead.monthlySubscriptionFee.toLocaleString()}</span>
                </div>
              )}
              
              {lead.estimatedLtv && (
                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-md">
                  <span className="text-blue-800 font-medium">Estimated LTV:</span>
                  <span className="text-blue-900 font-bold">${lead.estimatedLtv.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Activity Log</h3>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {lead.activities && lead.activities.length > 0 ? (
              lead.activities.map((activity) => (
                <div key={activity.id} className="border-l-2 border-blue-200 pl-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{activity.type}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{activity.notes}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No activities recorded yet.</p>
            )}
          </div>
          
          <button className="mt-3 flex items-center text-blue-600 hover:text-blue-800 text-sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Activity
          </button>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
          
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => addActivity('Call', 'Follow-up call')}
              className="flex items-center justify-center px-3 py-2 text-sm bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors"
            >
              <Phone className="w-4 h-4 mr-1" />
              Call
            </button>
            
            <button 
              onClick={() => addActivity('Email', 'Follow-up email')}
              className="flex items-center justify-center px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
            >
              <Mail className="w-4 h-4 mr-1" />
              Email
            </button>
            
            <button 
              onClick={() => addActivity('Meeting', 'Schedule meeting')}
              className="flex items-center justify-center px-3 py-2 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md transition-colors"
            >
              <Calendar className="w-4 h-4 mr-1" />
              Meeting
            </button>
            
            <button 
              onClick={() => addActivity('Note', 'Add note')}
              className="flex items-center justify-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              <FileText className="w-4 h-4 mr-1" />
              Note
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
