import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const secretApiKey = process.env.KULABOOTH_API_KEY || 'default_secret_key';
    const formData = await req.formData();
    const apiKey = formData.get('api_key') as string;
    const imageFile = formData.get('image') as File | null;

    if (!apiKey || apiKey !== secretApiKey) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!imageFile) {
      return NextResponse.json({ success: false, error: 'No image provided' }, { status: 400 });
    }

    // Validasi ukuran file (max 5MB)
    if (imageFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File terlalu besar (max 5MB)' }, { status: 400 });
    }

    // Validasi tipe file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json({ success: false, error: 'Format gambar tidak didukung (gunakan JPG, PNG, atau WebP)' }, { status: 400 });
    }

    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), 'public', 'products', 'kulabooth');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const ext = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = allowedTypes.includes(`image/${ext}`) ? ext : 'jpg';
    const filename = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${safeExt}`;
    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const imageUrl = `/products/kulabooth/${filename}`;
    return NextResponse.json({ success: true, imageUrl });
  } catch (error: any) {
    console.error('[UPLOAD IMAGE ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
