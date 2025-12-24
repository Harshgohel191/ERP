'use client'

import { useState } from 'react'
import { X, Edit, Calendar, DollarSign, Users, TrendingUp, MessageSquare, Star, Phone, Mail } from 'lucide-react'
import { Lead } from '@/types/lead'

interface DealDetailsModalProps {
  deal: Lead
  isOpen: boolean
  onClose: () => void
  onUpdate: (updatedDeal: Lead) => void
}

export function DealDetailsModal({ deal, isOpen, onClose, onUpdate }: DealDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedDeal, setEditedDeal] = useState<Lead>(deal)

  if (!isOpen) return null

  const handleSave = () => {
    onUpdate(editedDeal)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedDeal(deal)
    setIsEditing(false)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getDaysInStage = () => {
    const created = new Date(deal.createdAt)
    const updated = new Date(deal.updatedAt)
    const diffTime = Math.abs(updated.getTime() - created.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Deal Details
            </h2>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(deal.leadScore)}`}>
              Score: {deal.leadScore}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Deal Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Company & Contact Info */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Deal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedDeal.company || ''}
                        onChange={(e) => setEditedDeal({...editedDeal, company: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{deal.company || 'N/A'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedDeal.name || ''}
                        onChange={(e) => setEditedDeal({...editedDeal, name: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{deal.name || 'N/A'}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source
                    </label>
                    {isEditing ? (
                      <select
                        value={editedDeal.source}
                        onChange={(e) => setEditedDeal({...editedDeal, source: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Website">Website</option>
                        <option value="Referral">Referral</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Cold Call">Cold Call</option>
                        <option value="Email">Email</option>
                        <option value="Social Media">Social Media</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">{deal.source}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    {isEditing ? (
                      <select
                        value={editedDeal.status}
                        onChange={(e) => setEditedDeal({...editedDeal, status: e.target.value as any})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="INCOMING">New Lead</option>
                        <option value="QUALIFIED">Qualified</option>
                        <option value="TECH_AUDIT">Discovery</option>
                        <option value="PROPOSAL_SENT">Proposal</option>
                        <option value="NEGOTIATION">Negotiation</option>
                        <option value="CLOSED_WON">Won</option>
                        <option value="LOST">Lost</option>
                      </select>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {deal.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated LTV
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedDeal.estimatedLtv || 0}
                        onChange={(e) => setEditedDeal({...editedDeal, estimatedLtv: parseFloat(e.target.value) || 0})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(deal.estimatedLtv || 0)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      One-time Fee
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedDeal.oneTimeFee || 0}
                        onChange={(e) => setEditedDeal({...editedDeal, oneTimeFee: parseFloat(e.target.value) || 0})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-lg text-gray-900">
                        {formatCurrency(deal.oneTimeFee || 0)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monthly Fee
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedDeal.monthlySubscriptionFee || 0}
                        onChange={(e) => setEditedDeal({...editedDeal, monthlySubscriptionFee: parseFloat(e.target.value) || 0})}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-lg text-gray-900">
                        {formatCurrency(deal.monthlySubscriptionFee || 0)}/mo
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Technical Requirements */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Requirements</h3>
                {isEditing ? (
                  <textarea
                    value={editedDeal.technicalRequirements || ''}
                    onChange={(e) => setEditedDeal({...editedDeal, technicalRequirements: e.target.value})}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter technical requirements..."
                  />
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {deal.technicalRequirements || 'No technical requirements specified'}
                  </p>
                )}
              </div>

              {/* Activities */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
                <div className="space-y-3">
                  {deal.activities.length > 0 ? (
                    deal.activities.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-white rounded-lg border">
                        <MessageSquare className="w-4 h-4 text-gray-400 mt-1" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{activity.type}</div>
                          <div className="text-sm text-gray-600">{activity.notes}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No activities recorded</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Days in Stage</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{getDaysInStage()} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Activities</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{deal.activities.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Deals</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{deal.deals.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Lead Score</span>
                    </div>
                    <span className={`text-sm font-semibold ${getScoreColor(deal.leadScore).split(' ')[0]}`}>
                      {deal.leadScore}/100
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Actions */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center space-x-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Phone className="w-4 h-4" />
                    <span>Call Contact</span>
                  </button>
                  <button className="w-full flex items-center space-x-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <Mail className="w-4 h-4" />
                    <span>Send Email</span>
                  </button>
                  <button className="w-full flex items-center space-x-2 p-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <Calendar className="w-4 h-4" />
                    <span>Schedule Meeting</span>
                  </button>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Deal Age</span>
                    <span className={`text-sm font-semibold ${getDaysInStage() > 30 ? 'text-red-600' : 'text-green-600'}`}>
                      {getDaysInStage() > 30 ? 'High Risk' : 'Normal'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Lead Score</span>
                    <span className={`text-sm font-semibold ${deal.leadScore >= 70 ? 'text-green-600' : deal.leadScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {deal.leadScore >= 70 ? 'Good' : deal.leadScore >= 50 ? 'Fair' : 'Poor'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Deal Size</span>
                    <span className="text-sm font-semibold text-blue-600">
                      {(deal.estimatedLtv || 0) > 50000 ? 'Large' : 'Standard'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
