'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Mock Data for "The Scrolls"
const SHEETS = [
    {
        id: 'striver',
        title: "Striver's A2Z DSA",
        author: "Striver",
        desc: "The definitive roadmap to mastering DSA. 450+ questions covering every topic.",
        color: "text-rose-400",
        stats: "455 Questions",
        icon: "📜"
    },
    {
        id: 'neetcode',
        title: "NeetCode 150",
        author: "NeetCode",
        desc: "The highly curated list of 150 patterns needed to crack any interview.",
        color: "text-emerald-400",
        stats: "150 Questions",
        icon: "🌿"
    },
    {
        id: 'blind75',
        title: "Blind 75",
        author: "Team Blind",
        desc: "The classic legendary list. If you are in a hurry, start here.",
        color: "from-blue-500 to-indigo-500",
        stats: "75 Questions",
        icon: "👁️"
    }
];

export default function SheetsLibrary() {
    const router = useRouter();
    const [isImporting, setIsImporting] = useState(false);
    const [customUrl, setCustomUrl] = useState('');
    const [customSheets, setCustomSheets] = useState<any[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('MY_CUSTOM_SHEETS');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Deduplicate existing bad data
                const unique = parsed.filter((obj: any, index: number, self: any[]) =>
                    index === self.findIndex((t) => t.id === obj.id)
                );
                setCustomSheets(unique);
            } catch (e) {
                console.error("Failed to parse custom sheets", e);
            }
        }
    }, []);

    const handleImport = async () => {
        try {
            // 1. Extract Sheet ID
            const match = customUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
            if (!match) {
                alert("Invalid Google Sheet Link. Please paste the full URL.");
                return;
            }
            const sheetId = match[1];
            const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

            // 2. Fetch CSV
            const response = await fetch(csvUrl);
            if (!response.ok) throw new Error("Could not fetch the scroll. Make sure it is Publicly Visible (Anyone with link).");
            const text = await response.text();

            // 3. Parse CSV (Simple Parser)
            const rows = text.split('\n').map(row => {
                // Handle quotes standard CSV parsing regex
                const matches = row.split(',').map(cell => cell.replace(/^"|"$/g, '').trim());
                return matches || row.split(',');
            });

            // Find Header Row
            const headerRowIndex = rows.findIndex(row =>
                row.some((cell: any) => cell.toString().toLowerCase().includes('problem') || cell.toString().toLowerCase().includes('link'))
            );

            if (headerRowIndex === -1) throw new Error("Could not find a valid header row with 'Problem' or 'Link'.");

            const headers = rows[headerRowIndex].map((h: any) => h.toString().toLowerCase().replace(/['"]+/g, '').trim());
            const problemIdx = headers.findIndex((h: string) => h.includes('problem'));
            const linkIdx = headers.findIndex((h: string) => h.includes('link') || h.includes('url'));
            const topicIdx = headers.findIndex((h: string) => h.includes('topic'));
            const diffIdx = headers.findIndex((h: string) => h.includes('difficulty'));

            if (problemIdx === -1 || linkIdx === -1) throw new Error("Columns 'Problem' and 'Link' are required.");

            // Extract Problems
            const problems = [];
            for (let i = headerRowIndex + 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row[problemIdx]) continue;

                const cleanCell = (val: any) => val ? val.toString().replace(/^"|"$/g, '').trim() : '';

                problems.push({
                    id: `custom-${sheetId}-${i}`,
                    title: cleanCell(row[problemIdx]),
                    url: cleanCell(row[linkIdx]),
                    difficulty: diffIdx !== -1 ? cleanCell(row[diffIdx]) : 'Medium',
                    topic: topicIdx !== -1 ? cleanCell(row[topicIdx]) : 'General'
                });
            }

            // Create New Sheet Object
            const newSheet = {
                id: `custom-${sheetId}`,
                title: "Custom Imported Sheet",
                author: "You",
                desc: `Imported from Google Sheets (${problems.length} problems)`,
                color: "from-purple-500 to-pink-500",
                stats: `${problems.length} Questions`,
                icon: "🔮",
                isCustom: true,
                problems: problems // Store raw list, will group later
            };

            // Save (Overwrite if exists)
            const otherSheets = customSheets.filter(s => s.id !== newSheet.id);
            const updated = [...otherSheets, newSheet];
            setCustomSheets(updated);
            localStorage.setItem('MY_CUSTOM_SHEETS', JSON.stringify(updated));
            setIsImporting(false);
            setCustomUrl('');

            // Redirect
            router.push(`/sheets/${newSheet.id}`);

        } catch (err: any) {
            alert("Scribe Error: " + err.message);
        }
    };

    return (
        <div className="min-h-screen pt-36 pb-20 px-4">
            {/* Header */}
            <div className="container mx-auto text-center mb-16">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl font-display font-bold text-white drop-shadow-sm mb-4"
                >
                    The <span className="text-indigo-500">Library</span>
                </motion.h1>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                    Curated roadmaps to guide your path. Select a collection or transcribe your own.
                </p>
            </div>

            {/* Library Grid */}
            <div className="container mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...SHEETS, ...customSheets].map((sheet, i) => (
                    <Link href={`/sheets/${sheet.id}`} key={sheet.id}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            className="group relative h-full glass-liquid p-8 flex flex-col hover:border-indigo-500/30 transition-colors"
                        >
                            {/* Top Gradient - Removed for cleaner glass look */}

                            <div className="flex items-start justify-between mb-6">
                                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    {sheet.icon}
                                </div>
                                <div className={`px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-bold ${sheet.color}`}>
                                    {sheet.stats}
                                </div>
                            </div>

                            <h2 className="text-2xl font-display font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                                {sheet.title}
                            </h2>
                            <p className="text-sm text-slate-400 mb-8 flex-grow leading-relaxed">
                                {sheet.desc}
                            </p>

                            <button className="w-full py-3 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg border border-indigo-500/20 font-bold transition-all">
                                Open Collection
                            </button>
                        </motion.div>
                    </Link>
                ))}

                {/* Add Custom Sheet Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="relative h-full glass-liquid p-8 flex flex-col items-center justify-center text-center hover:bg-white/10 border border-white/10 hover:border-indigo-500/40 transition-all cursor-pointer group"
                    onClick={() => setIsImporting(true)}
                >
                    <div className="w-16 h-16 mb-4 rounded-full bg-indigo-500/10 flex items-center justify-center text-3xl text-indigo-400 group-hover:scale-110 transition-transform">
                        ➕
                    </div>
                    <h2 className="text-xl font-display font-bold text-white mb-2">
                        Import Custom Sheet
                    </h2>
                    <p className="text-sm text-slate-400">
                        Import a Google Sheet or CSV URL to create your own path.
                    </p>
                </motion.div>
            </div>

            {/* Import Modal */}
            {isImporting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-full max-w-md glass-liquid p-8 relative"
                    >
                        <button
                            className="absolute top-4 right-4 text-slate-500 hover:text-white"
                            onClick={() => setIsImporting(false)}
                        >
                            ✕
                        </button>

                        <h2 className="text-2xl font-display font-bold text-white mb-6">Import Sheet</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wide font-bold">Google Sheet Link (Public)</label>
                                <input
                                    type="text"
                                    placeholder="https://docs.google.com/spreadsheets/..."
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none font-mono text-sm transition-colors"
                                    value={customUrl}
                                    onChange={(e) => setCustomUrl(e.target.value)}
                                />
                            </div>
                            <div className="text-xs text-slate-500">
                                * Make sure the sheet is public and has columns: Problem, URL, Topic, Difficulty.
                            </div>

                            <button
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all"
                                onClick={handleImport}
                            >
                                Import
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

