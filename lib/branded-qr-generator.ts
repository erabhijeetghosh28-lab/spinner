/**
 * Branded QR Generator Service
 * 
 * Creates branded QR code posters/flyers with:
 * - Campaign name at top
 * - QR code in center
 * - Business branding in footer (logo, phone, website)
 */

import { createCanvas, loadImage } from 'canvas';
import QRCode from 'qrcode';
import { UTApi } from 'uploadthing/server';

const utapi = new UTApi();

export interface BrandedQROptions {
  campaignName: string;
  qrData: string; // URL or voucher code
  businessName: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  primaryColor?: string;
  backgroundColor?: string;
}

/**
 * Generate a branded QR code poster
 * 
 * Creates a 800x1200 poster with:
 * - Campaign name at top (large, bold)
 * - QR code in center (400x400)
 * - Business info in footer
 * 
 * @param options - Branding and content options
 * @returns Buffer containing the PNG image
 */
export async function generateBrandedQRPoster(options: BrandedQROptions): Promise<Buffer> {
  const {
    campaignName,
    qrData,
    businessName,
    phone,
    website,
    logoUrl,
    primaryColor = '#1E3A8A',
    backgroundColor = '#FFFFFF'
  } = options;

  // Create canvas (poster size: 800x1200)
  const canvas = createCanvas(800, 1200);
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, 800, 1200);

  console.log('[BrandedQR] Generating QR buffer for data:', qrData);
  // Generate QR code
  const qrBuffer = await QRCode.toBuffer(qrData, {
    type: 'png',
    width: 400,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: primaryColor,
      light: backgroundColor,
    },
  });

  console.log('[BrandedQR] QR buffer generated, loading image...');
  // Load QR code image
  const qrImage = await loadImage(qrBuffer);
  console.log('[BrandedQR] QR image loaded.');

  // Header Section (Campaign Name)
  ctx.fillStyle = primaryColor;
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Word wrap for long campaign names
  const maxWidth = 720;
  const words = campaignName.split(' ');
  let line = '';
  let y = 120;
  
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, 400, y);
      line = words[n] + ' ';
      y += 60;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 400, y);

  // QR Code Section (Center)
  const qrX = (800 - 400) / 2; // Center horizontally
  const qrY = 300; // Position vertically
  ctx.drawImage(qrImage, qrX, qrY, 400, 400);

  // QR Code Label
  ctx.fillStyle = '#666666';
  ctx.font = '24px Arial';
  ctx.fillText('Scan to participate', 400, qrY + 450);

  // Footer Section (Business Info)
  const footerY = 900;
  
  // Load and draw logo if provided
  if (logoUrl) {
    try {
      console.log('[BrandedQR] Loading logo from URL:', logoUrl);
      const logo = await loadImage(logoUrl);
      const logoSize = 80;
      const logoX = (800 - logoSize) / 2;
      ctx.drawImage(logo, logoX, footerY, logoSize, logoSize);
      console.log('[BrandedQR] Logo drawn.');
    } catch (error) {
      console.warn('[BrandedQR] Failed to load logo:', error);
    }
  }

  // Business name
  ctx.fillStyle = primaryColor;
  ctx.font = 'bold 36px Arial';
  ctx.fillText(businessName, 400, footerY + 120);

  // Contact info
  ctx.fillStyle = '#666666';
  ctx.font = '24px Arial';
  
  let contactY = footerY + 170;
  
  if (phone) {
    ctx.fillText(`📞 ${phone}`, 400, contactY);
    contactY += 40;
  }
  
  if (website) {
    ctx.fillText(`🌐 ${website}`, 400, contactY);
  }

  // Add decorative border
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, 760, 1160);

  return canvas.toBuffer('image/png');
}

/**
 * Generate a compact branded QR card (business card size)
 * 
 * Creates a 600x400 card with:
 * - Campaign name at top
 * - QR code on left, business info on right
 * 
 * @param options - Branding and content options
 * @returns Buffer containing the PNG image
 */
