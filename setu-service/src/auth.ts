// Setu API Authentication and HTTP Client
import fetch from 'node-fetch';

// Setu API Base URLs
const SETU_SANDBOX_URL = 'https://fiu-sandbox.setu.co';
const SETU_PRODUCTION_URL = 'https://fiu.setu.co';

// Get configuration from environment
const getSetuConfig = () => {
    const clientId = process.env.SETU_CLIENT_ID;
    const clientSecret = process.env.SETU_CLIENT_SECRET;
    const productId = process.env.SETU_PRODUCT_ID;
    const environment = process.env.SETU_ENV || 'sandbox';

    if (!clientId || !clientSecret || !productId) {
        throw new Error('Missing Setu credentials in environment variables');
    }

    return {
        clientId,
        clientSecret,
        productId,
        baseUrl: environment === 'production' ? SETU_PRODUCTION_URL : SETU_SANDBOX_URL,
        environment,
    };
};

// Make authenticated requests to Setu API
export async function setuFetch(endpoint: string, options: any = {}): Promise<any> {
    const config = getSetuConfig();
    const url = `${config.baseUrl}${endpoint}`;

    // Log request details (mask sensitive data)
    console.log('[Setu Request]', {
        url,
        method: options.method || 'GET',
        clientId: `${config.clientId.substring(0, 8)}...`,
        environment: config.environment,
    });

    const headers = {
        'Content-Type': 'application/json',
        'x-client-id': config.clientId,
        'x-client-secret': config.clientSecret,
        'x-product-instance-id': config.productId,
        ...options.headers,
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        const responseText = await response.text();
        console.log('[Setu Response]', {
            status: response.status,
            statusText: response.statusText,
            bodyPreview: responseText.substring(0, 200),
        });

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            throw new Error(`Setu API returned non-JSON response: ${responseText.substring(0, 200)}`);
        }

        if (!response.ok) {
            console.error('[Setu API Error]', data);
            const errorMessage = data.errorMsg || data.message || data.error || JSON.stringify(data);
            throw new Error(errorMessage);
        }

        return data;
    } catch (error: any) {
        console.error('[Setu Fetch Error]', error.message);
        throw error;
    }
}

export { getSetuConfig, SETU_SANDBOX_URL, SETU_PRODUCTION_URL };
