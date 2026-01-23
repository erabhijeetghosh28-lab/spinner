# Social Tasks & Referrals - Final Implementation Plan

## User Experience Flow

### Social Task Completion
```
1. User sees task: "Like our product launch post - +3 spins"
2. User clicks task button
3. System opens targetUrl in new tab (e.g., https://instagram.com/p/ABC123/)
4. User performs action (likes the post)
5. User returns to campaign page
6. Clicks "I Completed This" button (enabled after 10 seconds)
7. UI shows graceful message:
   ┌─────────────────────────────────────┐
   │ ✅ Task Submitted!                  │
   │                                     │
   │ We're verifying your completion.    │
   │ You'll receive WhatsApp notification│
   │ once verified with your bonus spins.│
   │                                     │
   │ Thanks for your participation! 🎉   │
   └─────────────────────────────────────┘

8. System records:
   - taskId (which specific task/post)
   - targetUrl (which URL was opened)
   - timestamp (when claimed)
   - userId (who claimed)

9. Task status shows "Pending Verification"
10. Adaptive verification runs in background
11. When verified → WhatsApp notification sent
12. No notification if failed (silent)
```

**URL Tracking Purpose:**
- Admin knows which exact post/page users interacted with
- Can track performance per post (which posts drive most engagement)
- Analytics show: "Post A: 500 completions, Post B: 200 completions"

### Referral Milestone
```
1. User invites friends
2. Friend #5 registers successfully
3. WhatsApp notification sent immediately:
   "🎊 Great news! Your 5th friend joined. 
   You earned 2 bonus spins! 
   Spin now: [link]"
4. User clicks link → Spins available
```

---

## Database Schema

### Social Media Task (Admin Creates)
```prisma
model SocialMediaTask {
  id          String @id @default(cuid())
  campaignId  String
  campaign    Campaign @relation(fields: [campaignId], references: [id])
  
  platform    String   // FACEBOOK, INSTAGRAM, TWITTER, YOUTUBE
  actionType  String   // FOLLOW, LIKE_POST, LIKE_PAGE, SHARE, COMMENT
  
  // Admin-entered details
  title       String   // "Like our product launch post"
  description String?  // Optional extra context
  targetUrl   String   // CRITICAL: The exact URL user must visit
                       // Examples:
                       // - https://instagram.com/p/ABC123/ (specific post)
                       // - https://facebook.com/YourPage (page to like)
                       // - https://instagram.com/yourbrand (profile to follow)
  
  // Admin-controlled reward
  spinsReward Int      // 1-10 spins for completing this task
  
  isActive    Boolean  @default(true)
  displayOrder Int     @default(0)
  createdAt   DateTime @default(now())
  
  completions SocialTaskCompletion[]
}
```

### Campaign Settings (Admin Controlled)
```prisma
model Campaign {
  id String @id @default(cuid())
  
  // Existing fields...
  
  // Referral rewards (admin sets globally)
  referralsForBonus    Int @default(5)
  referralBonusSpins   Int @default(1)
  
  // WhatsApp notification settings
  notificationEnabled  Boolean @default(true)
  notificationStartHour Int   @default(9)   // 9 AM
  notificationEndHour   Int   @default(21)  // 9 PM
  sendImmediately      Boolean @default(false) // Override time window
  
  socialTasks         SocialMediaTask[]
}
```

### Task Completion Tracking
```prisma
model SocialTaskCompletion {
  id       String @id @default(cuid())
  userId   String
  taskId   String
  
  status   String @default("PENDING") // PENDING, VERIFIED, FAILED
  
  // WhatsApp notification tracking
  notificationSent     Boolean @default(false)
  notificationSentAt   DateTime?
  notificationDelivered Boolean @default(false)
  
  claimedAt  DateTime @default(now())
  verifiedAt DateTime?
}
```

---

## Frontend UI

### Task Card - Pending State
```tsx
function SocialTaskCard({ task, completion }) {
  if (completion?.status === 'PENDING') {
    return (
      <div className="task-card opacity-80">
        <div className="flex items-center gap-3">
          <div className="animate-pulse">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <span>⏳</span>
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold">{task.title}</h3>
            <p className="text-sm text-yellow-400">⏱ Verification in progress</p>
            <p className="text-xs text-slate-400 mt-1">
              You'll receive WhatsApp notification once verified
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (completion?.status === 'VERIFIED') {
    return (
      <div className="task-card bg-green-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">✓</span>
            <div>
              <h3 className="font-bold">{task.title}</h3>
              <p className="text-sm text-green-400">Verified</p>
            </div>
          </div>
          <span className="text-sm text-slate-400">
            +{task.spinsReward} spins awarded
          </span>
        </div>
      </div>
    );
  }
  
  // Available to complete
  return (
    <div className="task-card">
      <button onClick={handleComplete}>
        Complete Task → +{task.spinsReward} spins
      </button>
    </div>
  );
}
```

