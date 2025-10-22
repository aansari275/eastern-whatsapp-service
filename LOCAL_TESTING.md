# Local Testing Guide - WhatsApp Service

Quick guide to test the WhatsApp integration on your local machine.

## Prerequisites

- Node.js 20+ installed
- Chrome/Chromium browser installed (for Puppeteer)
- Firebase Admin credentials
- Your WhatsApp phone ready for QR code scanning

## Step 1: Install Dependencies

```bash
cd whatsapp-service
npm install
```

This will install:
- express
- whatsapp-web.js
- firebase-admin
- qrcode
- And other dependencies

## Step 2: Create .env File

Create a `.env` file in the `whatsapp-service/` directory:

```bash
# Copy from example
cp .env.example .env

# Edit the file
nano .env  # or use your preferred editor
```

**Required values:**

```env
PORT=3001
API_SECRET_KEY=test-secret-key-123

# Firebase - Get from Firebase Console > Project Settings > Service Accounts
FIREBASE_PROJECT_ID=eastern-crm-c57d9
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@eastern-crm-c57d9.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
Your private key here (keep the quotes and \n characters)
-----END PRIVATE KEY-----"

WHATSAPP_SESSION_ID=eastern-mills-local-test
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# Leave webhook URL empty for now (we'll add AI later)
WEBHOOK_URL=
```

### Getting Firebase Credentials

**Option 1: Use existing credentials file**

If you have a service account JSON file:

```bash
# The credentials are in your project at:
# credentials/eastern-crm-c57d9-firebase-adminsdk-xxxxx.json

# Extract the values:
cat ../credentials/eastern-crm-c57d9-firebase-adminsdk-*.json | jq -r '.project_id'
cat ../credentials/eastern-crm-c57d9-firebase-adminsdk-*.json | jq -r '.client_email'
cat ../credentials/eastern-crm-c57d9-firebase-adminsdk-*.json | jq -r '.private_key'
```

**Option 2: Download new credentials**

