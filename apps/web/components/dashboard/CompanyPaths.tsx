'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CompanyPath {
    id: string;
    name: string;
    logoUrl?: string;
    totalProblems: number;
    solvedProblems: number;
    description?: string;
}

interface CompanyPathsProps {
    paths: CompanyPath[];
    onSelectPath?: (pathId: string) => void;
}

// Default company paths
const defaultPaths: CompanyPath[] = [
    {
        id: 'google',
        name: 'Google',
        totalProblems: 75,
        solvedProblems: 0,
        description: 'Top 75 Google interview questions'
    },
    {
        id: 'meta',
        name: 'Meta',
        totalProblems: 75,
        solvedProblems: 0,
        description: 'Top 75 Meta interview questions'
    },
    {
        id: 'amazon',
        name: 'Amazon',
        totalProblems: 75,
        solvedProblems: 0,
        description: 'Top 75 Amazon interview questions'
    },
    {
        id: 'microsoft',
        name: 'Microsoft',
        totalProblems: 50,
        solvedProblems: 0,
        description: 'Top 50 Microsoft interview questions'
    },
    {
        id: 'apple',
        name: 'Apple',
        totalProblems: 50,
        solvedProblems: 0,
        description: 'Top 50 Apple interview questions'
    },
    {
        id: 'blind75',
        name: 'Blind 75',
        totalProblems: 75,
        solvedProblems: 0,
        description: 'The famous Blind 75 curated list'
    },
];

export function CompanyPaths({ paths = defaultPaths, onSelectPath }: CompanyPathsProps) {
    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [hoveredPath, setHoveredPath] = useState<string | null>(null);

    const handleSelect = (pathId: string) => {
        setSelectedPath(pathId);
        onSelectPath?.(pathId);
    };

    const getProgressColor = (percent: number) => {
        if (percent === 0) return 'from-beast-dark-300 to-beast-dark-300';
        if (percent < 33) return 'from-beast-secondary to-beast-secondary';
        if (percent < 66) return 'from-beast-warning to-orange-500';
        if (percent < 100) return 'from-beast-accent to-beast-primary';
        return 'from-beast-primary to-green-400';
    };

    const getCompanyEmoji = (name: string) => {
        const emojis: Record<string, string> = {
            'Google': '🔍',
            'Meta': '👤',
            'Amazon': '📦',
            'Microsoft': '🪟',
            'Apple': '🍎',
            'Blind 75': '🎯',
        };
        return emojis[name] || '🏢';
    };

    return (
        <div className="cyber-card p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-bold text-white">
                    🎯 Mission Selector
                </h2>
                <span className="text-xs text-muted-foreground">
                    Select a target company
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {paths.map((path) => {
                    const progress = path.totalProblems > 0
                        ? (path.solvedProblems / path.totalProblems) * 100
                        : 0;
                    const isSelected = selectedPath === path.id;
                    const isHovered = hoveredPath === path.id;

                    return (
                        <motion.button
                            key={path.id}
                            onClick={() => handleSelect(path.id)}
                            onMouseEnter={() => setHoveredPath(path.id)}
                            onMouseLeave={() => setHoveredPath(null)}
                            className={cn(
                                "relative p-4 rounded-lg border text-left transition-all",
                                isSelected
                                    ? "bg-beast-primary/10 border-beast-primary/50"
                                    : "bg-beast-dark-300/50 border-beast-primary/20 hover:border-beast-primary/40"
                            )}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {/* Company Header */}
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-2xl">{getCompanyEmoji(path.name)}</span>
                                <div className="flex-1">
                                    <div className="font-display font-bold text-white">
                                        {path.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {path.description}
                                    </div>
                                </div>
                                {isSelected && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="text-beast-primary"
                                    >
                                        ✓
                                    </motion.div>
                                )}
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Progress</span>
                                    <span className={cn(
                                        "font-bold",
                                        progress === 100 ? "text-beast-primary" : "text-white"
                                    )}>
                                        {path.solvedProblems}/{path.totalProblems}
                                    </span>
                                </div>
                                <div className="h-2 bg-beast-dark-400 rounded-full overflow-hidden">
                                    <motion.div
                                        className={cn(
                                            "h-full rounded-full bg-gradient-to-r",
                                            getProgressColor(progress)
                                        )}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                    />
                                </div>
                            </div>

                            {/* Hover Indicator */}
                            <AnimatePresence>
                                {isHovered && !isSelected && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 rounded-lg border-2 border-beast-primary/30 pointer-events-none"
                                    />
                                )}
                            </AnimatePresence>
                        </motion.button>
                    );
                })}
            </div>

            {/* Selected Path Details */}
            <AnimatePresence>
                {selectedPath && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6 pt-6 border-t border-beast-primary/20"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-display text-lg font-bold text-beast-primary">
                                    {paths.find(p => p.id === selectedPath)?.name} Path Active
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Track your progress in the dashboard
                                </p>
                            </div>
                            <button className="px-4 py-2 bg-beast-primary text-beast-dark-500 font-display font-bold rounded-lg hover:bg-beast-primary/90 transition-colors">
                                VIEW PROBLEMS
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
