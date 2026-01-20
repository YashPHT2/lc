import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@project-beast/database';

/**
 * GET /api/friends
 * Get all friends for the current user (accepted only)
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's DB ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ friends: [] });
    }

    // Get all accepted friendships (both directions)
    const friendships = await prisma.friend.findMany({
      where: {
        OR: [
          { initiatorId: user.id, status: 'ACCEPTED' },
          { receiverId: user.id, status: 'ACCEPTED' },
        ],
      },
      include: {
        initiator: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            leetcodeUsername: true,
            xp: true,
            level: true,
            leagueTier: true,
            currentStreak: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            leetcodeUsername: true,
            xp: true,
            level: true,
            leagueTier: true,
            currentStreak: true,
          },
        },
      },
    });

    // Map to friend list (get the other person)
    const friends = friendships.map((f) => {
      const friend = f.initiatorId === user.id ? f.receiver : f.initiator;
      return {
        friendshipId: f.id,
        isRival: f.isRival,
        ...friend,
      };
    });

    return NextResponse.json({ friends });
  } catch (error) {
    console.error('Get friends error:', error);
    return NextResponse.json({ error: 'Failed to get friends' }, { status: 500 });
  }
}

/**
 * POST /api/friends
 * Send a friend request
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, username: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find target user
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { leetcodeUsername: username },
        ],
      },
      select: { id: true, username: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.id === currentUser.id) {
      return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 });
    }

    // Check if friendship already exists
    const existing = await prisma.friend.findFirst({
      where: {
        OR: [
          { initiatorId: currentUser.id, receiverId: targetUser.id },
          { initiatorId: targetUser.id, receiverId: currentUser.id },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        return NextResponse.json({ error: 'Already friends' }, { status: 400 });
      }
      if (existing.status === 'PENDING') {
        return NextResponse.json({ error: 'Request already pending' }, { status: 400 });
      }
    }

    // Create friend request
    const friendship = await prisma.friend.create({
      data: {
        initiatorId: currentUser.id,
        receiverId: targetUser.id,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, friendship });
  } catch (error) {
    console.error('Add friend error:', error);
    return NextResponse.json({ error: 'Failed to send request' }, { status: 500 });
  }
}
