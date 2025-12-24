'use client'

import { useState } from 'react'
import { X, Upload, FileText } from 'lucide-react'
import { Lead } from '@/types/lead'

interface BulkImportLeadsProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: (leads: Lead[]) => void
}

export function BulkImportLeads({ isOpen, onClose, onImportComplete }: BulkImportLeadsProps) {
  const [csvData, setCsvData] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [previewLeads, setPreviewLeads] = useState<Lead[]>([])
  const [showPreview, setShowPreview] = useState(false)


  const sampleCsvData = `Company Name,Contact Name,Source,Lead Score,Status,Estimated Value
Tech Solutions Inc,John Smith,Website,75,QUALIFIED,25000
Digital Agency,Sarah Johnson,Referral,60,INCOMING,15000
Startup Co,Mike Wilson,LinkedIn,85,QUALIFIED,35000`

  const parseCsvData = (csvText: string): Lead[] => {
    const lines = csvText.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const leads: Lead[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      
      if (values.length >= headers.length) {

        const lead: any = {
          id: Date.now().toString() + i,
          name: '',
          company: '',
          source: 'Bulk Import',
          technicalRequirements: '',
          leadScore: 50,
          status: 'INCOMING' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          oneTimeFee: 0,
          monthlySubscriptionFee: 0,
          estimatedLtv: 0,
          activities: [],
          deals: []
        }


        headers.forEach((header, index) => {
          const value = values[index] || ''
          switch (header) {
            case 'company name':
            case 'company':
              lead.company = value
              break
            case 'contact name':
            case 'name':
              lead.name = value
              break
            case 'email':
              lead.technicalRequirements = lead.technicalRequirements ? 
                `${lead.technicalRequirements}\nEmail: ${value}` : `Email: ${value}`
              break
            case 'phone':
              lead.technicalRequirements = lead.technicalRequirements ? 
                `${lead.technicalRequirements}\nPhone: ${value}` : `Phone: ${value}`
              break
            case 'source':
              lead.source = value
              break
            case 'status':
              lead.status = value.toUpperCase() as any
              break
            case 'estimated value':
            case 'value':
              lead.estimatedLtv = parseFloat(value) || 0
              break
            case 'lead score':
            case 'score':
              lead.leadScore = parseInt(value) || 50
              break
          }
        })

        leads.push(lead)
      }
    }

    return leads
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setCsvData(text)
    }
    reader.readAsText(file)
  }

  const handlePreview = () => {
    if (!csvData.trim()) return
    
    const parsedLeads = parseCsvData(csvData)
    setPreviewLeads(parsedLeads)
    setShowPreview(true)
  }

  const handleImport = async () => {
    setIsProcessing(true)
    
    try {
      // In a real app, you would send this to your API
      // For now, we'll just simulate the import
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onImportComplete(previewLeads)
    } catch (error) {
      console.error('Failed to import leads:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const loadSampleData = () => {
    setCsvData(sampleCsvData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Bulk Import Leads</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!showPreview ? (
            <div className="space-y-6">

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">CSV Format</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Your CSV file should include these columns (headers can be in any order):
                </p>
                <div className="text-sm text-blue-700 font-mono bg-blue-100 p-2 rounded">
                  Company Name, Contact Name, Source, Lead Score, Status, Estimated Value
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload CSV File
                  </label>
                  <div className="flex items-center space-x-3">
                    <label className="cursor-pointer bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 flex items-center space-x-2">
                      <Upload className="w-4 h-4" />
                      <span>Choose File</span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      onClick={loadSampleData}
                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Load Sample Data</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or paste CSV data directly
                  </label>
                  <textarea
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    placeholder="Company Name,Contact Name,Email,Phone,Source,Status,Estimated Value"
                    rows={8}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePreview}
                  disabled={!csvData.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Preview Import
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Preview ({previewLeads.length} leads to import)
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit Data
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">


                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700">
                    <div>Company Name</div>
                    <div>Contact Name</div>
                    <div>Source</div>
                    <div>Lead Score</div>
                    <div>Status</div>
                    <div>Estimated LTV</div>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {previewLeads.map((lead, index) => (
                    <div key={index} className="px-4 py-3 border-b border-gray-100 last:border-b-0">
                      <div className="grid grid-cols-6 gap-4 text-sm text-gray-900">
                        <div>{lead.company || 'N/A'}</div>
                        <div>{lead.name || 'N/A'}</div>
                        <div>{lead.source}</div>
                        <div>{lead.leadScore}</div>
                        <div>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {lead.status}
                          </span>
                        </div>
                        <div>${lead.estimatedLtv || 0}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Importing...' : `Import ${previewLeads.length} Leads`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
