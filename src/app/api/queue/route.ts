import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 0;

export async function GET() {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const activeOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startOfDay },
        status: { in: ['PREPARING', 'READY'] },
        queueNumber: { not: null }
      },
      select: {
        id: true,
        queueNumber: true,
        customerName: true,
        status: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ orders: activeOrders });
  } catch (error) {
    console.error('Queue API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
