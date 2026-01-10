"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
    Brain, TrendingUp, TrendingDown, AlertTriangle, Lightbulb,
    Lock, Sparkles, Info, AlertCircle, CheckCircle2, ArrowUpRight, HelpCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UpgradeModal } from "@/components/upgrade-modal";

const FREE_INSIGHT_LIMIT = 6;

// Generate insights from transaction data for a specific account
function generateInsights(transactions, budgetData, accountName) {
    const insights = [];

    if (!transactions || transactions.length === 0) {
        return [{
            id: 'no-data',
            type: 'neutral',
            icon: 'Info',
            title: 'Not enough data yet',
            message: 'Add more transactions to get personalized AI insights.',
            priority: 0,
        }];
    }

    // Get this month's transactions
    const now = new Date();
    const thisMonth = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    // Get last month's transactions
    const lastMonth = transactions.filter(t => {
        const date = new Date(t.date);
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return date.getMonth() === lastMonthDate.getMonth() && date.getFullYear() === lastMonthDate.getFullYear();
    });

    // Calculate totals
    const thisMonthExpenses = thisMonth.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
    const lastMonthExpenses = lastMonth.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
    const thisMonthIncome = thisMonth.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);

    // Insight 1: Spending comparison
    if (lastMonthExpenses > 0) {
        const change = ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
        if (change > 15) {
            insights.push({
                id: 'spending-increase',
                type: 'warning',
                icon: 'TrendingUp',
                title: 'Spending increased',
                message: `Expenses up ${Math.round(change)}% vs last month. Consider reviewing your spending.`,
                priority: 4,
            });
        } else if (change > 5) {
            insights.push({
                id: 'spending-slight-increase',
                type: 'neutral',
                icon: 'ArrowUpRight',
                title: 'Slight spending increase',
                message: `Expenses up ${Math.round(change)}% compared to last month.`,
                priority: 2,
            });
        } else if (change < -10) {
            insights.push({
                id: 'spending-decrease',
                type: 'positive',
                icon: 'TrendingDown',
                title: 'Great job saving!',
                message: `You've reduced spending by ${Math.round(Math.abs(change))}% this month.`,
                priority: 3,
            });
        }
    }

    // Insight 2: Budget warning
    if (budgetData?.budget && budgetData?.currentExpenses) {
        const budgetUsage = (budgetData.currentExpenses / budgetData.budget.amount) * 100;
        if (budgetUsage >= 100) {
            insights.push({
                id: 'budget-exceeded',
                type: 'warning',
                icon: 'AlertTriangle',
                title: 'Budget exceeded',
                message: `Over budget by ₹${Math.round(budgetData.currentExpenses - budgetData.budget.amount).toLocaleString()}. Time to cut back.`,
                priority: 5,
            });
        } else if (budgetUsage > 80) {
            insights.push({
                id: 'budget-warning',
                type: 'warning',
                icon: 'AlertCircle',
                title: 'Budget alert',
                message: `${Math.round(budgetUsage)}% of budget used. ₹${Math.round(budgetData.budget.amount - budgetData.currentExpenses).toLocaleString()} remaining.`,
                priority: 4,
            });
        } else if (budgetUsage < 50 && thisMonth.length > 5) {
            insights.push({
                id: 'budget-healthy',
                type: 'positive',
                icon: 'CheckCircle2',
                title: 'On track!',
                message: `Only ${Math.round(budgetUsage)}% of budget used. You're doing well!`,
                priority: 2,
            });
        }
    }

    // Insight 3: Category analysis
    const categoryTotals = {};
    thisMonth.filter(t => t.type === 'EXPENSE').forEach(t => {
        const cat = t.category || 'other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
    });

    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const topCategory = sortedCategories[0];

    if (topCategory && thisMonthExpenses > 0) {
        const percentage = Math.round((topCategory[1] / thisMonthExpenses) * 100);
        if (percentage > 40) {
            insights.push({
                id: 'category-dominance',
                type: 'neutral',
                icon: 'Lightbulb',
                title: `${percentage}% on ${formatCategory(topCategory[0])}`,
                message: `Your biggest expense category this month.`,
                priority: 2,
            });
        }
    }

    // Insight 4: Savings rate
    if (thisMonthIncome > 0 && thisMonthExpenses > 0) {
        const savingsRate = ((thisMonthIncome - thisMonthExpenses) / thisMonthIncome) * 100;
        if (savingsRate > 30) {
            insights.push({
                id: 'savings-excellent',
                type: 'positive',
                icon: 'Sparkles',
                title: 'Excellent savings!',
                message: `Saving ${Math.round(savingsRate)}% of income. Keep it up!`,
                priority: 3,
            });
        } else if (savingsRate < 0) {
            insights.push({
                id: 'overspending',
                type: 'warning',
                icon: 'AlertTriangle',
                title: 'Overspending alert',
                message: `Spending exceeds income by ₹${Math.round(Math.abs(thisMonthIncome - thisMonthExpenses)).toLocaleString()}.`,
                priority: 5,
            });
        }
    }

    // If very few insights, add a generic one
    if (insights.length === 0) {
        insights.push({
            id: 'keep-tracking',
            type: 'neutral',
            icon: 'Info',
            title: 'Keep tracking!',
            message: 'Add more transactions for detailed insights.',
            priority: 0,
        });
    }

    // Sort by priority and return
    return insights.sort((a, b) => b.priority - a.priority);
}

