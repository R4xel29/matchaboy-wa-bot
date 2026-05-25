import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Login diperlukan untuk mengunggah bukti pembayaran' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { paymentProofUrl } = body;

    if (!paymentProofUrl) {
      return NextResponse.json({ error: 'Bukti pembayaran wajib dilampirkan' }, { status: 400 });
    }

    // Check if order exists and belongs to user
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    if (order.userId !== session.user.id && session.user.role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Tidak memiliki akses untuk pesanan ini' }, { status: 403 });
    }

    // Update order with payment proof and change status to PENDING (waiting cashier validation)
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        paymentProofUrl,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error('[API ORDER PAYMENT PROOF ERROR]', error);
    return NextResponse.json({ error: 'Gagal memperbarui bukti pembayaran' }, { status: 500 });
  }
}
