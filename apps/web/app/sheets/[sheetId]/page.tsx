'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Problem {
    id: string;
    title: string;
    slug: string;
    url: string;
    platform: string;
    difficulty: string;
    order: number;
}

interface Module {
    topic: string;
    problems: Problem[];
}

interface SheetData {
    id: string;
    title: string;
    desc: string;
    sourceUrl?: string;
    totalProblems: number;
    modules: Module[];
}

// Community progress types
interface UserProgress {
    userId: string;
    username: string;
    avatarUrl: string | null;
    clerkId: string;
    completed: string[];
    inProgress: string[];
}

// Fallback data for when API is unavailable
const FALLBACK_DATA: Record<string, SheetData> = {
    'neetcode': {
        id: 'neetcode',
        title: "NeetCode 150",
        desc: "Must-do list for top tech interviews.",
        totalProblems: 150,
        modules: [
            {
                topic: "Arrays & Hashing",
                problems: [
                    { id: 'nc-1', title: "Contains Duplicate", slug: "contains-duplicate", url: "https://leetcode.com/problems/contains-duplicate", difficulty: "EASY", platform: "LeetCode", order: 0 },
                    { id: 'nc-2', title: "Valid Anagram", slug: "valid-anagram", url: "https://leetcode.com/problems/valid-anagram", difficulty: "EASY", platform: "LeetCode", order: 1 },
                    { id: 'nc-3', title: "Two Sum", slug: "two-sum", url: "https://leetcode.com/problems/two-sum", difficulty: "EASY", platform: "LeetCode", order: 2 },
                ]
            },
        ]
    },
    'striver': {
        id: 'striver',
        title: "Striver A2Z DSA Sheet",
        desc: "The comprehensive roadmap to master DSA from basics to advanced.",
        totalProblems: 455,
        modules: [
            {
                topic: "Step 1: Learn the Basics",
                problems: [
                    { id: 'str-1', title: "User Input / Output", slug: "user-input-output", url: "https://www.codingninjas.com/studio/problems/find-character-case_58513", difficulty: "EASY", platform: "CodingNinjas", order: 0 },
                    { id: 'str-2', title: "Data Types", slug: "data-types", url: "https://www.codingninjas.com/studio/problems/data-type_8357232", difficulty: "EASY", platform: "CodingNinjas", order: 1 },
                ]
            },
            {
                topic: "Step 3: Arrays",
                problems: [
                    { id: 'str-3', title: "Largest Element in Array", slug: "largest-element-in-array", url: "https://leetcode.com/problems/largest-element-in-array", difficulty: "EASY", platform: "LeetCode", order: 0 },
                    { id: 'str-4', title: "Second Largest Element", slug: "second-largest-element-in-array", url: "https://leetcode.com/problems/second-largest-element-in-array", difficulty: "MEDIUM", platform: "LeetCode", order: 1 },
                ]
            }
        ]
    }
};

