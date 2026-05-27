import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 0;

export async function GET() {
  const count = await prisma.order.count({
    where: {
      status: { in: ['PENDING', 'PENDING_PAYMENT', 'PREPARING', 'READY', 'ASSIGNED'] },
    },
  });

  return NextResponse.json({ count });
}
