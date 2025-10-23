# Railway Environment Variables Setup

## Required Variables

Set these in your Railway project settings:

### 1. FIREBASE_PROJECT_ID
```
eastern-crm-c57d9
```

### 2. FIREBASE_CLIENT_EMAIL
```
firebase-adminsdk-fbsvc@eastern-crm-c57d9.iam.gserviceaccount.com
```

### 3. FIREBASE_PRIVATE_KEY
**IMPORTANT:** Copy the ENTIRE private key including quotes and newline characters.

```
"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDU6B2VVhrFeMn/\nO833xWhXi0u6u/8rvtZciAPy7esfe7/H8uCAiTUEgkzJ+dvHhtgocCXhpV2lZWQL\nhMI6q8nNJ+BYwP90rRy9N5juYCmUWoeGMkOg4gL49vqqCPuAKrO7a0fDGy5nP6TZ\naXS0i5RcT9KnHAucziasdsUrZ3zPpdBSV/xNPIBLLQQpRg52+jaAmUvV8R2rdT+i\ng/Sr04hO8l3z8gcK7ILNygvONzbA+TKZSW4lhbqamTVIAVSONo9v5C1Br+5za983\nVLUwxagLeR9iDPfOW+cf1N5WT0mSkpC6DQI7pX1h+XMzweA0G2W2EDL+xj7Sce1Y\n0gYFpJwTAgMBAAECggEABiNpEvCoFfBtFnxBbHbXEssT1F7uNPMsF//d6Uedw0sc\nlOW2Pk52ZlphX2NiSEblfYj6Np6/a/DX6RMbTHi+eTlAmR57XwBMt1HeiWThXgMc\nLCzP0Vgi0M3CHVvj8GaKxwkJSSFD/bsShCgrsrbhgKXWg3XmCc/RwqAsABvcN9pZ\nCB1X6rdr3w7KnNd2bkhMEsQlE4C69G/kjA2WY2GpLAUK0BMN3v9lYIYqOPhIN0dD\na6oATefUtKN6D1PAETxe1rPLj5kPrw3g6BpVEH6MxyVJDlFSssNXMxH6FnhzGD+/\nfwsd70zYDx+PY0/yNvPNHmehkXDwGhHohvq1wBOlDQKBgQDsxnnPDdyWcSQlFaPV\nNKo85HqvAiF9qYQGWh63rR7/nq8s0gjj/EGbOz9XZYG0zCelAC3ZVaqmxscLf2tu\nIEojjuQ6yKwhD5cfY44QVmBMQWgrLsLtjkJ+RQKd8RHnZsnABUTdNxinGdbyU3sf\nGJqP/1RQEwuHd0MIFKepNFb3HQKBgQDmMYQTFzmgfTR5gyDMS6FJMvQGFGVo+k7Y\nsFzHQx5onymKRCOJ4kKHqNLRP8qvm1VJMAydStu9ZEqml6IbrVbV0Zqi0lndf0Io\nw2rlxjFuQbEAuAOEg7OHjejJ2ktUZHBPWIA0aBgioeC5QV/QxQ+x2ZZtpfQWq1JP\n10VLB7cI7wKBgQCLfCEmKTRaLCzu6+CoKW5gkPj1QHwaW1K7qzuNWR951zG7ZcB3\nDpRXrn+SLOpMaDiyq3hXIHB374Iy882GAt+qMvOg7bb5gwW0KCH43em9AosrZVDQ\nQY5KdL0l7m5ts9AGnxQCfgK37jECcMuHdicXzYMN6SpRk6CZkhFzTLIuwQKBgDHO\nXOlUiR90d7oi6SHK62bPI4V9PEPuhMjVv/1NRHMWnQJRo+7dic+Yc6TazJwaW+Wu\nA8y0ub7MyGorPOQIKVWyOGcqZE9MjaAMSEDXFTLp+8ZQClLNvDaEOe4S0WG9KZ/B\nYlv0eeRkah8rSfP971tn3Oh0k8+j2fd0eIW3cZ75AoGAYkD1YvSWqh3xGJR23pcK\nYPUkdXE9fiL2HcBbDU1CCpdFAsVTyXnzE1BG0HwfcIjF5fhAecjqCC/SPeh4zylf\nmr05Xib594Z3SI/2LKKpD++RgJUfI924KQJebmMK8iqSrv5Z68+hZNH5KbjJjzis\nLHonXxxeQc0p0chYfNVsn2Q=\n-----END PRIVATE KEY-----\n"
```

