# Social Media Tasks - Implementation Plan

## Database Schema

### SocialMediaTask Model
```prisma
model SocialMediaTask {
  id            String   @id @default(cuid())
  campaignId    String
  campaign      Campaign @relation(fields: [campaignId], references: [id])
  
  platform      String   // FACEBOOK, INSTAGRAM
  actionType    String   // FOLLOW, LIKE_POST, LIKE_PAGE
  title         String
  targetUrl     String
  spinsReward   Int      // 1-10
  
  isActive      Boolean  @default(true)
  displayOrder  Int      @default(0)
  createdAt     DateTime @default(now())
  
  completions   SocialTaskCompletion[]
}
```

### SocialTaskCompletion Model
```prisma
model SocialTaskCompletion {
  id          String   @id @default(cuid())
  taskId      String
  task        SocialMediaTask @relation(fields: [taskId], references: [id])
  userId      String
  user        EndUser  @relation(fields: [userId], references: [id])
  
  status      String   @default("CLAIMED")
  spinsAwarded Int
  claimedAt   DateTime @default(now())
  verifiedAt  DateTime?
  
  @@unique([taskId, userId])
}
```

### SocialMediaCounter Model
```prisma
model SocialMediaCounter {
  id          String   @id @default(cuid())
  campaignId  String?
  platform    String
  count       Int
  checkedAt   DateTime @default(now())
}
```

## Meta API Integration

### Environment Variables
```env
FACEBOOK_PAGE_ID=your_page_id
FACEBOOK_PAGE_ACCESS_TOKEN=EAAxxxxxxxxxx
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_ig_id
INSTAGRAM_ACCESS_TOKEN=IGQVJxxxxxxxxx
```

### API Endpoints to Call

**Facebook Follower Count:**
```
GET https://graph.facebook.com/v18.0/{PAGE_ID}?fields=followers_count&access_token={TOKEN}
```

**Instagram Follower Count:**
```
GET https://graph.facebook.com/v18.0/{IG_ID}?fields=followers_count&access_token={TOKEN}
```

## Backend APIs

### Social Stats API
```typescript
// app/api/social/stats/route.ts
GET /api/social/stats

Cache: 1 hour (revalidate = 3600)

Response:
{
  facebook: { followers: 12543 },
  instagram: { followers: 8921 },
  updatedAt: "2026-01-22T12:00:00Z"
}
```

### Admin Task Management
```typescript
// app/api/admin/social-tasks/route.ts
POST /api/admin/social-tasks

Permission Check:
1. Verify plan.socialMediaEnabled = true
2. Count existing tasks
3. Verify count < plan.maxSocialTasks
4. Create task

Request:
{
  campaignId, platform, actionType, title, targetUrl, spinsReward (1-10)
}
```

### User Task Completion
```typescript
// app/api/social-tasks/complete/route.ts
POST /api/social-tasks/complete

Logic:
1. Check if already completed (unique constraint)
2. Check rate limit (5 tasks/day)
3. Award spins IMMEDIATELY
4. Create completion record with status=CLAIMED
5. Return success

NO WAITING - instant reward
```

## Frontend Components

### SocialStatsBar Component
```tsx
// components/SocialStatsBar.tsx
Display Facebook & Instagram follower counts
Fetch from /api/social/stats
Update every hour
```

### SocialTasksPanel Component
```tsx
// components/SocialTasksPanel.tsx
Show all available tasks
10-second delay before "Complete" button enables
Mark completed tasks
Handle instant reward
```

### Admin Task Manager
```tsx
// app/admin/campaigns/[id]/social-tasks/page.tsx
Permission gate: Check plan.socialMediaEnabled
Show task limit: "3/3 used"
Create task modal
Edit/delete tasks
```

## Fraud Prevention

### Rate Limiting
- Max 5 tasks per day per user
- Validate on completion

### Time Delay
- 10-second delay before claim button enables
- Opens target URL in new tab

### Background Verification (Event-Based)

**Trigger**: Immediately after user completes task

**Using Vercel Queues or setTimeout approach:**

```typescript
// app/api/social-tasks/complete/route.ts
POST /api/social-tasks/complete

async function completeTask(taskId, userId) {
  // 1. Award spins immediately
  const completion = await prisma.socialTaskCompletion.create({
    data: { taskId, userId, status: 'CLAIMED', spinsAwarded: task.spinsReward }
  });
  
  await prisma.endUser.update({
    where: { id: userId },
    data: { bonusSpinsEarned: { increment: task.spinsReward } }
  });
  
  // 2. Schedule verification for 5 minutes later (event-based)
  await scheduleVerification(completion.id);
  
  return completion;
}

async function scheduleVerification(completionId: string) {
  // Option 1: Use Vercel Queue (if available)
  // await queue.enqueue('verify-task', { completionId }, { delay: 300000 });
  
  // Option 2: Simple delayed API call (works everywhere)
  setTimeout(async () => {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/social-tasks/verify`, {
      method: 'POST',
      body: JSON.stringify({ completionId })
    });
  }, 300000); // 5 minutes
}
```

**Verification Endpoint:**
```typescript
// app/api/social-tasks/verify/route.ts
POST /api/social-tasks/verify

async function verifyCompletion(completionId: string) {
  const completion = await prisma.socialTaskCompletion.findUnique({
    where: { id: completionId },
    include: { task: { include: { campaign: true } } }
  });
  
  // Get counter before and after
  const counterBefore = await getCounterBeforeClaim(completion);
  const counterNow = await getFollowerCount(completion.task.platform);
  
  if (counterNow > counterBefore) {
    // Verified - counter increased
    await prisma.socialTaskCompletion.update({
      where: { id: completionId },
      data: { status: 'VERIFIED', verifiedAt: new Date() }
    });
  } else {
    // Flagged - no increase detected
    await prisma.socialTaskCompletion.update({
      where: { id: completionId },
      data: { status: 'FLAGGED' }
    });
  }
}
```

**Benefits**:
- ✅ No scheduled cron jobs
- ✅ Verification happens exactly 5 minutes after each completion
- ✅ More precise timing
- ✅ Scales automatically with usage

## Implementation Priority

### Week 1: Infrastructure
- Add database models
- Setup Meta API tokens
- Create /api/social/stats endpoint

### Week 2: Admin Features
- Build task creation UI
- Add permission checks
- Implement task CRUD

### Week 3: User Features
- Build task completion flow
- Add rate limiting
- Setup background verification

## Critical Rules
- ✅ Award spins IMMEDIATELY (no waiting)
- ✅ Use FREE Meta APIs (no cost)
- ✅ Cache responses for 1 hour
- ✅ Accept 15% fraud rate
- ✅ Check subscription permissions
- ✅ Validate spin rewards 1-10 only

## Testing Checklist
- [ ] Meta APIs return follower counts
- [ ] Admin can create tasks (if plan allows)
- [ ] Admin blocked if plan doesn't include feature
- [ ] User gets instant spins on completion
- [ ] Rate limit blocks after 5 tasks/day
- [ ] Verification triggers 5 minutes after completion (event-based)
- [ ] Fraud metrics tracked correctly
- [ ] No cron jobs required
