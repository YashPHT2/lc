import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/leetcode/check-solved
 * 
 * Checks if a user has solved a specific problem after a given timestamp.
 * Used during battles to detect when a player finishes the problem.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, problemSlug, afterTimestamp } = body;

        if (!username || !problemSlug) {
            return NextResponse.json({ error: 'Missing username or problemSlug' }, { status: 400 });
        }

        // Query LeetCode for recent submissions
        const query = `
      query recentSubmissions($username: String!, $limit: Int!) {
        recentAcSubmissionList(username: $username, limit: $limit) {
          id
          title
          titleSlug
          timestamp
          statusDisplay
          lang
        }
      }
    `;

        const response = await fetch('https://leetcode.com/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0',
            },
            body: JSON.stringify({
                query,
                variables: { username, limit: 20 },
            }),
        });

        if (!response.ok) {
            return NextResponse.json({ solved: false, error: 'LeetCode API error' });
        }

        const data = await response.json();
        const submissions = data.data?.recentAcSubmissionList || [];

        // Find if user solved the specific problem after the battle started
        const solvedSubmission = submissions.find((sub: any) => {
            const subTimestamp = parseInt(sub.timestamp) * 1000; // Convert to ms
            return (
                sub.titleSlug === problemSlug &&
                sub.statusDisplay === 'Accepted' &&
                (!afterTimestamp || subTimestamp > afterTimestamp)
            );
        });

        if (solvedSubmission) {
            const solveTime = parseInt(solvedSubmission.timestamp) * 1000;
            return NextResponse.json({
                solved: true,
                timestamp: solveTime,
                language: solvedSubmission.lang,
            });
        }

        return NextResponse.json({ solved: false });
    } catch (error) {
        console.error('Check solved error:', error);
        return NextResponse.json({ solved: false, error: 'Check failed' });
    }
}
