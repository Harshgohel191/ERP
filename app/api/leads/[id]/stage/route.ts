import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Pipeline stage probabilities
const STAGE_PROBABILITIES: Record<string, number> = {
  INCOMING: 0.10,
  QUALIFIED: 0.20,
  TECH_AUDIT: 0.50,
  PROPOSAL_SENT: 0.70,
  NEGOTIATION: 0.80,
  CLOSED_WON: 1.00,
  LOST: 0.00
}

// Update lead stage with automation triggers
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { newStage } = body

    if (!newStage || !STAGE_PROBABILITIES.hasOwnProperty(newStage)) {
      return NextResponse.json(
        { error: 'Invalid pipeline stage' },
        { status: 400 }
      )
    }

    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        deals: true
      }
    })

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    const oldStage = lead.status
    const probability = STAGE_PROBABILITIES[newStage]

    // Update the lead stage
    const updatedLead = await prisma.lead.update({
      where: { id: params.id },
      data: {
        status: newStage,
        updatedAt: new Date()
      },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' }
        },
        deals: true
      }
    })

    // Create activity log for stage change
    await prisma.activity.create({
      data: {
        leadId: params.id,
        type: 'stage_change',
        notes: `Stage changed from ${oldStage} to ${newStage}`
      }
    })

    // Automation triggers
    const automationResults: any = {}

    // TECH_AUDIT trigger: Create automatic task
    if (newStage === 'TECH_AUDIT') {
      await prisma.pipelineTask.create({
        data: {
          leadId: params.id,
          title: 'Create System Architecture Roadmap',
          description: 'Automatically generated task for TECH_AUDIT stage - Create detailed system architecture and technology roadmap for the client.',
          assignedTo: 'Development Team',
          priority: 'high',
          status: 'pending'
        }
      })
      automationResults.techAuditTask = 'created'
    }

    // CLOSED_WON trigger: Revenue separation
    if (newStage === 'CLOSED_WON') {
      const leadData = await prisma.lead.findUnique({
        where: { id: params.id }
      })

      if (leadData?.oneTimeFee || leadData?.monthlySubscriptionFee) {
        // Create immediate revenue entry for one-time fee
        if (leadData.oneTimeFee) {
          await prisma.revenue.create({
            data: {
              type: 'one_time',
              amount: leadData.oneTimeFee,
              clientName: leadData.name,
              service: 'Setup Fee',
              description: `One-time setup fee for ${leadData.company || leadData.name}`,
              status: 'confirmed'
            }
          })
        }

        // Create recurring revenue tracking for subscription
        if (leadData.monthlySubscriptionFee) {
          await prisma.revenue.create({
            data: {
              type: 'subscription',
              amount: leadData.monthlySubscriptionFee,
              clientName: leadData.name,
              service: 'Monthly Subscription',
              description: `Monthly subscription for ${leadData.company || leadData.name}`,
              status: 'confirmed'
            }
          })
        }

        automationResults.revenueEntries = 'created'
      }
    }

    // Calculate weighted forecast
    const weightedForecast = lead.estimatedLtv ? lead.estimatedLtv * probability : 0

    return NextResponse.json({
      lead: updatedLead,
      automation: automationResults,
      weightedForecast,
      probability
    })
  } catch (error) {
    console.error('Error updating lead stage:', error)
    return NextResponse.json(
      { error: 'Failed to update lead stage' },
      { status: 500 }
    )
  }
}
