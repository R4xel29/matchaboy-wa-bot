import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET: Get current shift + history
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user || (session.user.role !== 'CASHIER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activeShift = await prisma.cashierShift.findFirst({
      where: {
        cashierId: session.user.id,
        closedAt: null
      }
    })

    const history = await prisma.cashierShift.findMany({
      where: { cashierId: session.user.id },
      orderBy: { openedAt: 'desc' },
      take: 10
    })

    return NextResponse.json({ activeShift, history })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch shifts' }, { status: 500 })
  }
}

// POST: Open new shift
export async function POST(req: Request) {
  try {
    const session = await auth()
    
    if (!session?.user || (session.user.role !== 'CASHIER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if there's already an active shift
    const existing = await prisma.cashierShift.findFirst({
      where: {
        cashierId: session.user.id,
        closedAt: null
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'Sudah ada shift yang aktif. Tutup shift terlebih dahulu.' }, { status: 400 })
    }

    const body = await req.json()

    const shift = await prisma.cashierShift.create({
      data: {
        cashierId: session.user.id,
        openingCash: body.openingCash || 0,
        notes: body.notes || null
      }
    })

    return NextResponse.json({ success: true, shift })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to open shift' }, { status: 500 })
  }
}

// PATCH: Close shift
export async function PATCH(req: Request) {
  try {
    const session = await auth()
    
    if (!session?.user || (session.user.role !== 'CASHIER' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    const activeShift = await prisma.cashierShift.findFirst({
      where: {
        cashierId: session.user.id,
        closedAt: null
      }
    })

    if (!activeShift) {
      return NextResponse.json({ error: 'Tidak ada shift yang aktif' }, { status: 400 })
    }

    const shift = await prisma.cashierShift.update({
      where: { id: activeShift.id },
      data: {
        closedAt: new Date(),
        closingCash: body.closingCash || 0,
        notes: body.notes || activeShift.notes
      }
    })

    return NextResponse.json({ success: true, shift })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to close shift' }, { status: 500 })
  }
}