function formatCategory(cat) {
    return cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' ');
}

// Icon component mapping
const iconMap = {
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Lightbulb,
    Sparkles,
    Info,
    AlertCircle,
    CheckCircle2,
    ArrowUpRight,
};

// Color mapping for insight types
const typeConfig = {
    positive: {
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        icon: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800',
    },
    warning: {
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        icon: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800',
    },
    neutral: {
        bg: 'bg-slate-50 dark:bg-slate-900/50',
        icon: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-200 dark:border-slate-700',
    },
};

function InsightItem({ insight, isBlurred = false }) {
    const Icon = iconMap[insight.icon] || Lightbulb;
    const config = typeConfig[insight.type] || typeConfig.neutral;

    return (
        <div className={`relative flex items-start gap-3 p-3 rounded-xl border ${config.border} ${config.bg} transition-all hover:shadow-sm ${isBlurred ? 'blur-sm select-none' : ''}`}>
            <div className={`p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm ${config.icon}`}>
                <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{insight.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{insight.message}</p>
            </div>
        </div>
    );
}

function LockedOverlay({ onUpgrade }) {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-xl z-10">
            <div className="text-center p-4">
                <Lock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground mb-1">Insight limit reached</p>
                <p className="text-xs text-muted-foreground mb-3">Upgrade for unlimited AI insights</p>
                <Button size="sm" onClick={onUpgrade} className="bg-gradient-to-r from-violet-600 to-indigo-600">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Upgrade to Pro
                </Button>
            </div>
        </div>
    );
}

