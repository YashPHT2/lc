import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@project-beast/database';

/**
 * GET /api/leaderboard
 * Get weekly leaderboard data
 * Query params: tier (optional), limit (default 100)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tier = searchParams.get('tier');
        const limit = parseInt(searchParams.get('limit') || '100', 10);

        // Calculate start of current week (Monday)
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setHours(0, 0, 0, 0);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1);

        // Get users with their weekly stats
        const users = await prisma.user.findMany({
            where: tier ? { leagueTier: tier as any } : undefined,
            select: {
                id: true,
                username: true,
                avatarUrl: true,
                xp: true,
                level: true,
                leagueTier: true,
                currentStreak: true,
                totalSolved: true,
                coins: true,
            },
            orderBy: [
                { xp: 'desc' },
                { totalSolved: 'desc' },
            ],
            take: limit,
        });

        // Add rank
        const leaderboard = users.map((user, index) => ({
            rank: index + 1,
            ...user,
        }));

        return NextResponse.json({
            leaderboard,
            weekStart: startOfWeek.toISOString(),
            totalUsers: await prisma.user.count(),
        });
    } catch (error) {
        console.error('Leaderboard error:', error);
        return NextResponse.json({ error: 'Failed to get leaderboard' }, { status: 500 });
    }
}
