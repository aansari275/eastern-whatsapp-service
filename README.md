# Eastern CRM WhatsApp Service

Backend service for handling WhatsApp messaging in the Eastern Mills CRM production follow-up system.

## Overview

This service runs as a persistent Node.js application on Google Cloud Run, maintaining a WhatsApp Web session using `whatsapp-web.js`. It provides a REST API for sending messages and receives incoming messages via webhooks.

## Architecture

```
Frontend (React)
    ↓ HTTPS
WhatsApp Service (Express + whatsapp-web.js)
    ↓ RemoteAuth
Firebase Firestore (Session Storage)
    ↓ Webhook
Cloud Function (AI Reply Parser)
```

## Features

- **Persistent WhatsApp Session**: Uses RemoteAuth to store session in Firestore
- **Auto-Reconnect**: Automatically reconnects when disconnected
- **QR Code Generation**: Provides QR code for initial authentication
- **Message Routing**: Routes incoming messages to correct conversations
- **REST API**: Send messages and check connection status
- **Webhook Integration**: Forwards incoming messages to Cloud Function for AI analysis

## Environment Variables

See `.env.example` for required environment variables.

## Installation

```bash
npm install
```

## Development

```bash
# Start with auto-reload
npm run dev

# Start production
npm start
```

## API Endpoints

### `GET /api/status`
Check WhatsApp connection status

**Response:**
```json
{
  "connected": true,
  "sessionId": "eastern-mills-production",
  "phoneNumber": "+92300XXXXXXX"
}
```

### `GET /api/qr`
Get QR code for initial setup (only works when not connected)

**Response:**
```json
{
  "qrCode": "data:image/png;base64,..."
}
```

### `POST /api/send-message`
Send a WhatsApp message to staff

**Headers:**
```
Authorization: Bearer YOUR_API_SECRET_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "opsNumber": "OPS-123",
  "staffType": "kamala",
  "message": "Hi Kamala, checking on OPS-123...",
  "context": {
    "targetDate": "2025-01-15",
    "buyerCode": "ABC",
    "article": "RUG-001"
  }
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg_abc123",
  "conversationId": "ops123_kamala",
  "timestamp": "2025-10-22T10:30:00Z"
}
```

### `POST /webhook` (Internal)
Receives incoming WhatsApp messages - called by whatsapp-web.js client

## Docker Build

```bash
docker build -t whatsapp-service .
docker run -p 3001:3001 --env-file .env whatsapp-service
```

## Cloud Run Deployment

```bash
# Build and deploy
gcloud builds submit --config cloudbuild.yaml

# Or manually
gcloud run deploy whatsapp-service \
  --image gcr.io/eastern-crm-c57d9/whatsapp-service \
  --platform managed \
  --region us-central1 \
  --min-instances 1 \
  --max-instances 2 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300s \
  --allow-unauthenticated
```

## Troubleshooting

### QR Code not generating
- Make sure WhatsApp session is cleared
- Check Firestore permissions
- Restart the service

### Messages not sending
- Verify API_SECRET_KEY is correct
- Check staff phone numbers are in international format
- Ensure WhatsApp client is connected (check `/api/status`)

### Session disconnects frequently
- Increase Cloud Run memory to 2Gi
- Check Firestore write permissions
- Verify RemoteAuth is properly configured

## Security Notes

- Never commit `.env` file
- Rotate API_SECRET_KEY regularly
- Use Firestore security rules to protect session data
- Only allow authenticated requests from frontend

## Files

- `index.js` - Express server and API routes
- `whatsappClient.js` - WhatsApp Web client with RemoteAuth
- `messageRouter.js` - Routes incoming messages to conversations
- `remoteauth-config.js` - Firestore RemoteAuth strategy
- `Dockerfile` - Container configuration
- `package.json` - Dependencies

## Dependencies

- **express**: Web server
- **whatsapp-web.js**: WhatsApp Web API client
- **firebase-admin**: Firestore access for RemoteAuth
- **qrcode**: QR code generation for setup
- **cors**: Cross-origin requests from frontend
- **dotenv**: Environment variable management

## Support

For issues, check the main CRM repository at `/claude.md`
