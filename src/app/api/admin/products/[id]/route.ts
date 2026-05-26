import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { logAdminAction } from '@/lib/admin-logger';

// PATCH /api/admin/products/[id] — Update product fields
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await request.json();
        const { name, description, price, categoryId, badge, image, modifiers } = body;

        const existingProduct = await prisma.product.findUnique({
            where: { id },
            select: { name: true, badge: true }
        });

        if (!existingProduct) {
            return new NextResponse('Product not found', { status: 404 });
        }

        const data: Record<string, any> = {};
        if (name !== undefined) data.name = name;
        if (description !== undefined) data.description = description;
        if (price !== undefined) data.price = Number(price);
        if (categoryId !== undefined) data.categoryId = categoryId;
        if (badge !== undefined) data.badge = badge;
        if (image !== undefined) data.image = image;
        if (modifiers !== undefined) data.modifiers = modifiers ? JSON.stringify(modifiers) : null;

        const product = await prisma.product.update({
            where: { id },
            data,
            include: { category: true },
        });

        let detailMessage = `Updated product manually: ${product.name}`;
        
        // Check if only the badge (availability) was updated
        const isOnlyBadgeUpdate = badge !== undefined && name === undefined && price === undefined && description === undefined;
        
        if (isOnlyBadgeUpdate) {
            const statusLabel = badge === 'sold-out' ? 'Habis (Sold Out)' : 'Tersedia (Available)';
            detailMessage = `Memperbarui status produk "${product.name}" menjadi ${statusLabel}`;
        } else {
            // General update details
            const changes = [];
            if (name !== undefined && name !== existingProduct.name) changes.push('name');
            if (price !== undefined) changes.push('price');
            if (badge !== undefined && badge !== existingProduct.badge) changes.push('availability');
            
            if (changes.length > 0) {
                detailMessage = `Mengedit produk "${product.name}" (Perubahan: ${changes.join(', ')})`;
            } else {
                detailMessage = `Mengedit produk "${product.name}"`;
            }
        }

        await logAdminAction({
            userId: session.user.id,
            action: 'UPDATE',
            entity: 'PRODUCT',
            entityId: id,
            details: detailMessage
        });

        return NextResponse.json(product);
    } catch (error) {
        console.error('Error updating product:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

// DELETE /api/admin/products/[id] — Delete a product
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (session?.user?.role !== 'ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Check if there are order items referencing this product
        const orderItemCount = await prisma.orderItem.count({
            where: { productId: id }
        });

        if (orderItemCount > 0) {
            // Cannot delete permanently due to order history, so soft-delete it by setting badge to 'archived'
            await prisma.product.update({
                where: { id },
                data: { badge: 'archived' }
            });

            await logAdminAction({
                userId: session.user.id,
                action: 'UPDATE',
                entity: 'PRODUCT',
                entityId: id,
                details: `Mengarsipkan produk (mengubah status menjadi Archived karena memiliki riwayat transaksi)`
            });

            return NextResponse.json({ 
                success: true, 
                message: 'Produk diarsipkan karena memiliki riwayat transaksi.',
                archived: true
            });
        }

        await prisma.product.delete({ where: { id } });

        await logAdminAction({
            userId: session.user.id,
            action: 'DELETE',
            entity: 'PRODUCT',
            entityId: id,
            details: `Menghapus produk secara permanen`
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error deleting product:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
