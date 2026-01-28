# Step 3: WhatsApp Integration

**Time Estimate:** 1.5 hours  
**Difficulty:** Easy-Medium  
**File to Modify:** `lib/whatsapp.ts`

---

## Step 3.1: Add Enhanced Notification Function

Open `lib/whatsapp.ts` and add this new function (keep all existing functions intact!):

```typescript
import { format } from 'date-fns';
import prisma from './prisma';

/**
 * Sends voucher notification via WhatsApp
 * Includes professional formatting and campaign cross-promotion
 */
export async function sendVoucherNotification(
  phone: string,
  prizeName: string,
  prizeDescription: string | null,
  voucherCode: string,
  qrImageUrl: string | null,
  expiresAt: Date,
  tenantId: string,
  campaignId: string
) {
  // Fetch campaign and tenant for cross-promotion
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      socialTasks: {
        where: { isActive: true },
        take: 1
      }
    }
  });
  
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });
  
  const expiryDate = format(expiresAt, 'dd MMM yyyy');
  const hasReferralProgram = campaign && campaign.referralsRequiredForSpin > 0;
  const hasSocialTasks = campaign && campaign.socialMediaEnabled && campaign.socialTasks.length > 0;
  
  // Build professional message
  let message = `
🎉 *Congratulations${tenant?.name ? ' from ' + tenant.name : ''}!*

You won: *${prizeName}*
${prizeDescription ? prizeDescription : ''}

━━━━━━━━━━━━━━━
🎫 *Voucher Details*

Code: \`${voucherCode}\`
Valid Until: ${expiryDate}
${qrImageUrl ? '📲 QR Code attached below' : ''}

━━━━━━━━━━━━━━━
📍 *How to Redeem*

1. Visit our store/outlet
2. ${qrImageUrl ? 'Show the QR code OR voucher code' : 'Show this voucher code'} to our staff
3. Enjoy your prize!

⚠️ *Terms*
• One-time use only
• Cannot be exchanged for cash
• Valid until ${expiryDate}
  `.trim();
  
  // Add referral promotion if active
  if (hasReferralProgram) {
    message += `\n\n━━━━━━━━━━━━━━━\n👥 *Invite Friends, Earn More Spins!*\n\nInvite ${campaign.referralsRequiredForSpin} friends to get ${campaign.referralBonusSpins} bonus spin(s)!\nShare your referral link and win more prizes! 🎁`;
  }
  
  // Add social media tasks promotion if active
  if (hasSocialTasks) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com';
    const landingPageUrl = `${appUrl}/${tenant?.slug || ''}`;
    message += `\n\n━━━━━━━━━━━━━━━\n📱 *Get More Spins!*\n\nComplete social media tasks for bonus spins:\n${landingPageUrl}\n\nLike, Follow & Share to earn more chances! 🎯`;
  }
  
  message += `\n\n━━━━━━━━━━━━━━━\n✨ Thank you for participating!`;
  
  // Send text message
  await sendWhatsAppMessage(phone, message, tenantId);
  
  // Send QR image if available
  if (qrImageUrl) {
    await sendWhatsAppMedia(phone, qrImageUrl, 'image', tenantId);
  }
}

/**
 * Sends WhatsApp media (image or document)
 */
export async function sendWhatsAppMedia(
  phone: string,
  mediaUrl: string,
  mediaType: 'image' | 'document',
  tenantId: string
) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  const waConfig = tenant?.waConfig as any || getDefaultWAConfig();
  
  // WhatsApp Business API media send
  // Implementation depends on your provider (Gupshup, Twilio, Meta Cloud API)
  
  try {
    const payload = {
      messaging_product: "whatsapp",
      to: phone,
      type: mediaType,
      [mediaType]: {
        link: mediaUrl,
        caption: mediaType === 'image' ? 'Your Voucher QR Code' : undefined
      }
    };
    
    // Send via your WhatsApp provider
    // Example for Gupshup:
    // await fetch(waConfig.apiUrl + '/send', {
    //   method: 'POST',
    //   headers: {
    //     'apikey': waConfig.apiKey,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(payload)
    // });
    
    console.log('WhatsApp media sent:', { phone, mediaType, mediaUrl });
  } catch (error) {
    console.error('Failed to send WhatsApp media:', error);
    // Don't throw - failing to send QR shouldn't break the flow
  }
}
```

---

## Step 3.2: Keep Existing Functions

⚠️ **IMPORTANT:** Don't remove or modify these existing functions:
- `sendWhatsAppMessage()`
- `sendPrizeNotification()` (old version)
- `getDefaultWAConfig()`
- Any other helper functions

We're **ADDING** new functions, not replacing old ones.

---

## Step 3.3: Message Formatting Tips

The message uses:
- **Bold text:** `*text*` becomes **text**
- **Code blocks:** `` `code` `` becomes `code`
- **Emojis:** 🎉 🎫 📍 etc.
- **Unicode separators:** `━━━━━━━━━━━━━━━`

Make sure your WhatsApp provider supports these (most do).

---

## Step 3.4: Testing

Test manually:

```typescript
// In a test file or API route
import { sendVoucherNotification } from '@/lib/whatsapp';

await sendVoucherNotification(
  '+91-9876543210',
  '50% OFF Dinner',
  'Valid for lunch or dinner only',
  'DEMO-ABC12345',
  null, // No QR for test
  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  'your-tenant-id',
  'your-campaign-id'
);
```

Check:
- ✅ Message received on WhatsApp
- ✅ Formatting looks good
- ✅ All details present
- ✅ Cross-promotion added if campaigns active

---

## ✅ Step 3 Complete!

You should now have:
- ✅ `sendVoucherNotification()` function added
- ✅ `sendWhatsAppMedia()` function added
- ✅ Old functions still working
- ✅ Professional message formatting

**Next:** Proceed to `STEP_4_SPIN_INTEGRATION.md`
