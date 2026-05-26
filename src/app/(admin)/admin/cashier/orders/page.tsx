import { prisma } from '@/lib/prisma';
import CashierOrdersClient from './CashierOrdersClient';
import { cleanupOldPaymentProofs } from '@/lib/order-utils';

export const revalidate = 0;

export default async function AdminCashierOrdersPage() {
  // Background cleanup of old payment proofs
  cleanupOldPaymentProofs().catch(err => console.error('[Background Cleanup Error]', err));

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startOfDay },
    },
    include: {
      items: { include: { product: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const storeSettings = await prisma.storeSettings.findFirst();

  const mappedOrders = orders.map((o) => ({
    id: o.id,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    orderType: o.orderType,
    tableNumber: o.tableNumber,
    address: o.address,
    paymentMethod: o.paymentMethod,
    total: o.total,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    paymentProofUrl: o.paymentProofUrl,
    items: o.items.map((item) => ({
      id: item.id,
      qty: item.qty,
      price: item.price,
      product: { name: item.product.name, image: item.product.image },
    })),
  }));

  return <CashierOrdersClient 
    initialOrders={mappedOrders} 
    storeLat={storeSettings?.storeLat || -6.2088}
    storeLng={storeSettings?.storeLng || 106.8456}
  />;
}
