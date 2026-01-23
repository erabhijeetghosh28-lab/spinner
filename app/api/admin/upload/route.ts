import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
    try {
        // Get the file from the request
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only PNG, JPG, and WebP are allowed.' },
                { status: 400 }
            );
        }

        // Validate file size (max 4MB before optimization)
        const maxSize = 4 * 1024 * 1024; // 4MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 4MB.' },
                { status: 400 }
            );
        }

        // TODO: Add admin authentication check here
        // const session = await getServerSession();
        // if (!session?.user?.isAdmin) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Optimize image with sharp
        let optimizedBuffer: Buffer;
        let optimizedExtension = 'webp'; // Default to WebP for best compression
        
        try {
            // Resize if too large (max 2000px on longest side) and convert to WebP
            const image = sharp(buffer);
            const metadata = await image.metadata();
            
            // Determine if resize is needed
            const maxDimension = 2000;
            const needsResize = metadata.width && metadata.height && 
                (metadata.width > maxDimension || metadata.height > maxDimension);

            if (needsResize) {
                optimizedBuffer = await image
                    .resize(maxDimension, maxDimension, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .webp({ quality: 85, effort: 4 }) // Good balance of quality and file size
                    .toBuffer();
            } else {
                // Just optimize without resize
                optimizedBuffer = await image
                    .webp({ quality: 85, effort: 4 })
                    .toBuffer();
            }

            console.log(`[Upload] Image optimized: ${(buffer.length / 1024).toFixed(2)}KB -> ${(optimizedBuffer.length / 1024).toFixed(2)}KB`);
        } catch (optimizeError: any) {
            console.warn('[Upload] Image optimization failed, using original:', optimizeError.message);
            // Fallback to original if optimization fails
            optimizedBuffer = buffer;
            optimizedExtension = file.name.split('.').pop() || 'jpg';
        }

        // Generate a unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const filename = `prizes/${timestamp}-${randomString}.${optimizedExtension}`;

        // Upload optimized image to Vercel Blob
        const blob = await put(filename, optimizedBuffer, {
            access: 'public',
            addRandomSuffix: false,
            contentType: `image/${optimizedExtension}`,
        });

        console.log('[Upload] Success:', blob.url);

        return NextResponse.json({
            success: true,
            url: blob.url,
            filename: filename,
            optimized: true,
        });

    } catch (error: any) {
        console.error('[Upload] Error:', error);
        return NextResponse.json(
            {
                error: 'Upload failed',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            },
            { status: 500 }
        );
    }
}