export function AiInsightsCard({
    transactions = [],
    budgetData = null,
    userPlan = 'FREE',
    accountName = null
}) {
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
    const [insightsViewed, setInsightsViewed] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Use ref to prevent double-tracking in React Strict Mode
    const trackingRef = useRef(false);

    // Generate insights from transactions
    const insights = useMemo(() => {
        return generateInsights(transactions, budgetData, accountName);
    }, [transactions, budgetData, accountName]);

    const isPro = userPlan !== 'FREE';
    const remainingInsights = FREE_INSIGHT_LIMIT - insightsViewed;
    const isLimitReached = !isPro && remainingInsights <= 0;

    // Check if we've already tracked this session (to prevent multiple increments)
    const getSessionKey = () => `insights_tracked_${new Date().toISOString().slice(0, 7)}`; // YYYY-MM key

    // Fetch insights viewed count and track view if applicable
    useEffect(() => {
        // Prevent double execution in React Strict Mode
        if (trackingRef.current) return;
        trackingRef.current = true;

        const fetchAndTrack = async () => {
            try {
                // First, get current count
                const getRes = await fetch("/api/insights-usage");
                const getData = await getRes.json();

                const currentCount = getData.count || 0;
                setInsightsViewed(currentCount);
                setIsLoading(false);

                // Check if tracking should happen
                const hasRealInsights = insights.length > 0 && insights[0]?.id !== 'no-data';
                const hasRemainingInsights = (FREE_INSIGHT_LIMIT - currentCount) > 0;
                const sessionKey = getSessionKey();
                const hasTrackedThisSession = sessionStorage.getItem(sessionKey) === 'true';

                // Only track if:
                // - User is FREE
                // - Has real insights
                // - Has remaining quota
                // - Hasn't tracked this session yet
                if (!isPro && hasRealInsights && hasRemainingInsights && !hasTrackedThisSession) {
                    // Mark as tracked in session storage BEFORE making the API call
                    sessionStorage.setItem(sessionKey, 'true');

                    const postRes = await fetch("/api/insights-usage", { method: "POST" });
                    const postData = await postRes.json();

                    if (postData.count !== undefined) {
                        setInsightsViewed(postData.count);
                    }
                }
            } catch (error) {
                console.error("Insights tracking error:", error);
                setInsightsViewed(0);
                setIsLoading(false);
            }
        };

        fetchAndTrack();

        // Cleanup function to reset ref on unmount
        return () => {
            trackingRef.current = false;
        };
    }, [isPro]); // Only depend on isPro, insights are generated synchronously

    // For free users, show limited insights
    const visibleInsights = isPro ? insights : insights.slice(0, Math.min(insights.length, remainingInsights > 0 ? 3 : 1));
    const hasLockedInsights = !isPro && insights.length > visibleInsights.length;

    return (
        <>
            <Card className="overflow-hidden border-0 shadow-md bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
                <CardHeader className="pb-3 bg-gradient-to-r from-violet-500/5 to-indigo-500/5 border-b border-violet-100 dark:border-violet-900/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shadow-sm">
                                <Brain className="h-4 w-4 text-white" />
                            </div>
                            <CardTitle className="text-base font-semibold">AI Insights</CardTitle>
                        </div>

                        {/* Usage Counter for Free users with tooltip explanation */}
                        {!isPro && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className={`text-xs font-medium px-2 py-1 rounded-full cursor-help flex items-center gap-1 ${remainingInsights <= 1
                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                        }`}>
                                        <HelpCircle className="h-3 w-3" />
                                        {isLoading ? '...' : `${Math.max(0, remainingInsights)}/${FREE_INSIGHT_LIMIT} left`}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-[250px] text-center">
                                    <p className="text-xs">
                                        <strong>Free plan:</strong> {FREE_INSIGHT_LIMIT} AI insights per month.
                                        Uses 1 credit per hour of viewing.
                                        Resets on the 1st of each month.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        )}

                        {isPro && (
                            <div className="text-xs font-bold px-2 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white">
                                PRO
                            </div>
                        )}
                    </div>

                    {/* Account context indicator */}
                    {accountName && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            Based on {accountName}
                        </p>
                    )}
                </CardHeader>

                <CardContent className="pt-4 space-y-3 relative">
                    {insights.length === 0 ? (
                        <div className="text-center py-6">
                            <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                            <p className="text-sm text-muted-foreground">
                                Not enough data yet
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                                Add transactions to get insights
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Visible insights */}
                            {visibleInsights.map((insight) => (
                                <InsightItem key={insight.id} insight={insight} />
                            ))}

                            {/* Locked/blurred insights for free users */}
                            {hasLockedInsights && (
                                <div className="relative">
                                    <InsightItem
                                        insight={insights[visibleInsights.length]}
                                        isBlurred={true}
                                    />
                                    <LockedOverlay onUpgrade={() => setUpgradeModalOpen(true)} />
                                </div>
                            )}

                            {/* Upgrade prompt if limit reached but no more insights to show */}
                            {isLimitReached && !hasLockedInsights && (
                                <div className="p-4 rounded-xl border border-dashed border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 text-center">
                                    <Lock className="h-5 w-5 text-violet-500 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-foreground">Monthly limit reached</p>
                                    <p className="text-xs text-muted-foreground mt-1">Upgrade for unlimited insights</p>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setUpgradeModalOpen(true)}
                                        className="mt-3 border-violet-300 text-violet-600"
                                    >
                                        View Plans
                                    </Button>
                                </div>
                            )}

                            {/* Warning for similar insights */}
                            {insights.length <= 2 && transactions.length < 10 && (
                                <p className="text-xs text-muted-foreground/70 text-center pt-2 flex items-center justify-center gap-1">
                                    <Info className="h-3 w-3" />
                                    Add more transactions for varied insights
                                </p>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            <UpgradeModal
                open={upgradeModalOpen}
                onOpenChange={setUpgradeModalOpen}
                feature="Unlimited AI Insights"
            />
        </>
    );
}
