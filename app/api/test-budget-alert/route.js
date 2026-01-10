import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { sendEmail } from "@/actions/send-email";
import EmailTemplate from "@/emails/template";

// Manual budget alert test endpoint
// GET /api/test-budget-alert - Triggers budget check for current user
export async function GET(req) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get user with default account and budget
        const user = await db.user.findUnique({
            where: { clerkUserId: userId },
            include: {
                accounts: {
                    where: { isDefault: true },
                },
                budgets: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const defaultAccount = user.accounts[0];
        if (!defaultAccount) {
            return NextResponse.json({ error: "No default account" }, { status: 400 });
        }

        const budget = user.budgets[0];
        if (!budget) {
            return NextResponse.json({ error: "No budget set" }, { status: 400 });
        }

        // Calculate expenses
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const expenses = await db.transaction.aggregate({
            where: {
                userId: user.id,
                accountId: defaultAccount.id,
                type: "EXPENSE",
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
            _sum: { amount: true },
        });

        const totalExpenses = expenses._sum.amount?.toNumber() || 0;
        const budgetAmount = budget.amount;
        const percentageUsed = (totalExpenses / budgetAmount) * 100;

        // Send test email
        console.log(`Sending test budget alert to ${user.email}...`);
        console.log(`Budget: ${budgetAmount}, Expenses: ${totalExpenses}, Usage: ${percentageUsed.toFixed(1)}%`);

        const emailResult = await sendEmail({
            to: user.email,
            subject: `[TEST] Budget Alert for ${defaultAccount.name}`,
            react: EmailTemplate({
                userName: user.name,
                type: "budget-alert",
                data: {
                    percentageUsed,
                    budgetAmount: parseFloat(budgetAmount).toFixed(1),
                    totalExpenses: parseFloat(totalExpenses).toFixed(1),
                    accountName: defaultAccount.name,
                },
            }),
        });

        if (emailResult.success) {
            return NextResponse.json({
                success: true,
                message: `Test email sent to ${user.email}`,
                data: {
                    email: user.email,
                    budget: budgetAmount,
                    expenses: totalExpenses,
                    percentageUsed: percentageUsed.toFixed(1) + "%",
                },
            });
        } else {
            return NextResponse.json({
                success: false,
                error: "Email failed to send",
                details: emailResult.error?.message || emailResult.error,
            }, { status: 500 });
        }
    } catch (error) {
        console.error("Test budget alert error:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
        }, { status: 500 });
    }
}
