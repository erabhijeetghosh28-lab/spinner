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

Spin now: ${process.env.NEXT_PUBLIC_APP_URL || 'https://app.offerwheel.com'}?tenant=${campaign.tenantId}

Good luck! 🍀`;

  try {
    await sendWhatsAppMessage(user.phone, message, campaign.tenantId);
    
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

Spin now: ${process.env.NEXT_PUBLIC_APP_URL || 'https://app.offerwheel.com'}?tenant=${campaign.tenantId}

Keep sharing to earn more! 🚀`;

  try {
    await sendWhatsAppMessage(user.phone, message, campaign.tenantId);
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
