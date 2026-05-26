import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deductStockForOrder } from '@/lib/inventory-utils';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { api_key, client, sales_transactions } = body;

    // 1. Validasi API Key
    const secretApiKey = process.env.KULABOOTH_API_KEY || 'default_secret_key';
    if (!api_key || api_key !== secretApiKey) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 });
    }

    if (!sales_transactions || !Array.isArray(sales_transactions)) {
      return NextResponse.json({ error: 'Bad Request: sales_transactions array is required' }, { status: 400 });
    }

    const processedOrders: string[] = [];
    const skippedOrders: string[] = [];

    // 2. Proses tiap transaksi
    for (const txData of sales_transactions) {
      const orderId = `POS-${txData.id}`;

      // Cek apakah order sudah disinkronkan sebelumnya untuk menghindari double-entry
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (existingOrder) {
        skippedOrders.push(orderId);
        continue;
      }

      // Cari product berdasarkan ID (string) atau Nama (case-insensitive)
      let product = await prisma.product.findUnique({
        where: { id: String(txData.productId) },
      });

      if (!product) {
        product = await prisma.product.findFirst({
          where: { name: { equals: txData.productName, mode: 'insensitive' } },
        });
      }

      if (!product) {
        console.warn(`[POS SYNC] Product not found for ID: ${txData.productId}, Name: ${txData.productName}`);
        continue;
      }

      const totalRevenue = Math.round(txData.sellingPrice * txData.quantity);
      const orderTimestamp = txData.timestamp ? new Date(txData.timestamp) : new Date();

      // Buat Order di database menggunakan prisma transaction
      await prisma.$transaction(async (tx) => {
        await tx.order.create({
          data: {
            id: orderId,
            source: 'POS',
            orderType: 'PICKUP',
            customerName: 'Pelanggan POS',
            customerPhone: '',
            subtotal: totalRevenue,
            deliveryFee: 0,
            total: totalRevenue,
            paymentMethod: 'CASH',
            status: 'COMPLETED',
            createdAt: orderTimestamp,
            updatedAt: new Date(),
            items: {
              create: [
                {
                  productId: product.id,
                  qty: txData.quantity,
                  price: Math.round(txData.sellingPrice),
                },
              ],
            },
          },
        });
      });

      // 3. Jalankan pengurangan stok secara transaksional lewat utility terpusat
      await deductStockForOrder(orderId);
      processedOrders.push(orderId);
    }

    return NextResponse.json({
      success: true,
      message: 'Sync completed successfully',
      client: client || 'Unknown',
      processed: processedOrders,
      skipped: skippedOrders,
    });
  } catch (error: any) {
    console.error('[POS SYNC ERROR]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
