'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface LeetCodeConnectProps {
    currentUsername?: string;
    onConnect: (username: string) => Promise<{ success: boolean; error?: string }>;
    isLoading?: boolean;
}

export function LeetCodeConnect({ currentUsername, onConnect, isLoading }: LeetCodeConnectProps) {
    const [username, setUsername] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) return;

        setError(null);
        setSyncing(true);

        try {
            const result = await onConnect(username.trim());
            if (!result.success) {
                setError(result.error || 'Failed to connect');
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setSyncing(false);
        }
    };

    if (currentUsername) {
        return (
            <div className="cyber-card p-6 border-beast-primary/40">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <motion.div
                            className="w-10 h-10 rounded-full bg-beast-primary/20 flex items-center justify-center"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >
                            ✅
                        </motion.div>
                        <div>
                            <div className="text-sm text-muted-foreground">Connected as</div>
                            <div className="font-display font-bold text-beast-primary">
                                {currentUsername}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => {/* TODO: disconnect */ }}
                        className="px-3 py-1.5 text-sm text-muted-foreground hover:text-white border border-beast-primary/20 rounded-lg hover:bg-beast-dark-300 transition-colors"
                    >
                        Disconnect
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="cyber-card p-6">
            <h2 className="font-display text-xl font-bold text-white mb-2">
                🔗 Connect LeetCode
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
                Link your LeetCode account to start tracking your progress, earn XP, and unlock rewards.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Your LeetCode username"
                        className="flex-1 bg-beast-dark-300 border border-beast-primary/30 rounded-lg px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:border-beast-primary transition-colors"
                        disabled={syncing}
                    />
                    <motion.button
                        type="submit"
                        disabled={!username.trim() || syncing}
                        className="px-6 py-3 bg-beast-primary text-beast-dark-500 font-display font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-beast-primary/90 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {syncing ? (
                            <motion.span
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="inline-block"
                            >
                                ⚡
                            </motion.span>
                        ) : (
                            'CONNECT'
                        )}
                    </motion.button>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-beast-secondary text-sm flex items-center gap-2"
                    >
                        <span>❌</span>
                        {error}
                    </motion.div>
                )}
            </form>

            <div className="mt-4 pt-4 border-t border-beast-primary/10">
                <div className="text-xs text-muted-foreground">
                    <span className="text-beast-primary">💡 Tip:</span> Your LeetCode username is in your profile URL:
                    <span className="text-white"> leetcode.com/u/</span>
                    <span className="text-beast-accent">username</span>
                </div>
            </div>
        </div>
    );
}
