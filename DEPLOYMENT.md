# WhatsApp Service - Cloud Run Deployment

## 🚀 Deployment Information

**Service Name:** `eastern-whatsapp-service`
**Platform:** Google Cloud Run
**Region:** us-central1
**Project:** eastern-crm-c57d9

**Service URL:** https://eastern-whatsapp-service-437560062869.us-central1.run.app

**Deployed:** 2025-10-22
**Latest Revision:** eastern-whatsapp-service-00002-xcb

---

## 📋 Configuration

### Instance Settings
- **Memory:** 2 GiB
- **CPU:** 2 vCPU
- **Timeout:** 3600 seconds (1 hour)
- **Min Instances:** 1 (always-on)
- **Max Instances:** 1
- **Concurrency:** 80 (default)

### Environment Variables
```bash
NODE_ENV=production
FRONTEND_URL=https://eastern-mills-crm.netlify.app
WHATSAPP_SESSION_ID=eastern-mills-production
FIREBASE_PROJECT_ID=eastern-crm-c57d9
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@eastern-crm-c57d9.iam.gserviceaccount.com
API_SECRET_KEY=a374c98341a45a7266ae5e085a7d7dcc1f8825874f76e95b30368db02259021e
FIREBASE_PRIVATE_KEY=[stored securely in Cloud Run]
```

---

## 🔗 API Endpoints

### Public Endpoints
- **Health Check:** `GET /health`
- **QR Code Page:** `GET /qr` (browser-friendly UI)

### Protected Endpoints (require `Authorization: Bearer <API_SECRET_KEY>`)
- **Get Status:** `GET /api/status`
- **Get QR Code:** `GET /api/qr`
- **Send Message:** `POST /api/send-message`
- **Disconnect:** `POST /api/disconnect`
- **Reconnect:** `POST /api/reconnect`

---

## 🔐 Authentication

All API endpoints (except `/health` and `/qr`) require authentication:

```bash
Authorization: Bearer a374c98341a45a7266ae5e085a7d7dcc1f8825874f76e95b30368db02259021e
```

**Example:**
```bash
curl -H "Authorization: Bearer a374c98341a45a7266ae5e085a7d7dcc1f8825874f76e95b30368db02259021e" \
  https://eastern-whatsapp-service-437560062869.us-central1.run.app/api/status
```

---

## 📱 WhatsApp Setup

### 1. Link WhatsApp Account
Visit the QR code page:
```
https://eastern-whatsapp-service-437560062869.us-central1.run.app/qr
```

### 2. Scan QR Code
1. Open WhatsApp on your phone
2. Go to **Settings → Linked Devices**
3. Tap **"Link a Device"**
4. Scan the QR code displayed on the page

### 3. Verify Connection
Check connection status:
```bash
curl -H "Authorization: Bearer a374c98341a45a7266ae5e085a7d7dcc1f8825874f76e95b30368db02259021e" \
  https://eastern-whatsapp-service-437560062869.us-central1.run.app/api/status
```

Response when connected:
```json
{
  "connected": true,
  "sessionId": "eastern-mills-production",
  "phoneNumber": "+919876543210",
  "hasQRCode": false
}
```

---

## 📤 Sending Messages

### API Request
```bash
POST /api/send-message
Authorization: Bearer a374c98341a45a7266ae5e085a7d7dcc1f8825874f76e95b30368db02259021e
Content-Type: application/json

{
  "opsNumber": "OPS123",
  "staffType": "merchants",
  "message": "Follow-up on order",
  "context": {
    "targetDate": "2025-10-25",
    "buyerCode": "ABC",
    "article": "RUG-001"
  }
}
```

### Staff Types
- `merchants` - Group of merchant contacts
- `kamala` - Kamala (individual)
- `rinku` - Rinku (individual)

---

## 🔄 Redeployment

To redeploy the service:

```bash
cd whatsapp-service

gcloud run deploy eastern-whatsapp-service \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 3600 \
  --min-instances 1 \
  --max-instances 1 \
  --set-env-vars "NODE_ENV=production,FRONTEND_URL=https://eastern-mills-crm.netlify.app,WHATSAPP_SESSION_ID=eastern-mills-production,FIREBASE_PROJECT_ID=eastern-crm-c57d9,FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@eastern-crm-c57d9.iam.gserviceaccount.com,API_SECRET_KEY=a374c98341a45a7266ae5e085a7d7dcc1f8825874f76e95b30368db02259021e,FIREBASE_PRIVATE_KEY=<full-key-here>" \
  --project eastern-crm-c57d9
```

---

## 📊 Monitoring

### View Logs
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=eastern-whatsapp-service" \
  --limit 50 \
  --project eastern-crm-c57d9 \
  --format="table(timestamp,textPayload)"
```

### View Service Details
```bash
gcloud run services describe eastern-whatsapp-service \
  --region us-central1 \
  --project eastern-crm-c57d9
```

### Cloud Console
- **Service Dashboard:** https://console.cloud.google.com/run/detail/us-central1/eastern-whatsapp-service
- **Logs:** https://console.cloud.google.com/logs
- **Metrics:** https://console.cloud.google.com/monitoring

---

## 💰 Costs

**Estimated Monthly Cost:**
- **Always-on instance (min 1):** ~$50-70/month
- **2 GB memory, 2 vCPU:** $0.00002400/second
- **Request charges:** Minimal (most time idle)

**Total:** ~$50-70/month for 24/7 availability

---

## 🔧 Troubleshooting

### WhatsApp Not Connecting
1. Check logs for errors
2. Verify QR code is generated: `GET /api/qr`
3. Re-scan QR code if expired
4. Check Firestore for session data

### Service Not Responding
1. Check service status: `gcloud run services list`
2. View recent logs for errors
3. Verify environment variables are set
4. Check Cloud Run metrics

### High Memory Usage
- Puppeteer/Chrome uses ~1-1.5GB base memory
- WhatsApp sessions add ~100-200MB
- Current 2GB allocation has ~500MB headroom

---

## 🛡️ Security Notes

- ✅ API endpoints protected with secret key
- ✅ CORS configured for Netlify frontend only
- ✅ Firebase credentials encrypted in Cloud Run
- ✅ Service runs in isolated container
- ⚠️ `/qr` endpoint is public (needed for scanning)
- ⚠️ Consider adding IP allowlist for production

---

## 📝 Next Steps

1. ✅ Service deployed and running
2. ⏳ Link WhatsApp by scanning QR code
3. ⏳ Update Netlify frontend with Cloud Run URL
4. ⏳ Test message sending from CRM
5. ⏳ Set up monitoring alerts
6. ⏳ Configure backup/restore for WhatsApp sessions

---

**Last Updated:** 2025-10-22
**Maintained By:** Eastern Mills Tech Team
