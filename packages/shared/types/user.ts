// User-related types shared across packages

export type LeagueTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'BEAST';

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
    leetcodeUsername?: string;

    // Stats
    xp: number;
    level: number;
    coins: number;

    // Streak
    currentStreak: number;
    longestStreak: number;
    streakFreezes: number;

    // League
    leagueTier: LeagueTier;
    leaguePoints: number;

    // LeetCode stats
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    leetcodeRanking?: number;
}

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    username: string;
    avatarUrl?: string;
    leagueTier: LeagueTier;
    leaguePoints: number;
    problemsSolvedThisWeek: number;
    isRival: boolean;
    isFriend: boolean;
}
