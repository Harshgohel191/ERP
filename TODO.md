# Lead Management Enhancement Plan

## Requirements Analysis
- Add Lead functionality on dashboard page
- Filter pipeline to show only active leads (not CLOSED_WON or LOST)
- Show won leads data and final revenue in SaaS model
- Maintain current functionality while adding new features


## Implementation Plan


### 1. Create Add Lead Modal Component ✅ COMPLETED
- Create `AddLeadModal.tsx` component
- Form with fields: name, company, source, technical requirements, lead score, one-time fee, monthly subscription
- Integration with existing lead creation API
- Modal state management

### 2. Update Dashboard Header ✅ COMPLETED
- Make "Add Lead" button functional
- Add onClick handler to open AddLeadModal
- Update button styling and functionality

### 3. Filter Pipeline for Active Leads Only ✅ COMPLETED
- Modify `KanbanBoard.tsx` to filter out CLOSED_WON and LOST leads
- Add active leads filtering logic
- Maintain current drag-and-drop functionality

### 4. Create Revenue Analytics Section ✅ COMPLETED
- Create `RevenueAnalytics.tsx` component
- Show won leads data separately
- Display final revenue metrics for SaaS model
- Include MRR, ARR, total revenue from won deals

### 5. Update PipelineStats Component ✅ COMPLETED
- Separate active pipeline stats from revenue stats
- Show only in-progress leads in main pipeline stats
- Add won leads revenue section

### 6. Update Dashboard Layout ✅ COMPLETED
- Add RevenueAnalytics section to dashboard
- Maintain responsive design
- Ensure proper spacing and visual hierarchy

## Files to Modify
1. `components/AddLeadModal.tsx` (NEW)
2. `components/DashboardHeader.tsx` (MODIFY)
3. `components/KanbanBoard.tsx` (MODIFY)
4. `components/PipelineStats.tsx` (MODIFY)
5. `components/RevenueAnalytics.tsx` (NEW)
6. `app/dashboard/page.tsx` (MODIFY)

## Expected Outcome
- Functional Add Lead button with modal form
- Pipeline showing only active leads (INCOMING, QUALIFIED, TECH_AUDIT, PROPOSAL_SENT, NEGOTIATION)
- Separate revenue analytics section showing won deals and final revenue
- Maintained existing functionality for lead management
