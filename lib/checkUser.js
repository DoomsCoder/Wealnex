// lib/checkUser.ts
import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => {
  let user;

  try {
    user = await currentUser();
  } catch (clerkError) {
    // Handle Clerk API errors gracefully (e.g., 409 Conflict, network issues)
    console.error("Clerk API error in checkUser:", clerkError?.message || clerkError);
    return null;
  }

  if (!user) return null;

  try {
    const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();

    // Use upsert to handle race conditions atomically
    // This prevents "Unique constraint failed" errors when multiple requests
    // try to create the same user simultaneously after sign-up
    const dbUser = await db.user.upsert({
      where: { clerkUserId: user.id },
      update: {
        // Update user info in case it changed in Clerk
        name: name || undefined,
        email: user.emailAddresses[0]?.emailAddress,
        imageUrl: user.imageUrl,
      },
      create: {
        clerkUserId: user.id,
        name,
        email: user.emailAddresses[0].emailAddress,
        imageUrl: user.imageUrl,
      },
    });

    return dbUser;
  } catch (err) {
    console.error("checkUser error:", err.message);
    return null;
  }
};
