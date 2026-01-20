'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/lib/socket';
import { FriendsList } from '@/components/social';
import confetti from 'canvas-confetti';
import { playNotificationSound } from '@/lib/audio';

interface Participant {
    userId: string;
    username: string;
    avatarUrl?: string;
    isReady: boolean;
    solved: boolean;
    solveTime?: number;
}

interface ChatMessage {
    id: string;
    userId: string;
    username: string;
    message: string;
    timestamp: string;
    type: 'message' | 'system' | 'invite';
    roomCode?: string;
}

interface ProblemSuggestion {
    id: string;
    url: string;
    problemSlug: string;
    problemTitle: string;
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Unknown';
    submittedBy: string;
    submittedByUsername: string;
    votes: string[];
    voteCount: number;
}

interface RoomState {
    code: string;
    hostId: string;
    status: 'waiting' | 'starting' | 'in_progress' | 'finished';
    problemSlug: string;
    problemTitle?: string;
    difficulty: string;
    duration: number;
    startTime?: number;
    isHardcore: boolean;
    leetCodeRoomUrl?: string;
    participants: Participant[];
    chat: ChatMessage[];
    problemSuggestions: ProblemSuggestion[];
    problemLocked: boolean;
}

export default function BattleRoomPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useUser();
    const { socket, isConnected } = useSocket();
    const chatRef = useRef<HTMLDivElement>(null);

    const roomCode = params.code as string;

    const [room, setRoom] = useState<RoomState | null>(null);
    const [countdown, setCountdown] = useState<number | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [chatInput, setChatInput] = useState('');
    const [showFriends, setShowFriends] = useState(false);
    const [winnerId, setWinnerId] = useState<string | null>(null);

    // Notifications
    const [notification, setNotification] = useState<{ message: string; type: 'info' | 'warning' | 'success' } | null>(null);

    // Confetti / Celebration Logic
    const triggerCelebration = useCallback(() => {
        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 999 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        playNotificationSound('success');
    }, []);

    // LeetCode problem opened in new tab
    const [problemOpened, setProblemOpened] = useState(false);

    // Voting state
    const [problemUrlInput, setProblemUrlInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [votingError, setVotingError] = useState<string | null>(null);

    // Join room on mount
    useEffect(() => {
        if (!socket || !user || !roomCode) return;

        socket.emit('room:join', {
            roomCode,
            userId: user.id,
            username: user.firstName || user.username || 'Anonymous',
            avatarUrl: user.imageUrl,
        }, (response: { success: boolean; room?: RoomState; error?: string }) => {
            if (response.success && response.room) {
                setRoom(response.room);
                if (response.room.status === 'in_progress' && response.room.startTime) {
                    const elapsed = (Date.now() - response.room.startTime) / 1000;
                    setTimeRemaining(Math.max(0, response.room.duration * 60 - elapsed));
                }
            }
        });

        // Event listeners
        socket.on('room:participant-joined', (data: Participant) => {
            setRoom(prev => prev ? { ...prev, participants: [...prev.participants, data] } : null);
            playNotificationSound('chat');
        });

        socket.on('room:participant-left', (data: { userId: string }) => {
            setRoom(prev => prev ? {
                ...prev,
                participants: prev.participants.filter(p => p.userId !== data.userId),
            } : null);
        });

        socket.on('room:participant-updated', (data: { userId: string; isReady?: boolean }) => {
            setRoom(prev => prev ? {
                ...prev,
                participants: prev.participants.map(p => p.userId === data.userId ? { ...p, ...data } : p),
            } : null);
        });

        socket.on('room:chat-message', (msg: ChatMessage) => {
            setRoom(prev => prev ? { ...prev, chat: [...prev.chat, msg] } : null);
            if (msg.userId !== user.id) playNotificationSound('chat');
        });

        socket.on('room:starting', (data: { countdown: number }) => {
            setCountdown(data.countdown);
            playNotificationSound('warning'); // Beep for countdown
            let count = data.countdown;
            const interval = setInterval(() => {
                count--;
                setCountdown(count);
                if (count > 0) playNotificationSound('warning');
                if (count <= 0) {
                    clearInterval(interval);
                    playNotificationSound('start'); // GONG
                    setTimeout(() => setCountdown(null), 1000);
                }
            }, 1000);
        });

        socket.on('room:started', (data) => {
            setRoom(prev => prev ? { ...prev, status: 'in_progress', ...data } : null);
            setTimeRemaining(data.duration * 60);
            setNotification({ message: '⚔️ BATTLE START!', type: 'success' });
            setTimeout(() => setNotification(null), 3000);
        });

        socket.on('room:participant-solved', (data: { userId: string; solveTime: number }) => {
            setRoom(prev => prev ? {
                ...prev,
                participants: prev.participants.map(p =>
                    p.userId === data.userId ? { ...p, solved: true, solveTime: data.solveTime } : p
                ),
            } : null);

            if (data.userId === user.id) {
                triggerCelebration();
                setNotification({ message: '🎉 Problem Solved!', type: 'success' });
            } else {
                playNotificationSound('chat');
            }
        });

        socket.on('room:finished', (data: { rankings: Participant[]; winnerId: string }) => {
            setRoom(prev => prev ? { ...prev, status: 'finished', participants: data.rankings } : null);
            setWinnerId(data.winnerId);
            if (data.winnerId === user.id) {
                playNotificationSound('win');
                confetti({
                    particleCount: 200,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
        });

        // Voting events
        socket.on('room:problem-suggested', (suggestion: ProblemSuggestion) => {
            setRoom(prev => prev ? {
                ...prev,
                problemSuggestions: [...prev.problemSuggestions, suggestion],
            } : null);
        });

        socket.on('room:vote-updated', (data: { suggestionId: string; votes: string[]; voteCount: number }) => {
            setRoom(prev => prev ? {
                ...prev,
                problemSuggestions: prev.problemSuggestions.map(s =>
                    s.id === data.suggestionId ? { ...s, votes: data.votes, voteCount: data.voteCount } : s
                ),
            } : null);
        });

        socket.on('room:problem-locked', (data: { problemSlug: string; problemTitle: string; difficulty: string; leetCodeRoomUrl?: string }) => {
            setRoom(prev => prev ? {
                ...prev,
                problemLocked: true,
                problemSlug: data.problemSlug,
                problemTitle: data.problemTitle,
                difficulty: data.difficulty,
                leetCodeRoomUrl: data.leetCodeRoomUrl,
            } : null);
        });

        return () => {
            socket.off('room:participant-joined');
            socket.off('room:participant-left');
            socket.off('room:participant-updated');
            socket.off('room:chat-message');
            socket.off('room:starting');
            socket.off('room:started');
            socket.off('room:participant-solved');
            socket.off('room:finished');
            socket.off('room:problem-suggested');
            socket.off('room:vote-updated');
            socket.off('room:problem-locked');
        };
    }, [socket, user, roomCode]);

    // Timer & Warnings
    useEffect(() => {
        if (timeRemaining === null || timeRemaining <= 0) return;

        // Audio/Visual Warnings
        if (timeRemaining === 600) { // 10 mins
            playNotificationSound('warning');
            setNotification({ message: '⚠️ 10 Minutes Remaining!', type: 'warning' });
            setTimeout(() => setNotification(null), 5000);
        }
        if (timeRemaining === 300) { // 5 mins
            playNotificationSound('warning');
            setNotification({ message: '⚠️ 5 Minutes Remaining!', type: 'warning' });
            setTimeout(() => setNotification(null), 5000);
        }
        if (timeRemaining === 60) { // 1 min
            playNotificationSound('warning');
            setNotification({ message: '⚠️ 1 Minute Remaining!', type: 'warning' });
            setTimeout(() => setNotification(null), 5000);
        }

        const interval = setInterval(() => setTimeRemaining(prev => prev !== null ? Math.max(0, prev - 1) : null), 1000);
        return () => clearInterval(interval);
    }, [timeRemaining]);

    // Auto-scroll chat
    useEffect(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, [room?.chat]);

    // Poll LeetCode for solve status (every 10s when battle is in progress)
    useEffect(() => {
        if (!room || room.status !== 'in_progress' || !user) return;

        const me = room.participants.find(p => p.userId === user.id);
        if (me?.solved) return; // Already solved

        const checkSolved = async () => {
            try {
                // Get the user's LeetCode username
                const userRes = await fetch('/api/user/leetcode');
                const userData = await userRes.json();
                if (!userData.leetcodeUsername) return;

                const res = await fetch('/api/leetcode/check-solved', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: userData.leetcodeUsername,
                        problemSlug: room.problemSlug,
                        afterTimestamp: room.startTime,
                    }),
                });
                const data = await res.json();

                if (data.solved) {
                    socket?.emit('room:solved', {
                        roomCode: room.code,
                        userId: user.id,
                        solveTime: data.timestamp - (room.startTime || 0),
                    });
                }
            } catch (err) {
                console.error('Check solved error:', err);
            }
        };

        // Check immediately and then every 10 seconds
        checkSolved();
        const interval = setInterval(checkSolved, 10000);
        return () => clearInterval(interval);
    }, [room?.status, room?.startTime, room?.problemSlug, user, socket]);

    const handleReady = () => {
        if (!socket || !user || !room) return;
        const me = room.participants.find(p => p.userId === user.id);
        socket.emit('room:ready', { roomCode: room.code, userId: user.id, isReady: !me?.isReady });
    };

    const handleStart = () => {
        if (!socket || !user || !room) return;
        socket.emit('room:start', { roomCode: room.code, hostId: user.id });
    };

    const handleSendChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (!socket || !user || !room || !chatInput.trim()) return;
        socket.emit('room:chat', { roomCode: room.code, userId: user.id, username: user.firstName || 'Anonymous', message: chatInput.trim() });
        setChatInput('');
    };

    const handleOpenProblem = () => {
        if (!room) return;
        // If host provided a LeetCode room URL, use it (participants join same session)
        const url = room.leetCodeRoomUrl || `https://leetcode.com/problems/${room.problemSlug}`;
        window.open(url, '_blank');
        setProblemOpened(true);
    };

    const handleCopyInvite = () => {
        navigator.clipboard.writeText(`${window.location.origin}/dojo/${roomCode}`);
    };

    // Parse LeetCode URL to extract problem info
    const parseLeetCodeUrl = (url: string) => {
        try {
            const urlObj = new URL(url);
            if (!urlObj.hostname.includes('leetcode.com')) {
                return { isValid: false, problemSlug: '', problemTitle: '' };
            }
            const pathParts = urlObj.pathname.split('/').filter(Boolean);
            if (pathParts[0] !== 'problems' || !pathParts[1]) {
                return { isValid: false, problemSlug: '', problemTitle: '' };
            }
            const problemSlug = pathParts[1];
            // Convert slug to title: "two-sum" -> "Two Sum"
            const problemTitle = problemSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            return { isValid: true, problemSlug, problemTitle };
        } catch {
            return { isValid: false, problemSlug: '', problemTitle: '' };
        }
    };

    const handleSuggestProblem = () => {
        if (!socket || !user || !room || !problemUrlInput.trim()) return;

        const parsed = parseLeetCodeUrl(problemUrlInput);
        if (!parsed.isValid) {
            setVotingError('Please enter a valid LeetCode problem URL');
            return;
        }

        setIsSubmitting(true);
        setVotingError(null);

        socket.emit('room:suggest-problem', {
            roomCode: room.code,
            userId: user.id,
            username: user.firstName || user.username || 'Anonymous',
            url: problemUrlInput.trim(),
            problemSlug: parsed.problemSlug,
            problemTitle: parsed.problemTitle,
            difficulty: 'Unknown' as const, // User can't easily know this
        }, (response: { success: boolean; error?: string }) => {
            setIsSubmitting(false);
            if (response.success) {
                setProblemUrlInput('');
            } else {
                setVotingError(response.error || 'Failed to suggest problem');
            }
        });
    };

    const handleVote = (suggestionId: string) => {
        if (!socket || !user || !room) return;

        socket.emit('room:vote-problem', {
            roomCode: room.code,
            userId: user.id,
            suggestionId,
        });
    };

    const handleLockProblem = () => {
        if (!socket || !user || !room) return;

        socket.emit('room:lock-problem', {
            roomCode: room.code,
            hostId: user.id,
        }, (response: { success: boolean; error?: string }) => {
            if (!response.success) {
                setVotingError(response.error || 'Failed to lock problem');
            }
        });
    };

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

    if (!room) return <div className="min-h-screen grid place-items-center text-4xl">⚡</div>;

    const isHost = user?.id === room.hostId;
    const allReady = room.participants.every(p => p.isReady);
    const me = room.participants.find(p => p.userId === user?.id);

    return (
        <div className="min-h-screen p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <header className="flex items-center justify-between bg-beast-dark-300/50 p-4 rounded-xl border border-beast-primary/20">
                    <div>
                        <div className="text-sm text-muted-foreground">Room Code</div>
                        <div className="font-display text-2xl font-bold text-beast-primary tracking-widest">{room.code}</div>
                    </div>

                    <div className="flex items-center gap-4">
                        {room.status === 'in_progress' && timeRemaining !== null && (
                            <div className={`font-mono text-2xl font-bold ${timeRemaining < 60 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                ⏱️ {formatTime(timeRemaining)}
                            </div>
                        )}

                        <button
                            onClick={handleCopyInvite}
                            className="px-3 py-1.5 text-sm bg-beast-dark-300 border border-beast-primary/30 rounded-lg hover:bg-beast-dark-200"
                        >
                            📋 Copy Invite
                        </button>

                        <button
                            onClick={() => setShowFriends(true)}
                            className="px-3 py-1.5 text-sm bg-beast-primary/20 text-beast-primary border border-beast-primary/30 rounded-lg hover:bg-beast-primary/30"
                        >
                            👥 Invite Friends
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left: Problem + Action */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Problem Card */}
                        <div className="bg-beast-dark-300/50 rounded-xl border border-beast-primary/20 p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <span className={`text-xs px-2 py-0.5 rounded ${room.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                                        room.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-red-500/20 text-red-400'
                                        }`}>
                                        {room.difficulty}
                                    </span>
                                    <h2 className="font-display text-2xl font-bold text-white mt-2">
                                        {room.problemTitle || room.problemSlug}
                                    </h2>
                                </div>
                                {room.isHardcore && (
                                    <div className="text-beast-warning text-sm font-bold">🔥 Hardcore</div>
                                )}
                            </div>

                            {room.status === 'waiting' ? (
                                <div className="space-y-6">
                                    {/* Problem Voting Section */}
                                    {!room.problemLocked ? (
                                        <>
                                            {/* Submit Problem Input */}
                                            <div className="space-y-3">
                                                <label className="text-sm text-muted-foreground block">🗳️ Suggest a Problem</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={problemUrlInput}
                                                        onChange={(e) => setProblemUrlInput(e.target.value)}
                                                        placeholder="https://leetcode.com/problems/..."
                                                        disabled={room.problemLocked}
                                                        className="flex-1 py-2 px-3 bg-beast-dark-400 border border-beast-primary/30 rounded-lg text-sm focus:outline-none focus:border-beast-primary disabled:opacity-50"
                                                    />
                                                    <button
                                                        onClick={handleSuggestProblem}
                                                        disabled={isSubmitting || !problemUrlInput.trim()}
                                                        className="px-4 py-2 bg-beast-primary text-beast-dark-500 font-bold rounded-lg disabled:opacity-50 hover:bg-beast-primary/90"
                                                    >
                                                        {isSubmitting ? '...' : 'Add'}
                                                    </button>
                                                </div>
                                                {votingError && (
                                                    <p className="text-xs text-red-400">{votingError}</p>
                                                )}
                                            </div>

                                            {/* Suggestions List */}
                                            {room.problemSuggestions.length > 0 && (
                                                <div className="space-y-3">
                                                    <div className="text-sm text-muted-foreground">
                                                        📊 Voting ({room.problemSuggestions.length} suggestion{room.problemSuggestions.length !== 1 ? 's' : ''})
                                                    </div>
                                                    {room.problemSuggestions.map(suggestion => {
                                                        const hasVoted = user?.id ? suggestion.votes.includes(user.id) : false;
                                                        const maxVotes = Math.max(...room.problemSuggestions.map(s => s.voteCount), 1);
                                                        const votePercent = (suggestion.voteCount / maxVotes) * 100;

                                                        return (
                                                            <div
                                                                key={suggestion.id}
                                                                className={`p-3 rounded-lg border transition-all ${hasVoted ? 'bg-beast-primary/10 border-beast-primary/50' : 'bg-beast-dark-400/50 border-beast-primary/20 hover:border-beast-primary/40'}`}
                                                            >
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`text-xs px-2 py-0.5 rounded ${suggestion.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                                                                            suggestion.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                                suggestion.difficulty === 'Hard' ? 'bg-red-500/20 text-red-400' :
                                                                                    'bg-gray-500/20 text-gray-400'
                                                                            }`}>
                                                                            {suggestion.difficulty}
                                                                        </span>
                                                                        <span className="font-medium text-white">{suggestion.problemTitle}</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleVote(suggestion.id)}
                                                                        className={`px-3 py-1 text-sm font-bold rounded transition-all ${hasVoted
                                                                            ? 'bg-beast-primary text-beast-dark-500'
                                                                            : 'bg-beast-dark-300 text-beast-primary border border-beast-primary/50 hover:bg-beast-primary/10'
                                                                            }`}
                                                                    >
                                                                        {hasVoted ? '✓ Voted' : 'Vote'}
                                                                    </button>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="flex-1 h-2 bg-beast-dark-400 rounded-full overflow-hidden">
                                                                        <motion.div
                                                                            className="h-full bg-beast-primary"
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${votePercent}%` }}
                                                                            transition={{ duration: 0.3 }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs text-muted-foreground min-w-[60px] text-right">
                                                                        {suggestion.voteCount} vote{suggestion.voteCount !== 1 ? 's' : ''}
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs text-muted-foreground mt-1">
                                                                    by @{suggestion.submittedByUsername}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}

                                                    {/* Lock Problem Button (Host only) */}
                                                    {isHost && room.problemSuggestions.length > 0 && (
                                                        <button
                                                            onClick={handleLockProblem}
                                                            className="w-full py-3 bg-beast-accent text-beast-dark-500 font-bold rounded-lg hover:bg-beast-accent/90"
                                                        >
                                                            🔒 Lock Problem (Most Votes Wins)
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {room.problemSuggestions.length === 0 && (
                                                <div className="text-center py-6 text-muted-foreground">
                                                    <div className="text-4xl mb-2">🎯</div>
                                                    <p>No problems suggested yet</p>
                                                    <p className="text-sm">Paste a LeetCode URL above to get started!</p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        /* Problem is locked - show the selected problem */
                                        <div className="text-center py-4">
                                            <div className="text-sm text-beast-primary mb-2">🎯 Problem Locked!</div>
                                            <h3 className="text-xl font-bold text-white mb-2">{room.problemTitle || room.problemSlug}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded ${room.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                                                room.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-red-500/20 text-red-400'
                                                }`}>
                                                {room.difficulty}
                                            </span>
                                        </div>
                                    )}

                                    {/* Ready and Start Buttons */}
                                    <div className="pt-4 border-t border-beast-primary/20">
                                        <p className="text-muted-foreground text-center text-sm mb-4">
                                            {room.participants.length}/4 warriors • {room.problemLocked ? 'Problem locked!' : 'Waiting for problem...'}
                                        </p>
                                        <div className="flex flex-col gap-3 max-w-xs mx-auto">
                                            <button
                                                onClick={handleReady}
                                                disabled={!room.problemLocked}
                                                className={`py-3 rounded-lg font-bold transition-all ${!room.problemLocked
                                                    ? 'bg-beast-dark-400 text-muted-foreground cursor-not-allowed'
                                                    : me?.isReady
                                                        ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                                                        : 'bg-beast-dark-300 text-white border border-beast-primary/30 hover:border-beast-primary'
                                                    }`}
                                            >
                                                {!room.problemLocked
                                                    ? (isHost ? '🔒 Lock a problem first' : '⏳ Waiting for Host to Lock Problem')
                                                    : me?.isReady ? '✅ READY!' : '⚔️ CLICK TO READY'}
                                            </button>
                                            {isHost && (
                                                <button
                                                    onClick={handleStart}
                                                    disabled={!allReady || !room.problemLocked}
                                                    className="py-3 bg-beast-primary text-beast-dark-500 font-bold rounded-lg disabled:opacity-50"
                                                >
                                                    {room.participants.length === 1 ? 'START SOLO' : 'START BATTLE'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : room.status === 'in_progress' ? (
                                <div className="space-y-4">
                                    <motion.button
                                        onClick={handleOpenProblem}
                                        className="w-full py-4 bg-beast-primary text-beast-dark-500 font-display font-bold text-lg rounded-lg"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {problemOpened ? '🔄 REOPEN ON LEETCODE' : '🚀 OPEN ON LEETCODE'}
                                    </motion.button>

                                    {problemOpened && (
                                        <div className="text-center text-muted-foreground text-sm">
                                            Solve the problem on LeetCode • We're checking your progress...
                                        </div>
                                    )}

                                    {me?.solved && (
                                        <div className="text-center text-green-400 font-bold py-4 bg-green-500/10 rounded-lg">
                                            ✅ You solved it! Waiting for others...
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>

                        {/* Participants */}
                        <div className="bg-beast-dark-300/50 rounded-xl border border-beast-primary/20 p-4">
                            <h3 className="font-display font-bold text-white mb-3">⚔️ Warriors</h3>
                            <div className="space-y-2">
                                {room.participants.map((p, i) => (
                                    <div
                                        key={p.userId}
                                        className={`flex items-center justify-between p-3 rounded-lg ${p.solved ? 'bg-green-500/10 border border-green-500/30' : 'bg-beast-dark-400/50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{i === 0 ? '👑' : '⚔️'}</span>
                                            <div className="w-8 h-8 rounded-full bg-beast-primary/20 overflow-hidden">
                                                {p.avatarUrl ? (
                                                    <img src={p.avatarUrl} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold">{p.username[0]}</div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">{p.username}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {room.status === 'waiting'
                                                        ? (p.isReady ? '✅ Ready' : '⏳ Not ready')
                                                        : p.solved
                                                            ? `✅ Solved in ${formatTime((p.solveTime || 0) / 1000)}`
                                                            : '🔄 Solving...'
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Chat */}
                    <div className="bg-beast-dark-300/50 rounded-xl border border-beast-primary/20 flex flex-col h-[500px]">
                        <div className="p-3 border-b border-beast-primary/20 font-bold text-white">💬 Chat</div>
                        <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
                            {room.chat.map(msg => (
                                <div key={msg.id} className={`text-sm ${msg.type === 'system' ? 'text-center text-muted-foreground italic' : ''}`}>
                                    {msg.type === 'message' && <span className="text-beast-primary font-bold">{msg.username}: </span>}
                                    <span className="text-gray-300">{msg.message}</span>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleSendChat} className="p-3 border-t border-beast-primary/20 flex gap-2">
                            <input
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 py-2 px-3 bg-beast-dark-400 border border-beast-primary/30 rounded-lg text-sm text-black focus:outline-none"
                            />
                            <button type="submit" className="px-4 bg-beast-primary text-beast-dark-500 font-bold rounded-lg">
                                Send
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Countdown Overlay */}
            <AnimatePresence>
                {countdown !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
                    >
                        <motion.div
                            key={countdown}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 2, opacity: 0 }}
                            className="font-display text-9xl font-black text-beast-primary"
                        >
                            {countdown > 0 ? countdown : 'GO!'}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Winner Overlay */}
            {room.status === 'finished' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50"
                >
                    <div className="bg-beast-dark-300 border border-beast-primary p-8 rounded-2xl max-w-md w-full text-center">
                        <div className="text-6xl mb-4">🏆</div>
                        <h2 className="text-3xl font-display font-bold text-white mb-6">
                            {winnerId === user?.id ? 'You Won!' : 'Battle Complete!'}
                        </h2>
                        <div className="space-y-3">
                            {room.participants.map((p, i) => (
                                <div key={p.userId} className={`flex items-center justify-between p-3 rounded-lg ${i === 0 ? 'bg-beast-primary/20 border border-beast-primary' : 'bg-white/5'}`}>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">#{i + 1}</span>
                                        <span>{p.username}</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        {p.solved ? formatTime((p.solveTime || 0) / 1000) : 'DNF'}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => router.push('/dojo')}
                            className="mt-6 px-6 py-3 bg-beast-primary text-beast-dark-500 font-bold rounded-lg"
                        >
                            Return to Dojo
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Friends Sidebar */}
            <AnimatePresence>
                {showFriends && (
                    <motion.div
                        initial={{ opacity: 0, x: 300 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 300 }}
                        className="fixed right-4 top-20 z-40"
                    >
                        <FriendsList roomCode={roomCode} onClose={() => setShowFriends(false)} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notification Toast */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full font-bold shadow-2xl border ${notification.type === 'warning' ? 'bg-red-500/90 text-white border-red-400' :
                            notification.type === 'success' ? 'bg-green-500/90 text-white border-green-400' :
                                'bg-blue-500/90 text-white border-blue-400'
                            }`}
                    >
                        {notification.message}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
