// Setu Microservice - Main Entry Point
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import handlers
import { createConsentHandler, getConsentStatusHandler, revokeConsentHandler } from './consent';
import { createDataSessionHandler, fetchDataHandler, pollDataHandler } from './data-session';
import { webhookHandler, webhookHealthHandler } from './webhook';

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// ===========================================
// CORS Configuration
// ===========================================
// Only allow requests from your Render backend and localhost for development
const allowedOrigins = [
    process.env.RENDER_BACKEND_URL,
    'http://localhost:3000',
    'http://localhost:3001',
].filter(Boolean) as string[];

console.log('[Server] Allowed CORS origins:', allowedOrigins);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (server-to-server, webhooks, curl)
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
            callback(null, true);
        } else {
            console.warn('[CORS] Blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// ===========================================
// Middleware
// ===========================================
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// ===========================================
// Health Check Routes
// ===========================================
app.get('/', (req: Request, res: Response) => {
    res.json({
        service: 'setu-service',
        status: 'running',
        version: '1.0.0',
        region: 'ap-south-1', // Mumbai
        environment: process.env.SETU_ENV || 'sandbox',
        timestamp: new Date().toISOString(),
    });
});

app.get('/health', (req: Request, res: Response) => {
    const config = {
        setuConfigured: !!(process.env.SETU_CLIENT_ID && process.env.SETU_CLIENT_SECRET && process.env.SETU_PRODUCT_ID),
        renderUrlConfigured: !!process.env.RENDER_BACKEND_URL,
        internalKeyConfigured: !!process.env.INTERNAL_API_KEY,
    };

    res.json({
        status: 'ok',
        region: 'ap-south-1',
        environment: process.env.SETU_ENV || 'sandbox',
        config,
        timestamp: new Date().toISOString(),
    });
});

// ===========================================
// Consent API Routes
// ===========================================
// Create a new consent request
app.post('/api/consent/create', createConsentHandler);

// Get consent status
app.get('/api/consent/:consentId', getConsentStatusHandler);

// Revoke consent
app.delete('/api/consent/:consentId', revokeConsentHandler);

// ===========================================
// Data Session API Routes
// ===========================================
// Create a data session
app.post('/api/session/create', createDataSessionHandler);

// Get session data (single fetch)
app.get('/api/session/:sessionId', fetchDataHandler);

// Poll session data until ready (with retries)
app.get('/api/session/:sessionId/poll', pollDataHandler);

// ===========================================
// Webhook Routes (Called by Setu)
// ===========================================
app.post('/api/webhook', webhookHandler);
app.get('/api/webhook', webhookHealthHandler);

// ===========================================
// Error Handling
// ===========================================
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('[Error]', err.message);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message,
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path,
    });
});

// ===========================================
// Start Server
// ===========================================
app.listen(PORT, () => {
    console.log('===========================================');
    console.log(`  Setu Service v1.0.0`);
    console.log(`  Port: ${PORT}`);
    console.log(`  Environment: ${process.env.SETU_ENV || 'sandbox'}`);
    console.log(`  Region: ap-south-1 (Mumbai)`);
    console.log('===========================================');
    console.log('');
    console.log('API Endpoints:');
    console.log('  POST /api/consent/create    - Create consent');
    console.log('  GET  /api/consent/:id       - Get consent status');
    console.log('  DELETE /api/consent/:id     - Revoke consent');
    console.log('  POST /api/session/create    - Create data session');
    console.log('  GET  /api/session/:id       - Fetch session data');
    console.log('  GET  /api/session/:id/poll  - Poll until data ready');
    console.log('  POST /api/webhook           - Setu webhook receiver');
    console.log('');
    console.log('Health:');
    console.log('  GET  /                      - Service info');
    console.log('  GET  /health                - Health check');
    console.log('===========================================');
});

export default app;
