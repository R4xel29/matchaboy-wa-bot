import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { logAdminAction } from '@/lib/admin-logger';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        // RBAC: Only ADMIN or DRIVER could theoretically update orders, but let's stick to ADMIN for Phase 10
        if (session?.user?.role !== 'ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await request.json();
        const { status } = body;

        const validStatuses = ['PENDING_PAYMENT', 'ASSIGNED', 'TO_STORE', 'PICKED_UP', 'ON_DELIVERY', 'DELIVERED'];
        if (!validStatuses.includes(status)) {
            return new NextResponse('Invalid status', { status: 400 });
        }

        const { id } = await params;
        const existingOrder = await prisma.order.findUnique({
            where: { id },
            select: { id: true, status: true, customerName: true }
        });

        if (!existingOrder) {
            return new NextResponse('Order not found', { status: 404 });
        }

        const order = await prisma.order.update({
            where: {
                id,
            },
            data: {
                status,
            },
        });

        await logAdminAction({
            userId: session.user.id,
            action: 'UPDATE',
            entity: 'ORDER',
            entityId: id,
            details: `Mengubah status pesanan #${id.slice(-6).toUpperCase()} (${existingOrder.customerName}) dari ${existingOrder.status} menjadi ${status}`
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error('Error updating order:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
