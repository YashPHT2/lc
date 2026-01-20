import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@project-beast/database';

/**
 * GET /api/shop
 * Get available shop items
 */
export async function GET() {
    try {
        const items = await prisma.shopItem.findMany({
            where: {
                OR: [
                    { isLimited: false },
                    { isLimited: true, stock: { gt: 0 } },
                ],
            },
            orderBy: { price: 'asc' },
        });

        return NextResponse.json({ items });
    } catch (error) {
        console.error('Shop error:', error);
        return NextResponse.json({ error: 'Failed to get shop items' }, { status: 500 });
    }
}

/**
 * POST /api/shop
 * Purchase an item
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { itemId } = body;

        if (!itemId) {
            return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
        }

        // Get user and item
        const [user, item] = await Promise.all([
            prisma.user.findUnique({
                where: { clerkId: userId },
                select: { id: true, coins: true },
            }),
            prisma.shopItem.findUnique({
                where: { id: itemId },
            }),
        ]);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        // Check if already owned
        const existing = await prisma.userItem.findUnique({
            where: { userId_itemId: { userId: user.id, itemId } },
        });

        if (existing) {
            return NextResponse.json({ error: 'Already owned' }, { status: 400 });
        }

        // Check balance
        if (user.coins < item.price) {
            return NextResponse.json({ error: 'Insufficient coins' }, { status: 400 });
        }

        // Check stock for limited items
        if (item.isLimited && item.stock !== null && item.stock <= 0) {
            return NextResponse.json({ error: 'Out of stock' }, { status: 400 });
        }

        // Process purchase
        await prisma.$transaction([
            // Deduct coins
            prisma.user.update({
                where: { id: user.id },
                data: { coins: { decrement: item.price } },
            }),
            // Add to inventory
            prisma.userItem.create({
                data: { userId: user.id, itemId },
            }),
            // Create transaction record
            prisma.transaction.create({
                data: {
                    userId: user.id,
                    type: 'SHOP_PURCHASE',
                    amount: -item.price,
                    description: `Purchased ${item.name}`,
                    itemId,
                },
            }),
            // Decrement stock if limited
            ...(item.isLimited ? [
                prisma.shopItem.update({
                    where: { id: itemId },
                    data: { stock: { decrement: 1 } },
                }),
            ] : []),
        ]);

        return NextResponse.json({
            success: true,
            message: `Purchased ${item.name}!`,
            newBalance: user.coins - item.price,
        });
    } catch (error) {
        console.error('Purchase error:', error);
        return NextResponse.json({ error: 'Purchase failed' }, { status: 500 });
    }
}
