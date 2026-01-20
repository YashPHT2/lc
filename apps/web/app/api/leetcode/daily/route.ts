import { NextResponse } from 'next/server';

const LEETCODE_API_URL = 'https://leetcode.com/graphql/';

/**
 * GET /api/leetcode/daily
 * 
 * Fetches today's LeetCode daily challenge.
 */
export async function GET() {
    try {
        const query = `
      query getDailyChallenge {
        activeDailyCodingChallengeQuestion {
          date
          link
          question {
            questionFrontendId
            title
            titleSlug
            difficulty
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
                'Origin': 'https://leetcode.com',
                'Referer': 'https://leetcode.com',
            },
            body: JSON.stringify({ query }),
            // Cache for 1 hour
            next: { revalidate: 3600 },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch daily challenge' },
                { status: 500 }
            );
        }

        const data = await response.json();
        const challenge = data.data?.activeDailyCodingChallengeQuestion;

        if (!challenge) {
            return NextResponse.json(
                { error: 'No daily challenge found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            date: challenge.date,
            title: challenge.question.title,
            titleSlug: challenge.question.titleSlug,
            difficulty: challenge.question.difficulty,
            questionId: challenge.question.questionFrontendId,
        });
    } catch (error) {
        console.error('Daily challenge error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch daily challenge' },
            { status: 500 }
        );
    }
}
