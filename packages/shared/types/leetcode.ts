// LeetCode-related types shared across packages

export interface LeetCodeStats {
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    ranking: number;
    currentStreak: number;
    totalActiveDays: number;
}

export interface SubmissionHeatmapData {
    date: string;     // YYYY-MM-DD format
    count: number;    // Number of submissions
    problems: string[]; // Problem slugs solved
}

export interface DailyChallenge {
    date: string;
    title: string;
    titleSlug: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface CompanyPathProgress {
    companyName: string;
    logoUrl?: string;
    totalProblems: number;
    solvedProblems: number;
    progressPercent: number;
}
