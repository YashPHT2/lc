import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@project-beast/database';

/**
 * GET /api/sheets/[sheetId]
 * Get a specific sheet with all its problems organized by topic
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ sheetId: string }> }
) {
    try {
        const { sheetId } = await params;

        // Handle special sheet IDs
        let sheetName = '';
        if (sheetId === 'striver') {
            sheetName = 'Striver A2Z DSA Sheet';
        } else if (sheetId === 'neetcode') {
            sheetName = 'NeetCode 150';
        } else {
            // Try to find by ID or name
            sheetName = sheetId;
        }

        // Fetch the sheet with its problems
        const sheet = await prisma.dsaSheet.findFirst({
            where: {
                OR: [
                    { id: sheetId },
                    { name: sheetName },
                    { name: { contains: sheetId, mode: 'insensitive' } }
                ]
            },
            include: {
                problems: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!sheet) {
            return NextResponse.json(
                { error: 'Sheet not found' },
                { status: 404 }
            );
        }

        // Group problems by topic
        const topicsMap = new Map<string, any[]>();

        sheet.problems.forEach(problem => {
            const topic = problem.topic || 'General';
            if (!topicsMap.has(topic)) {
                topicsMap.set(topic, []);
            }
            topicsMap.get(topic)!.push({
                id: problem.id,
                title: problem.problemTitle,
                slug: problem.problemSlug,
                url: problem.problemUrl,
                platform: problem.platform,
                difficulty: problem.difficulty || 'MEDIUM',
                order: problem.order,
            });
        });

        // Convert to modules array format that the frontend expects
        const modules = Array.from(topicsMap.entries()).map(([topic, problems]) => ({
            topic,
            problems: problems.sort((a, b) => a.order - b.order),
        }));

        // Sort modules to maintain consistent order
        modules.sort((a, b) => {
            const aOrder = a.problems[0]?.order ?? 999;
            const bOrder = b.problems[0]?.order ?? 999;
            return aOrder - bOrder;
        });

        return NextResponse.json({
            id: sheet.id,
            title: sheet.name,
            desc: sheet.description || 'A curated collection of DSA problems.',
            sourceUrl: sheet.sourceUrl,
            totalProblems: sheet.totalProblems,
            modules,
        });
    } catch (error) {
        console.error('Error fetching sheet:', error);
        return NextResponse.json(
            { error: 'Failed to fetch sheet' },
            { status: 500 }
        );
    }
}
