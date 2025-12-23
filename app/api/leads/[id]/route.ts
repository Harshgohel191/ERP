import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Get, update, or delete a specific lead
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' }
        },
        deals: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ lead })
  } catch (error) {
    console.error('Error fetching lead:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lead' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      name,
      company,
      source,
      technicalRequirements,
      leadScore,
      oneTimeFee,
      monthlySubscriptionFee,
      status
    } = body

    // Calculate LTV if financials are provided
    let estimatedLtv = null
    if (oneTimeFee !== undefined || monthlySubscriptionFee !== undefined) {
      const currentLead = await prisma.lead.findUnique({
        where: { id: params.id }
      })
      
      const newOneTime = oneTimeFee ?? currentLead?.oneTimeFee ?? 0
      const newMonthly = monthlySubscriptionFee ?? currentLead?.monthlySubscriptionFee ?? 0
      
      estimatedLtv = newOneTime + (newMonthly * 12)
    }

    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(company !== undefined && { company }),
        ...(source !== undefined && { source }),
        ...(technicalRequirements !== undefined && { technicalRequirements }),
        ...(leadScore !== undefined && { leadScore }),
        ...(oneTimeFee !== undefined && { oneTimeFee }),
        ...(monthlySubscriptionFee !== undefined && { monthlySubscriptionFee }),
        ...(estimatedLtv !== null && { estimatedLtv }),
        ...(status !== undefined && { status }),
        updatedAt: new Date()
      },
      include: {
        activities: true,
        deals: true
      }
    })

    return NextResponse.json({ lead })
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.lead.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting lead:', error)
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    )
  }
}
