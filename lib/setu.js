// Setu Account Aggregator API Client
// This file proxies requests through the AWS Setu microservice
// to avoid 403 Forbidden errors from Render (US region)

// AWS Setu Service URL (deployed in Mumbai ap-south-1)
const SETU_SERVICE_URL = process.env.SETU_SERVICE_URL;

// Check if we should use direct Setu calls (local dev) or proxy (production)
const USE_DIRECT_SETU = process.env.SETU_USE_DIRECT === 'true';

// Direct Setu configuration (only used in local development)
const SETU_BASE_URL = process.env.SETU_ENV === 'production'
    ? 'https://fiu.setu.co'
    : 'https://fiu-sandbox.setu.co';

const SETU_CLIENT_ID = process.env.SETU_CLIENT_ID;
const SETU_CLIENT_SECRET = process.env.SETU_CLIENT_SECRET;
const SETU_PRODUCT_ID = process.env.SETU_PRODUCT_ID;

// ===========================================
// PROXY MODE (Production - via AWS Mumbai)
// ===========================================

// Make requests through AWS Setu Service
async function setuServiceFetch(endpoint, options = {}) {
    if (!SETU_SERVICE_URL) {
        throw new Error('SETU_SERVICE_URL not configured. Set this to your AWS Setu service URL.');
    }

    const url = `${SETU_SERVICE_URL}${endpoint}`;

    console.log('Setu Service Request:', url);

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    const responseText = await response.text();
    console.log('Setu Service Response Status:', response.status);

    let data;
    try {
        data = JSON.parse(responseText);
    } catch (e) {
        throw new Error(`Setu service returned non-JSON: ${responseText.substring(0, 200)}`);
    }

    if (!response.ok) {
        console.error('Setu Service Error:', data);
        throw new Error(data.error || data.message || 'Setu service error');
    }

    return data;
}

// ===========================================
// DIRECT MODE (Local Development Only)
// ===========================================

