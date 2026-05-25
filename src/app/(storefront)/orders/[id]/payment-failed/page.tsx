import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { notFound, redirect } from "next/navigation"
import PaymentFailedClient from "./PaymentFailedClient"

export const dynamic = 'force-dynamic'

export default async function OrderPaymentFailedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const order = await prisma.order.findUnique({
    where: { id },
  })

  if (!order) {
    notFound()
  }

  // Security check
  if (order.userId !== session.user.id && session.user.role === 'CUSTOMER') {
    notFound()
  }

  // If already paid, redirect straight to tracking
  if (order.status === 'PREPARING' || order.status === 'READY' || order.status === 'COMPLETED') {
    redirect(`/orders/${order.id}`)
  }

  const mappedOrder = {
    id: order.id,
    total: order.total,
    status: order.status,
  }

  return (
    <PaymentFailedClient 
      order={mappedOrder}
    />
  )
}
