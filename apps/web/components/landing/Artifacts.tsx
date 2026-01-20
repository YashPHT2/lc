'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export const Artifacts = () => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const rotateX = useTransform(scrollYProgress, [0, 0.5], [45, 20]);
    const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
    const opacity = useTransform(scrollYProgress, [0, 0.3], [0.5, 1]);

    return (
        <section ref={ref} className="py-32 relative perspective-1000 overflow-visible">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-fantasy font-bold text-white mb-4">
                    The <span className="text-purple-400">Artifacts</span> of Power
                </h2>
                <p className="text-[#f3e5ab]/60">
                    Track your progress, visualize your conquests, and manage your coding empire.
                </p>
            </div>

            <div className="container mx-auto px-4 flex justify-center perspective-[2000px]">
                <motion.div
                    style={{ rotateX, scale, opacity }}
                    className="relative w-full max-w-5xl aspect-video bg-[#0f0518] rounded-xl border-4 border-[#3e2723] shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden"
                >
                    {/* Fake Dashboard UI for Preview */}
                    <div className="absolute inset-0 bg-[#1a0b2e]">
                        {/* Header */}
                        <div className="h-12 border-b border-[#ffd700]/20 flex items-center px-6 justify-between bg-black/40">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            </div>
                            <div className="text-[#ffd700] text-xs font-fantasy tracking-widest">BEAST DASHBOARD v2.0</div>
                        </div>

                        {/* Grid Content */}
                        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 h-full overflow-y-auto md:overflow-visible custom-scrollbar">
                            {/* Stats */}
                            <div className="col-span-1 space-y-4 grid grid-cols-2 md:block gap-4 md:gap-0">
                                <div className="h-32 rounded bg-black/40 border border-[#ffd700]/30 p-4 flex flex-col justify-center">
                                    <div className="text-xs text-[#f3e5ab] uppercase mb-2">Total XP</div>
                                    <div className="text-2xl md:text-3xl font-fantasy text-[#ffd700] truncate">84,392</div>
                                </div>
                                <div className="h-32 rounded bg-black/40 border border-[#ffd700]/30 p-4 flex flex-col justify-center">
                                    <div className="text-xs text-[#f3e5ab] uppercase mb-2">Rank</div>
                                    <div className="text-3xl font-fantasy text-purple-400">#42</div>
                                </div>
                            </div>

                            {/* Main Map */}
                            <div className="col-span-1 md:col-span-2 h-48 md:h-[80%] rounded bg-black/40 border border-[#ffd700]/30 relative overflow-hidden order-last md:order-none">
                                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900 via-black to-black" />
                                {/* Grid Lines */}
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-[#ffd700] animate-pulse flex items-center justify-center">
                                        <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border border-purple-500/50" />
                                    </div>
                                </div>
                                <div className="absolute bottom-4 left-4 text-[#ffffff] font-mono text-xs">
                                    &gt; SCANNED SECTOR 7G...<br />
                                    &gt; NO BUGS DETECTED.
                                </div>
                            </div>

                            {/* Side Scroll */}
                            <div className="col-span-1 h-auto md:h-[80%] rounded bg-[#f3e5ab] text-[#3e2723] p-4 relative font-serif">
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#8b4513]" />
                                <div className="text-center font-bold border-b border-[#8b4513] pb-2 mb-2">Quest Log</div>
                                <ul className="text-xs space-y-2">
                                    <li className="flex justify-between"><span>Fix Loop</span> <span>✅</span></li>
                                    <li className="flex justify-between"><span>API Key</span> <span>✅</span></li>
                                    <li className="flex justify-between font-bold"><span>Deploy MVP</span> <span>❌</span></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Reflection Sheen */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                </motion.div>
            </div>
        </section>
    );
};
