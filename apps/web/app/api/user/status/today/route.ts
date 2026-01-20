import { NextRequest, NextResponse } from 'next/server';
import { leetcodeClient } from '@/lib/leetcode';

/**
 * GET /api/user/status/today
 * 
 * "The Enforcer" API endpoint
 * Returns whether the user has solved a LeetCode problem today
 * 
 * Query Parameters:
 * - username: LeetCode username (required)
 * 
 * Response:
 * {
 *   hasSolved: boolean,
 *   timestamp: string | null,
 *   problemsToday: number,
 *   currentStreak: number
 * }
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');

        if (!username) {
            return NextResponse.json(
                { error: 'Missing required parameter: username' },
                { status: 400 }
            );
        }

        const status = await leetcodeClient.hasUserSolvedToday(username);

        return NextResponse.json(status, {
            status: 200,
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
            },
        });
    } catch (error) {
        console.error('Enforcer API error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch daily status',
                hasSolved: false,
                timestamp: null,
                problemsToday: 0,
                currentStreak: 0,
            },
            { status: 500 }
        );
    }
}