### 4. WHATSAPP_SESSION_ID
```
eastern-mills-production
```

### 5. FRONTEND_URL
```
https://eastern-mills-crm.netlify.app
```

### 6. NODE_ENV
```
production
```

### 7. WEBHOOK_URL
```
https://us-central1-eastern-crm-c57d9.cloudfunctions.net/parseWhatsAppReply
```

### 8. PORT (Optional - Railway sets this automatically)
```
3001
```

### 9. API_SECRET_KEY
Generate a secure random key:
```bash
openssl rand -hex 32
```

Example:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

---

## How to Set Variables in Railway

### Method 1: Railway Dashboard (Recommended)
1. Go to https://railway.app
2. Select your project
3. Click on your service (whatsapp-service)
4. Go to "Variables" tab
5. Click "New Variable"
6. Add each variable one by one
7. Click "Deploy" to restart with new variables

### Method 2: Railway CLI
```bash
railway variables set FIREBASE_PROJECT_ID=eastern-crm-c57d9
railway variables set FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@eastern-crm-c57d9.iam.gserviceaccount.com
railway variables set FIREBASE_PRIVATE_KEY='"-----BEGIN PRIVATE KEY-----\nMII...(full key)...-----END PRIVATE KEY-----\n"'
railway variables set WHATSAPP_SESSION_ID=eastern-mills-production
railway variables set FRONTEND_URL=https://eastern-mills-crm.netlify.app
railway variables set NODE_ENV=production
railway variables set WEBHOOK_URL=https://us-central1-eastern-crm-c57d9.cloudfunctions.net/parseWhatsAppReply
railway variables set API_SECRET_KEY=$(openssl rand -hex 32)
```

### Method 3: Environment File Upload
1. Create `.env.railway` file with all variables
2. In Railway dashboard, click "Variables"
3. Click "Import from .env"
4. Upload the file

---

## Verification

After setting variables, check the deployment logs:
```bash
railway logs
```

You should see:
```
[WhatsApp] Initializing client with RemoteAuth...
[RemoteAuth] Session loaded from Firestore: eastern-mills-production
✓ WhatsApp client is ready
```

## Troubleshooting

### Private Key Format Issues
If you see the same error after setting variables, the private key format might be wrong.

**Option 1: Use Raw Format (Remove Quotes)**
Instead of:
```
"-----BEGIN PRIVATE KEY-----\n..."
```

Try:
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDU6B2VV...
(paste rest of key without \n, each line as-is)
...
-----END PRIVATE KEY-----
```

**Option 2: Escape Properly**
Make sure the `\n` are actual backslash-n, not real newlines.

### Check Variables Are Set
In Railway logs, you should see Firebase connecting. If not, verify:
```bash
railway run printenv | grep FIREBASE
```

### Still Not Working?
1. Check Railway deployment logs for the exact error
2. Verify Firebase project ID matches: `eastern-crm-c57d9`
3. Test connection locally first: `npm run dev`
4. Check Firebase Console > Project Settings > Service Accounts

---

## Security Note

⚠️ **Never commit `.env` files to git!**

The `.env` file is already in `.gitignore` but double-check:
```bash
git status
```

If `.env` appears, remove it:
```bash
git rm --cached whatsapp-service/.env
git commit -m "Remove .env from tracking"
```
