'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';

interface ShopItem {
    id: string;
    name: string;
    description: string;
    type: string;
    price: number;
    imageUrl?: string;
    isLimited: boolean;
    stock?: number;
}

const typeIcons: Record<string, string> = {
    PROFILE_FRAME: '🖼️',
    EDITOR_THEME: '🎨',
    STREAK_FREEZE: '❄️',
    XP_BOOST: '⚡',
    TITLE: '🏷️',
};

const typeLabels: Record<string, string> = {
    PROFILE_FRAME: 'Profile Frame',
    EDITOR_THEME: 'Editor Theme',
    STREAK_FREEZE: 'Streak Freeze',
    XP_BOOST: 'XP Boost',
    TITLE: 'Title',
};

export default function ShopPage() {
    const { user } = useUser();
    const [items, setItems] = useState<ShopItem[]>([]);
    const [userCoins, setUserCoins] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        Promise.all([
            fetch('/api/shop').then(r => r.json()),
            fetch('/api/coins').then(r => r.json()),
        ])
            .then(([shopData, coinsData]) => {
                setItems(shopData.items || []);
                setUserCoins(coinsData.coins || 0);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

    const handlePurchase = async (item: ShopItem) => {
        if (userCoins < item.price) {
            setMessage({ type: 'error', text: 'Insufficient BeastCoins!' });
            return;
        }

        setPurchasing(item.id);
        setMessage(null);

        try {
            const res = await fetch('/api/shop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId: item.id }),
            });
            const data = await res.json();

            if (res.ok) {
                setUserCoins(data.newBalance);
                setMessage({ type: 'success', text: `Purchased ${item.name}!` });
                // Remove from shop if limited and sold out
                if (item.isLimited) {
                    setItems(prev => prev.filter(i => i.id !== item.id));
                }
            } else {
                setMessage({ type: 'error', text: data.error || 'Purchase failed' });
            }
        } catch {
            setMessage({ type: 'error', text: 'Network error' });
        } finally {
            setPurchasing(null);
        }
    };

    return (
        <div className="min-h-screen pt-36 px-4 md:px-8 pb-12 font-serif selection:bg-[#ffd700]/30 selection:text-white">
            <main className="max-w-7xl mx-auto">
                {/* Header with Coin Balance */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="font-display text-4xl md:text-5xl font-bold mb-2 text-white drop-shadow-sm">
                        Beast <span className="text-indigo-500">Shop</span>
                    </h1>
                    <p className="text-slate-400 mb-6 font-medium">Unlock premium features and cosmetics!</p>

                    <div className="glass-liquid inline-flex items-center gap-3 px-8 py-3 !rounded-full">
                        <span className="text-indigo-400 text-2xl drop-shadow">🪙</span>
                        <span className="font-bold text-3xl text-white">{userCoins.toLocaleString()}</span>
                        <span className="text-slate-500 text-sm uppercase tracking-wider font-bold mt-1">BeastCoins</span>
                    </div>
                </motion.div>

                {/* Message */}
                <AnimatePresence>
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`mb-6 p-4 rounded-lg text-center ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                }`}
                        >
                            {message.text}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Shop Grid */}
                {isLoading ? (
                    <div className="text-center py-12 text-slate-400 animate-pulse">Loading items...</div>
                ) : items.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4 opacity-50">🛒</div>
                        <p className="text-slate-400 text-xl">The shop is currently empty.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {items.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="glass-liquid p-6 flex flex-col group hover:border-indigo-500/30 transition-colors"
                            >
                                {/* Icon/Image */}
                                <div className="h-32 flex items-center justify-center text-6xl mb-4 relative">
                                    <div className="absolute inset-0 bg-indigo-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} className="h-full w-auto object-contain drop-shadow-lg" />
                                    ) : (
                                        <div className="filter drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                                            {typeIcons[item.type] || '📦'}
                                        </div>
                                    )}
                                </div>

                                {/* Limited Badge */}
                                {item.isLimited && (
                                    <div className="absolute top-3 right-3 px-2 py-0.5 bg-red-900/80 border border-red-500 text-red-100 text-[10px] font-bold rounded uppercase tracking-wider shadow-lg">
                                        LIMITED {item.stock !== undefined && `• ${item.stock} left`}
                                    </div>
                                )}

                                {/* Info */}
                                <h3 className="font-display text-xl font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">{item.name}</h3>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-white/10 text-[10px] text-slate-400 uppercase tracking-wide">
                                        {typeLabels[item.type] || item.type}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-400 flex-1 mb-6 leading-relaxed border-t border-white/5 pt-2">
                                    "{item.description}"
                                </p>

                                {/* Price & Buy */}
                                <div className="flex items-center justify-between mt-auto">
                                    <div className="flex items-center gap-2">
                                        <span className="text-indigo-400 text-xl drop-shadow-sm">🪙</span>
                                        <span className="font-bold text-white text-xl">{item.price.toLocaleString()}</span>
                                    </div>
                                    <motion.button
                                        onClick={() => handlePurchase(item)}
                                        disabled={purchasing === item.id || userCoins < item.price}
                                        className={`px-4 py-2 text-xs font-bold rounded-lg shadow-lg transition-all ${userCoins >= item.price
                                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                                            : 'opacity-50 grayscale cursor-not-allowed border border-white/5 bg-slate-800 text-slate-500'
                                            }`}
                                        whileHover={userCoins >= item.price ? { scale: 1.05 } : {}}
                                        whileTap={userCoins >= item.price ? { scale: 0.95 } : {}}
                                    >
                                        {purchasing === item.id ? 'Processing...' : 'Purchase'}
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
