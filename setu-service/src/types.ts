// Setu Service Type Definitions

export interface SetuConfig {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    productId: string;
    environment: 'sandbox' | 'production';
}

export interface ConsentRequest {
    mobileNumber: string;
    redirectUrl: string;
}

export interface ConsentResponse {
    success: boolean;
    consentId: string;
    redirectUrl: string;
    status: string;
}

export interface ConsentStatusResponse {
    id: string;
    status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'REVOKED' | 'EXPIRED';
    accounts: LinkedAccount[];
    detail: ConsentDetail;
    fiDataRange: DataRange;
}

export interface LinkedAccount {
    maskedAccNumber: string;
    accType: 'SAVINGS' | 'CURRENT';
    fipId: string;
    linkRefNumber?: string;
}

export interface ConsentDetail {
    consentStart?: string;
    consentExpiry?: string;
    dataRange?: DataRange;
}

export interface DataRange {
    from: string;
    to: string;
}

export interface DataSessionRequest {
    consentId: string;
    fiDataRange: DataRange;
}

export interface DataSessionResponse {
    sessionId: string;
    status: string;
}

export interface FetchDataResponse {
    status: 'PENDING' | 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'EXPIRED';
    data: AccountData[];
    fips: FipData[];
}

export interface AccountData {
    fipId: string;
    account: any;
    maskedAccNumber: string;
    linkRefNumber: string;
}

export interface FipData {
    fipID: string;
    accounts: FipAccount[];
}

export interface FipAccount {
    data: {
        account: any;
    };
    FIstatus: 'READY' | 'PENDING' | 'FAILED';
    maskedAccNumber: string;
    linkRefNumber: string;
}

export interface WebhookPayload {
    type: WebhookType;
    consentId?: string;
    data?: {
        consentId?: string;
        sessionId?: string;
    };
}

export type WebhookType =
    | 'CONSENT_APPROVED'
    | 'CONSENT_ACTIVE'
    | 'CONSENT_REJECTED'
    | 'CONSENT_REVOKED'
    | 'CONSENT_EXPIRED'
    | 'FI_READY'
    | 'SESSION_COMPLETED'
    | 'SESSION_FAILED';

export interface InternalWebhookPayload {
    type: WebhookType;
    consentId: string;
    data?: any;
}
