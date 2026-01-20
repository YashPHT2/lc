'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BeastStatsProps {
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    xp: number;
    level: number;
    coins: number;
    currentStreak: number;
    leagueTier: string;
    leaguePoints: number;
    ranking?: number;
}

export function BeastStats({
    totalSolved,
    easySolved,
    mediumSolved,
    hardSolved,
    xp,
    level,
    coins,
    currentStreak,
    leagueTier,
    leaguePoints,
    ranking,
}: BeastStatsProps) {
    // Calculate XP progress to next level
    const xpForNextLevel = Math.pow(level, 2) * 100;
    const xpProgress = (xp / xpForNextLevel) * 100;

    const getTierColor = (tier: string) => {
        const colors: Record<string, string> = {
            BRONZE: 'text-amber-600',
            SILVER: 'text-gray-400',
            GOLD: 'text-yellow-400',
            PLATINUM: 'text-cyan-400',
            DIAMOND: 'text-blue-400',
            BEAST: 'text-beast-primary',
        };
        return colors[tier] || 'text-gray-400';
    };

    const getTierGlow = (tier: string) => {
        const glows: Record<string, string> = {
            BRONZE: 'shadow-amber-600/20',
            SILVER: 'shadow-gray-400/20',
            GOLD: 'shadow-yellow-400/30',
            PLATINUM: 'shadow-cyan-400/30',
            DIAMOND: 'shadow-blue-400/30',
            BEAST: 'shadow-beast-primary/40',
        };
        return glows[tier] || '';
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 },
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
            {/* Total Solved */}
            <motion.div variants={item} className="cyber-card p-4 md:p-6">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🎯</span>
                    <span className="text-sm text-muted-foreground">Total Solved</span>
                </div>
                <div className="font-display text-3xl md:text-4xl font-bold text-beast-primary mb-2">
                    {totalSolved}
                </div>
                <div className="flex gap-2 text-xs">
                    <span className="badge-easy px-2 py-0.5 rounded">{easySolved} E</span>
                    <span className="badge-medium px-2 py-0.5 rounded">{mediumSolved} M</span>
                    <span className="badge-hard px-2 py-0.5 rounded">{hardSolved} H</span>
                </div>
            </motion.div>

            {/* Current Streak */}
            <motion.div variants={item} className="cyber-card p-4 md:p-6">
                <div className="flex items-center gap-2 mb-2">
                    <motion.span
                        className="text-2xl"
                        animate={{ scale: currentStreak > 0 ? [1, 1.2, 1] : 1 }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        🔥
                    </motion.span>
                    <span className="text-sm text-muted-foreground">Streak</span>
                </div>
                <div className="font-display text-3xl md:text-4xl font-bold text-beast-warning">
                    {currentStreak}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                    {currentStreak > 0 ? "days on fire!" : "Start your streak!"}
                </div>
            </motion.div>

            {/* XP & Level */}
            <motion.div variants={item} className="cyber-card p-4 md:p-6">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">⭐</span>
                    <span className="text-sm text-muted-foreground">Level {level}</span>
                </div>
                <div className="font-display text-3xl md:text-4xl font-bold text-beast-accent">
                    {xp.toLocaleString()}
                </div>
                <div className="mt-2">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>XP</span>
                        <span>{xpForNextLevel.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-beast-dark-400 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-beast-accent to-beast-primary rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(xpProgress, 100)}%` }}
                            transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                        />
                    </div>
                </div>
            </motion.div>

            {/* League Tier */}
            <motion.div
                variants={item}
                className={cn(
                    "cyber-card p-4 md:p-6",
                    getTierGlow(leagueTier),
                    leagueTier === 'BEAST' && 'border-beast-primary/50'
                )}
            >
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🏆</span>
                    <span className="text-sm text-muted-foreground">League</span>
                </div>
                <div className={cn(
                    "font-display text-2xl md:text-3xl font-bold",
                    getTierColor(leagueTier)
                )}>
                    {leagueTier}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                    {leaguePoints.toLocaleString()} points
                    {ranking && <span> • Rank #{ranking}</span>}
                </div>
            </motion.div>

            {/* BeastCoins (Full Width on Mobile) */}
            <motion.div
                variants={item}
                className="cyber-card p-4 md:p-6 col-span-2 md:col-span-4 flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <motion.span
                        className="text-3xl"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    >
                        ⚡
                    </motion.span>
                    <div>
                        <div className="text-sm text-muted-foreground">BeastCoins</div>
                        <div className="font-display text-2xl font-bold text-beast-warning">
                            {coins.toLocaleString()}
                        </div>
                    </div>
                </div>
                <a
                    href="/shop"
                    className="px-4 py-2 bg-beast-warning/20 border border-beast-warning/30 text-beast-warning font-display text-sm font-bold rounded-lg hover:bg-beast-warning/30 transition-colors"
                >
                    VISIT SHOP
                </a>
            </motion.div>
        </motion.div>
    );
}
