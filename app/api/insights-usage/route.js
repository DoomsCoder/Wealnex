import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

// Get user's insight usage count for the month
export async function GET(req) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ count: 0 });
        }

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
            select: {
                plan: true,
                monthlyInsightsViewed: true,
                lastInsightsReset: true,
            },
        });

        if (!user) {
            return NextResponse.json({ count: 0, plan: 'FREE' });
        }

        // Pro users have unlimited insights
        if (user.plan !== 'FREE') {
            return NextResponse.json({ count: 0, unlimited: true, plan: user.plan });
        }

        // Check if we need to reset monthly count
        const now = new Date();
        const lastReset = user.lastInsightsReset ? new Date(user.lastInsightsReset) : null;
        const shouldReset = !lastReset ||
            lastReset.getMonth() !== now.getMonth() ||
            lastReset.getFullYear() !== now.getFullYear();

        let count = user.monthlyInsightsViewed || 0;

        if (shouldReset) {
            // Reset the count for the new month
            await db.user.update({
                where: { clerkUserId: userId },
                data: {
                    monthlyInsightsViewed: 0,
                    lastInsightsReset: now,
                },
            });
            count = 0;
        }

        return NextResponse.json({ count, plan: user.plan });
    } catch (error) {
        console.error("Get insights usage error:", error);
        return NextResponse.json({ count: 0, plan: 'FREE' });
    }
}

// Increment insights viewed count (called when user views insights)
export async function POST(req) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
            select: {
                plan: true,
                monthlyInsightsViewed: true,
                lastInsightsViewed: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Pro users have unlimited insights
        if (user.plan !== 'FREE') {
            return NextResponse.json({ success: true, count: 0, unlimited: true });
        }

        // Rate limit: Prevent duplicate increments within 1 hour
        // This prevents issues from page refreshes, multiple tabs, React double-renders, etc.
        const now = new Date();
        const lastViewed = user.lastInsightsViewed ? new Date(user.lastInsightsViewed) : null;
        const hoursSinceLastView = lastViewed
            ? (now.getTime() - lastViewed.getTime()) / (1000 * 60 * 60)
            : Infinity;

        // If viewed less than 1 hour ago, don't increment
        if (hoursSinceLastView < 1) {
            return NextResponse.json({
                success: true,
                count: user.monthlyInsightsViewed || 0,
                message: "Already tracked recently",
                skipped: true,
            });
        }

        // Increment insights count
        const updated = await db.user.update({
            where: { clerkUserId: userId },
            data: {
                monthlyInsightsViewed: { increment: 1 },
                lastInsightsViewed: now,
            },
            select: { monthlyInsightsViewed: true },
        });

        return NextResponse.json({
            success: true,
            count: updated.monthlyInsightsViewed,
        });
    } catch (error) {
        console.error("Increment insights error:", error);
        return NextResponse.json(
            { error: "Failed to update insights count" },
            { status: 500 }
        );
    }
}
