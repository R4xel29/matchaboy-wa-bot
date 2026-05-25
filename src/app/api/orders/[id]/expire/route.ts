import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// POST: Expire an unpaid order when countdown timer runs out
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Wrap in interactive transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch the order
      const order = await tx.order.findUnique({
        where: { id },
        include: {
          user: true
        }
      })

      if (!order) {
        throw new Error('Pesanan tidak ditemukan')
      }

      // Safeguard: Only expire orders that are actually waiting for payment
      if (order.status !== 'PENDING_PAYMENT') {
        return { success: true, message: 'No-op: Status pesanan sudah terproses (bukan pending payment)', orderStatus: order.status }
      }

      // 2. Mark order as CANCELLED
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          notes: order.notes 
            ? `${order.notes}\n[Sistem] Pembayaran kedaluwarsa (15 menit).`
            : '[Sistem] Pembayaran kedaluwarsa (15 menit).'
        }
      })

      // 3. Restore used points if any
      const pointHistories = await tx.pointHistory.findMany({
        where: {
          orderId: id,
          amount: { lt: 0 } // Negative points (redeem)
        }
      })

      for (const ph of pointHistories) {
        const refundAmount = Math.abs(ph.amount)
        // Increment user's points
        await tx.user.update({
          where: { id: order.userId || '' },
          data: { points: { increment: refundAmount } }
        })
        // Log the refund in PointHistory
        await tx.pointHistory.create({
          data: {
            userId: order.userId || '',
            amount: refundAmount,
            type: 'ADMIN_ADJUST', // Or a new type if we want, ADMIN_ADJUST is safe
            description: `Pengembalian ${refundAmount} poin karena pesanan #${id.slice(0, 8).toUpperCase()} kedaluwarsa/gagal`,
            orderId: id
          }
        })
      }

      // 4. Restore used voucher if any
      if (order.voucherCode) {
        const voucher = await tx.voucher.findUnique({
          where: { code: order.voucherCode }
        })
        if (voucher && voucher.isUsed) {
          await tx.voucher.update({
            where: { id: voucher.id },
            data: {
              isUsed: false,
              usedAt: null
            }
          })
        }
      }

      return { success: true, message: 'Pesanan berhasil dibatalkan karena kedaluwarsa', orderStatus: 'CANCELLED' }
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[API ORDER EXPIRE ERROR]', error)
    return NextResponse.json({ error: error.message || 'Gagal membatalkan pesanan' }, { status: 500 })
  }
}
