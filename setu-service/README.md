# Setu Microservice

This is a separate microservice that handles all Setu Account Aggregator API interactions. It's designed to be deployed on **AWS EC2 in the Mumbai (ap-south-1) region** to comply with RBI data localization requirements.

## Why a Separate Service?

1. **Geographic Compliance**: Setu/RBI requires financial data processing from Indian data centers
2. **Security Isolation**: Setu credentials never touch the main app on Render
3. **403 Forbidden Fix**: Render deploys to US regions, causing Setu to block requests

## Architecture

```
User → Render App → AWS Setu Service → Setu API → OneMoney AA → Bank
```

## Local Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your Setu credentials

# Run in development mode
npm run dev
```

## Build for Production

```bash
npm run build
npm start
```

## Docker Deployment

```bash
# Build image
docker build -t setu-service .

# Run container
docker run -d \
  --name setu-service \
  -p 3001:3001 \
  -e SETU_CLIENT_ID=xxx \
  -e SETU_CLIENT_SECRET=xxx \
  -e SETU_PRODUCT_ID=xxx \
  -e SETU_ENV=sandbox \
  -e RENDER_BACKEND_URL=https://wealnex.onrender.com \
  -e INTERNAL_API_KEY=xxx \
  setu-service
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/consent/create` | Create consent request |
| GET | `/api/consent/:id` | Get consent status |
| DELETE | `/api/consent/:id` | Revoke consent |
| POST | `/api/session/create` | Create data session |
| GET | `/api/session/:id` | Fetch session data |
| GET | `/api/session/:id/poll` | Poll until data ready |
| POST | `/api/webhook` | Receive Setu webhooks |
| GET | `/health` | Health check |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SETU_CLIENT_ID` | Setu client ID |
| `SETU_CLIENT_SECRET` | Setu client secret |
| `SETU_PRODUCT_ID` | Setu product instance ID |
| `SETU_ENV` | `sandbox` or `production` |
| `RENDER_BACKEND_URL` | URL of your Render backend |
| `INTERNAL_API_KEY` | Secret key for Render ↔ AWS communication |
| `PORT` | Server port (default: 3001) |

## AWS EC2 Deployment Steps

1. Launch EC2 in **ap-south-1** (Mumbai)
2. Install Node.js 20+
3. Clone this folder to EC2
4. Set environment variables
5. Install PM2: `npm install -g pm2`
6. Start service: `pm2 start dist/index.js --name setu-service`
7. Setup Nginx reverse proxy with SSL

See `implementation_plan.md` for detailed deployment instructions.