### Graceful Confirmation Modal
```tsx
function TaskSubmittedModal({ show, onClose }) {
  if (!show) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
    >
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-2xl max-w-md border border-white/10">
        <div className="text-center space-y-4">
          {/* Success Icon */}
          <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
            <span className="text-4xl">✅</span>
          </div>
          
          {/* Title */}
          <h2 className="text-2xl font-black text-white">
            Task Submitted!
          </h2>
          
          {/* Message */}
          <p className="text-slate-300">
            We're verifying your completion in the background.
          </p>
          
          <p className="text-sm text-slate-400">
            You'll receive a WhatsApp notification once verified 
            with your bonus spins credited.
          </p>
          
          {/* CTA */}
          <button
            onClick={onClose}
            className="w-full mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors"
          >
            Got it!
          </button>
          
          {/* Status indicator */}
          <p className="text-xs text-slate-500 mt-4">
            💡 You can continue exploring while we verify
          </p>
        </div>
      </div>
    </motion.div>
  );
}
```

---

## WhatsApp Integration

### Verification Success Notification
```typescript
// lib/whatsapp-notifications.ts
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export async function sendTaskVerifiedNotification(
  userId: string,
  taskTitle: string,
  spinsAwarded: number,
  campaignLink: string
) {
  const user = await prisma.endUser.findUnique({ where: { id: userId } });
  
  const message = `🎉 Congratulations ${user.name}!

Your task "${taskTitle}" has been verified! ✅

Reward: ${spinsAwarded} bonus spins added to your account

Spin now: ${campaignLink}

Good luck! 🍀`;

  await sendWhatsAppMessage(user.phone, message);
  
  // Mark notification as sent
  await prisma.socialTaskCompletion.updateMany({
    where: { userId, status: 'VERIFIED', notificationSent: false },
    data: { notificationSent: true, notificationSentAt: new Date() }
  });
}
```

### Referral Milestone Notification
```typescript
export async function sendReferralMilestoneNotification(
  userId: string,
  friendName: string,
  totalReferrals: number,
  spinsAwarded: number,
  campaignLink: string
) {
  const user = await prisma.endUser.findUnique({ where: { id: userId } });
  
  const message = `🎊 Great news ${user.name}!

${friendName} just joined using your referral link! 

Your Progress: ${totalReferrals} friends joined

Reward: ${spinsAwarded} bonus spins earned! 🎁

Spin now: ${campaignLink}

Keep sharing to earn more! 🚀`;

  await sendWhatsAppMessage(user.phone, message);
}
```

### Smart Notification Timing
```typescript
async function shouldSendNotificationNow(campaignId: string): Promise<boolean> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId }
  });
  
  // If immediate sending enabled, always send
  if (campaign.sendImmediately) return true;
  
  // Check time window
  const now = new Date();
  const currentHour = now.getHours();
  
  const inWindow = 
    currentHour >= campaign.notificationStartHour && 
    currentHour < campaign.notificationEndHour;
  
  return inWindow;
}

async function scheduleNotification(completionId: string) {
  const completion = await prisma.socialTaskCompletion.findUnique({
    where: { id: completionId },
    include: { task: { include: { campaign: true } } }
  });
  
  if (await shouldSendNotificationNow(completion.task.campaignId)) {
    // Send immediately
    await sendTaskVerifiedNotification(/* ... */);
  } else {
    // Queue for next valid time window
    await queueNotificationForNextWindow(completionId);
  }
}
```

---

## Admin Dashboard

