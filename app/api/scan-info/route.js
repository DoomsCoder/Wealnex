import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

// Get user's scan info (usage count and plan)
export async function GET(req) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ scansUsed: 0, plan: 'FREE' });
        }

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
            select: {
                plan: true,
                monthlyScansUsed: true,
                lastScanReset: true,
            },
        });

        if (!user) {
            return NextResponse.json({ scansUsed: 0, plan: 'FREE' });
        }

        // Check if we need to reset monthly scan count
        const now = new Date();
        const lastReset = user.lastScanReset ? new Date(user.lastScanReset) : null;
        const shouldReset = !lastReset ||
            lastReset.getMonth() !== now.getMonth() ||
            lastReset.getFullYear() !== now.getFullYear();

        let scansUsed = user.monthlyScansUsed || 0;

        if (shouldReset) {
            // Reset the count for the new month
            await db.user.update({
                where: { clerkUserId: userId },
                data: {
                    monthlyScansUsed: 0,
                    lastScanReset: now,
                },
            });
            scansUsed = 0;
        }

        return NextResponse.json({
            scansUsed,
            plan: user.plan || 'FREE',
        });
    } catch (error) {
        console.error("Get scan info error:", error);
        return NextResponse.json({ scansUsed: 0, plan: 'FREE' });
    }
}

// Increment scan count after successful scan
export async function POST(req) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
            select: { plan: true, monthlyScansUsed: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Pro users have unlimited scans
        if (user.plan !== 'FREE') {
            return NextResponse.json({ success: true, scansUsed: 0, unlimited: true });
        }

        // Increment scan count
        const updated = await db.user.update({
            where: { clerkUserId: userId },
            data: {
                monthlyScansUsed: { increment: 1 },
                lastScanReset: new Date(), // Update to current month
            },
            select: { monthlyScansUsed: true },
        });

        return NextResponse.json({
            success: true,
            scansUsed: updated.monthlyScansUsed,
        });
    } catch (error) {
        console.error("Increment scan error:", error);
        return NextResponse.json(
            { error: "Failed to update scan count" },
            { status: 500 }
        );
    }
}
