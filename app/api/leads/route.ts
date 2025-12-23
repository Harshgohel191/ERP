import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Get all leads with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const source = searchParams.get('source')
    const search = searchParams.get('search')

    const where: any = {}
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (source && source !== 'all') {
      where.source = source
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { source: { contains: search, mode: 'insensitive' } }
      ]
    }

    const skip = (page - 1) * limit

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          deals: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      }),
      prisma.lead.count({ where })
    ])

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

// Create a new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      name,
      company,
      source,
      technicalRequirements,
      leadScore = 0,
      oneTimeFee,
      monthlySubscriptionFee
    } = body

    // Calculate LTV
    const estimatedLtv = oneTimeFee && monthlySubscriptionFee 
      ? oneTimeFee + (monthlySubscriptionFee * 12)
      : null

    const lead = await prisma.lead.create({
      data: {
        name,
        company,
        source,
        technicalRequirements,
        leadScore,
        oneTimeFee,
        monthlySubscriptionFee,
        estimatedLtv,
        status: 'INCOMING'
      },
      include: {
        activities: true,
        deals: true
      }
    })

    return NextResponse.json({ lead }, { status: 201 })
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    )
  }
}
