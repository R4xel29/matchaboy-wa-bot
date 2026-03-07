import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const favorites = await prisma.favorite.findMany({
            where: { userId: session.user.id },
            include: { product: true },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(favorites);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { productId, cartJson } = body;

        if (!productId) {
            return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
        }

        const existing = await prisma.favorite.findUnique({
            where: {
                userId_productId: {
                    userId: session.user.id,
                    productId,
                },
            },
        });

        if (existing) {
            return NextResponse.json({ error: "Already in favorites" }, { status: 400 });
        }

        const newFavorite = await prisma.favorite.create({
            data: {
                userId: session.user.id,
                productId,
                cartJson: cartJson || null,
            },
            include: { product: true },
        });

        return NextResponse.json(newFavorite, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
