# Complete Prompt for Cursor - Social Media Features Implementation

## Context

I have a multi-tenant spin wheel campaign platform. The database schema is ~80% complete, but business logic and UI need to be finished.

**Current Status:**
- ✅ Database models exist for subscriptions, social tasks, and adaptive verification
- ✅ Basic API endpoints created
- ⚠️ Subscription enforcement logic missing
- ⚠️ Social task user flow UI incomplete
- ❌ Adaptive verification logic not implemented
- ❌ WhatsApp notifications not triggering
- ❌ Landing page builder not started

**Reference Documents in `brain/` folder:**
- `CURRENT_STATUS.md` - What's implemented vs what's needed
- `SUBSCRIPTION_IMPLEMENTATION.md` - Subscription system details
- `SOCIAL_TASKS_FINAL.md` - Social task user experience
- `ADAPTIVE_VERIFICATION.md` - Scalable verification system
- `LANDING_PAGE_RECOMMENDATIONS.md` - Landing page features

---

## Implementation Priority

### Phase 1: Subscription Enforcement (Week 1)

**Goal:** Prevent users from exceeding campaign limits based on their subscription plan.

**Tasks:**

1. **Update Campaign Creation API** (`app/api/admin/campaigns/route.ts`)
   ```typescript
   // Add subscription limit checks
   async function POST(req: Request) {
     const { tenantId, ...campaignData } = await req.json();
     
     // Get tenant with subscription plan
     const tenant = await prisma.tenant.findUnique({
       where: { id: tenantId },
       include: { subscriptionPlan: true }
     });
     
     if (!tenant?.subscriptionPlan) {
       return Response.json({ error: "No subscription plan" }, { status: 400 });
     }
     
     // Check 1: Active campaign limit
     const activeCampaigns = await prisma.campaign.count({
       where: { 
         tenantId,
         isActive: true,
         isArchived: false
       }
     });
     
     if (activeCampaigns >= tenant.subscriptionPlan.campaignsPerMonth) {
       return Response.json({
         error: "Campaign limit reached",
         message: `Your ${tenant.subscriptionPlan.name} plan allows ${tenant.subscriptionPlan.campaignsPerMonth} active campaigns. Upgrade to create more.`,
         limit: tenant.subscriptionPlan.campaignsPerMonth,
         current: activeCampaigns,
         upgradeUrl: "/admin/billing/upgrade"
       }, { status: 403 });
     }
     
     // Check 2: Monthly creation limit
     const currentMonth = new Date().toISOString().slice(0, 7); // "2026-01"
     
     const usage = await prisma.tenantUsage.upsert({
       where: { 
         tenantId_month: { tenantId, month: currentMonth }
       },
       create: { tenantId, month: currentMonth, campaignsCreated: 0 },
       update: {}
     });
     
     if (usage.campaignsCreated >= tenant.subscriptionPlan.campaignsPerMonth) {
       return Response.json({
         error: "Monthly campaign limit reached",
         message: `You've created ${usage.campaignsCreated} campaigns this month. Your limit resets on the 1st of next month.`,
         resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
       }, { status: 403 });
     }
     
     // Create campaign
     const campaign = await prisma.campaign.create({
       data: { ...campaignData, tenantId }
     });
     
     // Increment usage
     await prisma.tenantUsage.update({
       where: { tenantId_month: { tenantId, month: currentMonth } },
       data: { campaignsCreated: { increment: 1 } }
     });
     
     return Response.json(campaign);
   }
   ```

2. **Update Campaign Archive API**
   ```typescript
   // app/api/admin/campaigns/[id]/archive/route.ts
   async function PATCH(req: Request, { params }) {
     const { id } = params;
     
     const campaign = await prisma.campaign.update({
       where: { id },
       data: {
         isActive: false,
         isArchived: true,
         archivedAt: new Date()
       }
     });
     
     return Response.json(campaign);
   }
   ```

3. **Build Admin Usage Dashboard Component**
   ```tsx
   // components/admin/UsageStats.tsx
   export function UsageStats({ tenantId }: { tenantId: string }) {
     const { data } = useSWR(`/api/admin/usage/${tenantId}`, fetcher);
     
     return (
       <div className="bg-slate-900 p-6 rounded-xl">
         <h3 className="font-bold mb-4">Campaign Usage</h3>
         
         <div className="space-y-4">
           <div>
             <div className="flex justify-between mb-2">
               <span>Active Campaigns</span>
               <span className="font-bold">
                 {data?.activeCampaigns}/{data?.plan.campaignsPerMonth}
               </span>
             </div>
             <div className="w-full bg-slate-700 h-2 rounded-full">
               <div 
                 className="bg-primary h-2 rounded-full"
                 style={{ 
                   width: `${(data?.activeCampaigns / data?.plan.campaignsPerMonth) * 100}%` 
                 }}
               />
             </div>
           </div>
           
           {data?.activeCampaigns >= data?.plan.campaignsPerMonth && (
             <div className="bg-orange-500/10 border border-orange-500 p-4 rounded-lg">
               <p className="text-orange-500 text-sm">
                 ⚠️ Campaign limit reached. 
                 <a href="/admin/billing/upgrade" className="underline ml-1">
                   Upgrade to {data?.nextPlan.name}
                 </a>
               </p>
             </div>
           )}
         </div>
       </div>
     );
   }
   ```

---

### Phase 2: Social Task User Flow (Week 2)

**Goal:** Complete the user experience for social task completion with modal instructions and pending states.

**Tasks:**

1. **Create Task Instruction Modal**
   ```tsx
   // components/social/TaskInstructionModal.tsx
   'use client';
   
   import { useState, useEffect } from 'react';
   
   export function TaskInstructionModal({ 
     task, 
     onClose, 
     onComplete 
   }: { 
     task: SocialMediaTask; 
     onClose: () => void;
     onComplete: () => void;
   }) {
     const [timer, setTimer] = useState(10);
     const [linkOpened, setLinkOpened] = useState(false);
     
     const handleOpenLink = () => {
       window.open(task.targetUrl, '_blank');
       setLinkOpened(true);
       
       // Start countdown
       const interval = setInterval(() => {
         setTimer(prev => {
           if (prev <= 1) {
             clearInterval(interval);
             return 0;
           }
           return prev - 1;
         });
       }, 1000);
     };
     
     const handleConfirm = async () => {
       await fetch('/api/social-tasks/complete', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           taskId: task.id,
           userId: user.id
         })
       });
       
       onComplete();
       onClose();
     };
     
     return (
       <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
         <div className="bg-slate-900 p-8 rounded-2xl max-w-md w-full">
           <h3 className="text-2xl font-bold mb-4">
             {task.platform === 'INSTAGRAM' ? '📷' : '👍'} {task.title}
           </h3>
           
           <div className="space-y-4 mb-6">
             <div className="flex items-start gap-3">
               <span className="text-primary font-bold">1.</span>
               <p>Click the button below to open our {task.platform} page</p>
             </div>
             <div className="flex items-start gap-3">
               <span className="text-primary font-bold">2.</span>
               <p>Complete the action ({task.actionType.toLowerCase()})</p>
             </div>
             <div className="flex items-start gap-3">
               <span className="text-primary font-bold">3.</span>
               <p>Return here and confirm completion</p>
             </div>
           </div>
           
           {!linkOpened ? (
             <button
               onClick={handleOpenLink}
               className="w-full px-6 py-3 bg-primary rounded-lg font-bold"
             >
               Open {task.platform}
             </button>
           ) : (
             <>
               {timer > 0 ? (
                 <div className="text-center text-sm text-gray-400">
                   Complete the task, then confirm in {timer}s
                 </div>
               ) : (
                 <button
                   onClick={handleConfirm}
                   className="w-full px-6 py-3 bg-green-600 rounded-lg font-bold"
                 >
                   ✓ I Completed This
                 </button>
               )}
             </>
           )}
           
           <button
             onClick={onClose}
             className="w-full mt-4 text-gray-400 text-sm"
           >
             Cancel
           </button>
         </div>
       </div>
     );
   }
   ```

2. **Update Social Task Completion API**
   ```typescript
   // app/api/social-tasks/complete/route.ts
   async function POST(req: Request) {
     const { taskId, userId } = await req.json();
     
     // Check if already completed
     const existing = await prisma.socialTaskCompletion.findUnique({
       where: { taskId_userId: { taskId, userId } }
     });
     
     if (existing) {
       return Response.json({ error: "Task already completed" }, { status: 400 });
     }
     
     // Check rate limit (5 tasks/day)
     const todayStart = new Date();
     todayStart.setHours(0, 0, 0, 0);
     
     const todayCount = await prisma.socialTaskCompletion.count({
       where: {
         userId,
         claimedAt: { gte: todayStart }
       }
     });
     
     if (todayCount >= 5) {
       return Response.json({ error: "Daily limit reached (5 tasks/day)" }, { status: 429 });
     }
     
     const task = await prisma.socialMediaTask.findUnique({
       where: { id: taskId }
     });
     
     // Create completion record (status: PENDING)
     const completion = await prisma.socialTaskCompletion.create({
       data: {
         taskId,
         userId,
         status: 'PENDING',
         spinsAwarded: task.spinsReward,
         cohortId: new Date().toISOString().slice(0, 13) // "2026-01-22T09"
       }
     });
     
     // Schedule verification (event-based, not cron)
     await scheduleVerification(completion.id);
     
     return Response.json({
       success: true,
       message: "Task submitted! We'll verify and notify you on WhatsApp shortly."
     });
   }
   
   async function scheduleVerification(completionId: string) {
     // Call adaptive verification logic after 5 minutes
     setTimeout(async () => {
       await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/social-tasks/verify`, {
         method: 'POST',
         body: JSON.stringify({ completionId })
       });
     }, 300000); // 5 minutes
   }
   ```

3. **Build Social Task Card Component**
   ```tsx
   // components/social/SocialTaskCard.tsx
   'use client';
   
   export function SocialTaskCard({ 
     task, 
     completion 
   }: { 
     task: SocialMediaTask; 
     completion?: SocialTaskCompletion;
   }) {
     const [showModal, setShowModal] = useState(false);
     const [showSuccess, setShowSuccess] = useState(false);
     
     if (completion?.status === 'VERIFIED') {
       return (
         <div className="task-card bg-green-500/10 border border-green-500">
           <span className="text-2xl">✓</span>
           <div>
             <h4 className="font-bold">{task.title}</h4>
             <p className="text-sm text-green-400">Verified</p>
             <p className="text-xs text-gray-400">+{task.spinsReward} spins awarded</p>
           </div>
         </div>
       );
     }
     
     if (completion?.status === 'PENDING') {
       return (
         <div className="task-card bg-yellow-500/10 border border-yellow-500">
           <span className="text-2xl animate-pulse">⏳</span>
           <div>
             <h4 className="font-bold">{task.title}</h4>
             <p className="text-sm text-yellow-400">Verification in progress</p>
             <p className="text-xs text-gray-400">
               You'll receive WhatsApp notification once verified
             </p>
           </div>
         </div>
       );
     }
     
     return (
       <>
         <div 
           className="task-card cursor-pointer hover:border-primary"
           onClick={() => setShowModal(true)}
         >
           <span className="text-2xl">
             {task.platform === 'INSTAGRAM' ? '📷' : '👍'}
           </span>
           <div className="flex-1">
             <h4 className="font-bold">{task.title}</h4>
             <p className="text-sm text-primary">+{task.spinsReward} spins</p>
           </div>
           <button className="px-4 py-2 bg-primary rounded-lg text-sm font-bold">
             Complete
           </button>
         </div>
         
         {showModal && (
           <TaskInstructionModal
             task={task}
             onClose={() => setShowModal(false)}
             onComplete={() => {
               setShowModal(false);
               setShowSuccess(true);
             }}
           />
         )}
         
         {showSuccess && (
           <SuccessMessage 
             onClose={() => setShowSuccess(false)}
           />
         )}
       </>
     );
   }
   ```

---

### Phase 3: WhatsApp Notifications (Week 2)

**Goal:** Send WhatsApp notifications when tasks are verified.

**Tasks:**

1. **Create WhatsApp Notification Service**
   ```typescript
   // lib/whatsapp-notifications.ts
   import { sendWhatsAppMessage } from '@/lib/whatsapp';
   
   export async function sendTaskVerifiedNotification(
     userId: string,
     taskId: string
   ) {
     const user = await prisma.endUser.findUnique({ where: { id: userId } });
     const task = await prisma.socialMediaTask.findUnique({ where: { id: taskId } });
     const campaign = await prisma.campaign.findUnique({ where: { id: task.campaignId } });
     
     // Check notification time window
     if (!shouldSendNow(campaign)) {
       await queueForLater(userId, taskId);
       return;
     }
     
     const message = `🎉 Congratulations ${user.name}!

Your task "${task.title}" has been verified! ✅

Reward: ${task.spinsReward} bonus spins added to your account

Spin now: ${process.env.NEXT_PUBLIC_APP_URL}/campaigns/${campaign.id}

Good luck! 🍀`;
     
     await sendWhatsAppMessage(user.phone, message);
     
     // Mark notification as sent
     await prisma.socialTaskCompletion.updateMany({
       where: { userId, taskId, status: 'VERIFIED' },
       data: { 
         notificationSent: true, 
         notificationSentAt: new Date() 
       }
     });
   }
   
   function shouldSendNow(campaign: Campaign): boolean {
     if (campaign.sendImmediately) return true;
     
     const now = new Date();
     const currentHour = now.getHours();
     
     return currentHour >= campaign.notificationStartHour && 
            currentHour < campaign.notificationEndHour;
   }
   ```

2. **Update Verification Endpoint to Trigger Notifications**
   ```typescript
   // app/api/social-tasks/verify/route.ts
   async function POST(req: Request) {
     const { completionId } = await req.json();
     
     const completion = await prisma.socialTaskCompletion.findUnique({
       where: { id: completionId },
       include: { task: true }
     });
     
     // Simple verification (check if counter increased)
     const verified = await checkIfTaskCompleted(completion);
     
     await prisma.socialTaskCompletion.update({
       where: { id: completionId },
       data: {
         status: verified ? 'VERIFIED' : 'FAILED',
         verifiedAt: new Date()
       }
     });
     
     if (verified) {
       // Award spins
       await prisma.endUser.update({
         where: { id: completion.userId },
         data: { 
           bonusSpinsEarned: { increment: completion.spinsAwarded }
         }
       });
       
       // Send WhatsApp notification
       await sendTaskVerifiedNotification(completion.userId, completion.taskId);
     }
     // If failed, silent (no notification)
     
     return Response.json({ success: true });
   }
   ```

---

### Phase 4: Adaptive Verification Logic (Week 3)

**Goal:** Implement traffic-based verification strategy selection.

**Reference:** `brain/ADAPTIVE_VERIFICATION.md`

**Tasks:**

1. **Create Traffic Detection Function**
   ```typescript
   // lib/adaptive-verification.ts
   async function determineVerificationStrategy(cohortId: string) {
     const oneHourAgo = new Date(Date.now() - 3600000);
     
     const recentCount = await prisma.socialTaskCompletion.count({
       where: {
         claimedAt: { gte: oneHourAgo }
       }
     });
     
     if (recentCount < 200) {
       return {
         type: 'INDIVIDUAL',
         verificationWindow: 0,
         verifyPercentage: 100
       };
     } else if (recentCount < 1000) {
       return {
         type: 'BATCHED',
         verificationWindow: Math.ceil(recentCount / 180) * 3600000,
         verifyPercentage: 100
       };
     } else if (recentCount < 10000) {
       return {
         type: 'STATISTICAL',
         verificationWindow: 12 * 3600000,
         verifyPercentage: 2 // 2% sample
       };
     } else {
       return {
         type: 'HONOR_SYSTEM',
         verificationWindow: 0,
         verifyPercentage: 0
       };
     }
   }
   ```

---

### Phase 5: Landing Page Builder (Weeks 4-5)

**Goal:** Create customizable landing pages with admin-controlled sections.

**Reference:** `brain/LANDING_PAGE_RECOMMENDATIONS.md`

**Database Models Needed:**
```prisma
model LandingPage {
  id          String @id @default(cuid())
  campaignId  String @unique
  campaign    Campaign @relation(fields: [campaignId], references: [id])
  
  title       String @default("Spin to Win")
  brandColor  String @default("#FF6B35")
  
  sections    LandingPageSection[]
  
  isPublished Boolean @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model LandingPageSection {
  id            String @id @default(cuid())
  landingPageId String
  landingPage   LandingPage @relation(fields: [landingPageId], references: [id])
  
  type          String // HERO, OFFERS, SOCIAL_TASKS, FOOTER
  displayOrder  Int @default(0)
  isVisible     Boolean @default(true)
  
  content       Json // Flexible structure per type
  
  createdAt DateTime @default(now())
  
  @@index([landingPageId, displayOrder])
}

model OfferShowcase {
  id          String @id @default(cuid())
  campaignId  String
  
  offerType   String // PRODUCT, SERVICE, DISCOUNT, VOUCHER
  title       String
  description String?
  image       String
  category    String?
  link        String?
  
  displayOrder Int @default(0)
  
  @@index([campaignId, displayOrder])
}
```

---

## Key Requirements

1. **Use existing database schema** - Don't create duplicate models
2. **Follow existing patterns** - Check other API routes for auth/error handling
3. **Add TypeScript types** - Use proper type definitions
4. **Mobile responsive** - All UI components must work on mobile
5. **Error handling** - Show user-friendly error messages
6. **Loading states** - Add loading indicators for async operations

## Testing Checklist

After implementation:
- [ ] Create campaign respects subscription limits
- [ ] Archive campaign frees up slot
- [ ] Social task modal shows instructions
- [ ] 10-second delay works
- [ ] Task completion creates PENDING record
- [ ] WhatsApp notification sent on verification
- [ ] Pending tasks show "verification in progress"
- [ ] Verified tasks show checkmark

## Questions?

If anything is unclear, check these files in `brain/` folder:
- `CURRENT_STATUS.md` - Implementation status
- `SUBSCRIPTION_IMPLEMENTATION.md` - Subscription details
- `SOCIAL_TASKS_FINAL.md` - Complete social task flow
- `ADAPTIVE_VERIFICATION.md` - Verification strategies

Start with Phase 1 (subscription enforcement) and work sequentially through the phases.
