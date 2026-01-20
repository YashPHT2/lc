'use client';

import { motion } from 'framer-motion';

interface ProblemViewerProps {
    title: string;
    difficulty: string;
    description?: string;
}

export function ProblemViewer({ title, difficulty, description }: ProblemViewerProps) {
    const getDifficultyColor = (diff: string) => {
        switch (diff.toLowerCase()) {
            case 'easy': return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'hard': return 'text-red-400 bg-red-400/10 border-red-400/20';
            default: return 'text-beast-primary bg-beast-primary/10 border-beast-primary/20';
        }
    };

    return (
        <div className="h-full flex flex-col glass-liquid rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-white/5">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="font-display text-xl font-bold text-white max-w-[70%] truncate">
                        {title}
                    </h2>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getDifficultyColor(difficulty)}`}>
                        {difficulty}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {description ? (
                    <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-white prose-strong:text-white prose-code:text-indigo-400 prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/10">
                        <div dangerouslySetInnerHTML={{ __html: description }} />
                    </div>
                ) : (
                    <div className="space-y-4 animate-pulse">
                        <div className="h-4 bg-white/5 rounded w-3/4" />
                        <div className="h-4 bg-white/5 rounded w-full" />
                        <div className="h-4 bg-white/5 rounded w-5/6" />
                        <div className="h-24 bg-white/5 rounded w-full mt-4" />
                    </div>
                )}

                {/* Example Cases (Mock) */}
                <div className="mt-6 space-y-4">
                    <div className="bg-black/30 p-3 rounded-lg border border-white/10">
                        <h3 className="text-sm font-bold text-white mb-2">Example 1:</h3>
                        <div className="space-y-1 font-mono text-sm">
                            <div className="text-muted-foreground">
                                <span className="text-white">Input:</span> nums = [2,7,11,15], target = 9
                            </div>
                            <div className="text-muted-foreground">
                                <span className="text-white">Output:</span> [0,1]
                            </div>
                            <div className="text-muted-foreground">
                                <span className="text-white">Explanation:</span> Because nums[0] + nums[1] == 9, we return [0, 1].
                            </div>
                        </div>
                    </div>

                    <div className="bg-black/30 p-3 rounded-lg border border-white/10">
                        <h3 className="text-sm font-bold text-white mb-2">Example 2:</h3>
                        <div className="space-y-1 font-mono text-sm">
                            <div className="text-muted-foreground">
                                <span className="text-white">Input:</span> nums = [3,2,4], target = 6
                            </div>
                            <div className="text-muted-foreground">
                                <span className="text-white">Output:</span> [1,2]
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
