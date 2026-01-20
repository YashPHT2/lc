import { PrismaClient, Difficulty } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ScrapedProblem {
    title: string;
    slug: string;
    url: string;
    platform: string;
    topic: string;
    step: string;
}

// Difficulty mapping for common problem patterns
function inferDifficulty(title: string, topic: string): Difficulty | null {
    const lowerTitle = title.toLowerCase();
    const lowerTopic = topic.toLowerCase();

    // Hard indicators
    if (
        lowerTitle.includes('hard') ||
        lowerTopic.includes('hard') ||
        lowerTitle.includes('trapping rain') ||
        lowerTitle.includes('n-queens') ||
        lowerTitle.includes('sudoku') ||
        lowerTitle.includes('median of two')
    ) {
        return Difficulty.HARD;
    }

    // Easy indicators
    if (
        lowerTopic.includes('easy') ||
        lowerTopic.includes('learn the basics') ||
        lowerTitle.includes('reverse') ||
        lowerTitle.includes('palindrome number') ||
        lowerTitle.includes('two sum')
    ) {
        return Difficulty.EASY;
    }

    // Default to MEDIUM for most DSA problems
    return Difficulty.MEDIUM;
}

async function seedStriverSheet() {
    console.log('🌱 Starting Striver A2Z Sheet seeding...\n');

    // Read the scraped data
    const jsonPath = path.join(__dirname, '..', '..', '..', 'striver_a2z.json');

    if (!fs.existsSync(jsonPath)) {
        console.error(`❌ Could not find striver_a2z.json at: ${jsonPath}`);
        console.log('Please run the scraper first: node scripts/striver-scraper.js');
        process.exit(1);
    }

    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const problems: ScrapedProblem[] = JSON.parse(rawData);

    console.log(`📄 Found ${problems.length} problems in striver_a2z.json\n`);

    // Create or update the Striver A2Z sheet
    const sheet = await prisma.dsaSheet.upsert({
        where: { name: 'Striver A2Z DSA Sheet' },
        update: {
            totalProblems: problems.length,
            updatedAt: new Date(),
        },
        create: {
            name: 'Striver A2Z DSA Sheet',
            description: 'The comprehensive A2Z DSA course by Striver (Raj Vikramaditya). This sheet covers all important DSA topics from basics to advanced, making it perfect for interview preparation.',
            sourceUrl: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2',
            totalProblems: problems.length,
        },
    });

    console.log(`📋 Sheet "${sheet.name}" (${sheet.id})\n`);

    // Track statistics
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const byTopic: { [key: string]: number } = {};

    // Insert problems
    for (let i = 0; i < problems.length; i++) {
        const problem = problems[i];

        // Skip problems without a valid slug
        if (!problem.slug || problem.slug.length < 2) {
            console.log(`⏭️ Skipping problem with invalid slug: ${problem.title}`);
            skipped++;
            continue;
        }

        // Clean the URL (remove #... or ? fragments that might cause duplicates)
        const cleanUrl = problem.url.split('#')[0].split('?')[0];

        try {
            const result = await prisma.dsaSheetProblem.upsert({
                where: {
                    sheetId_problemSlug: {
                        sheetId: sheet.id,
                        problemSlug: problem.slug,
                    },
                },
                update: {
                    problemTitle: problem.title,
                    problemUrl: cleanUrl,
                    platform: problem.platform,
                    topic: problem.topic,
                    step: problem.step || null,
                    difficulty: inferDifficulty(problem.title, problem.topic),
                    order: i,
                },
                create: {
                    sheetId: sheet.id,
                    problemSlug: problem.slug,
                    problemTitle: problem.title,
                    problemUrl: cleanUrl,
                    platform: problem.platform,
                    topic: problem.topic,
                    step: problem.step || null,
                    difficulty: inferDifficulty(problem.title, problem.topic),
                    order: i,
                },
            });

            // Check if this was a create or update
            const wasCreated = result.createdAt.getTime() > Date.now() - 1000;
            if (wasCreated) {
                created++;
            } else {
                updated++;
            }

            // Track by topic
            byTopic[problem.topic] = (byTopic[problem.topic] || 0) + 1;

            // Progress indicator
            if ((i + 1) % 50 === 0) {
                console.log(`  ⚡ Processed ${i + 1}/${problems.length} problems...`);
            }
        } catch (error: any) {
            console.error(`❌ Error inserting problem "${problem.title}": ${error.message}`);
            skipped++;
        }
    }

    console.log('\n✅ Seeding complete!\n');
    console.log('📊 Summary:');
    console.log(`   Total problems: ${problems.length}`);
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log('\n📂 Problems by Topic:');

    Object.entries(byTopic)
        .sort((a, b) => b[1] - a[1])
        .forEach(([topic, count]) => {
            console.log(`   ${topic}: ${count}`);
        });
}

async function main() {
    try {
        await seedStriverSheet();
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
