'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

// === BATTLEGROUND TICKER ===
const battles = [
    "User_88 just solved 'Two Sum' (Hard)",
    "Gladiator_X achieved a 50-day streak!",
    "Neon_Wizard defeated Bug_King in 12s",
    "System: New Tournament starting in 5m...",
    "Player_One unlocked 'Algorithm Master' Title",
];

export const Battleground = () => {
    return (
        <div className="w-full bg-black border-y border-[#ffd700]/30 py-3 overflow-hidden flex relative z-20">
            <div className="absolute inset-0 bg-green-900/10 pointer-events-none" />
            <motion.div
                animate={{ x: [0, -1000] }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                className="flex whitespace-nowrap gap-12 text-[#ffd700] font-mono text-sm items-center"
            >
                {[...battles, ...battles, ...battles].map((battle, i) => (
                    <span key={i} className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        {battle}
                    </span>
                ))}
            </motion.div>
        </div>
    );
};

// === GUILDS MARQUEE ===
const guilds = ["Google", "Amazon", "Netflix", "Microsoft", "Meta", "Apple", "Tesla", "SpaceX"];

export const Guilds = () => {
    return (
        <section className="py-20 bg-[#1a0b2e]">
            <h2 className="text-4xl md:text-6xl font-fantasy font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#ffd700] to-[#b8860b] drop-shadow-[0_2px_10px_rgba(255,215,0,0.3)] tracking-wider">
                Conquer The High Towers
            </h2>

            <div className="relative flex overflow-x-hidden group">
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#1a0b2e] to-transparent z-10" />
                <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#1a0b2e] to-transparent z-10" />

                <motion.div
                    animate={{ x: [0, -1920] }} // Adjust based on width
                    transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
                    className="flex gap-16 py-8"
                >
                    {[...guilds, ...guilds, ...guilds, ...guilds].map((guild, i) => (
                        <div key={i} className="relative min-w-[150px] text-center group/guild">
                            {/* Banner Shape */}
                            <div className="absolute inset-0 bg-gradient-to-b from-[#3e2723] to-black opacity-80"
                                style={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 85%, 50% 100%, 0% 85%)" }}
                            />
                            <div className="relative py-8 px-4 border-2 border-[#b8860b] border-t-0"
                                style={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 85%, 50% 100%, 0% 85%)" }}
                            >
                                <h3 className="text-2xl font-fantasy text-[#d4c486] group-hover/guild:text-[#ffd700] transition-colors">
                                    {guild.charAt(0)}
                                </h3>
                                <p className="text-xs uppercase mt-2 text-[#f3e5ab]/50">{guild}</p>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

// === SUMMONING FOOTER ===
export const Summoning = () => {
    const { isSignedIn } = useUser();

    return (
        <section className="relative py-32 flex flex-col items-center justify-center overflow-hidden">
            {/* Background Portal Loop */}
            <div className="absolute inset-0 bg-[#0f0518]">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border-[1px] border-[#ffd700]/20 animate-spin-slow" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border-[2px] border-[#9d00ff]/30 animate-spin-reverse" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-900/10 blur-[120px] rounded-full mix-blend-screen" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                className="relative z-10 text-center space-y-8"
            >
                <h2 className="text-5xl md:text-8xl font-fantasy font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                    Begin Your<br /><span className="text-gold-gradient">Saga</span>
                </h2>

                <Link href={isSignedIn ? "/dashboard" : "/sign-in"}>
                    <motion.button
                        whileHover={{ scale: 1.1, textShadow: "0 0 8px #ffd700" }}
                        whileTap={{ scale: 0.95 }}
                        className="mt-8 px-12 py-6 bg-transparent border-2 border-[#ffd700] text-[#ffd700] font-fantasy font-bold text-2xl tracking-[0.2em] uppercase rounded-sm relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-[#ffd700] opacity-0 group-hover:opacity-10 transition-opacity" />
                        Enter The Realm
                    </motion.button>
                </Link>
            </motion.div>

            {/* Footer Links */}
            <div className="absolute bottom-4 text-xs text-gray-600 flex gap-6">
                <span>© 2025 Project Beast</span>
                <a href="#" className="hover:text-gray-400">Terms of Invocation</a>
                <a href="#" className="hover:text-gray-400">Privacy Scroll</a>
            </div>
        </section>
    );
};
