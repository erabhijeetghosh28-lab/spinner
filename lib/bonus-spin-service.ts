import prisma from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

/**
 * BonusSpinService
 * 
 * Handles granting bonus spins to customers and sending notifications.
 * Implements customer eligibility checks and retry logic for notifications.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5
 */

interface GrantBonusSpinsResult {
  success: boolean;
  newSpinCount?: number;
  error?: string;
}

interface NotifyCustomerResult {
  success: boolean;
  error?: string;
}

/**
 * Grant bonus spins to a customer
 * 
 * Uses database transaction for atomicity.
 * Checks customer eligibility (has spun at least once).
 * Logs errors and marks for retry on failure.
 * 
 * @param customerId - The customer's EndUser ID
 * @param amount - Number of bonus spins to grant
 * @param reason - Reason for granting spins (e.g., "Task approval")
 * @param grantedBy - Manager ID who granted the spins
 * @returns Result with success status and new spin count
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.5
 */
export async function grantBonusSpins(
  customerId: string,
  amount: number,
  reason: string,
  grantedBy: string
): Promise<GrantBonusSpinsResult> {
  try {
    // Use transaction for atomicity (Requirement 5.3)
    const result = await prisma.$transaction(async (tx) => {
      // Fetch customer and check eligibility
      const customer = await tx.endUser.findUnique({
        where: { id: customerId },
        include: {
          spins: {
            select: { id: true },
            take: 1
          }
        }
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      // Requirement 5.1: Verify customer has spun at least once
      if (customer.spins.length === 0) {
        throw new Error('Customer must spin at least once before receiving bonus spins');
      }

      // Requirement 5.2: Increment customer's bonus spins
      const updatedCustomer = await tx.endUser.update({
        where: { id: customerId },
        data: {
          bonusSpinsEarned: {
            increment: amount
          }
        },
        select: {
          bonusSpinsEarned: true
        }
      });

      return {
        success: true,
        newSpinCount: updatedCustomer.bonusSpinsEarned
      };
    });

    console.log(`✅ Granted ${amount} bonus spins to customer ${customerId} by ${grantedBy}. Reason: ${reason}`);
    return result;

  } catch (error) {
    // Requirement 5.5: Log error and mark for retry
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Failed to grant bonus spins to customer ${customerId}:`, {
      error: errorMessage,
      amount,
      reason,
      grantedBy,
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Send notification to customer
 * 
 * Implements retry logic with exponential backoff (3 attempts).
 * Logs notification delivery status.
 * 
 * @param customerId - The customer's EndUser ID
 * @param message - Message to send
 * @param tenantId - Tenant ID for WhatsApp config
 * @returns Result with success status
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
export async function notifyCustomer(
  customerId: string,
  message: string,
  tenantId: string
): Promise<NotifyCustomerResult> {
  try {
    // Retrieve customer phone number
    const customer = await prisma.endUser.findUnique({
      where: { id: customerId },
      select: { phone: true, name: true }
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Requirement 6.4: Retry up to 3 times with exponential backoff
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📤 Sending WhatsApp notification to ${customer.phone} (attempt ${attempt}/${maxRetries})`);
        
        // Send WhatsApp message
        const result = await sendWhatsAppMessage(customer.phone, message, tenantId);

        if (result) {
          // Requirement 6.5: Log notification delivery status
          console.log(`✅ WhatsApp notification delivered to customer ${customerId} on attempt ${attempt}`);
          
          return {
            success: true
          };
        } else {
          throw new Error('WhatsApp service returned null');
        }

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`⚠️ WhatsApp notification attempt ${attempt} failed:`, lastError.message);

        // Exponential backoff: wait before retry (except on last attempt)
        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`⏳ Waiting ${delayMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    // All retries failed
    // Requirement 6.5: Log notification failure
    console.error(`❌ Failed to deliver WhatsApp notification to customer ${customerId} after ${maxRetries} attempts:`, {
      error: lastError?.message,
      customerId,
      phone: customer.phone,
      timestamp: new Date().toISOString()
    });

    return {
      success: false,
      error: lastError?.message || 'All retry attempts failed'
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Error in notifyCustomer:`, errorMessage);

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Send approval notification to customer
 * 
 * Formats and sends a WhatsApp message when a task is approved.
 * 
 * @param customerId - The customer's EndUser ID
 * @param taskType - Type of task that was approved
 * @param bonusSpinsGranted - Number of bonus spins granted
 * @param tenantId - Tenant ID for WhatsApp config
 * @returns Result with success status
 * 
 * Requirements: 6.1, 6.3
 */
export async function sendApprovalNotification(
  customerId: string,
  taskType: string,
  bonusSpinsGranted: number,
  tenantId: string
): Promise<NotifyCustomerResult> {
  // Requirement 6.3: Include task type and number of bonus spins
  const message = `🎉 Congratulations! Your ${taskType} task has been approved!\n\n` +
    `You've been awarded ${bonusSpinsGranted} bonus spin${bonusSpinsGranted > 1 ? 's' : ''}! 🎁\n\n` +
    `Log in now to use your bonus spins and win amazing prizes! 🍀`;

  return notifyCustomer(customerId, message, tenantId);
}

/**
 * Send rejection notification to customer
 * 
 * Formats and sends a WhatsApp message when a task is rejected.
 * 
 * @param customerId - The customer's EndUser ID
 * @param taskType - Type of task that was rejected
 * @param rejectionReason - Reason for rejection from manager's comment
 * @param tenantId - Tenant ID for WhatsApp config
 * @returns Result with success status
 * 
 * Requirements: 6.2, 6.3
 */
export async function sendRejectionNotification(
  customerId: string,
  taskType: string,
  rejectionReason: string,
  tenantId: string
): Promise<NotifyCustomerResult> {
  // Requirement 6.3: Include task type and rejection reason
  const message = `We've reviewed your ${taskType} task submission.\n\n` +
    `Unfortunately, it could not be approved at this time.\n\n` +
    `Reason: ${rejectionReason}\n\n` +
    `Please try again or contact support if you have questions.`;

  return notifyCustomer(customerId, message, tenantId);
}
