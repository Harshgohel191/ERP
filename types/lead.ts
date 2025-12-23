export interface Lead {
  id: string
  name: string
  company?: string
  source: string // Social Media, Referral, Website, etc.
  technicalRequirements?: string
  leadScore: number // 0-100
  status: PipelineStage
  createdAt: Date
  updatedAt: Date
  oneTimeFee?: number
  monthlySubscriptionFee?: number
  estimatedLtv?: number
  activities: Activity[]
  deals: Deal[]
}

export interface Deal {
  id: string
  leadId: string
  value: number
  stage: PipelineStage
  probability: number
  expectedCloseDate?: Date
  createdAt: Date
  updatedAt: Date
  activities: Activity[]
}

export interface Activity {
  id: string
  leadId: string
  dealId?: string
  type: string // Call, Email, Meeting, Task, etc.
  notes: string
  createdAt: Date
}

export interface PipelineTask {
  id: string
  leadId?: string
  dealId?: string
  title: string
  description: string
  assignedTo?: string
  status: string // pending, in_progress, completed
  priority: string // low, medium, high
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Revenue {
  id: string
  type: string // one_time, subscription, recurring
  amount: number
  clientName?: string
  service?: string
  description?: string
  date: Date
  status: string // pending, confirmed, failed
  createdAt: Date
}

export type PipelineStage = 
  | 'INCOMING'
  | 'QUALIFIED'
  | 'TECH_AUDIT'
  | 'PROPOSAL_SENT'
  | 'NEGOTIATION'
  | 'CLOSED_WON'
  | 'LOST'

export interface PipelineStats {
  totalPipelineValue: number
  projectedMRR: number
  leadConversionRate: number
  weightedForecast: number
  dealsByStage: Record<PipelineStage, number>
  leadsBySource: Record<string, number>
  averageDealSize: number
  averageLeadScore: number
}
