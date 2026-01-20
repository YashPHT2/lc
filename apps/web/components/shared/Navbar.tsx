'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { UserButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils';

interface NavbarProps {
    coins?: number;
}

export function Navbar({ coins = 0 }: NavbarProps) {
    const pathname = usePathname();

    const navItems = [
        { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
        { href: '/dojo', label: 'Dojo', icon: '⚔️' },
        { href: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
        { href: '/shop', label: 'Shop', icon: '🛒' },
    ];

    return (
        <header className="sticky top-0 z-50 border-b border-beast-primary/20 bg-beast-dark-300/80 backdrop-blur-md">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <motion.div
                            className="font-display text-xl font-black"
                            whileHover={{ scale: 1.05 }}
                        >
                            <span className="text-beast-primary">BEAST</span>
                        </motion.div>
                    </Link>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "relative px-4 py-2 rounded-lg font-medium transition-colors",
                                        isActive
                                            ? "text-beast-primary"
                                            : "text-muted-foreground hover:text-white"
                                    )}
                                >
                                    <span className="flex items-center gap-2">
                                        <span>{item.icon}</span>
                                        <span>{item.label}</span>
                                    </span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="navbar-indicator"
                                            className="absolute inset-0 bg-beast-primary/10 border border-beast-primary/30 rounded-lg -z-10"
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Side */}
                    <div className="flex items-center gap-4">
                        {/* Coins */}
                        <Link
                            href="/shop"
                            className="flex items-center gap-2 px-3 py-1.5 bg-beast-dark-200 border border-beast-warning/30 rounded-lg hover:bg-beast-dark-100 transition-colors"
                        >
                            <motion.span
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 3 }}
                            >
                                ⚡
                            </motion.span>
                            <span className="font-display font-bold text-beast-warning">
                                {coins.toLocaleString()}
                            </span>
                        </Link>

                        {/* User Button */}
                        <UserButton
                            appearance={{
                                elements: {
                                    avatarBox: "w-9 h-9 border-2 border-beast-primary/50",
                                }
                            }}
                        />
                    </div>

                    {/* Mobile Menu Button */}
                    <button className="md:hidden p-2 text-muted-foreground hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
}
