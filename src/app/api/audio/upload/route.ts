import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

// Configure Cloudinary server-side from environment variables
// Audio uploads switch to Cloudinary automatically once
// CLOUDINARY_* env vars are present in .env.local
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
 * POST /api/audio/upload
 * Cloudinary Audio Upload & Local Disk Storage Fallback
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob | null;

    if (!file || !(file instanceof Blob) || file.size === 0) {
      return NextResponse.json(
        { error: 'No audio file provided or recording was empty.' },
        { status: 400 }
      );
    }

    // Validate audio mime type
    const validTypes = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/mp4',
      'audio/mpeg',
      'audio/wav',
      'audio/x-wav',
      'audio/ogg',
    ];
    if (!validTypes.includes(file.type) && !file.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: `Unsupported audio format: ${file.type}. Please record with a supported browser.` },
        { status: 400 }
      );
    }

    // Max 25MB file size (Whisper API transcription limit)
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Audio recording exceeds the 25MB upload limit.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. If Cloudinary credentials are configured, upload directly to Cloudinary
    // Cloudinary stores audio as a 'video' resource for instant streaming delivery
    if (cloudName && apiKey && apiSecret) {
      const uploadPromise = new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'tote/artisan_audio',
            tags: ['tote_artisan_narration', 'e_commerce'],
            resource_type: 'video',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });

      const uploadResult = await uploadPromise;

      return NextResponse.json({
        success: true,
        storageMode: 'cloudinary_cloud',
        audioUrl: uploadResult.secure_url,
        duration: uploadResult.duration || null,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
      });
    }

    // 2. Fallback: Save directly to local filesystem in public/uploads/
    // Allows artisans to store real narrations without external API keys yet
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });

      const rawExt = (file.type.split('/')[1] || 'webm').split(';')[0];
      const cleanExt = rawExt.replace('x-wav', 'wav').replace('mpeg', 'mp3');
      const filename = `tote_audio_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${cleanExt}`;
      const filePath = path.join(uploadsDir, filename);

      await fs.writeFile(filePath, buffer);
      const localUrl = `/uploads/${filename}`;

      return NextResponse.json({
        success: true,
        storageMode: 'local_disk',
        audioUrl: localUrl,
        bytes: file.size,
      });
    } catch (fsErr) {
      // Fallback 3: In-memory base64 data URL
      const base64Data = `data:${file.type};base64,${buffer.toString('base64')}`;
      return NextResponse.json({
        success: true,
        storageMode: 'base64_fallback',
        audioUrl: base64Data,
        bytes: file.size,
      });
    }
  } catch (error: any) {
    console.error('Audio upload route error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process audio upload.' },
      { status: 500 }
    );
  }
}