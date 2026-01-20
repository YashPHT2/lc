'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

const classes = [
    {
        title: "Frontend Paladin",
        icon: "🛡️",
        desc: "Wield the power of the browser. Craft stunning user interfaces and master the visual spells of React and CSS.",
        color: "from-blue-500 to-cyan-500",
        border: "group-hover:border-cyan-400",
        shadow: "group-hover:shadow-cyan-500/20"
    },
    {
        title: "Fullstack Sorcerer",
        icon: "🔥",
        desc: "Balance the arcane forces. Conquer both the thriving realm of UI and the dark mysteries of the backend.",
        color: "from-amber-500 to-red-500",
        border: "group-hover:border-amber-400",
        shadow: "group-hover:shadow-amber-500/20"
    },
    {
        title: "Backend Necromancer",
        icon: "💀",
        desc: "Manipulate the hidden systems.summon powerful servers and command the unseen data legions.",
        color: "from-purple-500 to-emerald-500",
        border: "group-hover:border-purple-400",
        shadow: "group-hover:shadow-purple-500/20"
    }
];

export const Classes = () => {
    const { isSignedIn } = useUser();

    return (
        <section className="py-24 relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-fantasy font-bold text-white mb-4">
                        Choose Your <span className="text-gold-gradient">Path</span>
                    </h2>
                    <p className="text-[#f3e5ab]/60 max-w-2xl mx-auto">
                        Every legend begins with a choice. Will you defend the UI, command the data, or master it all?
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {classes.map((cls, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.2 }}
                            viewport={{ once: true }}
                            className="group relative h-full"
                        >
                            <div className={`
                                h-full p-8 rounded-xl bg-black/40 backdrop-blur-md 
                                border border-[#ffd700]/20 ${cls.border}
                                transition-all duration-500 hover:-translate-y-2
                                hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] ${cls.shadow}
                            `}>
                                {/* Inner Gradient Glow */}
                                <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-10 bg-gradient-to-br ${cls.color} transition-opacity duration-500`} />

                                <div className="relative z-10 flex flex-col items-center text-center h-full">
                                    <div className="w-20 h-20 mb-6 rounded-full bg-[#1a0b2e] border border-[#ffd700]/30 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform duration-500">
                                        {cls.icon}
                                    </div>

                                    <h3 className="text-2xl font-fantasy font-bold text-[#f3e5ab] mb-4 group-hover:text-white">
                                        {cls.title}
                                    </h3>

                                    <p className="text-gray-400 mb-8 flex-grow">
                                        {cls.desc}
                                    </p>

                                    <Link href={isSignedIn ? "/dashboard" : "/sign-in"} className="w-full">
                                        <button className="w-full px-6 py-2 rounded border border-[#ffd700]/30 text-[#ffd700] text-sm font-bold uppercase tracking-widest hover:bg-[#ffd700] hover:text-[#black] transition-colors group-hover:border-[#ffd700]">
                                            Select Class
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
