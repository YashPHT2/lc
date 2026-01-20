import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@project-beast/database';

/**
 * GET /api/friends/requests
 * Get pending friend requests for the current user
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
            return NextResponse.json({ requests: [] });
        }

        // Get incoming requests
        const incoming = await prisma.friend.findMany({
            where: {
                receiverId: user.id,
                status: 'PENDING',
            },
            include: {
                initiator: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                        leetcodeUsername: true,
                        level: true,
                    },
                },
            },
        });

        // Get outgoing requests
        const outgoing = await prisma.friend.findMany({
            where: {
                initiatorId: user.id,
                status: 'PENDING',
            },
            include: {
                receiver: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                        leetcodeUsername: true,
                        level: true,
                    },
                },
            },
        });

        return NextResponse.json({
            incoming: incoming.map((r) => ({
                requestId: r.id,
                user: r.initiator,
                createdAt: r.createdAt,
            })),
            outgoing: outgoing.map((r) => ({
                requestId: r.id,
                user: r.receiver,
                createdAt: r.createdAt,
            })),
        });
    } catch (error) {
        console.error('Get requests error:', error);
        return NextResponse.json({ error: 'Failed to get requests' }, { status: 500 });
    }
}

/**
 * POST /api/friends/requests
 * Accept or decline a friend request
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { requestId, action } = body;

        if (!requestId || !['accept', 'decline'].includes(action)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Find the request
        const friendRequest = await prisma.friend.findUnique({
            where: { id: requestId },
        });

        if (!friendRequest || friendRequest.receiverId !== user.id) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        if (friendRequest.status !== 'PENDING') {
            return NextResponse.json({ error: 'Request already handled' }, { status: 400 });
        }

        // Update status
        const updated = await prisma.friend.update({
            where: { id: requestId },
            data: {
                status: action === 'accept' ? 'ACCEPTED' : 'BLOCKED',
            },
        });

        return NextResponse.json({ success: true, status: updated.status });
    } catch (error) {
        console.error('Handle request error:', error);
        return NextResponse.json({ error: 'Failed to handle request' }, { status: 500 });
    }
}
