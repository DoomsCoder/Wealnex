import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import razorpay from "@/lib/razorpay";

// Plan prices in paise (Razorpay uses smallest currency unit)
const PLAN_PRICES = {
    PRO_MONTHLY: 14900,  // ₹149
    PRO_YEARLY: 99900,   // ₹999
};

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

        // Check if already Pro
        if (user.plan === "PRO" || user.plan === "BUSINESS") {
            return NextResponse.json({
                error: "Already subscribed to Pro"
            }, { status: 400 });
        }

        // Parse request body
        const body = await req.json();
        const isYearly = body.isYearly || false;
        const amount = isYearly ? PLAN_PRICES.PRO_YEARLY : PLAN_PRICES.PRO_MONTHLY;

        // Create Razorpay order
        // Receipt must be max 40 chars
        const receiptId = `pro_${user.id.slice(0, 8)}_${Date.now().toString(36)}`;

        const order = await razorpay.getInstance().orders.create({
            amount: amount,
            currency: "INR",
            receipt: receiptId,
            notes: {
                userId: user.id,
                plan: "PRO",
                billingPeriod: isYearly ? "yearly" : "monthly",
            },
        });

        return NextResponse.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            userEmail: user.email,
            userName: user.name,
        });
    } catch (error) {
        console.error("Create order error:", error);
        return NextResponse.json(
            { error: "Failed to create payment order" },
            { status: 500 }
        );
    }
}
