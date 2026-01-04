// Setu Account Aggregator API Client
// This file should only be imported from server-side code (API routes)

// Setu Account Aggregator API Client
// Sandbox Base URL: https://fiu-sandbox.setu.co

const SETU_BASE_URL = process.env.SETU_ENV === 'production'
    ? 'https://fiu.setu.co'
    : 'https://fiu-sandbox.setu.co';

const SETU_CLIENT_ID = process.env.SETU_CLIENT_ID;
const SETU_CLIENT_SECRET = process.env.SETU_CLIENT_SECRET;
const SETU_PRODUCT_ID = process.env.SETU_PRODUCT_ID;

// Helper to make authenticated requests to Setu
async function setuFetch(endpoint, options = {}) {
    const url = `${SETU_BASE_URL}${endpoint}`;

    // Debug log
    console.log('Setu Config:', {
        baseUrl: SETU_BASE_URL,
        clientId: SETU_CLIENT_ID ? `${SETU_CLIENT_ID.substring(0, 8)}...` : 'MISSING',
        productId: SETU_PRODUCT_ID ? `${SETU_PRODUCT_ID.substring(0, 8)}...` : 'MISSING',
        secretProvided: !!SETU_CLIENT_SECRET
    });

    const headers = {
        'Content-Type': 'application/json',
        'x-client-id': SETU_CLIENT_ID,
        'x-client-secret': SETU_CLIENT_SECRET,
        'x-product-instance-id': SETU_PRODUCT_ID,
        ...options.headers,
    };

    console.log('Setu Request:', url);

    const response = await fetch(url, {
        ...options,
        headers,
    });

    const responseText = await response.text();
    console.log('Setu Response Status:', response.status);
    console.log('Setu Response:', responseText.substring(0, 500));

    let data;
    try {
        data = JSON.parse(responseText);
    } catch (e) {
        throw new Error(`Setu API returned non-JSON: ${responseText.substring(0, 200)}`);
    }

    if (!response.ok) {
        console.error('Setu API Error:', data);
        throw new Error(data.errorMsg || data.message || data.error || JSON.stringify(data));
    }

    return data;
}

// Create a consent request for bank linking
export async function createConsent(mobileNumber, redirectUrl) {
    const consentRequest = {
        consentDuration: {
            unit: "MONTH",
            value: 1
        },
        vua: `${mobileNumber}@onemoney`, // Virtual User Address format
        dataRange: {
            from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
            to: new Date().toISOString()
        },
        context: [],
        redirectUrl: redirectUrl
    };

    const response = await setuFetch('/v2/consents', {
        method: 'POST',
        body: JSON.stringify(consentRequest),
    });

    return {
        consentId: response.id,
        redirectUrl: response.url,
        status: response.status,
    };
}

// Get consent status
export async function getConsentStatus(consentId) {
    const response = await setuFetch(`/v2/consents/${consentId}`);

    return {
        id: response.id,
        status: response.status,
        accounts: response.accounts || [],
    };
}

// Create a data session to fetch financial data
export async function createDataSession(consentId) {
    const sessionRequest = {
        consentId: consentId,
        dataRange: {
            from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString()
        },
        format: "json"
    };

    const response = await setuFetch('/v2/sessions', {
        method: 'POST',
        body: JSON.stringify(sessionRequest),
    });

    return {
        sessionId: response.id,
        status: response.status,
    };
}

// Fetch financial data from a session
export async function fetchSessionData(sessionId) {
    // Poll for data readiness
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
        const response = await setuFetch(`/v2/sessions/${sessionId}`);

        if (response.status === 'COMPLETED') {
            return {
                status: 'COMPLETED',
                data: response.data || [],
                accounts: response.accounts || [],
            };
        }

        if (response.status === 'FAILED') {
            throw new Error('Data fetch session failed');
        }

        // Wait 2 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
    }

    throw new Error('Data fetch timeout');
}

// Revoke consent
export async function revokeConsent(consentId) {
    const response = await setuFetch(`/v2/consents/${consentId}`, {
        method: 'DELETE',
    });

    return {
        success: true,
        status: response.status,
    };
}

// Parse Setu transactions to our format
export function parseSetuTransactions(setuData, accountId, userId) {
    const transactions = [];

    if (!setuData || !Array.isArray(setuData)) {
        return transactions;
    }

    for (const fiData of setuData) {
        const account = fiData.account || {};
        const txns = account.transactions || [];

        for (const txn of txns) {
            // Determine transaction type based on amount or type field
            const isCredit = txn.type === 'CREDIT' || parseFloat(txn.amount) > 0;

            transactions.push({
                type: isCredit ? 'INCOME' : 'EXPENSE',
                amount: Math.abs(parseFloat(txn.amount || 0)),
                description: txn.narration || txn.description || 'Bank Transaction',
                date: new Date(txn.transactionTimestamp || txn.valueDate || new Date()),
                category: categorizeTransaction(txn.narration || ''),
                status: 'COMPLETED',
                userId: userId,
                accountId: accountId,
                isAutoSynced: true,
                externalId: txn.txnId || txn.transactionId || `${txn.transactionTimestamp}-${txn.amount}`,
            });
        }
    }

    return transactions;
}

// Simple transaction categorization based on description
function categorizeTransaction(description) {
    const desc = description.toLowerCase();

    if (desc.includes('salary') || desc.includes('income')) return 'salary';
    if (desc.includes('rent') || desc.includes('housing')) return 'housing';
    if (desc.includes('food') || desc.includes('restaurant') || desc.includes('swiggy') || desc.includes('zomato')) return 'food';
    if (desc.includes('uber') || desc.includes('ola') || desc.includes('transport') || desc.includes('petrol')) return 'transportation';
    if (desc.includes('amazon') || desc.includes('flipkart') || desc.includes('shopping')) return 'shopping';
    if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('entertainment')) return 'entertainment';
    if (desc.includes('electric') || desc.includes('water') || desc.includes('gas') || desc.includes('bill')) return 'utilities';
    if (desc.includes('hospital') || desc.includes('medical') || desc.includes('pharmacy')) return 'healthcare';
    if (desc.includes('education') || desc.includes('course') || desc.includes('school')) return 'education';
    if (desc.includes('atm') || desc.includes('cash')) return 'other';
    if (desc.includes('transfer') || desc.includes('upi') || desc.includes('neft') || desc.includes('imps')) return 'transfer';

    return 'other';
}

export { SETU_BASE_URL, setuFetch };
