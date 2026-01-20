import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@project-beast/database';
import { auth, currentUser } from '@clerk/nextjs/server';

/**
 * GET /api/sheets/[sheetId]/progress
 * Get all users' progress for a specific sheet
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ sheetId: string }> }
) {
    try {
        const { sheetId } = await params;

        // Fetch all progress entries for this sheet, grouped by user
        const progressEntries = await prisma.sheetProgress.findMany({
            where: { sheetId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                        clerkId: true,
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        // Group by user
        const userProgressMap = new Map<string, {
            userId: string;
            username: string;
            avatarUrl: string | null;
            clerkId: string;
            completed: string[];
            inProgress: string[];
        }>();

        progressEntries.forEach(entry => {
            const userId = entry.userId;
            
            if (!userProgressMap.has(userId)) {
                userProgressMap.set(userId, {
                    userId: entry.user.id,
                    username: entry.user.username,
                    avatarUrl: entry.user.avatarUrl,
                    clerkId: entry.user.clerkId,
                    completed: [],
                    inProgress: [],
                });
            }

            const userProgress = userProgressMap.get(userId)!;
            if (entry.status === 'COMPLETED') {
                userProgress.completed.push(entry.problemId);
            } else {
                userProgress.inProgress.push(entry.problemId);
            }
        });

        return NextResponse.json({
            sheetId,
            users: Array.from(userProgressMap.values()),
        });
    } catch (error) {
        console.error('Error fetching sheet progress:', error);
        return NextResponse.json(
            { error: 'Failed to fetch progress' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/sheets/[sheetId]/progress
 * Update current user's progress on a problem
 * Body: { problemId: string, completed: boolean }
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ sheetId: string }> }
) {
    try {
        const { userId: clerkUserId } = await auth();
        
        if (!clerkUserId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { sheetId } = await params;
        const body = await request.json();
        const { problemId, completed } = body;

        if (!problemId || typeof completed !== 'boolean') {
            return NextResponse.json(
                { error: 'problemId and completed (boolean) are required' },
                { status: 400 }
            );
        }

        // Find the user by Clerk ID
        const user = await prisma.user.findUnique({
            where: { clerkId: clerkUserId }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        if (completed) {
            // Upsert the progress entry
            const progress = await prisma.sheetProgress.upsert({
                where: {
                    userId_sheetId_problemId: {
                        userId: user.id,
                        sheetId,
                        problemId,
                    }
                },
                create: {
                    userId: user.id,
                    sheetId,
                    problemId,
                    status: 'COMPLETED',
                    completedAt: new Date(),
                },
                update: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                }
            });

            return NextResponse.json({
                success: true,
                progress: {
                    problemId: progress.problemId,
                    status: progress.status,
                    completedAt: progress.completedAt,
                }
            });
        } else {
            // Delete the progress entry (unchecked)
            await prisma.sheetProgress.deleteMany({
                where: {
                    userId: user.id,
                    sheetId,
                    problemId,
                }
            });

            return NextResponse.json({
                success: true,
                progress: null,
            });
        }
    } catch (error) {
        console.error('Error updating sheet progress:', error);
        return NextResponse.json(
            { error: 'Failed to update progress' },
            { status: 500 }
        );
    }
}
