import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { createConsent } from "@/lib/setu";

export async function POST(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user from database
        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await request.json();
        const { mobileNumber } = body;

        if (!mobileNumber) {
            return NextResponse.json(
                { error: "Mobile number is required" },
                { status: 400 }
            );
        }

        // Determine redirect URL from request host
        const host = request.headers.get('host');
        const protocol = host?.includes('localhost') ? 'http' : 'https';
        const baseUrl = `${protocol}://${host}`;
        const redirectUrl = `${baseUrl}/api/setu/consent-callback`;

        // Create consent request with Setu
        const consent = await createConsent(mobileNumber, redirectUrl);

        // Store consent ID temporarily (we'll create the account after consent is approved)
        // For now, we'll pass the consent info back to frontend
        return NextResponse.json({
            success: true,
            consentId: consent.consentId,
            redirectUrl: consent.redirectUrl,
            message: "Consent request created. Redirect user to approve.",
        });
    } catch (error) {
        console.error("Create consent error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create consent" },
            { status: 500 }
        );
    }
}
