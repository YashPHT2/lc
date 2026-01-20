import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@project-beast/database';

/**
 * GET /api/coins/transactions
 * Get transaction history for current user
 */
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ transactions: [] });
        }

        const transactions = await prisma.transaction.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 50, // Last 50 transactions
        });

        return NextResponse.json({ transactions });
    } catch (error) {
        console.error('Get transactions error:', error);
        return NextResponse.json({ error: 'Failed to get transactions' }, { status: 500 });
    }
}
