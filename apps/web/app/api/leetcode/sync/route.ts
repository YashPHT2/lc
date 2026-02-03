import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@project-beast/database';

const LEETCODE_API_URL = 'https://leetcode.com/graphql/';

/**
 * POST /api/leetcode/sync
 * 
 * Server-side proxy for LeetCode GraphQL API to avoid CORS issues.
 * Fetches user data including profile, stats, submissions, and calendar.
 * Also saves the stats to the database for leaderboard.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, query, variables } = body;

    if (!username && !query) {
      return NextResponse.json(
        { error: 'Missing username or query' },
        { status: 400 }
      );
    }

    // If username provided, use the complete data query
    const graphqlQuery = query || `
      query getUserCompleteData($username: String!, $year: Int) {
        matchedUser(username: $username) {
          username
          profile {
            realName
            userAvatar
            ranking
            reputation
          }
          submitStatsGlobal {
            acSubmissionNum {
              difficulty
              count
            }
          }
          userCalendar(year: $year) {
            streak
            totalActiveDays
            submissionCalendar
          }
        }
        recentSubmissionList(username: $username, limit: 20) {
          title
          titleSlug
          timestamp
          statusDisplay
          lang
        }
      }
    `;

    const graphqlVariables = variables || {
      username,
      year: new Date().getFullYear(),
    };

    const response = await fetch(LEETCODE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://leetcode.com',
        'Referer': 'https://leetcode.com',
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: graphqlVariables,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `LeetCode API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.errors) {
      return NextResponse.json(
        { error: data.errors[0]?.message || 'GraphQL error' },
        { status: 400 }
      );
    }

    // SAVE STATS TO DATABASE for leaderboard
    try {
      const { userId } = await auth();
      if (userId && data.data?.matchedUser) {
        const lcUser = data.data.matchedUser;
        const getCount = (difficulty: string) =>
          lcUser.submitStatsGlobal?.acSubmissionNum?.find((s: any) => s.difficulty === difficulty)?.count || 0;

        const easySolved = getCount('Easy');
        const mediumSolved = getCount('Medium');
        const hardSolved = getCount('Hard');
        const totalSolved = getCount('All');
        const calculatedXp = easySolved * 10 + mediumSolved * 25 + hardSolved * 50;
        const level = Math.floor(Math.sqrt(calculatedXp / 100)) + 1;
        const currentStreak = lcUser.userCalendar?.streak || 0;

        // Update user stats in database
        await prisma.user.update({
          where: { clerkId: userId },
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
        console.log(`[Sync] Updated stats for user ${userId}: XP=${calculatedXp}, Solved=${totalSolved}, Streak=${currentStreak}`);
      }
    } catch (dbError) {
      // Log but don't fail the request - stats sync is best effort
      console.error('Failed to save stats to database:', dbError);
    }

    return NextResponse.json(data.data);
  } catch (error) {
    console.error('LeetCode sync error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from LeetCode' },
      { status: 500 }
    );
  }
}
