'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import {
    BeastStats,
    RPGHeatmap,
    CompanyPaths,
    RecentSubmissions,
    LeetCodeConnect
} from '@/components/dashboard';

// Mock data (if API fails or no connection)
const generateMockHeatmap = (): Record<string, number> => {
    const data: Record<string, number> = {};
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        if (Math.random() > 0.7) {
            data[dateStr] = Math.floor(Math.random() * 6) + 1;
        }
    }
    return data;
};

export default function DashboardPage() {
    const { user, isLoaded } = useUser();
    const [leetcodeUsername, setLeetcodeUsername] = useState<string | undefined>();
    const [stats, setStats] = useState({
        totalSolved: 35,
        easySolved: 13,
        mediumSolved: 22,
        hardSolved: 0,
        xp: 680,
        level: 3,
        coins: 100,
        currentStreak: 1,
        leagueTier: 'BRONZE',
        leaguePoints: 0,
        ranking: 2956523 as number | undefined,
    });
    const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [mockData] = useState(() => generateMockHeatmap());

    // Fetch LeetCode data logic
    const fetchLeetCodeData = useCallback(async (username: string) => {
        try {
            const response = await fetch('/api/leetcode/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });

            if (!response.ok) throw new Error('Failed to fetch');

            const data = await response.json();
            if (!data.matchedUser) return { success: false, error: 'User not found' };

            const lcUser = data.matchedUser;
            const recentSubmissions = data.recentSubmissionList || [];

            const getCount = (difficulty: string) =>
                lcUser.submitStatsGlobal?.acSubmissionNum?.find((s: any) => s.difficulty === difficulty)?.count || 0;

            let heatmap: Record<string, number> = {};
            try {
                if (lcUser.userCalendar?.submissionCalendar) {
                    const calendarData = JSON.parse(lcUser.userCalendar.submissionCalendar);
                    heatmap = Object.entries(calendarData).reduce((acc, [timestamp, count]) => {
                        const date = new Date(parseInt(timestamp) * 1000).toISOString().split('T')[0];
                        acc[date] = count as number;
                        return acc;
                    }, {} as Record<string, number>);
                }
            } catch (e) {
                console.warn('Failed to parse calendar');
            }

            const totalSolved = getCount('All');
            const easySolved = getCount('Easy');
            const mediumSolved = getCount('Medium');
            const hardSolved = getCount('Hard');
            const calculatedXp = easySolved * 10 + mediumSolved * 25 + hardSolved * 50;

            setStats(prev => ({
                ...prev,
                totalSolved,
                easySolved,
                mediumSolved,
                hardSolved,
                currentStreak: lcUser.userCalendar?.streak || 0,
                ranking: lcUser.profile?.ranking,
                xp: calculatedXp,
                level: Math.floor(Math.sqrt(calculatedXp / 100)) + 1,
            }));
            setHeatmapData(heatmap);
            setSubmissions(recentSubmissions.map((sub: any, i: number) => ({
                id: `${i}`,
                title: sub.title,
                titleSlug: sub.titleSlug,
                difficulty: 'Medium', // API doesn't always return difficulty in recent list, defaulting for now or handle later
                status: sub.statusDisplay,
                language: sub.lang,
                timestamp: sub.timestamp,
            })));

            return { success: true };
        } catch (error) {
            console.error('Fetch error:', error);
            return { success: false, error: 'Failed to fetch data' };
        }
    }, []);

    // Load saved username
    useEffect(() => {
        const loadSavedUsername = async () => {
            try {
                const response = await fetch('/api/user/leetcode', { cache: 'no-store' });
                if (response.ok) {
                    const data = await response.json();
                    if (data.leetcodeUsername) {
                        setLeetcodeUsername(data.leetcodeUsername);
                        setIsLoading(true);
                        await fetchLeetCodeData(data.leetcodeUsername);
                        setIsLoading(false);
                    }
                }
            } catch (error) {
                console.error('Failed to load saved username:', error);
            }
        };

        if (isLoaded && user) loadSavedUsername();
    }, [isLoaded, user, fetchLeetCodeData]);

    const handleLeetCodeConnect = async (username: string) => {
        setIsLoading(true);
        const result = await fetchLeetCodeData(username);
        if (result.success) {
            const response = await fetch('/api/user/leetcode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leetcodeUsername: username }),
            });

            if (response.ok) {
                setLeetcodeUsername(username);
            } else {
                console.error('Failed to save username');
                alert('Failed to save LeetCode connection. Please try again.');
            }
        }
        setIsLoading(false);
        return result;
    };

    if (!isLoaded) return null;

    return (
        <div className="min-h-screen pt-24 px-4 md:px-8 pb-12 selection:bg-indigo-500/30 selection:text-white">
            <div className="max-w-7xl mx-auto space-y-10">

                {/* Welcome Banner */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10"
                >
                    <h1 className="font-display text-4xl md:text-5xl font-bold text-white drop-shadow-sm">
                        Welcome back, <span className="text-indigo-400">{user?.firstName || 'User'}</span>
                    </h1>

                    {leetcodeUsername ? (
                        <p className="mt-2 text-[#d4c486] font-medium flex items-center gap-2">
                            Connected as <span className="text-white underline decoration-indigo-500">{leetcodeUsername}</span> on LeetCode
                        </p>
                    ) : (
                        <div className="mt-4 max-w-md">
                            <LeetCodeConnect onConnect={handleLeetCodeConnect} isLoading={isLoading} />
                        </div>
                    )}
                </motion.div>

                {/* Stats Row */}
                <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="glass-liquid p-6 flex flex-col justify-between min-h-[160px]">
                        <h3 className="text-slate-400 font-sans uppercase tracking-widest text-xs font-bold border-b border-white/5 pb-2 mb-2">Total Solved</h3>
                        <div className="flex items-center gap-4">
                            <div className="relative w-16 h-16 rounded-full border-2 border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                                <span className="font-display font-bold text-2xl text-white">{stats.totalSolved}</span>
                            </div>
                            <div className="space-y-1 text-xs font-mono text-slate-400">
                                <div className="text-emerald-400">{stats.easySolved} E</div>
                                <div className="text-amber-400">{stats.mediumSolved} M</div>
                                <div className="text-rose-400">{stats.hardSolved} H</div>
                            </div>
                        </div>
                    </div>
                    <div className="glass-liquid p-6 min-h-[160px] relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-orange-500/10 blur-2xl rounded-full" />
                        <h3 className="text-slate-400 font-sans uppercase tracking-widest text-xs font-bold border-b border-white/5 pb-2 mb-2">Streak</h3>
                        <div className="mt-2">
                            <div className="text-4xl font-display font-bold text-orange-400 flex items-center gap-2 drop-shadow-sm">
                                {stats.currentStreak} <span className="text-2xl">🔥</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 uppercase">Current Streak</p>
                        </div>
                    </div>
                    <div className="glass-liquid p-6 min-h-[160px]">
                        <h3 className="text-slate-400 font-sans uppercase tracking-widest text-xs font-bold border-b border-white/5 pb-2 mb-2 flex justify-between">
                            Level {stats.level}
                            <span className="text-indigo-400">🛡️ {stats.level}</span>
                        </h3>
                        <div className="mt-4">
                            <div className="text-3xl font-display font-bold text-white mb-2">{stats.xp} XP</div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 w-[75%] shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                                <span>0</span>
                                <span>900</span>
                            </div>
                        </div>
                    </div>
                    <div className="glass-liquid p-6 min-h-[160px]">
                        <h3 className="text-slate-400 font-sans uppercase tracking-widest text-xs font-bold border-b border-white/5 pb-2 mb-2 flex justify-between">
                            League
                            <span>🏆</span>
                        </h3>
                        <div>
                            <div className="text-3xl font-display font-bold text-amber-500 mt-2 drop-shadow-sm">BRONZE</div>
                            <p className="text-xs text-slate-500 mt-1">Rank #{stats.ranking || '---'}</p>
                        </div>
                    </div>
                </section>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* Left Column: Heatmap & Quest Log */}
                    <div className="lg:col-span-3 space-y-8">

                        {/* Adventure Map */}
                        <div className="glass-liquid p-1 min-h-[400px] border border-white/5 bg-black/20">
                            <div className="h-full p-6 relative overflow-hidden rounded-xl">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="font-display text-xl text-white font-bold">Activity Map</h2>
                                    <div className="flex items-center gap-2 text-xs text-indigo-400">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        Live Activity
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <RPGHeatmap
                                        data={leetcodeUsername ? heatmapData : mockData}
                                        currentStreak={stats.currentStreak}
                                        longestStreak={5}
                                        onRefresh={() => fetchLeetCodeData(leetcodeUsername!)}
                                        isRefreshing={isRefreshing}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Recent Quests (Submissions) */}
                        <div className="glass-liquid p-8 border border-white/5">
                            {/* Recent Activity List */}

                            <h2 className="font-display text-xl font-bold border-b border-white/10 pb-4 mb-6 text-white">
                                Recent Activity
                            </h2>
                            <RecentSubmissions submissions={submissions} isLoading={isLoading} />
                        </div>

                    </div>

                    {/* Right Column: Sidebars */}
                    {/* Right Column: Sidebars */}
                    <div className="space-y-8">
                        <div className="glass-liquid p-6 border border-white/5">

                            <h2 className="font-display text-lg font-bold border-b border-white/5 pb-1 mb-3 text-white">Daily Challenge</h2>

                            <div className="my-4">
                                <span className="block text-xs font-bold uppercase text-[#8b4513]/70">Target</span>
                                <div className="text-xl font-bold font-rpg leading-tight mt-1">Largest Magic Square</div>
                                <span className="inline-block px-2 py-0.5 mt-2 bg-amber-200/50 border border-amber-600/30 text-amber-900 text-[10px] rounded uppercase font-bold">Medium</span>
                            </div>

                            <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all">
                                Solve Now
                            </button>
                        </div>

                        <div className="glass-liquid p-6 border border-white/5">

                            <h2 className="font-display text-lg font-bold border-b border-white/5 pb-1 mb-3 text-white">Campaign Selector</h2>
                            <p className="text-sm italic mb-4 opacity-80">Choose your battlefield...</p>

                            <div className="space-y-2">
                                {['Google Citadel', 'Amazon Jungle', 'Netflix Tower'].map((opt, i) => (
                                    <div key={i} className="p-2 border border-white/5 bg-slate-800/30 rounded flex items-center justify-between hover:bg-slate-700/50 cursor-pointer transition-colors">
                                        <span className="font-medium text-sm text-slate-200">{opt}</span>
                                        <span className="text-xs">⚔️</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
