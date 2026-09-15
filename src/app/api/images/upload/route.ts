import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

// Configure Cloudinary server-side from environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

/**
 * POST /api/images/upload
 * Cloudinary Cloud Upload & Local Disk Storage Fallback
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob | null;

    if (!file || !(file instanceof Blob) || file.size === 0) {
      return NextResponse.json(
        { error: 'No image file uploaded or file was empty.' },
        { status: 400 }
      );
    }

    // Validate image mime type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/avif', 'image/gif'];
    if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: `Unsupported image format: ${file.type}. Please upload a JPG, PNG, WEBP, or HEIC image.` },
        { status: 400 }
      );
    }

    // Max 15MB file size
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image size exceeds the 15MB upload limit.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. If Cloudinary credentials are configured, upload directly to Cloudinary
    if (cloudName && apiKey && apiSecret) {
      const uploadPromise = new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'tote/artisan_products',
            tags: ['tote_artisan_bag', 'e_commerce'],
            resource_type: 'image',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });

      const uploadResult = await uploadPromise;

      const publicId = uploadResult.public_id;
      const originalImageUrl = uploadResult.secure_url;

      // Generate the AI-Enhanced URL with Cloudinary transformations:
      // 1. e_improve: auto-adjust lighting, saturation, contrast
      // 2. e_sharpen:80: reveal authentic fabric thread texture & artisan stitches
      // 3. b_white,c_pad,w_1200,h_1200,ar_1:1: clean professional product staging
      // 4. f_auto,q_auto: best format & quality optimization
      const enhancedImageUrl = cloudinary.url(publicId, {
        transformation: [
          { effect: 'improve' },
          { effect: 'sharpen:80' },
          { background: 'white', crop: 'pad', width: 1200, height: 1200, aspect_ratio: '1:1' },
          { fetch_format: 'auto', quality: 'auto' },
        ],
        secure: true,
      });

      return NextResponse.json({
        success: true,
        storageMode: 'cloudinary_cloud',
        cloudinaryPublicId: publicId,
        originalImageUrl,
        enhancedImageUrl,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
      });
    }

    // 2. Fallback: Save directly to local filesystem in public/uploads/
    // This allows artisans to upload real pictures and serve them immediately without external API keys
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });

      const rawExt = file.type.split('/')[1] || 'jpg';
      const cleanExt = rawExt.replace('jpeg', 'jpg').replace('svg+xml', 'svg');
      const filename = `tote_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${cleanExt}`;
      const filePath = path.join(uploadsDir, filename);

      await fs.writeFile(filePath, buffer);
      const localUrl = `/uploads/${filename}`;

      return NextResponse.json({
        success: true,
        storageMode: 'local_disk',
        cloudinaryPublicId: filename,
        originalImageUrl: localUrl,
        enhancedImageUrl: localUrl,
        width: 1200,
        height: 1200,
        format: cleanExt,
        bytes: file.size,
      });
    } catch (fsErr) {
      // Fallback 3: In-memory base64 data URL
      const base64Data = `data:${file.type};base64,${buffer.toString('base64')}`;
      return NextResponse.json({
        success: true,
        storageMode: 'base64_fallback',
        cloudinaryPublicId: `local_${Date.now()}`,
        originalImageUrl: base64Data,
        enhancedImageUrl: base64Data,
        width: 1000,
        height: 1000,
        format: file.type.split('/')[1] || 'jpeg',
        bytes: file.size,
      });
    }
  } catch (error: any) {
    console.error('Image upload route error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process image upload.' },
      { status: 500 }
    );
  }
}
