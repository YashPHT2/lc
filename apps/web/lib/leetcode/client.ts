import {
    LeetCodeUserData,
    LeetCodeUserProfile,
    LeetCodeSubmitStats,
    LeetCodeRecentSubmission,
    LeetCodeCalendar,
    UserStats,
    SyncResult,
    SyncOptions,
    DailyStatus,
} from './types';
import { USER_COMPLETE_DATA_QUERY, DAILY_CHALLENGE_QUERY } from './queries';

const LEETCODE_API_URL = 'https://leetcode.com/graphql/';

/**
 * Cache entry structure
 */
interface CacheEntry {
    data: LeetCodeUserData;
    expiry: number;
}

/**
 * LeetCode GraphQL API Client
 * 
 * Handles all interactions with LeetCode's GraphQL API including:
 * - Fetching user profiles and stats
 * - Getting recent submissions
 * - Parsing submission calendars
 * - Caching responses to reduce API calls
 */
export class LeetCodeClient {
    private cache: Map<string, CacheEntry> = new Map();
    private cacheTTL = 5 * 60 * 1000; // 5 minutes default cache TTL

    /**
     * Execute a GraphQL query against LeetCode's API
     */
    private async query<T>(
        queryString: string,
        variables: Record<string, unknown>
    ): Promise<T> {
        const response = await fetch(LEETCODE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                Origin: 'https://leetcode.com',
                Referer: 'https://leetcode.com',
            },
            body: JSON.stringify({
                query: queryString,
                variables,
            }),
        });

        if (!response.ok) {
            throw new Error(`LeetCode API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        if (result.errors) {
            throw new Error(`GraphQL Error: ${result.errors[0].message}`);
        }

        return result.data as T;
    }

    /**
     * Fetch complete user data (profile, stats, submissions, calendar)
     */
    async fetchUserData(
        username: string,
        options: SyncOptions = {}
    ): Promise<SyncResult> {
        // Check cache first (unless force refresh)
        if (!options.forceRefresh) {
            const cached = this.cache.get(username);
            if (cached && cached.expiry > Date.now()) {
                return {
                    success: true,
                    data: cached.data,
                    syncedAt: new Date(cached.expiry - this.cacheTTL),
                };
            }
        }

        try {
            const year = new Date().getFullYear();

            const data = await this.query<{
                matchedUser: {
                    username: string;
                    profile: {
                        realName: string | null;
                        userAvatar: string;
                        ranking: number;
                        reputation: number;
                    };
                    submitStatsGlobal: LeetCodeSubmitStats;
                    userCalendar: LeetCodeCalendar;
                } | null;
                recentSubmissionList: LeetCodeRecentSubmission[];
            }>(USER_COMPLETE_DATA_QUERY, { username, year });

            if (!data.matchedUser) {
                return {
                    success: false,
                    error: `User "${username}" not found on LeetCode`,
                    syncedAt: new Date(),
                };
            }

            const userData: LeetCodeUserData = {
                profile: {
                    username: data.matchedUser.username,
                    realName: data.matchedUser.profile.realName,
                    aboutMe: null,
                    avatar: data.matchedUser.profile.userAvatar,
                    ranking: data.matchedUser.profile.ranking,
                    reputation: data.matchedUser.profile.reputation,
                    starRating: null,
                    websites: [],
                    countryName: null,
                    company: null,
                    school: null,
                    skillTags: [],
                    linkedin: null,
                    twitter: null,
                    github: null,
                },
                submitStats: data.matchedUser.submitStatsGlobal,
                recentSubmissions: data.recentSubmissionList || [],
                calendar: data.matchedUser.userCalendar,
                fetchedAt: new Date(),
            };

            // Update cache
            this.cache.set(username, {
                data: userData,
                expiry: Date.now() + this.cacheTTL,
            });

            return {
                success: true,
                data: userData,
                syncedAt: new Date(),
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                syncedAt: new Date(),
            };
        }
    }

    /**
     * Parse raw LeetCode data into normalized stats for dashboard display
     */
    static parseUserStats(data: LeetCodeUserData): UserStats {
        const getCount = (
            submissions: { difficulty: string; count: number }[],
            difficulty: string
        ): number => {
            return submissions.find((s) => s.difficulty === difficulty)?.count ?? 0;
        };

        // Parse the submission calendar JSON
        let submissionHeatmap: Record<string, number> = {};
        try {
            if (data.calendar.submissionCalendar) {
                const calendarData = JSON.parse(data.calendar.submissionCalendar);
                // Convert Unix timestamps to ISO dates
                submissionHeatmap = Object.entries(calendarData).reduce(
                    (acc, [timestamp, count]) => {
                        const date = new Date(parseInt(timestamp) * 1000)
                            .toISOString()
                            .split('T')[0];
                        acc[date] = count as number;
                        return acc;
                    },
                    {} as Record<string, number>
                );
            }
        } catch {
            console.warn('Failed to parse submission calendar');
        }

        return {
            totalSolved: getCount(data.submitStats.acSubmissionNum, 'All'),
            easySolved: getCount(data.submitStats.acSubmissionNum, 'Easy'),
            mediumSolved: getCount(data.submitStats.acSubmissionNum, 'Medium'),
            hardSolved: getCount(data.submitStats.acSubmissionNum, 'Hard'),
            ranking: data.profile.ranking,
            currentStreak: data.calendar.streak,
            totalActiveDays: data.calendar.totalActiveDays,
            submissionHeatmap,
        };
    }

    /**
     * Check if user has solved a problem today
     * This is the core logic for "The Enforcer" API
     */
    async hasUserSolvedToday(username: string): Promise<DailyStatus> {
        const result = await this.fetchUserData(username, { forceRefresh: true });

        if (!result.success || !result.data) {
            return {
                hasSolved: false,
                timestamp: null,
                problemsToday: 0,
                currentStreak: 0,
            };
        }

        const today = new Date().toISOString().split('T')[0];
        const todaySubmissions = result.data.recentSubmissions.filter((sub) => {
            const subDate = new Date(parseInt(sub.timestamp) * 1000)
                .toISOString()
                .split('T')[0];
            return subDate === today && sub.statusDisplay === 'Accepted';
        });

        // Get unique problems solved today
        const uniqueProblemsToday = new Set(
            todaySubmissions.map((s) => s.titleSlug)
        ).size;

        if (todaySubmissions.length > 0) {
            const latestTimestamp = Math.max(
                ...todaySubmissions.map((s) => parseInt(s.timestamp))
            );
            return {
                hasSolved: true,
                timestamp: new Date(latestTimestamp * 1000).toISOString(),
                problemsToday: uniqueProblemsToday,
                currentStreak: result.data.calendar.streak,
            };
        }

        return {
            hasSolved: false,
            timestamp: null,
            problemsToday: 0,
            currentStreak: result.data.calendar.streak,
        };
    }

    /**
     * Get the daily coding challenge
     */
    async getDailyChallenge(): Promise<{
        date: string;
        title: string;
        titleSlug: string;
        difficulty: string;
    } | null> {
        try {
            const data = await this.query<{
                activeDailyCodingChallengeQuestion: {
                    date: string;
                    question: {
                        title: string;
                        titleSlug: string;
                        difficulty: string;
                    };
                };
            }>(DAILY_CHALLENGE_QUERY, {});

            const challenge = data.activeDailyCodingChallengeQuestion;
            return {
                date: challenge.date,
                title: challenge.question.title,
                titleSlug: challenge.question.titleSlug,
                difficulty: challenge.question.difficulty,
            };
        } catch {
            console.error('Failed to fetch daily challenge');
            return null;
        }
    }

    /**
     * Clear cache for a specific user or all users
     */
    clearCache(username?: string): void {
        if (username) {
            this.cache.delete(username);
        } else {
            this.cache.clear();
        }
    }

    /**
     * Set custom cache TTL (in milliseconds)
     */
    setCacheTTL(ttlMs: number): void {
        this.cacheTTL = ttlMs;
    }
}

// Singleton instance for use across the app
export const leetcodeClient = new LeetCodeClient();
