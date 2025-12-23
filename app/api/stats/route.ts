import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // Get all leads for calculations
    const leads = await prisma.lead.findMany({
      include: {
        activities: true,
        deals: true
      }
    })

    // Get all deals
    const deals = await prisma.deal.findMany()

    // Get all revenue entries
    const revenueEntries = await prisma.revenue.findMany()

    // Get all tasks
    const tasks = await prisma.pipelineTask.findMany()

    // Calculate statistics
    const totalLeads = leads.length

    const qualifiedLeads = leads.filter((lead: any) => 
      ['QUALIFIED', 'TECH_AUDIT', 'PROPOSAL_SENT', 'NEGOTIATION', 'CLOSED_WON'].includes(lead.status)
    ).length
    const convertedLeads = leads.filter((lead: any) => lead.status === 'CLOSED_WON').length

    // Pipeline stage probabilities
    const stageProbabilities: Record<string, number> = {
      INCOMING: 0.10,
      QUALIFIED: 0.20,
      TECH_AUDIT: 0.50,
      PROPOSAL_SENT: 0.70,
      NEGOTIATION: 0.80,
      CLOSED_WON: 1.00,
      LOST: 0.00
    }

    // Calculate total pipeline value (weighted)
    let totalPipelineValue = 0
    let projectedMRR = 0
    let weightedForecast = 0


    leads.forEach((lead: any) => {
      if (lead.estimatedLtv) {
        const probability = stageProbabilities[lead.status] || 0
        weightedForecast += lead.estimatedLtv * probability
        totalPipelineValue += lead.estimatedLtv
      }
      
      if (lead.monthlySubscriptionFee) {
        projectedMRR += lead.monthlySubscriptionFee
      }
    })

    // Deals by stage
    const dealsByStage = leads.reduce((acc: Record<string, number>, lead: any) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Leads by source
    const leadsBySource = leads.reduce((acc: Record<string, number>, lead: any) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate averages
    const averageDealSize = deals.length > 0 
      ? deals.reduce((sum: number, deal: any) => sum + deal.value, 0) / deals.length 
      : 0
    
    const averageLeadScore = leads.length > 0 
      ? leads.reduce((sum: number, lead: any) => sum + lead.leadScore, 0) / leads.length 
      : 0

    // Calculate conversion rate
    const leadConversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0

    // Get recent revenue
    const monthlyRevenue = revenueEntries
      .filter((entry: any) => entry.type === 'subscription')
      .reduce((sum: number, entry: any) => sum + entry.amount, 0)
    
    const oneTimeRevenue = revenueEntries
      .filter((entry: any) => entry.type === 'one_time')
      .reduce((sum: number, entry: any) => sum + entry.amount, 0)
    
    const totalExpenses = tasks.length * 100 // Placeholder calculation

    return NextResponse.json({
      totalPipelineValue,
      projectedMRR,
      weightedForecast,
      leadConversionRate,
      dealsByStage,
      leadsBySource,
      averageDealSize,
      averageLeadScore,
      monthlyRevenue,
      oneTimeRevenue,
      totalExpenses,
      netProfit: monthlyRevenue + oneTimeRevenue - totalExpenses,
      summary: {
        totalLeads,
        qualifiedLeads,
        convertedLeads,
        totalDeals: deals.length,
        totalTasks: tasks.length,
        totalRevenueEntries: revenueEntries.length
      }
    })
  } catch (error) {
    console.error('Error fetching pipeline stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pipeline statistics' },
      { status: 500 }
    )
  }
}
