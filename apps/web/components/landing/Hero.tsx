'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

export const Hero = () => {
    const { isSignedIn } = useUser();
    const { scrollY } = useScroll();
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-20">
            {/* Background Ambience */}
            {/* Background Ambience - Now handled globally by globals.css */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Animated Particles moved to GlobalBackground */}
            </div>

            <div className="container mx-auto px-4 z-10 grid lg:grid-cols-2 gap-12 items-center">

                {/* Left: Text Content */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center lg:text-left space-y-6"
                >
                    <div className="inline-block px-4 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 backdrop-blur-sm">
                        <span className="text-indigo-400 font-medium text-sm tracking-widest uppercase">
                            ✨ The future of coding
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-display font-bold text-white leading-tight drop-shadow-lg">
                        Master the <span className="text-indigo-500">Art</span> of Code
                    </h1>

                    <p className="text-lg text-slate-300 font-sans max-w-xl mx-auto lg:mx-0">
                        Embark on a journey where algorithms are your tools.
                        Forge your path from Novice to Master in the world's first competitive platform.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                        <Link href={isSignedIn ? "/dashboard" : "/sign-in"}>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xl rounded-lg shadow-lg shadow-indigo-500/25 transition-all"
                            >
                                {isSignedIn ? "Go to Dashboard" : "Get Started"}
                            </motion.button>
                        </Link>
                        <Link href={isSignedIn ? "/shop" : "/sign-in"}>
                            <motion.button
                                whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                                whileTap={{ scale: 0.95 }}
                                className="px-8 py-4 bg-transparent text-slate-300 font-bold text-xl rounded-lg border border-white/10 hover:border-white/30 transition-colors"
                            >
                                View Shop
                            </motion.button>
                        </Link>
                    </div>
                </motion.div>

                {/* Right: Floating Spellbook Editor */}
                <motion.div
                    style={{ y: y1 }}
                    className="relative hidden lg:block"
                >
                    {/* Glowing Aura */}
                    <div className="absolute -inset-10 bg-gradient-to-tr from-purple-600/30 to-blue-600/30 blur-3xl rounded-full" />

                    <motion.div
                        initial={{ y: 20, rotateX: 10, rotateZ: -5 }}
                        animate={{ y: -20, rotateX: 5, rotateZ: 5 }}
                        transition={{ repeat: Infinity, repeatType: "mirror", duration: 6, ease: "easeInOut" }}
                        className="relative bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl p-6 shadow-2xl transform preserve-3d"
                    >
                        {/* Window Controls */}
                        <div className="flex gap-2 mb-4 border-b border-white/10 pb-4">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <div className="ml-auto text-xs text-gray-500 font-mono">spellbook.js</div>
                        </div>

                        {/* Code */}
                        <div className="font-mono text-sm space-y-2 text-gray-300">
                            <div className="flex">
                                <span className="text-purple-400 mr-2">const</span>
                                <span className="text-blue-400">castFireball</span>
                                <span className="text-white mx-2">=</span>
                                <span className="text-yellow-400 opacity-50">async</span>
                                <span className="text-white mx-2">()</span>
                                <span className="text-white mx-2">=&gt;</span>
                                <span className="text-white">{`{`}</span>
                            </div>
                            <div className="pl-4 flex">
                                <span className="text-purple-400 mr-2">const</span>
                                <span className="text-white">mana</span>
                                <span className="text-white mx-2">=</span>
                                <span className="text-purple-400 mr-2">await</span>
                                <span className="text-blue-400">gatherEnergy</span>
                                <span className="text-white">();</span>
                            </div>
                            <div className="pl-4 flex">
                                <span className="text-purple-400 mr-2">if</span>
                                <span className="text-white">(mana &gt; </span>
                                <span className="text-red-400">9000</span>
                                <span className="text-white">) {`{`}</span>
                            </div>
                            <div className="pl-8 flex">
                                <span className="text-green-400">// Critical Hit!</span>
                            </div>
                            <div className="pl-8 flex">
                                <span className="text-blue-400">summonDragon</span>
                                <span className="text-white">();</span>
                            </div>
                            <div className="pl-4 text-white">{'}'}</div>
                            <div className="text-white">{'}'}</div>
                        </div>

                        {/* Floating Particles/Runes - Removed for cleaner look */}
                    </motion.div>
                </motion.div>

            </div>

            {/* Scroll Indicator */}
            <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[#ffd700]/50"
            >
                <div className="w-6 h-10 border-2 border-[#ffd700]/30 rounded-full flex justify-center pt-2">
                    <div className="w-1 h-2 bg-[#ffd700] rounded-full" />
                </div>
            </motion.div>
        </section>
    );
};
