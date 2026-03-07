import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const session = await auth()
        const body = await req.json()

        // Server-side validation
        if (!body.items || body.items.length === 0) {
            return NextResponse.json({ error: 'Keranjang kosong' }, { status: 400 })
        }

        if (!body.address || !body.name || !body.phone) {
            return NextResponse.json({ error: 'Data pengiriman tidak lengkap' }, { status: 400 })
        }

        // --- SECURE SERVER-SIDE PRICE CALCULATION ---
        const productIds = body.items.map((item: any) => item.productId)
        const dbProducts = await prisma.product.findMany({
            where: { id: { in: productIds } }
        })

        let secureSubtotal = 0
        const orderItemsToCreate = []

        for (const item of body.items) {
            const dbProduct = dbProducts.find(p => p.id === item.productId)
            if (!dbProduct) {
                return NextResponse.json({ error: `Produk tidak ditemukan: ${item.name}` }, { status: 400 })
            }

            // Parse DB modifiers
            let dbModifiers: any = {}
            if (dbProduct.modifiers) {
                try {
                    dbModifiers = JSON.parse(dbProduct.modifiers)
                } catch {
                    // Ignore schema parse error
                }
            }

            // Calculate Add-Ons total
            let addOnsTotal = 0
            if (item.addOnIds && Array.isArray(item.addOnIds) && dbModifiers.addOns) {
                for (const addOnId of item.addOnIds) {
                    const validAddOn = dbModifiers.addOns.find((a: any) => a.id === addOnId)
                    if (validAddOn) {
                        addOnsTotal += validAddOn.price
                    }
                }
            }

            // Secure item price calculation
            const secureItemPrice = dbProduct.price + addOnsTotal
            const secureItemTotal = secureItemPrice * item.quantity
            secureSubtotal += secureItemTotal

            orderItemsToCreate.push({
                productId: dbProduct.id,
                qty: item.quantity,
                price: secureItemPrice, // Base + add-ons
                modifiers: item.modsString || null
            })
        }

        const deliveryFee = body.deliveryFee || 0
        const secureTotal = secureSubtotal + deliveryFee

        // Format address into a single string
        const fullAddress = `${body.address.label} - ${body.address.detail}${body.notes ? ` (Catatan: ${body.notes})` : ''}`

        // Create the order
        const order = await prisma.order.create({
            data: {
                userId: session?.user?.id || null,
                customerName: body.name,
                customerPhone: body.phone,
                address: fullAddress,
                distanceKm: body.address.distance || 0,
                subtotal: secureSubtotal,
                deliveryFee,
                total: secureTotal,
                paymentMethod: body.paymentMethod.toUpperCase(),
                status: body.paymentMethod === 'cod' ? 'ASSIGNED' : 'PENDING_PAYMENT',
                items: {
                    create: orderItemsToCreate
                }
            }
        })

        // If Midtrans, we would generate a Snap Token here in Phase 9.3

        return NextResponse.json({ success: true, orderId: order.id, total: secureTotal })
    } catch (error) {
        console.error('Checkout error:', error)
        return NextResponse.json({ error: 'Gagal membuat pesanan' }, { status: 500 })
    }
}
