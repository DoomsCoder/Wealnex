// Feature access configuration for Wealnex freemium model
// This file defines what features are available for each plan

export const PLANS = {
    FREE: 'FREE',
    PRO: 'PRO',
    BUSINESS: 'BUSINESS',
};

export const FEATURES = {
    BANK_LINKING: { requiredPlan: 'PRO', name: 'Bank Linking', description: 'Link bank accounts via Account Aggregator' },
    AUTO_SYNC: { requiredPlan: 'PRO', name: 'Auto Sync', description: 'Automatic transaction syncing' },
    EXPORT_REPORTS: { requiredPlan: 'PRO', name: 'Export Reports', description: 'Export CSV/PDF reports' },
    UNLIMITED_AI_INSIGHTS: { requiredPlan: 'PRO', name: 'Unlimited AI Insights', description: 'Get unlimited AI-powered insights' },
    MULTI_USER: { requiredPlan: 'BUSINESS', name: 'Multi-User Access', description: 'Team finance management' },
    API_ACCESS: { requiredPlan: 'BUSINESS', name: 'API Access', description: 'Programmatic access to your data' },
};

// Plan hierarchy for comparison
const PLAN_LEVELS = { FREE: 0, PRO: 1, BUSINESS: 2 };

/**
 * Check if a user's plan has access to a specific feature
 * @param {string} userPlan - User's current plan (FREE, PRO, BUSINESS)
 * @param {string} featureKey - Feature key from FEATURES object
 * @returns {boolean} - Whether the user has access
 */
export function canAccess(userPlan, featureKey) {
    const feature = FEATURES[featureKey];
    if (!feature) return true; // Unknown features are allowed

    const requiredLevel = PLAN_LEVELS[feature.requiredPlan] || 0;
    const userLevel = PLAN_LEVELS[userPlan] || 0;

    return userLevel >= requiredLevel;
}

/**
 * Get plan-specific limits
 * @param {string} plan - User's plan
 * @returns {object} - Limits for the plan
 */
export function getPlanLimits(plan) {
    const limits = {
        FREE: {
            aiInsightsPerMonth: 3,
            linkedAccounts: 0,
            canExport: false,
            canLinkBank: false,
        },
        PRO: {
            aiInsightsPerMonth: Infinity,
            linkedAccounts: Infinity,
            canExport: true,
            canLinkBank: true,
        },
        BUSINESS: {
            aiInsightsPerMonth: Infinity,
            linkedAccounts: Infinity,
            canExport: true,
            canLinkBank: true,
        },
    };

    return limits[plan] || limits.FREE;
}

/**
 * Get display info for a plan
 * @param {string} plan - Plan name
 * @returns {object} - Display info including price and features
 */
export function getPlanInfo(plan) {
    const plans = {
        FREE: {
            name: 'Free',
            price: 0,
            priceLabel: '₹0/forever',
            description: 'Get started with manual expense tracking',
            features: [
                'Unlimited manual accounts',
                'Transaction tracking',
                'Basic budget alerts',
                'AI insights (3/month)',
            ],
        },
        PRO: {
            name: 'Pro',
            price: 149,
            yearlyPrice: 999,
            priceLabel: '₹149/month',
            yearlyPriceLabel: '₹999/year',
            description: 'Full power with bank linking and AI',
            features: [
                'Everything in Free',
                'Bank linking via Account Aggregator',
                'Auto-sync transactions',
                'Unlimited AI insights',
                'Export reports (CSV/PDF)',
            ],
            popular: true,
        },
        BUSINESS: {
            name: 'Business',
            price: null,
            priceLabel: 'Contact Us',
            description: 'Team finance management',
            features: [
                'Everything in Pro',
                'Multi-user access',
                'API access',
                'Priority support',
            ],
            comingSoon: true,
        },
    };

    return plans[plan] || plans.FREE;
}
