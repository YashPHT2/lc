'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/lib/socket';
import { useRouter } from 'next/navigation';

interface Friend {
    id: string;
    friendshipId: string;
    username: string;
    avatarUrl?: string;
    leetcodeUsername?: string;
    level: number;
    leagueTier: string;
    currentStreak: number;
    isRival: boolean;
}

interface Invite {
    id: string;
    roomCode: string;
    message: string;
    createdAt: string;
    from: { username: string; avatarUrl?: string };
}

interface FriendsListProps {
    roomCode?: string; // If in a room, show invite buttons
    onClose?: () => void;
}

export function FriendsList({ roomCode, onClose }: FriendsListProps) {
    const router = useRouter();
    const { socket } = useSocket();

    const [friends, setFriends] = useState<Friend[]>([]);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'friends' | 'invites' | 'add'>('friends');
    const [addUsername, setAddUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Fetch friends
    useEffect(() => {
        fetch('/api/friends')
            .then((res) => res.json())
            .then((data) => setFriends(data.friends || []))
            .catch(console.error);
    }, []);

    // Fetch invites
    useEffect(() => {
        fetch('/api/invites')
            .then((res) => res.json())
            .then((data) => setInvites(data.invites || []))
            .catch(console.error);
    }, []);

    // Listen for online presence updates
    useEffect(() => {
        if (!socket) return;

        socket.on('presence:update', (userIds: string[]) => {
            setOnlineUsers(new Set(userIds));
        });

        // Also listen for real-time invites
        socket.on('invite:received', (invite: Invite) => {
            setInvites((prev) => [invite, ...prev]);
        });

        return () => {
            socket.off('presence:update');
            socket.off('invite:received');
        };
    }, [socket]);

    const handleAddFriend = async () => {
        if (!addUsername.trim()) return;
        setIsLoading(true);
        setMessage(null);

        try {
            const res = await fetch('/api/friends', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: addUsername.trim() }),
            });
            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Friend request sent!' });
                setAddUsername('');
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to send request' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Network error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendInvite = async (friendId: string) => {
        if (!roomCode) return;

        try {
            const res = await fetch('/api/invites', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ toUserId: friendId, roomCode }),
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Invite sent!' });
                // Also emit via socket for real-time
                socket?.emit('invite:send', { toUserId: friendId, roomCode });
            }
        } catch {
            setMessage({ type: 'error', text: 'Failed to send invite' });
        }
    };

    const handleAcceptInvite = async (inviteId: string) => {
        try {
            const res = await fetch('/api/invites', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inviteId, action: 'accept' }),
            });
            const data = await res.json();

            if (res.ok && data.roomCode) {
                router.push(`/dojo/${data.roomCode}`);
            }
        } catch {
            console.error('Failed to accept invite');
        }
    };

    const handleDeclineInvite = async (inviteId: string) => {
        try {
            await fetch('/api/invites', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inviteId, action: 'decline' }),
            });
            setInvites((prev) => prev.filter((i) => i.id !== inviteId));
        } catch {
            console.error('Failed to decline invite');
        }
    };

    return (
        <div className="bg-beast-dark-300/95 border border-beast-primary/30 rounded-xl overflow-hidden w-80">
            {/* Header */}
            <div className="p-4 border-b border-beast-primary/20 flex items-center justify-between">
                <h2 className="font-display font-bold text-white">Friends</h2>
                {onClose && (
                    <button onClick={onClose} className="text-muted-foreground hover:text-white">
                        ✕
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-beast-primary/20">
                {(['friends', 'invites', 'add'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 text-sm font-medium transition-colors ${activeTab === tab
                                ? 'text-beast-primary border-b-2 border-beast-primary'
                                : 'text-muted-foreground hover:text-white'
                            }`}
                    >
                        {tab === 'friends' && `Friends (${friends.length})`}
                        {tab === 'invites' && `Invites (${invites.length})`}
                        {tab === 'add' && '+ Add'}
                    </button>
                ))}
            </div>

            {/* Message */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className={`px-4 py-2 text-sm ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}
                    >
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            <div className="max-h-80 overflow-y-auto scrollbar-hide">
                {/* Friends Tab */}
                {activeTab === 'friends' && (
                    <div className="p-2 space-y-1">
                        {friends.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No friends yet. Add some!
                            </div>
                        ) : (
                            friends.map((friend) => (
                                <div
                                    key={friend.id}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-beast-dark-400/50 group"
                                >
                                    <div className="flex items-center gap-2">
                                        {/* Avatar with online indicator */}
                                        <div className="relative">
                                            <div className="w-8 h-8 rounded-full bg-beast-dark-400 overflow-hidden">
                                                {friend.avatarUrl ? (
                                                    <img src={friend.avatarUrl} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-beast-primary">
                                                        {friend.username[0].toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div
                                                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-beast-dark-300 ${onlineUsers.has(friend.id) ? 'bg-green-500' : 'bg-gray-500'
                                                    }`}
                                            />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white">{friend.username}</div>
                                            <div className="text-xs text-muted-foreground">
                                                Lv.{friend.level} • {friend.leagueTier}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {roomCode && (
                                        <motion.button
                                            onClick={() => handleSendInvite(friend.id)}
                                            className="px-2 py-1 text-xs bg-beast-primary/20 text-beast-primary rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            Invite
                                        </motion.button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Invites Tab */}
                {activeTab === 'invites' && (
                    <div className="p-2 space-y-2">
                        {invites.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                No pending invites
                            </div>
                        ) : (
                            invites.map((invite) => (
                                <div
                                    key={invite.id}
                                    className="p-3 bg-beast-dark-400/50 rounded-lg border border-beast-primary/20"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-full bg-beast-primary/20 flex items-center justify-center text-xs">
                                            {invite.from.username[0].toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium text-white">{invite.from.username}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground mb-3">{invite.message}</div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAcceptInvite(invite.id)}
                                            className="flex-1 py-1.5 bg-beast-primary text-beast-dark-500 text-xs font-bold rounded hover:brightness-110"
                                        >
                                            Join Battle
                                        </button>
                                        <button
                                            onClick={() => handleDeclineInvite(invite.id)}
                                            className="px-3 py-1.5 text-xs text-muted-foreground hover:text-white border border-white/10 rounded"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Add Friend Tab */}
                {activeTab === 'add' && (
                    <div className="p-4 space-y-4">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">
                                Username or LeetCode ID
                            </label>
                            <input
                                type="text"
                                value={addUsername}
                                onChange={(e) => setAddUsername(e.target.value)}
                                placeholder="Enter username..."
                                className="w-full py-2 px-3 bg-beast-dark-400 border border-beast-primary/30 rounded-lg text-white text-sm focus:outline-none focus:border-beast-primary"
                            />
                        </div>
                        <button
                            onClick={handleAddFriend}
                            disabled={isLoading || !addUsername.trim()}
                            className="w-full py-2 bg-beast-primary text-beast-dark-500 font-bold rounded-lg disabled:opacity-50"
                        >
                            {isLoading ? 'Sending...' : 'Send Friend Request'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
