'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LeaderboardUser {
    rank: number;
    id: string;
    username: string;
    avatarUrl?: string;
    xp: number;
    level: number;
    leagueTier: string;
    currentStreak: number;
    totalSolved: number;
    coins: number;
}

const TIERS = ['ALL', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'BEAST'];

// RPG Tier Colors
const tierColors: Record<string, string> = {
    BRONZE: 'text-amber-700',
    SILVER: 'text-slate-300',
    GOLD: 'text-yellow-400',
    PLATINUM: 'text-cyan-400',
    DIAMOND: 'text-blue-400',
    BEAST: 'text-purple-500',
};

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [selectedTier, setSelectedTier] = useState('ALL');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const tier = selectedTier === 'ALL' ? '' : selectedTier;
        fetch(`/api/leaderboard${tier ? `?tier=${tier}` : ''}`)
            .then(res => res.json())
            .then(data => {
                setLeaderboard(data.leaderboard || []);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, [selectedTier]);

    return (
        <div className="min-h-screen pt-36 px-4 md:px-8 pb-12 selection:bg-indigo-500/30 selection:text-white">
            <main className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="font-display text-4xl md:text-5xl font-bold mb-2 text-white drop-shadow-sm">
                        Weekly <span className="text-indigo-500">Leaderboard</span>
                    </h1>
                    <p className="text-slate-400 font-medium text-lg">Top performers this week</p>
                </motion.div>

                {/* Tier Filter */}
                <div className="flex justify-center gap-3 flex-wrap mb-10">
                    {TIERS.map((tier) => (
                        <button
                            key={tier}
                            onClick={() => setSelectedTier(tier)}
                            className={`px-5 py-2 rounded-lg font-bold text-sm tracking-wide transition-all duration-300 border ${selectedTier === tier
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/25'
                                : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/20 hover:text-white'
                                }`}
                        >
                            {tier === 'ALL' ? '🏆 ALL' : tier}
                        </button>
                    ))}
                </div>

                {/* Leaderboard Table */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-liquid border border-white/5"
                >
                    {isLoading ? (
                        <div className="p-12 text-center text-slate-400 animate-pulse">Loading rankings...</div>
                    ) : leaderboard.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <div className="text-5xl mb-4 opacity-50">🏆</div>
                            <p className="text-xl">No players found in this tier</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5 text-left text-xs text-slate-500 font-bold tracking-wider uppercase bg-white/5">
                                        <th className="py-5 px-6">Rank</th>
                                        <th className="py-5 px-6">User</th>
                                        <th className="py-5 px-6 text-center">Level</th>
                                        <th className="py-5 px-6 text-center">XP</th>
                                        <th className="py-5 px-6 text-center">Solved</th>
                                        <th className="py-5 px-6 text-center">Streak</th>
                                        <th className="py-5 px-6 text-center">Tier</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboard.map((user, i) => (
                                        <motion.tr
                                            key={user.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                            className={`border-b border-white/5 group transition-colors hover:bg-white/5 ${user.rank <= 3 ? 'bg-indigo-500/5' : ''
                                                }`}
                                        >
                                            <td className="py-4 px-6">
                                                <div className={`font-bold text-lg flex items-center justify-center w-8 h-8 rounded ${user.rank === 1 ? 'text-yellow-400 drop-shadow' :
                                                    user.rank === 2 ? 'text-slate-300' :
                                                        user.rank === 3 ? 'text-amber-700' : 'text-slate-500'
                                                    }`}>
                                                    {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : user.rank === 3 ? '🥉' : `#${user.rank}`}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-slate-800 border border-white/10 overflow-hidden relative group-hover:border-indigo-500/50 transition-colors">
                                                        {user.avatarUrl ? (
                                                            <img src={user.avatarUrl} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold bg-slate-900">
                                                                {user.username[0].toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="font-bold text-slate-200">{user.username}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center font-bold text-indigo-400">
                                                {user.level}
                                            </td>
                                            <td className="py-4 px-6 text-center text-slate-400 font-mono text-sm">
                                                {user.xp.toLocaleString()}
                                            </td>
                                            <td className="py-4 px-6 text-center text-slate-300">
                                                {user.totalSolved}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                {user.currentStreak > 0 && (
                                                    <span className="text-orange-400 font-bold drop-shadow-sm">🔥 {user.currentStreak}</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`font-bold text-xs px-2 py-1 rounded-md bg-slate-900 border border-white/5 ${tierColors[user.leagueTier] || 'text-white'}`}>
                                                    {user.leagueTier}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}
