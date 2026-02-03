import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@project-beast/database';

const LEETCODE_API_URL = 'https://leetcode.com/graphql/';

// Cache to prevent too frequent syncs (sync at most once per 5 minutes)
let lastSyncTime = 0;
const SYNC_COOLDOWN = 5 * 60 * 1000; // 5 minutes

/**
 * Sync a single user's LeetCode stats
 */
async function syncUserStats(userId: string, leetcodeUsername: string) {
    try {
        const graphqlQuery = `
            query getUserCompleteData($username: String!, $year: Int) {
                matchedUser(username: $username) {
                    username
                    profile {
                        userAvatar
                    }
                    submitStatsGlobal {
                        acSubmissionNum {
                            difficulty
                            count
                        }
                    }
                    userCalendar(year: $year) {
                        streak
                    }
                }
            }
        `;

        const response = await fetch(LEETCODE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            body: JSON.stringify({
                query: graphqlQuery,
                variables: { username: leetcodeUsername, year: new Date().getFullYear() },
            }),
        });

        if (!response.ok) return;

        const data = await response.json();
        const lcUser = data.data?.matchedUser;
        if (!lcUser) return;

        const getCount = (difficulty: string) =>
            lcUser.submitStatsGlobal?.acSubmissionNum?.find((s: any) => s.difficulty === difficulty)?.count || 0;

        const easySolved = getCount('Easy');
        const mediumSolved = getCount('Medium');
        const hardSolved = getCount('Hard');
        const totalSolved = getCount('All');
        const calculatedXp = easySolved * 10 + mediumSolved * 25 + hardSolved * 50;
        const level = Math.floor(Math.sqrt(calculatedXp / 100)) + 1;
        const currentStreak = lcUser.userCalendar?.streak || 0;

        await prisma.user.update({
            where: { id: userId },
            data: {
                totalSolved,
                easySolved,
                mediumSolved,
                hardSolved,
                xp: calculatedXp,
                level,
                currentStreak,
                avatarUrl: lcUser.profile?.userAvatar || null,
                updatedAt: new Date(),
            },
        });

        console.log(`[Leaderboard Sync] Updated ${leetcodeUsername}: XP=${calculatedXp}, Solved=${totalSolved}`);
    } catch (error) {
        console.error(`Failed to sync ${leetcodeUsername}:`, error);
    }
}

/**
 * GET /api/leaderboard
 * Get weekly leaderboard data - auto-syncs all connected users first
 * Query params: tier (optional), limit (default 100)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const tier = searchParams.get('tier');
        const limit = parseInt(searchParams.get('limit') || '100', 10);

        // Sync all connected users (with cooldown to prevent spam)
        const now = Date.now();
        if (now - lastSyncTime > SYNC_COOLDOWN) {
            lastSyncTime = now;
            console.log('[Leaderboard] Starting background sync for all users...');

            // Get all users with connected LeetCode accounts
            const usersToSync = await prisma.user.findMany({
                where: { leetcodeUsername: { not: null } },
                select: { id: true, leetcodeUsername: true },
            });

            // Sync all users in parallel (but don't wait - fire and forget)
            Promise.all(
                usersToSync.map(user =>
                    syncUserStats(user.id, user.leetcodeUsername!)
                )
            ).then(() => {
                console.log(`[Leaderboard] Synced ${usersToSync.length} users`);
            }).catch(err => {
                console.error('[Leaderboard] Sync error:', err);
            });
        }

        // Calculate start of current week (Monday)
        const startOfWeek = new Date();
        startOfWeek.setHours(0, 0, 0, 0);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);

        // Get users with their stats
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
