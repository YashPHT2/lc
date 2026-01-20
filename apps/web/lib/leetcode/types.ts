// ============== LeetCode API Response Types ==============

/**
 * LeetCode user profile data from GraphQL API
 */
export interface LeetCodeUserProfile {
    username: string;
    realName: string | null;
    aboutMe: string | null;
    avatar: string;
    ranking: number;
    reputation: number;
    starRating: number | null;
    websites: string[];
    countryName: string | null;
    company: string | null;
    school: string | null;
    skillTags: string[];
    linkedin: string | null;
    twitter: string | null;
    github: string | null;
}

/**
 * Submission statistics grouped by difficulty
 */
export interface LeetCodeSubmitStats {
    acSubmissionNum: AcSubmissionCount[];
    totalSubmissionNum: TotalSubmissionCount[];
}

export interface AcSubmissionCount {
    difficulty: 'All' | 'Easy' | 'Medium' | 'Hard';
    count: number;
}

export interface TotalSubmissionCount {
    difficulty: 'All' | 'Easy' | 'Medium' | 'Hard';
    count: number;
}

/**
 * Recent submission entry
 */
export interface LeetCodeRecentSubmission {
    title: string;
    titleSlug: string;
    timestamp: string;  // Unix timestamp as string
    statusDisplay: string;
    lang: string;
}

/**
 * User's submission calendar and streak data
 */
export interface LeetCodeCalendar {
    streak: number;
    totalActiveDays: number;
    submissionCalendar: string;  // JSON string of { "timestamp": count }
}

// ============== Aggregated User Data ==============

/**
 * Complete user data fetched from LeetCode
 */
export interface LeetCodeUserData {
    profile: LeetCodeUserProfile;
    submitStats: LeetCodeSubmitStats;
    recentSubmissions: LeetCodeRecentSubmission[];
    calendar: LeetCodeCalendar;
    fetchedAt: Date;
}

/**
 * Parsed stats for dashboard display
 */
export interface UserStats {
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    ranking: number;
    currentStreak: number;
    totalActiveDays: number;
    submissionHeatmap: Record<string, number>;  // Date (YYYY-MM-DD) -> count
}

// ============== Problem Types ==============

/**
 * LeetCode problem details
 */
export interface LeetCodeProblem {
    questionId: string;
    questionFrontendId: string;  // Display ID (e.g., "1")
    title: string;
    titleSlug: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    isPaidOnly: boolean;
    topicTags: { name: string; slug: string }[];
    stats: string;  // JSON string with acceptance rate
}

/**
 * Problem submission result
 */
export interface ProblemSubmissionResult {
    statusCode: number;
    statusMsg: string;
    runtime: string;
    memory: string;
    totalCorrect: number;
    totalTestcases: number;
    runtimePercentile: number | null;
    memoryPercentile: number | null;
}

// ============== Company Path Types ==============

/**
 * Question associated with a company
 */
export interface CompanyQuestion {
    titleSlug: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    frequency: number;  // 1-5 scale or percentage
}

/**
 * Company's question path
 */
export interface CompanyPath {
    name: string;
    logoUrl: string;
    questions: CompanyQuestion[];
    totalQuestions: number;
}

// ============== Sync Service Types ==============

/**
 * Result of a sync operation
 */
export interface SyncResult {
    success: boolean;
    data?: LeetCodeUserData;
    error?: string;
    syncedAt: Date;
}

/**
 * Options for sync operations
 */
export interface SyncOptions {
    forceRefresh?: boolean;
    includeSubmissions?: boolean;
    submissionLimit?: number;
}

// ============== Daily Status for Enforcer API ==============

/**
 * Response for the "Enforcer" API endpoint
 */
export interface DailyStatus {
    hasSolved: boolean;
    timestamp: string | null;
    problemsToday: number;
    currentStreak: number;
}

// ============== WebSocket Event Types for Dojo ==============

export interface RoomState {
    id: string;
    code: string;
    name: string;
    hostId: string;
    status: 'waiting' | 'countdown' | 'active' | 'finished';
    problemSlug: string | null;
    problemTitle: string | null;
    difficulty: 'Easy' | 'Medium' | 'Hard' | null;
    participants: RoomParticipant[];
    duration: number;
    startedAt: string | null;
    isHardcore: boolean;
    entryFee: number;
}

export interface RoomParticipant {
    id: string;
    username: string;
    avatarUrl: string | null;
    status: 'waiting' | 'solving' | 'finished' | 'spectating' | 'disconnected';
    testCasesPassed: number;
    totalTestCases: number;
    finishedAt: string | null;
    rank: number | null;
}

export interface ChatMessage {
    id: string;
    roomId: string;
    userId: string;
    username: string;
    message: string;
    timestamp: string;
}
