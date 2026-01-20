'use client';

import { useState, useEffect, Suspense } from 'react';
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSocket } from '@/lib/socket';

function DojoContent() {
    const { user } = useUser();
    const { socket, isConnected } = useSocket();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [joinCode, setJoinCode] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Create room settings
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Random'>('Medium');
    const [duration, setDuration] = useState(30);
    const [isHardcore, setIsHardcore] = useState(false);
    const [leetCodeRoomUrl, setLeetCodeRoomUrl] = useState('');

    // Pre-fill URL from query params
    useEffect(() => {
        const urlParam = searchParams.get('url');
        if (urlParam) {
            setLeetCodeRoomUrl(urlParam);
        }
    }, [searchParams]);

    // Parse LeetCode URL to extract problem and roomId
    const parseLeetCodeUrl = (url: string) => {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/').filter(Boolean);
            const problemSlug = pathParts[1] || 'two-sum';
            const roomId = urlObj.searchParams.get('roomId') || '';
            return { problemSlug, roomId, isValid: pathParts[0] === 'problems' };
        } catch {
            return { problemSlug: '', roomId: '', isValid: false };
        }
    };

    const handleCreateRoom = () => {
        if (!socket || !user) return;

        setIsCreating(true);
        setError(null);

        const { problemSlug, roomId, isValid } = parseLeetCodeUrl(leetCodeRoomUrl);

        socket.emit('room:create', {
            userId: user.id,
            username: user.firstName || user.username || 'Anonymous',
            avatarUrl: user.imageUrl,
            difficulty,
            duration,
            isHardcore,
            entryFee: isHardcore ? 50 : 0,
            problemSlug: isValid ? problemSlug : undefined,
            leetCodeRoomId: isValid ? roomId : undefined,
            leetCodeRoomUrl: isValid ? leetCodeRoomUrl : undefined,
        }, (response: { success: boolean; room?: any; error?: string }) => {
            setIsCreating(false);
            if (response.success && response.room) {
                router.push(`/dojo/${response.room.code}`);
            } else {
                setError(response.error || 'Failed to create room');
            }
        });
    };

    const handleJoinRoom = () => {
        if (!socket || !user || !joinCode.trim()) return;

        setIsJoining(true);
        setError(null);

        socket.emit('room:join', {
            roomCode: joinCode.trim().toUpperCase(),
            userId: user.id,
            username: user.firstName || user.username || 'Anonymous',
            avatarUrl: user.imageUrl,
        }, (response: { success: boolean; room?: any; error?: string }) => {
            setIsJoining(false);
            if (response.success && response.room) {
                router.push(`/dojo/${response.room.code}`);
            } else {
                setError(response.error || 'Failed to join room');
            }
        });
    };

    return (
        <div className="min-h-screen pt-16 px-4 md:px-8 pb-20 selection:bg-indigo-500/30 selection:text-white">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 text-white drop-shadow-sm">
                        Enter The <span className="text-indigo-500">Dojo</span>
                    </h1>
                    <p className="text-slate-400 text-lg font-medium">
                        Battle rivals in real-time coding challenges
                    </p>

                    {/* Connection Status */}
                    <div className="mt-4 flex items-center justify-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-red-500/50'}`} />
                        <span className="text-sm text-slate-500">
                            {isConnected ? 'Connected to Dojo Server' : 'Connecting...'}
                        </span>
                    </div>
                </motion.div>

                {/* Error Display */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded text-center"
                    >
                        <span className="text-red-300 font-medium">❌ {error}</span>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Create Room */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-liquid p-6 border border-white/5"
                    >
                        <h2 className="font-display text-2xl font-bold text-white mb-6 border-b border-white/5 pb-3">
                            ⚔️ Create Battle
                        </h2>

                        <div className="space-y-5">
                            {/* Difficulty */}
                            <div>
                                <label className="text-sm text-slate-400 mb-2 block font-bold uppercase tracking-wider">Difficulty</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {(['Easy', 'Medium', 'Hard', 'Random'] as const).map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => setDifficulty(d)}
                                            className={`py-2 px-4 rounded-full text-sm font-bold transition-all border ${difficulty === d
                                                ? d === 'Easy' ? 'bg-emerald-900/50 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-500/20'
                                                    : d === 'Medium' ? 'bg-amber-900/50 text-amber-300 border-amber-500/50 shadow-lg shadow-amber-500/20'
                                                        : d === 'Hard' ? 'bg-rose-900/50 text-rose-300 border-rose-500/50 shadow-lg shadow-rose-500/20'
                                                            : 'bg-indigo-900/50 text-indigo-300 border-indigo-500/50 shadow-lg shadow-indigo-500/20'
                                                : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/20'
                                                }`}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="text-sm text-slate-400 mb-2 block font-bold uppercase tracking-wider">Duration</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[15, 30, 45, 60].map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => setDuration(d)}
                                            className={`py-2 px-4 rounded-full text-sm font-bold transition-all border ${duration === d
                                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
                                                : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/20'
                                                }`}
                                        >
                                            {d} min
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* LeetCode Room URL */}
                            <div>
                                <label className="text-sm text-slate-400 mb-2 block font-bold uppercase tracking-wider">
                                    Quick Start URL <span className="text-slate-600 font-normal">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={leetCodeRoomUrl}
                                    onChange={(e) => setLeetCodeRoomUrl(e.target.value)}
                                    placeholder="https://leetcode.com/problems/two-sum/?roomId=..."
                                    className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    💡 Skip this to vote on problems in the lobby with your friends!
                                </p>
                                {leetCodeRoomUrl && parseLeetCodeUrl(leetCodeRoomUrl).isValid && (
                                    <div className="mt-2 text-xs text-emerald-400">
                                        ✅ Problem: {parseLeetCodeUrl(leetCodeRoomUrl).problemSlug} | Room: {parseLeetCodeUrl(leetCodeRoomUrl).roomId}
                                    </div>
                                )}
                            </div>

                            {/* Hardcore Mode */}
                            <div className="flex items-center justify-between p-4 bg-orange-900/10 rounded border border-orange-500/20">
                                <div>
                                    <div className="font-bold text-orange-200">🔥 Hardcore Mode</div>
                                    <div className="text-xs text-orange-400/60">Wager 50 Coins</div>
                                </div>
                                <button
                                    onClick={() => setIsHardcore(!isHardcore)}
                                    className={`w-12 h-6 rounded-full transition-all ${isHardcore ? 'bg-orange-500 shadow-lg shadow-orange-500/20' : 'bg-slate-800 border border-white/10'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${isHardcore ? 'translate-x-6' : 'translate-x-0.5'
                                        }`} />
                                </button>
                            </div>

                            {/* Create Button */}
                            <motion.button
                                onClick={handleCreateRoom}
                                disabled={!isConnected || isCreating}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg rounded-lg shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {isCreating ? '⚡ Preparing Arena...' : '⚔️ CREATE ROOM'}
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Join Room */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-liquid p-6 border border-white/5"
                    >
                        <h2 className="font-display text-2xl font-bold text-white mb-6 border-b border-white/5 pb-3">
                            🎯 Join Battle
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="text-sm text-slate-400 mb-2 block font-bold uppercase tracking-wider">Room Code</label>
                                <input
                                    type="text"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    placeholder="Enter 6-character code"
                                    maxLength={6}
                                    className="w-full py-4 px-6 bg-slate-900/60 border border-white/10 rounded text-white text-center font-mono text-2xl tracking-widest uppercase placeholder:text-slate-600 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            <motion.button
                                onClick={handleJoinRoom}
                                disabled={!isConnected || isJoining || joinCode.length < 6}
                                className="w-full py-4 bg-emerald-600 text-white font-bold text-lg rounded-lg border-2 border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {isJoining ? '⚡ Joining...' : '🎯 JOIN ROOM'}
                            </motion.button>

                            {/* How it works */}
                            <div className="pt-6 border-t border-white/5">
                                <h3 className="font-bold text-lg text-white mb-3">How it works</h3>
                                <ul className="space-y-3 text-sm text-slate-400">
                                    <li className="flex items-start gap-3">
                                        <span className="text-indigo-500 font-bold">1.</span>
                                        <span>Create or join a room with friends</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-indigo-500 font-bold">2.</span>
                                        <span>Suggest problems & vote on which to solve</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="text-indigo-500 font-bold">3.</span>
                                        <span>Race to solve it first and earn XP!</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Recent Battles */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-10 glass-liquid p-6 border border-white/5"
                >
                    <h2 className="font-display text-xl font-bold text-white mb-4 border-b border-white/5 pb-3">
                        📜 Battle Chronicle
                    </h2>
                    <div className="text-center py-10 text-slate-400">
                        <div className="text-5xl mb-3 opacity-50">⚔️</div>
                        <p className="text-lg font-medium">No battles recorded yet</p>
                        <p className="text-sm mt-1 text-slate-500">Your legend awaits, challenger!</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default function DojoPage() {
    return (
        <Suspense fallback={<div className="min-h-screen pt-20 flex justify-center text-white">Loading Dojo...</div>}>
            <DojoContent />
        </Suspense>
    );
}