### Create Social Task Modal
```tsx
function CreateTaskModal({ campaignId, onClose }) {
  const [form, setForm] = useState({
    platform: 'INSTAGRAM',
    actionType: 'FOLLOW',
    title: '',
    description: '',
    targetUrl: '', // CRITICAL FIELD
    spinsReward: 3
  });

  return (
    <div className="modal">
      <h2>Create Social Media Task</h2>
      
      {/* Platform Selection */}
      <div>
        <label>Platform</label>
        <select value={form.platform} onChange={(e) => setForm({...form, platform: e.target.value})}>
          <option value="INSTAGRAM">Instagram</option>
          <option value="FACEBOOK">Facebook</option>
          <option value="TWITTER">Twitter</option>
          <option value="YOUTUBE">YouTube</option>
        </select>
      </div>
      
      {/* Action Type */}
      <div>
        <label>Action Type</label>
        <select value={form.actionType} onChange={(e) => setForm({...form, actionType: e.target.value})}>
          <option value="FOLLOW">Follow Profile</option>
          <option value="LIKE_POST">Like Specific Post</option>
          <option value="LIKE_PAGE">Like Page</option>
          <option value="SHARE">Share Post</option>
          <option value="COMMENT">Comment on Post</option>
        </select>
      </div>
      
      {/* Task Title */}
      <div>
        <label>Task Title</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({...form, title: e.target.value})}
          placeholder="e.g., Follow us on Instagram"
        />
      </div>
      
      {/* TARGET URL - CRITICAL FIELD */}
      <div>
        <label>Target URL ⭐ Required</label>
        <input
          type="url"
          value={form.targetUrl}
          onChange={(e) => setForm({...form, targetUrl: e.target.value})}
          placeholder="https://instagram.com/yourbrand"
          className="w-full px-4 py-2 bg-slate-800 rounded-lg"
          required
        />
        <p className="text-xs text-slate-400 mt-1">
          {form.actionType === 'FOLLOW' && 'Profile URL (e.g., https://instagram.com/yourbrand)'}
          {form.actionType === 'LIKE_POST' && 'Post URL (e.g., https://instagram.com/p/ABC123/)'}
          {form.actionType === 'LIKE_PAGE' && 'Page URL (e.g., https://facebook.com/YourPage)'}
          {form.actionType === 'SHARE' && 'Post to share URL'}
        </p>
      </div>
      
      {/* Spins Reward */}
      <div>
        <label>Spins Reward</label>
        <input
          type="number"
          value={form.spinsReward}
          onChange={(e) => setForm({...form, spinsReward: parseInt(e.target.value)})}
          min={1}
          max={10}
        />
        <p className="text-xs text-slate-400">Users will earn this many spins upon completion</p>
      </div>
      
      {/* Preview */}
      <div className="bg-slate-800 p-4 rounded-lg">
        <p className="text-sm text-slate-400 mb-2">Preview:</p>
        <div className="flex items-center gap-3">
          <span className="text-2xl">
            {form.platform === 'INSTAGRAM' && '📷'}
            {form.platform === 'FACEBOOK' && '👍'}
          </span>
          <div>
            <p className="font-bold">{form.title || 'Task title'}</p>
            <p className="text-sm text-green-400">+{form.spinsReward} spins</p>
          </div>
        </div>
        <a href={form.targetUrl} target="_blank" className="text-xs text-blue-400 mt-2 block">
          {form.targetUrl || 'URL will appear here'}
        </a>
      </div>
      
      <button onClick={handleCreate}>Create Task</button>
    </div>
  );
}
```

### Campaign Settings UI
```tsx
// Admin can configure global settings
function CampaignSocialSettings({ campaignId }) {
  return (
    <div className="space-y-6">
      {/* List of Tasks */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Social Media Tasks</h3>
          <button onClick={openCreateModal}>+ Create Task</button>
        </div>
        
        {/* Existing tasks list */}
        <div className="space-y-3">
          {tasks.map(task => (
            <div key={task.id} className="bg-slate-800 p-4 rounded-lg">
              <div className="flex justify-between">
                <div>
                  <h4 className="font-bold">{task.title}</h4>
                  <a href={task.targetUrl} target="_blank" className="text-sm text-blue-400">
                    {task.targetUrl}
                  </a>
                  <p className="text-sm text-slate-400 mt-1">
                    Reward: {task.spinsReward} spins | Completions: {task.completionCount}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => editTask(task.id)}>Edit</button>
                  <button onClick={() => deleteTask(task.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Referral Rewards */}
      <section>
        <h3 className="text-xl font-bold mb-4">Referral Rewards</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>Referrals Required for Bonus</label>
            <input type="number" defaultValue={5} min={1} max={20} />
          </div>
          
          <div>
            <label>Bonus Spins per Milestone</label>
            <input type="number" defaultValue={1} min={1} max={5} />
          </div>
        </div>
        
        <p className="text-sm text-slate-400 mt-2">
          Example: Every 5 successful referrals = 1 bonus spin
        </p>
      </section>
      
      {/* Notification Settings */}
      <section>
        <h3 className="text-xl font-bold mb-4">WhatsApp Notifications</h3>
        
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked />
            <span>Enable WhatsApp notifications</span>
          </label>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Start Time (24hr)</label>
              <input type="number" defaultValue={9} min={0} max={23} />
            </div>
            
            <div>
              <label>End Time (24hr)</label>
              <input type="number" defaultValue={21} min={0} max={23} />
            </div>
          </div>
          
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            <span>Send immediately (ignore time window)</span>
          </label>
          
          <p className="text-sm text-slate-400">
            Notifications sent between 9 AM - 9 PM by default.
            Enable "Send immediately" for urgent campaigns.
          </p>
        </div>
      </section>
    </div>
  );
}
```

