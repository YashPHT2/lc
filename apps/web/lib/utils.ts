import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with Tailwind CSS conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format a number with K/M suffix for large numbers
 */
export function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
}

/**
 * Calculate XP needed for next level
 * XP formula: level^2 * 100
 */
export function xpForLevel(level: number): number {
    return Math.pow(level, 2) * 100;
}

/**
 * Calculate current level from total XP
 */
export function levelFromXp(xp: number): number {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
}

/**
 * Calculate XP progress percentage within current level
 */
export function xpProgress(xp: number): number {
    const level = levelFromXp(xp);
    const currentLevelXp = xpForLevel(level - 1);
    const nextLevelXp = xpForLevel(level);
    const progress = (xp - currentLevelXp) / (nextLevelXp - currentLevelXp);
    return Math.min(Math.max(progress * 100, 0), 100);
}

/**
 * Generate a random room code (6 alphanumeric characters)
 */
export function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Format a date relative to now (e.g., "2 hours ago")
 */
export function timeAgo(date: Date | string): string {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return then.toLocaleDateString();
}

/**
 * Format duration in seconds to MM:SS or HH:MM:SS
 */
export function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Get difficulty color class
 */
export function getDifficultyColor(difficulty: 'Easy' | 'Medium' | 'Hard' | string): string {
    switch (difficulty.toLowerCase()) {
        case 'easy':
            return 'text-green-400';
        case 'medium':
            return 'text-yellow-400';
        case 'hard':
            return 'text-red-400';
        default:
            return 'text-gray-400';
    }
}

/**
 * Get difficulty background class
 */
export function getDifficultyBg(difficulty: 'Easy' | 'Medium' | 'Hard' | string): string {
    switch (difficulty.toLowerCase()) {
        case 'easy':
            return 'bg-green-500/20 border-green-500/30';
        case 'medium':
            return 'bg-yellow-500/20 border-yellow-500/30';
        case 'hard':
            return 'bg-red-500/20 border-red-500/30';
        default:
            return 'bg-gray-500/20 border-gray-500/30';
    }
}

/**
 * Get league tier color
 */
export function getLeagueTierColor(tier: string): string {
    switch (tier.toUpperCase()) {
        case 'BRONZE':
            return 'text-amber-600';
        case 'SILVER':
            return 'text-gray-400';
        case 'GOLD':
            return 'text-yellow-400';
        case 'PLATINUM':
            return 'text-cyan-400';
        case 'DIAMOND':
            return 'text-blue-400';
        case 'BEAST':
            return 'text-beast-primary';
        default:
            return 'text-gray-400';
    }
}

/**
 * Delay utility for async operations
 */
export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
