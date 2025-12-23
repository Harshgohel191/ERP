import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Get all activities or create new activity
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')
    const dealId = searchParams.get('dealId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    
    if (leadId) {
      where.leadId = leadId
    }
    
    if (dealId) {
      where.dealId = dealId
    }

    const skip = (page - 1) * limit

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              company: true
            }
          },
          deal: {
            select: {
              id: true,
              value: true
            }
          }
        }
      }),
      prisma.activity.count({ where })
    ])

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

// Create a new activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      leadId,
      dealId,
      type,
      notes
    } = body

    if (!leadId || !type || !notes) {
      return NextResponse.json(
        { error: 'Lead ID, type, and notes are required' },
        { status: 400 }
      )
    }

    // Verify lead exists if leadId provided
    if (leadId) {
      const lead = await prisma.lead.findUnique({
        where: { id: leadId }
      })
      
      if (!lead) {
        return NextResponse.json(
          { error: 'Lead not found' },
          { status: 404 }
        )
      }
    }

    // Verify deal exists if dealId provided
    if (dealId) {
      const deal = await prisma.deal.findUnique({
        where: { id: dealId }
      })
      
      if (!deal) {
        return NextResponse.json(
          { error: 'Deal not found' },
          { status: 404 }
        )
      }
    }

    const activity = await prisma.activity.create({
      data: {
        leadId,
        dealId,
        type,
        notes
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            company: true
          }
        },
        deal: {
          select: {
            id: true,
            value: true
          }
        }
      }
    })

    return NextResponse.json({ activity }, { status: 201 })
  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    )
  }
}
