# Next Steps for Cursor - Complete Remaining Features

## Status Check Complete ✅

Great work! You've successfully implemented:
- ✅ Subscription enforcement with campaign limits
- ✅ Social task instruction modal with 10-second timer
- ✅ Task completion API with rate limiting
- ✅ Database schema for adaptive verification
- ✅ Campaign soft delete (archive)

**Verified in code:**
- `app/api/admin/campaigns/route.ts` - Full subscription enforcement ✓
- `components/social/TaskInstructionModal.tsx` - Complete user flow ✓
- `app/api/social-tasks/complete/route.ts` - API with rate limits ✓

---

## What's Missing - Priority Implementation

### Phase 1: Complete Adaptive Verification (High Priority)

You've created the database structure and cohort tracking. Now implement the actual verification logic.

**File to create:** `lib/social-verification.ts`

```typescript
import prisma from '@/lib/prisma';
import { sendTaskVerifiedNotification } from '@/lib/whatsapp-notifications';

/**
 * Determine verification strategy based on traffic
 */
export async function determineVerificationStrategy(cohortId: string) {
  const oneHourAgo = new Date(Date.now() - 3600000);
  
  const recentCount = await prisma.socialTaskCompletion.count({
    where: {
      claimedAt: { gte: oneHourAgo }
    }
  });
  
  if (recentCount < 200) {
    return {
      type: 'INDIVIDUAL',
      verificationWindow: 0, // Real-time
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
      verificationWindow: 12 * 3600000, // 12 hours
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

/**
 * Schedule verification for a completion (event-based, not cron)
 */
export function scheduleVerification(completionId: string) {
  // Verify after 5 minutes
  setTimeout(async () => {
    await verifyCompletion(completionId);
  }, 300000); // 5 minutes in milliseconds
}

/**
 * Verify a single completion
 */
async function verifyCompletion(completionId: string) {
  const completion = await prisma.socialTaskCompletion.findUnique({
    where: { id: completionId },
    include: { 
      task: { 
        include: { campaign: true } 
      },
      user: true
    }
  });
  
  if (!completion || completion.status !== 'PENDING') {
    return; // Already processed
  }
  
  // Simple verification: Check if we should verify based on strategy
  const strategy = await determineVerificationStrategy(completion.cohortId);
  
  // Update strategy in completion record
  await prisma.socialTaskCompletion.update({
    where: { id: completionId },
    data: { verificationStrategy: strategy.type }
  });
  
  let isVerified = false;
  
  if (strategy.type === 'HONOR_SYSTEM') {
    // Honor system: Auto-verify everyone
    isVerified = true;
  } else if (strategy.type === 'STATISTICAL') {
    // Statistical: Randomly verify based on percentage
    const shouldVerify = Math.random() * 100 < strategy.verifyPercentage;
    
    if (shouldVerify) {
      // Mark for actual verification
      await prisma.socialTaskCompletion.update({
        where: { id: completionId },
        data: { sampledForVerification: true }
      });
      
      // For now, assume 85% success rate (you can add real API verification later)
      isVerified = Math.random() < 0.85;
    } else {
      // Project from sample (will be updated in batch job)
      await prisma.socialTaskCompletion.update({
        where: { id: completionId },
        data: { projectedFromSample: true }
      });
      // Assume similar success rate
      isVerified = Math.random() < 0.85;
    }
  } else {
    // INDIVIDUAL or BATCHED: For MVP, assume 90% success rate
    // TODO: Add real API verification using Meta Graph API
    isVerified = Math.random() < 0.90;
  }
  
  // Update completion status
  await prisma.socialTaskCompletion.update({
    where: { id: completionId },
    data: {
      status: isVerified ? 'VERIFIED' : 'FAILED',
      verifiedAt: new Date()
    }
  });
  
  if (isVerified) {
    // Award spins to user
    await prisma.endUser.update({
      where: { id: completion.userId },
      data: {
        bonusSpinsEarned: { increment: completion.spinsAwarded }
      }
    });
    
    // Send WhatsApp notification
    await sendTaskVerifiedNotification(
      completion.userId,
      completion.taskId,
      completion.task.campaignId
    );
  }
  // If failed, silent (no notification as per requirements)
}
```

---

### Phase 2: WhatsApp Notifications (High Priority)

**File to create:** `lib/whatsapp-notifications.ts`

```typescript
import prisma from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

/**
 * Send WhatsApp notification when task is verified
 */
export async function sendTaskVerifiedNotification(
  userId: string,
  taskId: string,
  campaignId: string
) {
  const user = await prisma.endUser.findUnique({ where: { id: userId } });
  const task = await prisma.socialMediaTask.findUnique({ where: { id: taskId } });
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  
  if (!user || !task || !campaign) {
    console.error('Missing data for WhatsApp notification');
    return;
  }
  
  // Check if notifications are enabled
  if (!campaign.notificationEnabled) {
    return;
  }
  
  // Check time window
  if (!shouldSendNow(campaign)) {
    // Queue for later (implement queue if needed)
    console.log(`Notification queued for ${user.phone} - outside time window`);
    return;
  }
  
  const message = `🎉 Congratulations ${user.name || 'User'}!

Your task "${task.title}" has been verified! ✅

Reward: ${task.spinsReward} bonus spin${task.spinsReward > 1 ? 's' : ''} added to your account

Spin now: ${process.env.NEXT_PUBLIC_APP_URL}/campaigns/${campaign.id}

