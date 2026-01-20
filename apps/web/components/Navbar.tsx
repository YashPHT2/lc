'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect, useCallback } from 'react';
import { UserButton, useUser } from '@clerk/nextjs';
import { Menu, X } from 'lucide-react';

interface BubblePosition {
    left: number;
    top: number;
    width: number;
    height: number;
}

export const Navbar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { scrollY } = useScroll();
    const [hidden, setHidden] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { isSignedIn, isLoaded } = useUser();
    const [hoveredPath, setHoveredPath] = useState<string | null>(null);

    // Bubble Navigation Refs & State (Desktop)
    const navRef = useRef<HTMLDivElement>(null);
    const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
    const [activeBubble, setActiveBubble] = useState<BubblePosition>({ left: 0, top: 0, width: 0, height: 0 });
    const [hoverBubble, setHoverBubble] = useState<BubblePosition>({ left: 0, top: 0, width: 0, height: 0 });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Bubble Navigation Refs & State (Mobile)
    const mobileNavRef = useRef<HTMLDivElement>(null);
    const mobileLinkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
    const [mobileActiveBubble, setMobileActiveBubble] = useState<BubblePosition>({ left: 0, top: 0, width: 0, height: 0 });

    // Calculate bubble position for a given path (Desktop)
    const calculateBubblePosition = useCallback((path: string): BubblePosition => {
        const linkEl = linkRefs.current[path];
        const navEl = navRef.current;
        if (!linkEl || !navEl) return { left: 0, top: 0, width: 0, height: 0 };

        const navRect = navEl.getBoundingClientRect();
        const linkRect = linkEl.getBoundingClientRect();

        return {
            left: linkRect.left - navRect.left,
            top: linkRect.top - navRect.top,
            width: linkRect.width,
            height: linkRect.height,
        };
    }, []);

    // Calculate bubble position for a given path (Mobile)
    const calculateMobileBubblePosition = useCallback((path: string): BubblePosition => {
        const linkEl = mobileLinkRefs.current[path];
        const navEl = mobileNavRef.current;
        if (!linkEl || !navEl) return { left: 0, top: 0, width: 0, height: 0 };

        const navRect = navEl.getBoundingClientRect();
        const linkRect = linkEl.getBoundingClientRect();

        return {
            left: linkRect.left - navRect.left,
            top: linkRect.top - navRect.top,
            width: linkRect.width,
            height: linkRect.height,
        };
    }, []);

    // Update active bubble on pathname change or mount
    useEffect(() => {
        // Find the active link href (handles sub-pages)
        const findActiveHref = () => {
            const links = ['/dashboard', '/dojo', '/sheets', '/leaderboard', '/shop'];
            for (const href of links) {
                if (href === '/dashboard' && pathname === '/dashboard') return href;
                if (href !== '/dashboard' && pathname.startsWith(href)) return href;
            }
            return '/dashboard';
        };

        const activeHref = findActiveHref();

        // Desktop bubble update
        const updateDesktopBubble = () => {
            const linkEl = linkRefs.current[activeHref];
            if (linkEl && navRef.current) {
                const pos = calculateBubblePosition(activeHref);
                if (pos.width > 0) {
                    setActiveBubble(pos);
                    return true;
                }
            }
            return false;
        };

        // Mobile bubble update
        const updateMobileBubble = () => {
            const linkEl = mobileLinkRefs.current[activeHref];
            if (linkEl && mobileNavRef.current) {
                const pos = calculateMobileBubblePosition(activeHref);
                if (pos.width > 0) {
                    setMobileActiveBubble(pos);
                    return true;
                }
            }
            return false;
        };

        // Try immediately
        updateDesktopBubble();
        updateMobileBubble();

        // Retry with increasing delays until successful
        const timers = [50, 100, 200, 500].flatMap((delay) => [
            setTimeout(updateDesktopBubble, delay),
            setTimeout(updateMobileBubble, delay),
        ]);

        return () => timers.forEach(t => clearTimeout(t));
    }, [pathname, calculateBubblePosition, calculateMobileBubblePosition]);

    // Handle hover
    const handleMouseEnter = (path: string) => {
        setHoveredPath(path);
        const pos = calculateBubblePosition(path);
        setHoverBubble(pos);
    };

    const handleMouseLeave = () => {
        setHoveredPath(null);
    };

    // Navigation Config
    const appLinks = [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Dojo', href: '/dojo' },
        { name: 'Sheets', href: '/sheets' },
        { name: 'Leaderboard', href: '/leaderboard' },
        { name: 'Shop', href: '/shop' },
    ];

    // Helper to check if a link is active (including sub-pages)
    const isLinkActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard';
        return pathname.startsWith(href);
    };

    // Get the active link's href for bubble positioning
    const getActiveHref = () => {
        for (const link of appLinks) {
            if (isLinkActive(link.href)) return link.href;
        }
        return appLinks[0].href; // Default to first
    };

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious() || 0;
        if (latest > previous && latest > 150) {
            // setHidden(true); // Always show navbar request
            setHidden(false);
        } else {
            setHidden(false);
        }

        // Blur logic
        if (latest > 50) {
            setScrolled(true);
        } else {
            setScrolled(false);
        }
    });

    if (!isLoaded) return null;

    return (
        <>
            {/* Top HUD (Floating Island Style) */}
            <motion.nav
                variants={{
                    visible: { y: 0, opacity: 1 },
                    hidden: { y: -20, opacity: 0 },
                }}
                animate={hidden ? "hidden" : "visible"}
                transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="fixed top-6 left-0 right-0 z-[999] px-4 pointer-events-none"
            >
                {/* HUD Container */}
                <div className="relative mx-auto max-w-5xl px-6 py-3 flex items-center justify-between pointer-events-auto glass-navbar !rounded-full">

                    {/* Brand */}
                    <Link href={isSignedIn ? "/dashboard" : "/"} className="flex items-center gap-3 group relative pl-2">
                        <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg shadow-lg flex items-center justify-center text-white font-bold transform group-hover:scale-105 transition-all duration-300">
                            B
                        </div>
                        <span className="font-display font-bold text-lg tracking-tight text-white/90 group-hover:text-white transition-colors">
                            BEAST
                        </span>
                    </Link>

                    {/* Desktop Navigation - Bubble Style */}
                    {isSignedIn && (
                        <div className="hidden md:block nav-bubble-wrap">
                            <div className="nav-bubble-links" ref={navRef}>
                                {/* Active Bubble */}
                                <div
                                    className="bubble-active"
                                    style={{
                                        left: activeBubble.left,
                                        top: activeBubble.top,
                                        width: activeBubble.width,
                                        height: activeBubble.height,
                                    }}
                                />
                                {/* Hover Bubble */}
                                <div
                                    className={`bubble-hover ${hoveredPath && hoveredPath !== pathname ? 'visible' : ''}`}
                                    style={{
                                        left: hoverBubble.left,
                                        top: hoverBubble.top,
                                        width: hoverBubble.width,
                                        height: hoverBubble.height,
                                    }}
                                />
                                {appLinks.map((item) => {
                                    const isActive = isLinkActive(item.href);
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            ref={(el) => { linkRefs.current[item.href] = el; }}
                                            onMouseEnter={() => handleMouseEnter(item.href)}
                                            onMouseLeave={handleMouseLeave}
                                            className={`nav-bubble-link ${isActive ? 'active' : ''}`}
                                        >
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Right / Currency HUD */}
                    <div className="flex items-center gap-4 pr-2">
                        {isSignedIn ? (
                            <>
                                {/* Coins */}
                                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                                    <span className="text-xs">🪙</span>
                                    <span className="font-bold text-indigo-300 text-xs">
                                        100
                                    </span>
                                </div>

                                <UserButton
                                    appearance={{
                                        elements: {
                                            avatarBox: "w-8 h-8 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                                        }
                                    }}
                                />
                            </>
                        ) : (
                            <Link href="/sign-in">
                                <button className="px-5 py-2 text-sm font-medium bg-white text-black hover:bg-gray-200 rounded-lg shadow-lg shadow-white/10 transition-all">
                                    Sign In
                                </button>
                            </Link>
                        )}
                    </div>

                    {/* Mobile Hamburger Button */}
                    <div className="md:hidden flex items-center pl-4 border-l border-white/10 ml-2">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 text-white/80 hover:text-white transition-colors"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                    {/* Mobile Dropdown Menu (Liquid Glass) */}
                    <AnimatePresence>
                        {mobileMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -20, scale: 0.9, filter: "blur(10px)" }}
                                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                                exit={{ opacity: 0, y: -20, scale: 0.9, filter: "blur(10px)" }}
                                transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                                className="absolute top-full right-6 mt-4 w-64 p-2 rounded-2xl glass-panel bg-[#0f172a]/70 backdrop-blur-xl border border-white/10 flex flex-col gap-1 origin-top-right z-[1000] pointer-events-auto shadow-2xl shadow-indigo-500/20 ring-1 ring-white/20"
                            >
                                {appLinks.map((item) => {
                                    const isActive = isLinkActive(item.href);
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`relative px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${isActive
                                                ? 'bg-indigo-500/20 text-indigo-300 shadow-[inset_0_0_10px_rgba(99,102,241,0.2)]'
                                                : 'text-white/70 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            {item.name}
                                            {isActive && (
                                                <motion.div
                                                    layoutId="mobile-active-glow"
                                                    className="absolute inset-0 rounded-xl bg-indigo-500/10 -z-10"
                                                    transition={{ type: "spring", duration: 0.6 }}
                                                />
                                            )}
                                        </Link>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.nav>
        </>
    );
};
