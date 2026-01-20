import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@project-beast/database';

/**
 * GET /api/coins
 * Get current user's coin balance
 */
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true, coins: true, username: true },
        });

        if (!user) {
            return NextResponse.json({ coins: 0 });
        }

        return NextResponse.json({ coins: user.coins });
    } catch (error) {
        console.error('Get coins error:', error);
        return NextResponse.json({ error: 'Failed to get coins' }, { status: 500 });
    }
}

/**
 * POST /api/coins
 * Add or deduct coins (internal use - for battles, rewards, etc.)
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { amount, type, description, roomCode, itemId } = body;

        if (typeof amount !== 'number' || !type || !description) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true, coins: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check if user has enough coins for deduction
        if (amount < 0 && user.coins + amount < 0) {
            return NextResponse.json({ error: 'Insufficient coins' }, { status: 400 });
        }

        // Update coins and create transaction in a transaction
        const [updatedUser, transaction] = await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { coins: { increment: amount } },
                select: { coins: true },
            }),
            prisma.transaction.create({
                data: {
                    userId: user.id,
                    type,
                    amount,
                    description,
                    roomCode,
                    itemId,
                },
            }),
        ]);

        return NextResponse.json({
            success: true,
            newBalance: updatedUser.coins,
            transaction,
        });
    } catch (error) {
        console.error('Coins transaction error:', error);
        return NextResponse.json({ error: 'Transaction failed' }, { status: 500 });
    }
}