export async function generateBrandedQRCard(options: BrandedQROptions): Promise<Buffer> {
  const {
    campaignName,
    qrData,
    businessName,
    phone,
    website,
    logoUrl,
    primaryColor = '#1E3A8A',
    backgroundColor = '#FFFFFF'
  } = options;

  // Create canvas (card size: 600x400)
  const canvas = createCanvas(600, 400);
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, 600, 400);

  // Generate QR code (smaller for card)
  const qrBuffer = await QRCode.toBuffer(qrData, {
    type: 'png',
    width: 200,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: {
      dark: primaryColor,
      light: backgroundColor,
    },
  });

  const qrImage = await loadImage(qrBuffer);

  // Header (Campaign Name)
  ctx.fillStyle = primaryColor;
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(campaignName, 300, 40);

  // QR Code (Left side)
  ctx.drawImage(qrImage, 50, 100, 200, 200);

  // Business Info (Right side)
  ctx.textAlign = 'left';
  
  // Business name
  ctx.fillStyle = primaryColor;
  ctx.font = 'bold 24px Arial';
  ctx.fillText(businessName, 280, 140);

  // Contact info
  ctx.fillStyle = '#666666';
  ctx.font = '18px Arial';
  
  let infoY = 180;
  
  if (phone) {
    ctx.fillText(`📞 ${phone}`, 280, infoY);
    infoY += 30;
  }
  
  if (website) {
    ctx.fillText(`🌐 ${website}`, 280, infoY);
    infoY += 30;
  }

  // Scan instruction
  ctx.fillStyle = '#888888';
  ctx.font = '16px Arial';
  ctx.fillText('← Scan to participate', 280, 260);

  // Add border
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 580, 380);

  return canvas.toBuffer('image/png');
}

/**
 * Upload branded QR image to UploadThing
 * 
 * @param imageBuffer - The generated image buffer
 * @param filename - Filename for the upload
 * @returns URL of uploaded image
 */
export async function uploadBrandedQR(imageBuffer: Buffer, filename: string): Promise<string> {
  try {
    console.log('[BrandedQR] Starting upload process for:', filename);
    
    // Check for API key
    if (!process.env.UPLOADTHING_SECRET && !process.env.UPLOADTHING_TOKEN) {
      console.error('[BrandedQR] UPLOADTHING_SECRET or UPLOADTHING_TOKEN is missing in .env');
      throw new Error('UploadThing API key is missing. Please add UPLOADTHING_TOKEN to your .env file.');
    }

    const uint8Array = new Uint8Array(imageBuffer);
    const blob = new Blob([uint8Array], { type: 'image/png' });
    const file = new File([blob], `${filename}.png`, { type: 'image/png' });
    
    console.log('[BrandedQR] Uploading to UploadThing...');
    const response = await utapi.uploadFiles(file);
    
    if (!response.data) {
      console.error('[BrandedQR] UploadThing response missing data:', response);
      throw new Error('Upload failed: No data returned from storage provider');
    }
    
    console.log('[BrandedQR] Upload successful:', response.data.url);
    return response.data.url;
  } catch (error) {
    console.error('[BrandedQR] Branded QR upload failed:', error);
    throw error;
  }
}

/**
 * Generate and upload a branded QR poster
 * 
 * @param options - Branding options
 * @param campaignId - Campaign ID for filename
 * @returns URL of uploaded poster or null on failure
 */
export async function createAndUploadBrandedPoster(
  options: BrandedQROptions, 
  campaignId: string
): Promise<string | null> {
  try {
    const posterBuffer = await generateBrandedQRPoster(options);
    const url = await uploadBrandedQR(posterBuffer, `campaign-poster-${campaignId}`);
    return url;
  } catch (error) {
    console.error('Failed to create branded poster:', error);
    return null;
  }
}

/**
 * Generate and upload a branded QR card
 * 
 * @param options - Branding options
 * @param campaignId - Campaign ID for filename
 * @returns URL of uploaded card or null on failure
 */
export async function createAndUploadBrandedCard(
  options: BrandedQROptions, 
  campaignId: string
): Promise<string | null> {
  try {
    const cardBuffer = await generateBrandedQRCard(options);
    const url = await uploadBrandedQR(cardBuffer, `campaign-card-${campaignId}`);
    return url;
  } catch (error) {
    console.error('Failed to create branded card:', error);
    return null;
  }
}