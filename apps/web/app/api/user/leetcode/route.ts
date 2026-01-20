import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@project-beast/database';

/**
 * GET /api/user/leetcode
 * 
 * Get the current user's linked LeetCode username.
 */
export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { leetcodeUsername: true },
        });

        return NextResponse.json({
            leetcodeUsername: user?.leetcodeUsername || null
        });
    } catch (error) {
        console.error('Get LeetCode username error:', error);
        return NextResponse.json({ error: 'Failed to get username' }, { status: 500 });
    }
}

/**
 * POST /api/user/leetcode
 * 
 * Link or update the user's LeetCode username.
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { leetcodeUsername } = body;

        if (!leetcodeUsername || typeof leetcodeUsername !== 'string') {
            return NextResponse.json(
                { error: 'Invalid LeetCode username' },
                { status: 400 }
            );
        }

        // Upsert user - create if doesn't exist, update if exists
        const user = await prisma.user.upsert({
            where: { clerkId: userId },
            update: {
                leetcodeUsername: leetcodeUsername.trim(),
                updatedAt: new Date(),
            },
            create: {
                clerkId: userId,
                email: `${userId}@placeholder.com`, // Will be updated later with real email
                username: `${leetcodeUsername.trim()}_${Math.floor(Math.random() * 1000)}`, // Ensure uniqueness or use a better strategy
                leetcodeUsername: leetcodeUsername.trim(),
            },
        });

        return NextResponse.json({
            success: true,
            leetcodeUsername: user.leetcodeUsername,
        });
    } catch (error) {
        console.error('Save LeetCode username error:', error);
        return NextResponse.json({ error: 'Failed to save username' }, { status: 500 });
    }
}

/**
 * DELETE /api/user/leetcode
 * 
 * Unlink the user's LeetCode account.
 */
export async function DELETE() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await prisma.user.update({
            where: { clerkId: userId },
            data: { leetcodeUsername: null },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Unlink LeetCode error:', error);
        return NextResponse.json({ error: 'Failed to unlink' }, { status: 500 });
    }
}
