#!/bin/bash
# Set Railway environment variables for WhatsApp Service

echo "🚂 Setting Railway environment variables..."

# Load local .env file
set -a
source .env
set +a

# Set variables in Railway
railway variables set FIREBASE_PROJECT_ID="$FIREBASE_PROJECT_ID"
railway variables set FIREBASE_CLIENT_EMAIL="$FIREBASE_CLIENT_EMAIL"
railway variables set FIREBASE_PRIVATE_KEY="$FIREBASE_PRIVATE_KEY"
railway variables set WHATSAPP_SESSION_ID="eastern-mills-production"
railway variables set FRONTEND_URL="https://eastern-mills-crm.netlify.app"
railway variables set NODE_ENV="production"
railway variables set WEBHOOK_URL="https://us-central1-eastern-crm-c57d9.cloudfunctions.net/parseWhatsAppReply"

# Generate and set API secret
API_SECRET=$(openssl rand -hex 32)
railway variables set API_SECRET_KEY="$API_SECRET"

echo "✅ Variables set successfully!"
echo ""
echo "🔑 Generated API Secret Key:"
echo "$API_SECRET"
echo ""
echo "Save this API key - you'll need it to authenticate frontend requests."
echo ""
echo "🚀 Deploying to Railway..."
railway up