1. Go to [Firebase Console](https://console.firebase.google.com/project/eastern-crm-c57d9)
2. Settings (⚙️) → Project Settings → Service Accounts
3. Click "Generate new private key"
4. Download the JSON file
5. Extract the values and paste into `.env`

## Step 3: Update Staff Phone Numbers

Edit `whatsappClient.js` and update the phone numbers:

```javascript
const STAFF_CONTACTS = {
  merchants: {
    name: 'Merchants Team',
    phone: '+923001234567' // Update with real number
  },
  kamala: {
    name: 'Kamala',
    phone: '+923007654321' // Update with real number
  },
  rinku: {
    name: 'Rinku',
    phone: '+923009876543' // Update with real number
  }
};
```

Also update `messageRouter.js`:

```javascript
const STAFF_PHONE_MAP = {
  '+923001234567': { type: 'merchants', name: 'Merchants Team' },
  '+923007654321': { type: 'kamala', name: 'Kamala' },
  '+923009876543': { type: 'rinku', name: 'Rinku' }
};
```

## Step 4: Start the Service

```bash
npm start
```

You should see:

```
============================================================
Starting Eastern CRM WhatsApp Service
============================================================
Initializing WhatsApp client...
[WhatsApp] Initializing client with RemoteAuth...
[WhatsApp] Loading...
Express server started
✓ Listening on port 3001
============================================================
WhatsApp Service is ready!
============================================================
```

**First time?** You'll see:

```
[WhatsApp] QR Code received
```

## Step 5: Authenticate with QR Code

**Open another terminal:**

```bash
# Test health endpoint
curl http://localhost:3001/health

# Get QR code (returns base64 image)
curl -H "Authorization: Bearer test-secret-key-123" \
  http://localhost:3001/api/qr
```

**Or use your browser:**

1. Open: http://localhost:3001/api/qr
2. Add header: `Authorization: Bearer test-secret-key-123`
3. You'll see JSON with `qrCode` field (base64 data URL)

**Scan the QR code:**

1. Copy the base64 string (starts with `data:image/png;base64,`)
2. Paste into browser address bar
3. QR code image will display
4. Open WhatsApp on YOUR phone (the boss's phone)
5. Go to Settings → Linked Devices → Link a Device
6. Scan the QR code

**Wait 2-3 minutes** for the session to save to Firestore.

You should see:

```
[WhatsApp] Authenticated successfully
[RemoteAuth] Session saved to Firestore: eastern-mills-local-test
✓ WhatsApp client is ready
✓ Connected as: +92300XXXXXXX
```

## Step 6: Test Sending a Message

**Create a test file: `test-send.sh`**

```bash
#!/bin/bash

curl -X POST http://localhost:3001/api/send-message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-secret-key-123" \
  -d '{
    "opsNumber": "OPS-TEST-001",
    "staffType": "kamala",
    "message": "Hi Kamala, this is a test message from the WhatsApp service. Please ignore!",
    "context": {
      "targetDate": "2025-01-15",
      "buyerCode": "TEST",
      "article": "TEST-RUG-001"
    }
  }'
```

**Run it:**

```bash
chmod +x test-send.sh
./test-send.sh
```

**Expected response:**

```json
{
  "success": true,
  "messageId": "abc-123-...",
  "conversationId": "ops-test-001_kamala",
  "timestamp": "2025-10-22T10:30:00.000Z"
}
```

**Check Kamala's phone** - she should receive the WhatsApp message!

## Step 7: Test Receiving a Reply

**Have Kamala reply on WhatsApp:**

```
Material arrived. On track for 15-Jan.
```

**Check the logs:**

```
[WhatsApp] Message received from 923007654321@c.us: Material arrived. On track for 15-Jan.
[Router] Routing message from Kamala: "Material arrived. On track for 15-Jan."
[Router] Message saved to conversation: ops-test-001_kamala
```

**Check Firestore:**

1. Open [Firebase Console](https://console.firebase.google.com/project/eastern-crm-c57d9)
2. Go to Firestore Database
3. Look for collection: `whatsappConversations`
4. Find document: `ops-test-001_kamala`
5. You should see the message in the `messages` array

## Step 8: Check Connection Status

```bash
curl -H "Authorization: Bearer test-secret-key-123" \
  http://localhost:3001/api/status
```

**Response:**

```json
{
  "connected": true,
  "sessionId": "eastern-mills-local-test",
  "phoneNumber": "+92300XXXXXXX",
  "hasQRCode": false
}
```

## Troubleshooting

### Port already in use
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or use different port
PORT=3002 npm start
```

### Chrome/Chromium not found
```bash
# Install Chrome (macOS)
brew install --cask google-chrome

# Or set custom path
export PUPPETEER_EXECUTABLE_PATH=/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome
```

### Firebase permission denied
- Make sure the service account has Firestore read/write permissions
- Check that FIREBASE_PRIVATE_KEY includes the newlines (`\n`)
- Verify the private key is wrapped in quotes in .env

### QR code not showing
- Clear Firestore session: Delete document in `whatsappSessions/eastern-mills-local-test`
- Restart the service
- QR code should appear again

### Messages not sending
- Verify phone numbers are in international format (+92...)
- Check that API_SECRET_KEY matches in your request
- Look at service logs for errors

### Session disconnects
- This is normal - WhatsApp Web sessions can disconnect
- The service will auto-reconnect
- Check logs for reconnection attempts

## Next Steps

Once local testing works:

1. ✅ **Backend working** - Messages send and receive
2. 🔄 **Test with frontend** - Update React app to use local API
3. 🚀 **Deploy to Cloud Run** - When ready for production

## Frontend Testing (Optional)

Update your local `.env` in the main project:

```bash
# In the root project directory (not whatsapp-service)
echo "VITE_WHATSAPP_API_URL=http://localhost:3001" >> .env
echo "VITE_WHATSAPP_API_SECRET=test-secret-key-123" >> .env
```

Start your frontend:

```bash
npm run dev
```

Now the React app will connect to your local WhatsApp service!

## Logs to Watch

**Good signs:**
- ✅ `WhatsApp client initialized`
- ✅ `Session saved to Firestore`
- ✅ `Message sent to [Staff] for [OPS]`
- ✅ `Message received from [Phone]`

**Warning signs:**
- ⚠️ `Disconnected: ...` (will auto-reconnect)
- ⚠️ `No active conversation found` (expected if no recent messages)

**Error signs:**
- ❌ `Authentication failure`
- ❌ `Failed to send message`
- ❌ `Error loading session`

## Clean Up

To stop the service:

```bash
# Press Ctrl+C in the terminal

# Or kill the process
pkill -f "node index.js"
```

To clear the session (forces new QR scan):

```bash
# Delete from Firestore
# Go to Firebase Console → Firestore → whatsappSessions → Delete eastern-mills-local-test
```

---

**Ready for production?** See `WHATSAPP_INTEGRATION.md` for deployment steps.
