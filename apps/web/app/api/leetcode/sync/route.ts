import { NextRequest, NextResponse } from 'next/server';

const LEETCODE_API_URL = 'https://leetcode.com/graphql/';

/**
 * POST /api/leetcode/sync
 * 
 * Server-side proxy for LeetCode GraphQL API to avoid CORS issues.
 * Fetches user data including profile, stats, submissions, and calendar.
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

        return NextResponse.json(data.data);
    } catch (error) {
        console.error('LeetCode sync error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch from LeetCode' },
            { status: 500 }
        );
    }
}
