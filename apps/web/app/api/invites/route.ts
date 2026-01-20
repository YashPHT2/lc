import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@project-beast/database';

/**
 * GET /api/invites
 * Get pending invites for the current user
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
            return NextResponse.json({ invites: [] });
        }

        const invites = await prisma.invite.findMany({
            where: {
                toId: user.id,
                status: 'PENDING',
            },
            orderBy: { createdAt: 'desc' },
        });

        // Get sender info for each invite
        const invitesWithSender = await Promise.all(
            invites.map(async (inv) => {
                const sender = await prisma.user.findUnique({
                    where: { id: inv.fromId },
                    select: { username: true, avatarUrl: true },
                });
                return {
                    id: inv.id,
                    roomCode: inv.roomCode,
                    message: inv.message,
                    createdAt: inv.createdAt,
                    from: sender,
                };
            })
        );

        return NextResponse.json({ invites: invitesWithSender });
    } catch (error) {
        console.error('Get invites error:', error);
        return NextResponse.json({ error: 'Failed to get invites' }, { status: 500 });
    }
}

/**
 * POST /api/invites
 * Send a room invite to a friend
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { toUserId, roomCode, message } = body;

        if (!toUserId || !roomCode) {
            return NextResponse.json({ error: 'Missing toUserId or roomCode' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true, username: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Create invite
        const invite = await prisma.invite.create({
            data: {
                fromId: user.id,
                toId: toUserId,
                roomCode,
                message: message || `${user.username} invited you to battle!`,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min expiry
            },
        });

        return NextResponse.json({ success: true, invite });
    } catch (error) {
        console.error('Send invite error:', error);
        return NextResponse.json({ error: 'Failed to send invite' }, { status: 500 });
    }
}

/**
 * PUT /api/invites
 * Accept or decline an invite
 */
export async function PUT(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { inviteId, action } = body;

        if (!inviteId || !['accept', 'decline'].includes(action)) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const invite = await prisma.invite.findUnique({
            where: { id: inviteId },
        });

        if (!invite || invite.toId !== user.id) {
            return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
        }

        const updated = await prisma.invite.update({
            where: { id: inviteId },
            data: {
                status: action === 'accept' ? 'ACCEPTED' : 'DECLINED',
            },
        });

        return NextResponse.json({
            success: true,
            roomCode: action === 'accept' ? updated.roomCode : null,
        });
    } catch (error) {
        console.error('Handle invite error:', error);
        return NextResponse.json({ error: 'Failed to handle invite' }, { status: 500 });
    }
}
