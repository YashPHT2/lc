'use client';

import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';

export default function LandingPage() {
    return (
        <main className="min-h-screen selection:bg-indigo-500/30 selection:text-white">
            <Hero />
            <Features />
        </main>
    );
};
