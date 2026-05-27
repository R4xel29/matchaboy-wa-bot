import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import sharp from 'sharp';
import { uploadToSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Must be image
        if (!file.type.includes('image')) {
            return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const safeName = file.name
            .replace(/\.[^.]+$/, '') // remove extension
            .replace(/[^a-zA-Z0-9-_]/g, '-') // sanitize
            .toLowerCase()
            .slice(0, 50);
        
        const filename = `avatar-${session.user.id}-${timestamp}.webp`;

        // Buffer and process with sharp (in-memory)
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const processedBuffer = await sharp(buffer)
            .resize(300, 300, { fit: 'cover' }) // Crop to square for profile picture
            .webp({ quality: 80 })
            .toBuffer();

        // Upload to Supabase Storage in the 'drivers' bucket
        const publicUrl = await uploadToSupabase(
            'drivers',
            filename,
            processedBuffer,
            'image/webp'
        );

        return NextResponse.json({ url: publicUrl });
    } catch (error) {
        console.error('User upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
