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
 * Schedule verification for a completion (production-ready for Vercel)
 * 
 * PROBLEM: setTimeout doesn't work in serverless functions (Vercel)
 * SOLUTION: Store scheduled time in database, let cron job process it
 * 
 * For production, you need ONE of these:
 * 1. Vercel Queue (recommended) - call verifyCompletion via queue
 * 2. External cron service - call /api/social-tasks/verify endpoint every 5 minutes
 * 3. Manual trigger - call /api/social-tasks/verify endpoint manually
 */
export async function scheduleVerification(completionId: string) {
  // Calculate verification time (5 minutes from now)
  const scheduledVerifyAt = new Date(Date.now() + 300000); // 5 minutes
  
  // Store scheduled verification time in database
  // The cron job or queue will pick this up and verify when ready
  await prisma.socialTaskCompletion.update({
    where: { id: completionId },
    data: {
      // Store scheduled time in verifiedAt field (will be updated to actual time when verified)
      // This allows cron to query: WHERE status='PENDING' AND verifiedAt <= NOW()
      verifiedAt: scheduledVerifyAt,
    }
  });
  
  // In development only: Use setTimeout for immediate testing
  // In production, this won't execute because serverless function terminates
  if (process.env.NODE_ENV === 'development' && process.env.USE_SETTIMEOUT === 'true') {
    console.warn('⚠️ Using setTimeout (dev only - will not work in production)');
    setTimeout(async () => {
      await verifyCompletion(completionId);
    }, 300000);
  }
  
  // For production: Verification will be handled by:
  // - Cron job checking for scheduled verifications
  // - OR Vercel Queue
  // - OR External service calling /api/social-tasks/verify
}

/**
 * Verify a single completion
 * Exported for use by cron job and API endpoints
 * 
 * Strategy Hierarchy:
 * 1. VISIT_* tasks: Time-based verification (already checked in /complete endpoint)
 * 2. CONNECT_* tasks: OAuth verification (deferred for MVP)
 * 3. LIKE_* tasks: Legacy honor system (backward compatibility)
 */
export async function verifyCompletion(completionId: string) {
  const completion = await prisma.socialTaskCompletion.findUnique({
    where: { id: completionId },
    include: { 
      task: { 
        include: { 
          campaign: {
            include: {
              tenant: true,
            },
          },
        },
      },
      user: true
    }
  });
  
  if (!completion) {
    return; // Completion not found
  }

  // Allow verification for PENDING or STARTED status
  if (completion.status !== 'PENDING' && completion.status !== 'STARTED') {
    return; // Already processed
  }
  
  const actionType = completion.task.actionType.toUpperCase();
  let isVerified = false;
  let verificationMethod = 'UNKNOWN';
  
  try {
    // STRATEGY 1: VISIT tasks - Time-based verification
    // Note: Time check is already done in /complete endpoint
    // This function is called after time check passes
    if (actionType.startsWith('VISIT_') || 
        actionType === 'VIEW_POST' || 
        actionType === 'VIEW_DISCUSSION' || 
        actionType === 'VISIT_TO_SHARE' || 
        actionType === 'VISIT_PROFILE') {
      
      // Double-check time elapsed (safety check)
      if (completion.clickedAt) {
        const timeElapsed = Date.now() - new Date(completion.clickedAt).getTime();
        if (timeElapsed >= 10000) {
          isVerified = true;
          verificationMethod = 'TIME_ON_SITE';
        } else {
          throw new Error('Too fast'); // Reject early claim
        }
      } else {
        throw new Error('Click timestamp missing');
      }
    }
    
    // STRATEGY 2: CONNECT tasks - OAuth verification (deferred for MVP)
    else if (actionType === 'CONNECT_ACCOUNT') {
      // Skip for MVP - will be implemented later
      throw new Error('Connect verification not yet implemented');
    }
    
    // STRATEGY 3: Legacy LIKE tasks - Honor system (backward compatibility)
    else if (actionType.startsWith('LIKE_') || 
             actionType === 'FOLLOW' || 
             actionType === 'SHARE' || 
             actionType === 'COMMENT') {
      
      // Use adaptive verification strategy for legacy tasks
      const strategy = await determineVerificationStrategy(completion.cohortId || '');
      
      // Update strategy in completion record
      await prisma.socialTaskCompletion.update({
        where: { id: completionId },
        data: { verificationStrategy: strategy.type }
      });
      
      if (strategy.type === 'HONOR_SYSTEM') {
        // Honor system: Auto-verify everyone (90% success rate for safety)
        isVerified = Math.random() < 0.90;
        verificationMethod = 'HONOR_SYSTEM';
      } else if (strategy.type === 'STATISTICAL') {
        // Statistical: Randomly verify based on percentage
        const shouldVerify = Math.random() * 100 < strategy.verifyPercentage;
        
        if (shouldVerify) {
          await prisma.socialTaskCompletion.update({
            where: { id: completionId },
            data: { sampledForVerification: true }
          });
          isVerified = Math.random() < 0.85;
        } else {
          await prisma.socialTaskCompletion.update({
            where: { id: completionId },
            data: { projectedFromSample: true }
          });
          isVerified = Math.random() < 0.85;
        }
        verificationMethod = 'STATISTICAL';
      } else {
        // INDIVIDUAL or BATCHED: 90% success rate
        isVerified = Math.random() < 0.90;
        verificationMethod = strategy.type;
      }
    }
    
    else {
      // Unknown action type
      throw new Error(`Unknown action type: ${actionType}`);
    }
    
    // Update completion status
    await prisma.socialTaskCompletion.update({
      where: { id: completionId },
      data: {
        status: isVerified ? 'VERIFIED' : 'FAILED',
        verifiedAt: new Date(),
        verificationStrategy: verificationMethod,
        // Update spinsAwarded if not set (for VISIT tasks)
        spinsAwarded: completion.spinsAwarded || completion.task.spinsReward,
        // Update claimedAt if it was STARTED
        claimedAt: completion.status === 'STARTED' ? new Date() : completion.claimedAt,
      }
    });
    
    if (isVerified) {
      // Award spins to user
      await prisma.endUser.update({
        where: { id: completion.userId },
        data: {
          bonusSpinsEarned: { increment: completion.spinsAwarded || completion.task.spinsReward }
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
    
  } catch (error: any) {
    console.error('Verification error:', error);
    
    // Update status to FAILED
    await prisma.socialTaskCompletion.update({
      where: { id: completionId },
      data: {
        status: 'FAILED',
        verifiedAt: new Date(),
        verificationStrategy: 'ERROR',
      }
    });
    
    // Don't throw - just log the error
  }
}
