# UploadThing Setup Guide

## Overview
UploadThing is integrated for direct image uploads with automatic optimization and compression.

## Environment Variables

Add these to your `.env` file:

```env
# UploadThing Configuration
UPLOADTHING_SECRET=your_uploadthing_secret_key
UPLOADTHING_APP_ID=your_uploadthing_app_id
```

## Getting Your UploadThing Keys

1. **Sign up/Login**: Go to [https://uploadthing.com](https://uploadthing.com)
2. **Create an App**: Create a new app in your dashboard
3. **Get API Keys**: 
   - Copy your `UPLOADTHING_SECRET` from the API Keys section
   - Copy your `UPLOADTHING_APP_ID` from the App Settings

## Features

### Automatic Image Optimization
- **Compression**: Images are automatically compressed to reduce file size
- **Format Conversion**: Images are converted to WebP when possible for better performance
- **Thumbnail Generation**: Thumbnails are automatically generated
- **Max File Size**: 4MB per image
- **Supported Formats**: JPEG, PNG, WebP, GIF

### Usage in Admin Dashboard
1. Navigate to the Prize table in the Overview or Campaigns tab
2. Click the "Upload" button next to any prize
3. Select an image file (or paste a URL as fallback)
4. The image will be automatically uploaded and optimized
5. The URL will be saved to the prize's `imageUrl` field

## API Endpoints

- **POST** `/api/uploadthing`: Upload endpoint (handled by UploadThing SDK)
- **GET** `/api/uploadthing`: File info endpoint

## Manual URL Fallback

If you prefer to use external image URLs (e.g., from Cloudinary, AWS S3, etc.), you can paste the URL directly in the input field. The upload button is optional.

## Troubleshooting

### Upload Fails
- Check that `UPLOADTHING_SECRET` and `UPLOADTHING_APP_ID` are set correctly
- Verify your UploadThing account has sufficient quota
- Check browser console for detailed error messages

### Images Not Displaying
- Verify the image URL is accessible
- Check CORS settings if using external URLs
- Ensure the image format is supported (JPEG, PNG, WebP, GIF)

## Security

- Uploads are authenticated via admin token
- Only authenticated admin users can upload images
- File type validation is enforced (images only)
- File size limits prevent abuse (4MB max)