Good luck! 🍀`;

  try {
    await sendWhatsAppMessage(user.phone, message);
    
    // Mark notification as sent
    await prisma.socialTaskCompletion.updateMany({
      where: { userId, taskId, status: 'VERIFIED' },
      data: {
        notificationSent: true,
        notificationSentAt: new Date(),
        notificationDelivered: true // Assume delivered for now
      }
    });
  } catch (error) {
    console.error('Failed to send WhatsApp notification:', error);
    // Don't throw - just log the error
  }
}

/**
 * Send WhatsApp notification for referral milestone
 */
export async function sendReferralMilestoneNotification(
  userId: string,
  friendName: string,
  totalReferrals: number,
  spinsAwarded: number,
  campaignId: string
) {
  const user = await prisma.endUser.findUnique({ where: { id: userId } });
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  
  if (!user || !campaign) return;
  
  if (!shouldSendNow(campaign)) return;
  
  const message = `🎊 Great news ${user.name || 'User'}!

${friendName} just joined using your referral link!

Your Progress: ${totalReferrals} friend${totalReferrals > 1 ? 's' : ''} joined

Reward: ${spinsAwarded} bonus spin${spinsAwarded > 1 ? 's' : ''} earned! 🎁

Spin now: ${process.env.NEXT_PUBLIC_APP_URL}/campaigns/${campaign.id}

Keep sharing to earn more! 🚀`;

  try {
    await sendWhatsAppMessage(user.phone, message);
  } catch (error) {
    console.error('Failed to send referral WhatsApp:', error);
  }
}

/**
 * Check if notification should be sent now based on campaign settings
 */
function shouldSendNow(campaign: { 
  sendImmediately: boolean; 
  notificationStartHour: number; 
  notificationEndHour: number;
}): boolean {
  // If immediate sending is enabled, always send
  if (campaign.sendImmediately) return true;
  
  // Check time window
  const now = new Date();
  const currentHour = now.getHours();
  
  return currentHour >= campaign.notificationStartHour && 
         currentHour < campaign.notificationEndHour;
}
```

---

### Phase 3: Admin UI Enhancements (Medium Priority)

**File to create:** `components/admin/UsageStats.tsx`

```typescript
'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function UsageStats({ tenantId }: { tenantId: string }) {
  const { data, isLoading } = useSWR(`/api/admin/usage?tenantId=${tenantId}`, fetcher);
  
  if (isLoading) {
    return <div className="animate-pulse bg-slate-800 h-32 rounded-xl"></div>;
  }
  
  const usagePercent = (data?.activeCampaigns / data?.plan.campaignsPerMonth) * 100;
  const isAtLimit = data?.activeCampaigns >= data?.plan.campaignsPerMonth;
  
  return (
    <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
      <h3 className="font-bold text-lg mb-4">Campaign Usage</h3>
      
      <div className="space-y-4">
        {/* Active Campaigns */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-slate-400">Active Campaigns</span>
            <span className="font-bold">
              {data?.activeCampaigns}/{data?.plan.campaignsPerMonth}
            </span>
          </div>
          <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-2 rounded-full transition-all ${
                isAtLimit ? 'bg-red-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
        </div>
        
        {/* Monthly Created */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-slate-400">Created This Month</span>
            <span className="font-bold">
              {data?.monthlyCreated}/{data?.plan.campaignsPerMonth}
            </span>
          </div>
        </div>
        
        {/* Upgrade Prompt */}
        {isAtLimit && (
          <div className="bg-orange-500/10 border border-orange-500 p-4 rounded-lg mt-4">
            <p className="text-orange-400 text-sm">
              ⚠️ Campaign limit reached.
              <a 
                href="/admin/billing/upgrade" 
                className="underline ml-1 font-bold"
              >
                Upgrade to create more
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

**API endpoint needed:** `app/api/admin/usage/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authError = await requireAdminAuth(req);
    if (authError) return authError;
    
    const tenantId = req.nextUrl.searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { 
        subscriptionPlan: true,
        _count: {
          select: {
            campaigns: {
              where: {
                isActive: true,
                isArchived: false
              }
            }
          }
        }
      }
    });
    
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    const usage = await prisma.tenantUsage.findUnique({
      where: {
        tenantId_month: { tenantId, month: currentMonth }
      }
    });
    
    return NextResponse.json({
      activeCampaigns: tenant._count.campaigns,
      monthlyCreated: usage?.campaignsCreated || 0,
      plan: {
        name: tenant.subscriptionPlan?.name || 'Free',
        campaignsPerMonth: tenant.subscriptionPlan?.campaignsPerMonth || 1
      }
    });
  } catch (error: any) {
    console.error('Error fetching usage:', error);
    return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 });
  }
}
```

---

## Implementation Order

**Week 1:**
1. ✅ Create `lib/social-verification.ts` with adaptive logic
2. ✅ Create `lib/whatsapp-notifications.ts` with sending logic
3. ✅ Test verification flow end-to-end
4. ✅ Test WhatsApp notifications

**Week 2:**
1. ✅ Create `components/admin/UsageStats.tsx`
2. ✅ Create `/api/admin/usage` endpoint
3. ✅ Add usage stats to admin dashboard
4. ✅ Test upgrade prompts

**Week 3-4:**
Landing page builder (separate prompt will be provided)

---

## Testing Checklist

After implementation:
- [ ] Complete social task → Status shows "PENDING"
- [ ] Wait 5 minutes → Status changes to "VERIFIED"
- [ ] Bonus spins added to user account
- [ ] WhatsApp notification received
- [ ] Admin dashboard shows usage stats (X/Y campaigns)
- [ ] Hitting campaign limit shows error message
- [ ] Archiving campaign frees up slot

---

## Notes

- For MVP, using randomized verification (85-90% success rate)
- Can add real Meta Graph API verification later
- WhatsApp notifications respect time windows (9 AM - 9 PM by default)
- All verification is event-based (no cron jobs)
- Silent failures (no notification if task fails verification)

Start with Phase 1 (adaptive verification), then Phase 2 (WhatsApp), then Phase 3 (admin UI).
