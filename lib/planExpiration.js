"use server";

import { db } from "@/lib/prisma";

/**
 * Check if user's Pro plan has expired and downgrade to FREE if so.
 * Call this in any API route that checks user's plan.
 * @param {string} clerkUserId - The Clerk user ID
 * @returns {Object} - The user object with updated plan if needed
 */
export async function checkAndUpdatePlanExpiration(clerkUserId) {
    const user = await db.user.findUnique({
        where: { clerkUserId },
        select: {
            id: true,
            plan: true,
            planExpiresAt: true,
            billingPeriod: true,
        },
    });

    if (!user) return null;

    // Only check expiration for PRO users
    if (user.plan === "PRO" && user.planExpiresAt) {
        const now = new Date();
        const expiresAt = new Date(user.planExpiresAt);

        if (now > expiresAt) {
            // Plan has expired - downgrade to FREE
            console.log(`User ${clerkUserId} Pro plan expired. Downgrading to FREE.`);

            const updatedUser = await db.user.update({
                where: { id: user.id },
                data: {
                    plan: "FREE",
                    // Keep planActivatedAt and planExpiresAt for history
                },
            });

            return { ...updatedUser, wasDowngraded: true };
        }
    }

    return { ...user, wasDowngraded: false };
}

/**
 * Get the remaining days until plan expiration.
 * @param {Date} expiresAt - The expiration date
 * @returns {number} - Days remaining (negative if expired)
 */
export function getDaysUntilExpiration(expiresAt) {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
