'use client';

import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import { useRef } from 'react';

export const MagnetButton = ({
    children,
    className = '',
    onClick,
}: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}) => {
    const ref = useRef<HTMLButtonElement>(null);

    // Motion values for the magnetic pull
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth spring physics
    const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
    const starX = useSpring(x, springConfig);
    const starY = useSpring(y, springConfig);

    // Gradient follow effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        const { clientX, clientY } = e;
        const { left, top, width, height } = ref.current!.getBoundingClientRect();

        // Magnetic Pull Calculation (stronger near center)
        const centerX = left + width / 2;
        const centerY = top + height / 2;

        const distanceX = clientX - centerX;
        const distanceY = clientY - centerY;

        x.set(distanceX * 0.35); // 0.35 = pull strength
        y.set(distanceY * 0.35);

        // Gradient Spot Calculation
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
        mouseX.set(0);
        mouseY.set(0);
    };

    return (
        <motion.button
            ref={ref}
            style={{ x: starX, y: starY }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            className={`relative group overflow-hidden rounded-lg px-8 py-4 font-display font-bold uppercase tracking-wider text-black transition-colors ${className}`}
        >
            {/* Hover Gradient Background */}
            <motion.div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100"
                style={{
                    background: useMotionTemplate`
                    radial-gradient(
                        650px circle at ${mouseX}px ${mouseY}px,
                        rgba(255,255,255,0.4),
                        transparent 80%
                    )
                `,
                }}
            />

            {/* Base Background */}
            <div className="absolute inset-0 bg-beast-primary z-0 transition-transform duration-300 group-hover:scale-105" />

            <span className="relative z-10 flex items-center justify-center gap-2">
                {children}
            </span>
        </motion.button>
    );
};
