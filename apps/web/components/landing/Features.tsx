'use client';

import { motion } from 'framer-motion';

const bentoItems = [
    {
        title: "The Arena",
        description: "1v1 Real-time Coding Battles",
        header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-beast-primary/20 to-transparent border border-white/5" />,
        className: "md:col-span-2",
        icon: "⚔️",
    },
    {
        title: "Level Progression",
        description: "Level up your skills",
        header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-beast-accent/20 to-transparent border border-white/5" />,
        className: "md:col-span-1",
        icon: "📈",
    },
    {
        title: "Leagues",
        description: "Weekly Promotion/Relegation",
        header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-beast-purple/20 to-transparent border border-white/5" />,
        className: "md:col-span-1",
        icon: "🏆",
    },
    {
        title: "Clan Wars",
        description: "Dominate with your team",
        header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-orange-500/20 to-transparent border border-white/5" />,
        className: "md:col-span-2",
        icon: "🛡️",
    },
];

export const Features = () => {
    return (
        <section className="py-24 px-4 max-w-7xl mx-auto">
            <div className="mb-16 text-center">
                <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
                    EVOLVE YOUR <span className="text-beast-primary">SKILLS</span>
                </h2>
                <p className="text-stone-400 max-w-xl mx-auto">
                    The old way of practicing LeetCode is dead. Welcome to the future of competitive programming.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
                {bentoItems.map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        viewport={{ once: true }}
                        className={`group relative overflow-hidden rounded-2xl glass-liquid border border-white/5 bg-white/5 hover:bg-white/10 transition-colors p-8 flex flex-col justify-between ${item.className}`}
                    >
                        <div className="mb-6 opacity-80 group-hover:opacity-100 transition-opacity">
                            <span className="text-4xl filter grayscale group-hover:grayscale-0 transition-all duration-500">{item.icon}</span>
                        </div>

                        <div className="relative z-10">
                            <h3 className="font-display font-semibold text-xl text-white mb-2 tracking-tight">{item.title}</h3>
                            <p className="text-sm text-slate-400 font-medium leading-relaxed">{item.description}</p>
                        </div>

                        {/* Subtle Gradient Hover Effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-beast-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </motion.div>
                ))}
            </div>
        </section>
    );
};
