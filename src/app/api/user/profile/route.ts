import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, phone } = body;

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name: name !== undefined ? name : undefined,
                phone: phone !== undefined ? phone : undefined,
            },
        });

        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
