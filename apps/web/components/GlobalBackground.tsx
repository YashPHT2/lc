'use client';

import { useEffect, useState } from 'react';

export const GlobalBackground = () => {
    const [particles, setParticles] = useState<{ top: string; left: string; width: string; height: string; duration: string }[]>([]);

    useEffect(() => {
        setParticles(
            Array.from({ length: 20 }).map(() => ({
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 300 + 50}px`,
                height: `${Math.random() * 300 + 50}px`,
                duration: `${Math.random() * 5 + 5}s`,
            }))
        );
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
            {particles.map((p, i) => (
                <div
                    key={i}
                    className="absolute rounded-full bg-indigo-500/40 blur-2xl animate-blob mix-blend-screen"
                    style={{
                        top: p.top,
                        left: p.left,
                        width: p.width,
                        height: p.height,
                        animationDuration: p.duration,
                        animationDelay: `${i * 0.5}s`
                    }}
                />
            ))}
        </div>
    );
};