export default function SheetDetail() {
    const params = useParams();
    const router = useRouter();
    const sheetId = params.sheetId as string;

    const [data, setData] = useState<SheetData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // LocalStorage Persistence for progress
    const [checked, setChecked] = useState<Record<string, boolean>>({});

    // Accordion state - track which modules are expanded
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

    // Community progress state (for Striver sheet)
    const [communityProgress, setCommunityProgress] = useState<UserProgress[]>([]);
    const [loadingCommunity, setLoadingCommunity] = useState(false);

    // Fetch sheet data from API
    useEffect(() => {
        async function fetchSheet() {
            try {
                setLoading(true);
                const response = await fetch(`/api/sheets/${sheetId}`);

                if (!response.ok) {
                    // Try fetch static JSON for Striver (Rescue Logic)
                    if (sheetId === 'striver') {
                        try {
                            const staticRes = await fetch('/striver_a2z.json');
                            if (staticRes.ok) {
                                const flatData = await staticRes.json();
                                // Transform flat data to modules
                                const modulesMap = new Map<string, any[]>();
                                flatData.forEach((p: any, idx: number) => {
                                    const topic = p.topic || "General";
                                    if (!modulesMap.has(topic)) modulesMap.set(topic, []);
                                    modulesMap.get(topic)!.push({
                                        id: `str-${idx}`,
                                        title: p.title,
                                        slug: p.slug,
                                        url: p.url,
                                        platform: p.platform,
                                        difficulty: "MEDIUM", // Default as scraped data lacks difficulty often
                                        order: idx
                                    });
                                });

                                const modules = Array.from(modulesMap.entries()).map(([topic, problems]) => ({
                                    topic,
                                    problems
                                }));

                                setData({
                                    id: 'striver',
                                    title: "Striver A2Z DSA Sheet",
                                    desc: "The comprehensive roadmap to master DSA from basics to advanced.",
                                    totalProblems: flatData.length,
                                    modules
                                });
                                setError(null);
                                return;
                            }
                        } catch (e) {
                            console.warn("Failed to load static Striver data", e);
                        }
                    }

                    if (FALLBACK_DATA[sheetId]) {
                        setData(FALLBACK_DATA[sheetId]);
                        setError(null);
                    } else {
                        throw new Error('Sheet not found');
                    }
                    return;
                }

                const sheetData = await response.json();
                setData(sheetData);
                setError(null);
            } catch (err) {
                console.error('Error fetching sheet:', err);
                if (FALLBACK_DATA[sheetId]) {
                    setData(FALLBACK_DATA[sheetId]);
                } else {
                    setError('Failed to load sheet');
                }
            } finally {
                setLoading(false);
            }
        }

        if (sheetId) {
            fetchSheet();
        }
    }, [sheetId]);

    // Load progress from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(`sheet_progress_${sheetId}`);
        if (saved) {
            setChecked(JSON.parse(saved));
        }
    }, [sheetId]);

    const toggleCheck = async (id: string) => {
        const newState = { ...checked, [id]: !checked[id] };
        setChecked(newState);
        localStorage.setItem(`sheet_progress_${sheetId}`, JSON.stringify(newState));

        // Sync to API for Striver sheet (multiplayer feature)
        if (sheetId === 'striver') {
            try {
                await fetch(`/api/sheets/${sheetId}/progress`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        problemId: id,
                        completed: newState[id],
                    }),
                });
                // Refresh community progress
                fetchCommunityProgress();
            } catch (err) {
                console.error('Failed to sync progress:', err);
            }
        }
    };

    // Fetch community progress for multiplayer feature
    const fetchCommunityProgress = async () => {
        if (sheetId !== 'striver') return; // Only for Striver sheet for now

        try {
            setLoadingCommunity(true);
            const response = await fetch(`/api/sheets/${sheetId}/progress`);
            if (response.ok) {
                const data = await response.json();
                setCommunityProgress(data.users || []);
            }
        } catch (err) {
            console.error('Failed to fetch community progress:', err);
        } finally {
            setLoadingCommunity(false);
        }
    };

    // Fetch community progress on mount (for Striver sheet)
    useEffect(() => {
        if (sheetId === 'striver') {
            fetchCommunityProgress();
        }
    }, [sheetId]);

    // Helper: Get users who completed a specific problem
    const getUsersWhoCompleted = (problemId: string): UserProgress[] => {
        return communityProgress.filter(u => u.completed.includes(problemId));
    };

    const toggleModule = (topic: string) => {
        setExpandedModules(prev => ({
            ...prev,
            [topic]: !prev[topic]
        }));
    };

    const expandAll = () => {
        if (!data) return;
        const allExpanded: Record<string, boolean> = {};
        data.modules.forEach(m => {
            allExpanded[m.topic] = true;
        });
        setExpandedModules(allExpanded);
    };

    const collapseAll = () => {
        setExpandedModules({});
    };

    // Calculate module completion
    const getModuleProgress = (problems: Problem[]) => {
        const solved = problems.filter(p => checked[p.id]).length;
        return { solved, total: problems.length };
    };

    // Loading State
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-indigo-400 font-display text-xl animate-pulse mb-4">Loading Collection...</div>
                    <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            </div>
        );
    }

    // Error State
    if (error && !data) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-rose-400 font-display text-xl mb-4">⚠️ {error}</div>
                    <Link href="/sheets" className="text-indigo-400 hover:text-white transition-colors">
                        ← Return to Library
                    </Link>
                </div>
            </div>
        );
    }

    if (!data) return null;

    // Calculate Progress
    const totalQuestions = data.modules?.reduce((acc, m) => acc + m.problems.length, 0) || 0;
    const solvedQuestions = Object.values(checked).filter(Boolean).length;
    const progressPercent = Math.round((solvedQuestions / totalQuestions) * 100) || 0;

    const handleFormParty = () => {
        router.push(`/dojo?mode=party&sheet=${sheetId}`);
    };

    const getDifficultyStyle = (difficulty: string) => {
        const diff = difficulty.toUpperCase();
        if (diff === 'EASY') {
            return 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5';
        } else if (diff === 'MEDIUM') {
            return 'border-amber-500/20 text-amber-400 bg-amber-500/5';
        } else {
            return 'border-rose-500/20 text-rose-400 bg-rose-500/5';
        }
    };

    const formatDifficulty = (difficulty: string) => {
        const diff = difficulty.toUpperCase();
        if (diff === 'EASY') return 'Easy';
        if (diff === 'MEDIUM') return 'Medium';
        return 'Hard';
    };

    return (
        <div className="min-h-screen pt-40 pb-20 px-4">
            <div className="container mx-auto max-w-5xl">

                {/* Hero Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 flex flex-col md:flex-row justify-between items-end relative"
                >
                    <div className="relative z-10 w-full md:w-2/3">
                        <Link href="/sheets" className="text-slate-400 hover:text-white text-sm mb-4 inline-flex items-center gap-2 transition-colors">
                            <span>←</span> Return to Library
                        </Link>
                        <h1 className="text-4xl font-display font-bold text-white mb-2">
                            {data.title}
                        </h1>
                        <p className="text-slate-400 text-lg font-light leading-relaxed">{data.desc}</p>

                        {/* Progress Bar */}
                        <div className="mt-6 max-w-md">
                            <div className="flex justify-between text-xs text-indigo-300 mb-2 font-mono">
                                <span>PROGRESS: {progressPercent}%</span>
                                <span>{solvedQuestions} / {totalQuestions} CLEARED</span>
                            </div>
                            <div className="h-2 w-full bg-black/30 rounded-full overflow-hidden border border-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 mt-6 md:mt-0 flex flex-col gap-3 w-full md:w-auto">
                        <button
                            onClick={() => {
                                if (confirm('Reset all progress for this sheet?')) {
                                    setChecked({});
                                    localStorage.removeItem(`sheet_progress_${sheetId}`);
                                }
                            }}
                            className="px-6 py-2 border border-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors text-sm font-medium"
                        >
                            Reset Progress
                        </button>
                        <button
                            onClick={handleFormParty}
                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                        >
                            <span className="text-xl">⚔️</span>
                            <span>Practice Mode</span>
                        </button>
                    </div>
                </motion.div>

                {/* Expand/Collapse All Controls */}
                <div className="flex justify-end gap-3 mb-4">
                    <button
                        onClick={expandAll}
                        className="px-4 py-2 text-xs font-bold text-indigo-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-colors"
                    >
                        Expand All
                    </button>
                    <button
                        onClick={collapseAll}
                        className="px-4 py-2 text-xs font-bold text-indigo-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-colors"
                    >
                        Collapse All
                    </button>
                </div>

                {/* Modules Grid - Accordion Style */}
                <div className="space-y-3">
                    {data.modules.map((module, i) => {
                        const isExpanded = expandedModules[module.topic] || false;
                        const { solved, total } = getModuleProgress(module.problems);
                        const moduleProgress = total > 0 ? Math.round((solved / total) * 100) : 0;

                        return (
                            <motion.div
                                key={module.topic}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-colors"
                            >
                                {/* Accordion Header - Clickable */}
                                <button
                                    onClick={() => toggleModule(module.topic)}
                                    className="w-full bg-white/5 hover:bg-white/10 px-6 py-4 flex justify-between items-center cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Expand/Collapse Icon */}
                                        <motion.span
                                            animate={{ rotate: isExpanded ? 90 : 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="text-indigo-400 text-xs"
                                        >
                                            ▶
                                        </motion.span>
                                        <h3 className="text-lg font-display font-medium text-white tracking-wide text-left">
                                            {module.topic}
                                        </h3>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {/* Module Progress */}
                                        <div className="hidden sm:flex items-center gap-2">
                                            <div className="w-24 h-1.5 bg-black/30 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500 transition-all duration-300"
                                                    style={{ width: `${moduleProgress}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-slate-400 font-mono w-10 text-right">
                                                {solved}/{total}
                                            </span>
                                        </div>
                                    </div>
                                </button>

                                {/* Accordion Content - Problems List */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                            className="overflow-hidden"
                                        >
                                            <div className="border-t border-white/5 divide-y divide-white/5">
                                                {module.problems.map((prob) => {
                                                    const isDone = !!checked[prob.id];
                                                    return (
                                                        <div
                                                            key={prob.id}
                                                            className={`
                                                                group p-4 flex items-center gap-4 transition-all duration-300
                                                                ${isDone ? 'bg-indigo-500/5' : 'hover:bg-white/5'}
                                                            `}
                                                        >
                                                            <div className="relative">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isDone}
                                                                    onChange={() => toggleCheck(prob.id)}
                                                                    className="peer w-5 h-5 appearance-none border-2 border-slate-600 rounded bg-transparent checked:bg-indigo-500 checked:border-indigo-500 cursor-pointer transition-all"
                                                                />
                                                                <div className="absolute inset-0 pointer-events-none text-white hidden peer-checked:flex items-center justify-center text-xs font-bold">✓</div>
                                                            </div>

                                                            <div className="flex-grow min-w-0">
                                                                <a
                                                                    href={prob.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className={`
                                                                        text-base font-medium transition-colors truncate block
                                                                        ${isDone ? 'text-slate-500 line-through' : 'text-slate-200 group-hover:text-indigo-400'}
                                                                    `}
                                                                >
                                                                    {prob.title}
                                                                </a>
                                                            </div>

                                                            <span className={`
                                                                text-xs px-2 py-1 rounded border font-mono uppercase tracking-wider flex-shrink-0
                                                                ${getDifficultyStyle(prob.difficulty)}
                                                            `}>
                                                                {formatDifficulty(prob.difficulty)}
                                                            </span>

                                                            <button
                                                                onClick={() => router.push(`/dojo?problem=${prob.slug}&url=${encodeURIComponent(prob.url)}`)}
                                                                className="opacity-0 group-hover:opacity-100 p-2 text-indigo-400 hover:text-white transition-opacity bg-white/5 rounded hover:bg-white/10 flex-shrink-0"
                                                                title="Solve in Dojo Room"
                                                            >
                                                                ⚔️
                                                            </button>

                                                            {/* Community Progress Avatars */}
                                                            {sheetId === 'striver' && (() => {
                                                                const completedUsers = getUsersWhoCompleted(prob.id);
                                                                if (completedUsers.length === 0) return null;

                                                                return (
                                                                    <div className="flex items-center gap-1 ml-2 flex-shrink-0" title={`Completed by: ${completedUsers.map(u => u.username).join(', ')}`}>
                                                                        {completedUsers.slice(0, 3).map((user, idx) => (
                                                                            <div
                                                                                key={user.userId}
                                                                                className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border border-white/20 flex items-center justify-center text-xs text-white font-bold overflow-hidden"
                                                                                style={{ marginLeft: idx > 0 ? '-8px' : '0', zIndex: 10 - idx }}
                                                                            >
                                                                                {user.avatarUrl ? (
                                                                                    <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                                                                                ) : (
                                                                                    user.username.charAt(0).toUpperCase()
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                        {completedUsers.length > 3 && (
                                                                            <span className="text-xs text-slate-400 ml-1">+{completedUsers.length - 3}</span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
