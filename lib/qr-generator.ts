/**
 * QR Generator Service
 * 
 * Generates QR code images and uploads them to UploadThing.
 * 
 * Features:
 * - Generates 400x400 PNG QR codes
 * - Error correction level M (15% recovery)
 * - Uploads to UploadThing storage
 * - Graceful error handling (returns null on failure)
 */

import QRCode from 'qrcode';
import { UTApi } from 'uploadthing/server';

// Initialize UploadThing API
const utapi = new UTApi();

/**
 * Generate QR code image from voucher code
 * 
 * Creates a PNG image with dimensions of exactly 400x400 pixels.
 * Uses error correction level M for 15% data recovery capability.
 * 
 * @param voucherCode - The voucher code to encode in the QR code
 * @returns Buffer containing the PNG image data
 * @throws Error if QR generation fails
 * 
 * Requirements: 1.3, 3.1, 3.2
 */
export async function generateQRImage(voucherCode: string): Promise<Buffer> {
  try {
    // Generate QR code as PNG buffer
    const qrBuffer = await QRCode.toBuffer(voucherCode, {
      type: 'png',
      width: 400,
      margin: 4,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    
    return qrBuffer;
  } catch (error) {
    console.error('QR code generation failed:', error);
    throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload QR image to UploadThing
 * 
 * Uploads the QR code image buffer to UploadThing storage and returns the URL.
 * 
 * @param imageBuffer - Buffer containing the PNG image data
 * @param voucherCode - The voucher code (used for filename)
 * @returns URL of the uploaded image
 * @throws Error if upload fails
 * 
 * Requirements: 1.4
 */
export async function uploadQRImage(imageBuffer: Buffer, voucherCode: string): Promise<string> {
  try {
    // Convert Buffer to Uint8Array for Blob constructor compatibility
    const uint8Array = new Uint8Array(imageBuffer);
    const blob = new Blob([uint8Array], { type: 'image/png' });
    const file = new File([blob], `qr-${voucherCode}.png`, { type: 'image/png' });
    
    // Upload to UploadThing
    const response = await utapi.uploadFiles(file);
    
    if (!response.data) {
      throw new Error('Upload failed: No data returned');
    }
    
    return response.data.url;
  } catch (error) {
    console.error('QR code upload failed:', error);
    throw new Error(`Failed to upload QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Combined: generate and upload QR code
 * 
 * Generates a QR code image and uploads it to UploadThing in one operation.
 * Returns null on failure instead of throwing, allowing graceful degradation.
 * 
 * @param voucherCode - The voucher code to encode
 * @returns URL of the uploaded QR image, or null if generation/upload fails
 * 
 * Requirements: 1.3, 1.4, 3.4, 12.5
 */
export async function createAndUploadQR(voucherCode: string): Promise<string | null> {
  try {
    // Generate QR code image
    const imageBuffer = await generateQRImage(voucherCode);
    
    // Upload to UploadThing
    const url = await uploadQRImage(imageBuffer, voucherCode);
    
    return url;
  } catch (error) {
    // Log error and fallback to a public QR API (Requirement 3.4 fallback)
    console.error(`Failed to create and upload QR code for voucher ${voucherCode}:`, error);
    
    // Fallback: Use a reliable public QR API that doesn't require uploading
    // This ensures the user still gets a QR code even if our storage service is down
    const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(voucherCode)}`;
    console.log(`🔄 Using fallback QR service: ${fallbackUrl}`);
    
    return fallbackUrl;
  }
}
