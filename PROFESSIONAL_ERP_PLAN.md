# Professional Lead Management & Revenue Pipeline ERP Plan

## Current System Analysis
- ✅ Node.js/Express backend with comprehensive SaaS API
- ✅ Basic SaaS interface (saas.html/saas.js)
- ✅ Existing database structure with leads, deals, revenue tracking
- ❌ Missing: Modern React frontend with Next.js
- ❌ Missing: Prisma/Lucia ORM setup
- ❌ Missing: Tailwind CSS implementation
- ❌ Missing: Drag-and-drop Kanban board
- ❌ Missing: Weighted revenue logic
- ❌ Missing: Tech-service automation triggers
- ❌ Missing: Smart follow-up system
- ❌ Missing: Lead detail slide-over panel

## Implementation Plan

### Phase 1: Modern Tech Stack Setup
1. **Next.js Project Structure**
   - Create Next.js 14+ app with App Router
   - Configure TypeScript
   - Setup Tailwind CSS
   - Install Prisma ORM and SQLite database

2. **Database Schema Design**
   ```prisma
   model Lead {
     id        String   @id @default(cuid())
     name      String
     company   String?
     source    String   // Social Media, Referral, etc.
     technicalRequirements String?
     leadScore Int      // 0-100
     status    PipelineStage
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
     
     // Financials
     oneTimeFee             Float?
     monthlySubscriptionFee Float?
     estimatedLtv           Float? // Calculated as one_time + 12*monthly
     
     // Relationships
     activities Activity[]
   }

   model Deal {
     id       String        @id @default(cuid())
     leadId   String
     lead     Lead          @relation(fields: [leadId], references: [id])
     value    Float
     stage    PipelineStage
     probability Int        // Calculated based on stage
     createdAt DateTime     @default(now())
   }

   enum PipelineStage {
     INCOMING
     QUALIFIED
     TECH_AUDIT
     PROPOSAL_SENT
     NEGOTIATION
     CLOSED_WON
     LOST
   }

   model Activity {
     id        String   @id @default(cuid())
     leadId    String
     lead      Lead     @relation(fields: [leadId], references: [id])
     type      String   // Call, Email, Meeting, etc.
     notes     String
     createdAt DateTime @default(now())
   }
   ```

### Phase 2: Core UI Components
1. **Dashboard Layout**
   - Modern sidebar navigation
   - Responsive grid layout
   - Clean, minimalist design

2. **Kanban Board Implementation**
   - Drag-and-drop functionality using @dnd-kit
   - Pipeline stages visualization
   - Real-time updates

3. **Lead Management Interface**
   - Lead list with filtering/sorting
   - Lead detail slide-over panel
   - Activity log display

### Phase 3: Business Logic Implementation
1. **Weighted Revenue Calculation**
   ```javascript
   const getWeightedForecast = (deal) => {
     const ltv = deal.lead.estimatedLtv || 0;
     const probabilityMap = {
       'PROPOSAL_SENT': 0.7,
       'QUALIFIED': 0.2,
       'NEGOTIATION': 0.8,
       'TECH_AUDIT': 0.5
     };
     return ltv * (probabilityMap[deal.stage] || 0);
   };
   ```

2. **Tech-Service Automation**
   - Auto task generation on TECH_AUDIT stage
   - Dev team notifications

3. **Smart Follow-up System**
   - Auto-highlight stale proposals (>3 days)
   - Red indicator and "Needs Follow-up" labels

4. **Conversion Engine**
   - Separate one-time vs recurring revenue tracking
   - Automatic subscription setup on CLOSED_WON

### Phase 4: Advanced Features
1. **Reporting Dashboard**
   - Total Pipeline Value
   - Projected MRR (Monthly Recurring Revenue)
   - Lead Conversion Rate %
   - Revenue forecasting

2. **Mobile Responsiveness**
   - Touch-friendly Kanban board
   - Responsive tables and forms
   - Mobile-optimized navigation

## Technical Implementation Steps

### Step 1: Setup Next.js Project
```bash
npx create-next-app@latest lead-erp --typescript --tailwind --app
cd lead-erp
npm install @prisma/client @dnd-kit/core @dnd-kit/sortable
npm install -D prisma
```

### Step 2: Database Migration
- Create Prisma schema
- Generate migrations
- Seed initial data

### Step 3: API Routes
- `/api/leads` - CRUD operations
- `/api/deals` - Deal management
- `/api/pipeline` - Pipeline stage updates
- `/api/reports` - Analytics and reporting

### Step 4: Frontend Components
- Kanban board with drag-drop
- Lead detail modal
- Dashboard widgets
- Reporting charts

### Step 5: Business Logic
- Revenue calculations
- Automation triggers
- Follow-up logic

## Success Criteria
- ✅ Modern, responsive interface
- ✅ Drag-and-drop Kanban pipeline
- ✅ Weighted revenue forecasting
- ✅ Tech-service automation
- ✅ Smart follow-up system
- ✅ Comprehensive reporting
- ✅ Mobile-optimized design

## Timeline Estimate
- Phase 1: 2-3 hours (Setup & Database)
- Phase 2: 3-4 hours (Core UI)
- Phase 3: 4-5 hours (Business Logic)
- Phase 4: 2-3 hours (Advanced Features)
- **Total: 11-15 hours**
