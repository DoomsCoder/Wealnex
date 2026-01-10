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

// Get current user's plan
export async function GET(req) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
            select: { plan: true, billingPeriod: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            plan: user.plan || "FREE",
            billingPeriod: user.billingPeriod || null
        });
    } catch (error) {
        console.error("Get plan error:", error);
        return NextResponse.json(
            { error: "Failed to get plan" },
            { status: 500 }
        );
    }
}
