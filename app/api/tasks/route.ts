import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Get all tasks or create new task
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')
    const dealId = searchParams.get('dealId')
    const status = searchParams.get('status')
    const assignedTo = searchParams.get('assignedTo')
    const priority = searchParams.get('priority')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}
    
    if (leadId) {
      where.leadId = leadId
    }
    
    if (dealId) {
      where.dealId = dealId
    }
    
    if (status && status !== 'all') {
      where.status = status
    }
    
    if (assignedTo && assignedTo !== 'all') {
      where.assignedTo = assignedTo
    }
    
    if (priority && priority !== 'all') {
      where.priority = priority
    }

    const skip = (page - 1) * limit


    const [tasks, total] = await Promise.all([
      prisma.pipelineTask.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.pipelineTask.count({ where })
    ])

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

// Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      leadId,
      dealId,
      title,
      description,
      assignedTo,
      priority = 'medium',
      status = 'pending',
      dueDate
    } = body

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
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


    const task = await prisma.pipelineTask.create({
      data: {
        leadId,
        dealId,
        title,
        description,
        assignedTo,
        priority,
        status,
        ...(dueDate && { dueDate: new Date(dueDate) })
      }
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
