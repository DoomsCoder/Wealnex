import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { verifyPaymentSignature } from "@/lib/razorpay";

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

        // Parse request body
        const body = await req.json();
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;

        // Validate required fields
        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return NextResponse.json(
                { error: "Missing payment details" },
                { status: 400 }
            );
        }

        // Verify payment signature
        const isValid = verifyPaymentSignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!isValid) {
            console.error("Payment signature verification failed");
            return NextResponse.json(
                { error: "Invalid payment signature" },
                { status: 400 }
            );
        }

        // Payment verified! Update user to Pro
        const updatedUser = await db.user.update({
            where: { id: user.id },
            data: {
                plan: "PRO",
                planActivatedAt: new Date(),
            },
        });

        console.log(`User ${user.email} upgraded to PRO via Razorpay payment ${razorpay_payment_id}`);

        return NextResponse.json({
            success: true,
            plan: updatedUser.plan,
            message: "Welcome to Wealnex Pro! 🚀",
        });
    } catch (error) {
        console.error("Payment verification error:", error);
        return NextResponse.json(
            { error: "Failed to verify payment" },
            { status: 500 }
        );
    }
}
