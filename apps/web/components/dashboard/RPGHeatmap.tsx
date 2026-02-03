'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface HeatmapData {
    [date: string]: number; // YYYY-MM-DD -> submission count
}

interface RPGHeatmapProps {
    data: HeatmapData;
    currentStreak: number;
    longestStreak: number;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

export function RPGHeatmap({
    data,
    currentStreak,
    longestStreak,
    onRefresh,
    isRefreshing
}: RPGHeatmapProps) {
    const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number } | null>(null);

    // Generate last 52 weeks (364 days)
    const generateWeeks = () => {
        const weeks: { date: string; count: number; dayOfWeek: number }[][] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 364);
        const dayOffset = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOffset);

        let currentWeek: { date: string; count: number; dayOfWeek: number }[] = [];
        const currentDate = new Date(startDate);

        while (currentDate.getTime() <= today.getTime()) {
            // Use local date format to avoid timezone issues (toISOString converts to UTC)
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;
            const dayOfWeek = currentDate.getDay();

            currentWeek.push({
                date: dateStr,
                count: data[dateStr] || 0,
                dayOfWeek,
            });

            if (dayOfWeek === 6) {
                weeks.push(currentWeek);
                currentWeek = [];
            }

            currentDate.setDate(currentDate.getDate() + 1);
        }

        if (currentWeek.length > 0) {
            weeks.push(currentWeek);
        }

        return weeks;
    };

    const weeks = generateWeeks();

    const getIntensity = (count: number): number => {
        if (count === 0) return 0;
        if (count === 1) return 1;
        if (count === 2) return 2;
        if (count <= 4) return 3;
        return 4; // 5+ submissions = brightest
    };

    // Magical Gold/Fire Palette
    // Midnight Blue / Cyber Palette
    const getIntensityColor = (intensity: number): string => {
        switch (intensity) {
            case 0: return 'bg-white/5'; // Inactive
            case 1: return 'bg-indigo-500/20';
            case 2: return 'bg-indigo-500/40';
            case 3: return 'bg-indigo-500/70 shadow-[0_0_8px_rgba(99,102,241,0.4)]'; // Active
            case 4: return 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.6)]'; // Intense
            default: return 'bg-white/5';
        }
    };

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getMonthLabels = () => {
        const labels: { month: string; position: number }[] = [];
        let lastMonth = -1;

        weeks.forEach((week, index) => {
            const firstDay = week[0];
            if (firstDay) {
                const month = new Date(firstDay.date).getMonth();
                if (month !== lastMonth) {
                    labels.push({ month: months[month], position: index });
                    lastMonth = month;
                }
            }
        });
        return labels;
    };

    const monthLabels = getMonthLabels();

    return (
        <div className="w-full">
            {/* Header with Stats (Optional if panel header exists) */}
            <div className="flex items-center justify-end gap-6 mb-4 text-slate-400">
                <div className="text-center">
                    <div className="text-white font-display text-lg font-bold drop-shadow-sm">
                        {currentStreak}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider opacity-70">Day Streak</div>
                </div>
                {onRefresh && (
                    <motion.button
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                        whileHover={{ rotate: 180 }}
                        whileTap={{ scale: 0.9 }}
                        title="Refresh Data"
                    >
                        ↻
                    </motion.button>
                )}
            </div>

            {/* Scrollable Container for small screens */}
            <div className="overflow-x-auto pb-2 scrollbar-hide">
                <div className="min-w-max">
                    {/* Month Labels */}
                    <div className="flex mb-1 text-[10px] text-slate-500 pl-8 relative h-4">
                        {monthLabels.map(({ month, position }) => (
                            <span
                                key={`${month}-${position}`}
                                className="absolute font-medium"
                                style={{ left: position * 14 }}
                            >
                                {month}
                            </span>
                        ))}
                    </div>

                    <div className="flex gap-1">
                        {/* Day Labels */}
                        <div className="flex flex-col gap-[3px] text-[9px] text-slate-500 pr-1 shrink-0 font-medium mt-[2px]">
                            {dayLabels.map((day, i) => (
                                <div key={day} className="h-[10px] flex items-center leading-none" style={{ visibility: i % 2 === 1 ? 'visible' : 'hidden' }}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Grid */}
                        <div className="flex gap-[3px]">
                            {weeks.map((week, weekIndex) => (
                                <div key={weekIndex} className="flex flex-col gap-[3px]">
                                    {Array.from({ length: 7 }).map((_, dayIndex) => {
                                        const day = week.find(d => d.dayOfWeek === dayIndex);

                                        if (!day) return <div key={dayIndex} className="w-[10px] h-[10px]" />;

                                        const intensity = getIntensity(day.count);

                                        return (
                                            <motion.div
                                                key={day.date}
                                                className={`w-[10px] h-[10px] rounded-[2px] cursor-pointer transition-colors ${getIntensityColor(intensity)}`}
                                                whileHover={{ scale: 1.5, zIndex: 10 }}
                                                onMouseEnter={() => setHoveredDay({ date: day.date, count: day.count })}
                                                onMouseLeave={() => setHoveredDay(null)}
                                            />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tooltip & Legend */}
            <div className="flex items-center justify-between mt-2 h-6">
                <div>
                    {hoveredDay && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs font-sans text-slate-200"
                        >
                            <span className="opacity-70">
                                {new Date(hoveredDay.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}:
                            </span>{' '}
                            <span className="text-indigo-400">
                                {hoveredDay.count} submissions
                            </span>
                        </motion.div>
                    )}
                </div>

                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span>Less</span>
                    {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className={`w-[8px] h-[8px] rounded-[1px] ${getIntensityColor(i)}`} />
                    ))}
                    <span>More</span>
                </div>
            </div>
        </div>
    );
}