---

## Backend Event Triggers

### On Task Verified
```typescript
// Triggered by adaptive verification system
async function onTaskVerified(completionId: string) {
  const completion = await prisma.socialTaskCompletion.update({
    where: { id: completionId },
    data: { status: 'VERIFIED', verifiedAt: new Date() }
  });
  
  // Award spins
  await prisma.endUser.update({
    where: { id: completion.userId },
    data: { bonusSpinsEarned: { increment: completion.task.spinsReward } }
  });
  
  // Send WhatsApp notification (respecting time window)
  await scheduleNotification(completionId);
}
```

### On Referral Milestone
```typescript
// Triggered when new user registers with referral code
async function onUserRegistered(newUserId: string, referralCode: string) {
  const referrer = await prisma.endUser.findFirst({
    where: { referralCode }
  });
  
  if (!referrer) return;
  
  // Increment successful referrals
  const updated = await prisma.endUser.update({
    where: { id: referrer.id },
    data: { successfulReferrals: { increment: 1 } }
  });
  
  // Check if milestone reached
  const campaign = await getCurrentCampaign();
  const milestoneReached = updated.successfulReferrals % campaign.referralsForBonus === 0;
  
  if (milestoneReached) {
    // Award bonus spins
    await prisma.endUser.update({
      where: { id: referrer.id },
      data: { bonusSpinsEarned: { increment: campaign.referralBonusSpins } }
    });
    
    // Send WhatsApp notification
    const newUser = await prisma.endUser.findUnique({ where: { id: newUserId } });
    await sendReferralMilestoneNotification(
      referrer.id,
      newUser.name,
      updated.successfulReferrals,
      campaign.referralBonusSpins,
      campaign.link
    );
  }
}
```

---

## Key Principles

✅ **All rewards = spins only** (no money transactions)
✅ **Silent failures** (no notification if verification fails)
✅ **Admin controls** (rewards, timing, notifications)
✅ **Graceful UI** (clear pending states, no spam)
✅ **WhatsApp only on success** (re-engagement via notifications)

---

## Recommendations

### 1. **Retry Failed Notifications**
```typescript
// If WhatsApp delivery fails, retry 3 times
const MAX_RETRIES = 3;

async function sendWithRetry(phone: string, message: string, retries = 0) {
  try {
    await sendWhatsAppMessage(phone, message);
  } catch (error) {
    if (retries < MAX_RETRIES) {
      await delay(5000); // Wait 5 seconds
      await sendWithRetry(phone, message, retries + 1);
    } else {
      // Log failure, don't notify user
      console.error('WhatsApp notification failed after retries:', phone);
    }
  }
}
```

### 2. **Notification Queue Dashboard**
```tsx
// Admin sees pending notifications
<div className="notification-queue">
  <h3>Pending Notifications</h3>
  <p>15 notifications queued for 9 AM</p>
  <button>Send Now (Override Time Window)</button>
</div>
```

### 3. **User Notification Preferences** (Future)
```tsx
// Let users opt-in/out of WhatsApp notifications
<div className="user-settings">
  <label>
    <input type="checkbox" defaultChecked />
    Receive WhatsApp notifications for rewards
  </label>
</div>
```

---

## Testing Checklist

- [ ] User completes task → See graceful "pending" UI
- [ ] No spins awarded until verified
- [ ] Failed verification → No notification (silent)
- [ ] Verified → WhatsApp sent (respecting time window)
- [ ] Referral milestone → WhatsApp sent immediately
- [ ] Admin can set different spin rewards per task type
- [ ] Admin can configure notification time window
- [ ] Pending tasks show in user's task list
- [ ] WhatsApp delivery failures retry automatically

---

**Ready for Cursor to implement!** This is the complete flow with graceful UX and WhatsApp re-engagement.