// Make direct authenticated requests to Setu (only for local dev)
async function directSetuFetch(endpoint, options = {}) {
    const url = `${SETU_BASE_URL}${endpoint}`;

    console.log('Direct Setu Config:', {
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

    console.log('Direct Setu Request:', url);

    const response = await fetch(url, {
        ...options,
        headers,
    });

    const responseText = await response.text();
    console.log('Direct Setu Response Status:', response.status);
    console.log('Direct Setu Response:', responseText.substring(0, 500));

    let data;
    try {
        data = JSON.parse(responseText);
    } catch (e) {
        throw new Error(`Setu API returned non-JSON: ${responseText.substring(0, 200)}`);
    }

    if (!response.ok) {
        console.error('Direct Setu API Error:', data);
        throw new Error(data.errorMsg || data.message || data.error || JSON.stringify(data));
    }

    return data;
}

// ===========================================
// Unified Fetch (Auto-selects mode)
// ===========================================

async function setuFetch(endpoint, options = {}) {
    if (USE_DIRECT_SETU) {
        console.log('[Setu] Using DIRECT mode (local development)');
        return directSetuFetch(endpoint, options);
    } else {
        console.log('[Setu] Using PROXY mode (via AWS Mumbai)');
        return setuServiceFetch(endpoint, options);
    }
}

// ===========================================
// API Functions
// ===========================================

// Create a consent request for bank linking
export async function createConsent(mobileNumber, redirectUrl) {
    if (USE_DIRECT_SETU) {
        // Direct mode - full request to Setu
        const consentRequest = {
            consentDuration: {
                unit: "MONTH",
                value: 1
            },
            vua: `${mobileNumber}@onemoney`,
            dataRange: {
                from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
                to: new Date().toISOString()
            },
            context: process.env.SETU_ENV === 'production' ? [] : [
                { key: "fipId", value: "setu-fip-2" }
            ],
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
    } else {
        // Proxy mode - let AWS service handle it
        return setuServiceFetch('/api/consent/create', {
            method: 'POST',
            body: JSON.stringify({ mobileNumber, redirectUrl }),
        });
    }
}

// Get consent status
export async function getConsentStatus(consentId) {
    if (USE_DIRECT_SETU) {
        const response = await setuFetch(`/v2/consents/${consentId}?expanded=true`);

        let fiDataRange;
        if (response.detail?.dataRange) {
            fiDataRange = response.detail.dataRange;
        } else if (response.fiDataRange) {
            fiDataRange = response.fiDataRange;
        } else if (response.dataRange) {
            fiDataRange = response.dataRange;
        } else if (response.detail?.consentStart) {
            const creationDate = new Date(response.detail.consentStart);
            const oneYearBefore = new Date(creationDate.getTime() - 365 * 24 * 60 * 60 * 1000);
            fiDataRange = {
                from: oneYearBefore.toISOString(),
                to: creationDate.toISOString()
            };
        } else {
            fiDataRange = { from: null, to: null };
        }

        return {
            id: response.id,
            status: response.status,
            accounts: response.accountsLinked || response.accounts || [],
            detail: response.detail || {},
            fiDataRange: fiDataRange,
        };
    } else {
        return setuServiceFetch(`/api/consent/${consentId}`);
    }
}

// Create a data session to fetch financial data
export async function createDataSession(consentId, fiDataRange) {
    if (!fiDataRange?.from || !fiDataRange?.to) {
        throw new Error("Missing FIDataRange from consent - cannot create data session");
    }

    if (USE_DIRECT_SETU) {
        const sessionRequest = {
            consentId: consentId,
            format: "json",
            dataRange: {
                from: fiDataRange.from,
                to: fiDataRange.to
            }
        };

        const response = await setuFetch('/v2/sessions', {
            method: 'POST',
            body: JSON.stringify(sessionRequest),
        });

        return {
            sessionId: response.id,
            status: response.status,
        };
    } else {
        return setuServiceFetch('/api/session/create', {
            method: 'POST',
            body: JSON.stringify({ consentId, fiDataRange }),
        });
    }
}

// Fetch financial data from a session
export async function fetchSessionData(sessionId) {
    if (USE_DIRECT_SETU) {
        // Poll for data readiness
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
            const response = await setuFetch(`/v2/sessions/${sessionId}`);

            console.log('Session poll attempt', attempts + 1, 'status:', response.status);

            if (response.status === 'COMPLETED' || response.status === 'PARTIAL') {
                const allAccountsData = [];

                if (response.fips && Array.isArray(response.fips)) {
                    for (const fip of response.fips) {
                        if (fip.accounts && Array.isArray(fip.accounts)) {
                            for (const account of fip.accounts) {
                                if (account.data && account.FIstatus === 'READY') {
                                    allAccountsData.push({
                                        fipId: fip.fipID,
                                        account: account.data.account,
                                        maskedAccNumber: account.maskedAccNumber,
                                        linkRefNumber: account.linkRefNumber,
                                    });
                                }
                            }
                        }
                    }
                }

                return {
                    status: response.status,
                    data: allAccountsData,
                    fips: response.fips || [],
                };
            }

            if (response.status === 'FAILED' || response.status === 'EXPIRED') {
                throw new Error(`Data fetch session ${response.status.toLowerCase()}`);
            }

            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;
        }

        throw new Error('Data fetch timeout');
    } else {
        // Use poll endpoint on AWS service
        return setuServiceFetch(`/api/session/${sessionId}/poll`);
    }
}

// Revoke consent
export async function revokeConsent(consentId) {
    if (USE_DIRECT_SETU) {
        const response = await setuFetch(`/v2/consents/${consentId}`, {
            method: 'DELETE',
        });

        return {
            success: true,
            status: response.status,
        };
    } else {
        return setuServiceFetch(`/api/consent/${consentId}`, {
            method: 'DELETE',
        });
    }
}

// ===========================================
// Transaction Parsing (Local Only)
// ===========================================

// Parse Setu transactions to our format
export function parseSetuTransactions(setuData, accountId, userId) {
    const transactions = [];

    if (!setuData || !Array.isArray(setuData)) {
        console.log('parseSetuTransactions: No data or not array');
        return transactions;
    }

    console.log('parseSetuTransactions: Processing', setuData.length, 'accounts');

    for (const fiData of setuData) {
        const account = fiData.account || {};
        const txnsContainer = account.transactions || {};
        const txns = txnsContainer.transaction || [];

        console.log('parseSetuTransactions: Account has', txns.length, 'transactions');

        for (const txn of txns) {
            const isCredit = txn.type === 'CREDIT';

            transactions.push({
                type: isCredit ? 'INCOME' : 'EXPENSE',
                amount: Math.abs(parseFloat(txn.amount || 0)),
                description: txn.narration || txn.description || 'Bank Transaction',
                date: new Date(txn.transactionTimestamp || txn.valueDate || new Date()),
                category: categorizeTransaction(txn.narration || ''),
                status: 'COMPLETED',
                userId: userId,
                accountId: accountId,
            });
        }
    }

    console.log('parseSetuTransactions: Total parsed transactions:', transactions.length);
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

export { SETU_BASE_URL, setuFetch, SETU_SERVICE_URL };
