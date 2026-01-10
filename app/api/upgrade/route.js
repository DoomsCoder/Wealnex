import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

// Mock upgrade endpoint - no real payment processing
// For hackathon demo purposes only
export async function POST(req) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Find the user
        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Parse request body for plan (default to PRO)
        let targetPlan = "PRO";
        try {
            const body = await req.json();
            if (body.plan && ["PRO", "BUSINESS"].includes(body.plan)) {
                targetPlan = body.plan;
            }
        } catch {
            // If no body, default to PRO
        }

        // Mock payment delay (simulates processing)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Update user's plan
        const updatedUser = await db.user.update({
            where: { id: user.id },
            data: { plan: targetPlan },
        });

        return NextResponse.json({
            success: true,
            plan: updatedUser.plan,
            message: `Successfully upgraded to ${targetPlan}!`,
        });
    } catch (error) {
        console.error("Upgrade error:", error);
        return NextResponse.json(
            { error: "Failed to process upgrade" },
            { status: 500 }
        );
    }
}

// Get current user's plan (with expiration check)
export async function GET(req) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch user with all plan-related fields
        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
            select: {
                id: true,
                plan: true,
                billingPeriod: true,
                planExpiresAt: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if Pro plan has expired
        let currentPlan = user.plan || "FREE";
        let wasDowngraded = false;

        if (user.plan === "PRO" && user.planExpiresAt) {
            const now = new Date();
            const expiresAt = new Date(user.planExpiresAt);

            if (now > expiresAt) {
                // Plan has expired - downgrade to FREE
                console.log(`User plan expired. Downgrading to FREE.`);

                await db.user.update({
                    where: { id: user.id },
                    data: { plan: "FREE" },
                });

                currentPlan = "FREE";
                wasDowngraded = true;
            }
        }

        // Calculate days remaining if Pro
        let daysRemaining = null;
        if (currentPlan === "PRO" && user.planExpiresAt) {
            const now = new Date();
            const expiresAt = new Date(user.planExpiresAt);
            daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }

        return NextResponse.json({
            plan: currentPlan,
            billingPeriod: user.billingPeriod || null,
            planExpiresAt: user.planExpiresAt,
            daysRemaining: daysRemaining,
            wasDowngraded: wasDowngraded,
        });
    } catch (error) {
        console.error("Get plan error:", error);
        return NextResponse.json(
            { error: "Failed to get plan" },
            { status: 500 }
        );
    }
}
