'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Submission {
    id: string;
    title: string;
    titleSlug: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    status: string;
    language: string;
    timestamp: string;
}

interface RecentSubmissionsProps {
    submissions: Submission[];
    isLoading?: boolean;
}

export function RecentSubmissions({ submissions, isLoading }: RecentSubmissionsProps) {
    const getDifficultyStyles = (difficulty: string) => {
        switch (difficulty.toLowerCase()) {
            case 'easy':
                return 'text-emerald-400 bg-emerald-900/30 border-emerald-500/30';
            case 'medium':
                return 'text-amber-400 bg-amber-900/30 border-amber-500/30';
            case 'hard':
                return 'text-rose-400 bg-rose-900/30 border-rose-500/30';
            default:
                return 'text-slate-400 bg-slate-900/30 border-slate-500/30';
        }
    };

    const getStatusIcon = (status: string) => {
        if (status === 'Accepted') return '✅';
        if (status.includes('Wrong')) return '❌';
        if (status.includes('Time')) return '⏱️';
        return '⚠️';
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(parseInt(timestamp) * 1000);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse h-12 bg-slate-800/50 rounded-lg" />
                ))}
            </div>
        );
    }

    if (submissions.length === 0) {
        return (
            <div className="text-center py-6">
                <p className="text-slate-500 italic opacity-70">No activity yet.</p>
                <p className="text-xs text-slate-500 mt-1">Connect your account to sync data.</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {submissions.slice(0, 10).map((submission, index) => (
                <motion.a
                    key={submission.id}
                    href={`https://leetcode.com/problems/${submission.titleSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 border-b border-white/5 hover:bg-white/5 transition-colors group rounded-lg"
                >
                    {/* Status Icon */}
                    <span className="text-lg shadow-sm">{getStatusIcon(submission.status)}</span>

                    {/* Problem Details */}
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                            {submission.title}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span className={cn(
                                "px-1.5 py-0.5 rounded border shadow-sm font-medium",
                                getDifficultyStyles(submission.difficulty)
                            )}>
                                {submission.difficulty}
                            </span>
                            <span className="font-mono bg-slate-800 px-1 rounded text-slate-400">{submission.language}</span>
                        </div>
                    </div>

                    {/* Timestamp */}
                    <div className="text-[10px] text-slate-500 shrink-0 font-medium">
                        {formatTime(submission.timestamp)}
                    </div>
                </motion.a>
            ))}

            {submissions.length > 10 && (
                <button className="w-full mt-4 py-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:underline uppercase tracking-widest transition-colors">
                    View all {submissions.length} submissions
                </button>
            )}
        </div>
    );
}
