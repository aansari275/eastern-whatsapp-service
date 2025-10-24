/**
 * Eastern CRM WhatsApp Service
 *
 * Express server that provides REST API for WhatsApp messaging
 * and handles incoming messages via webhooks.
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const whatsappClient = require('./whatsappClient');
const messageRouter = require('./messageRouter');

const app = express();
const PORT = process.env.PORT || 3001;
const API_SECRET_KEY = process.env.API_SECRET_KEY;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Authentication middleware for protected routes
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  if (token !== API_SECRET_KEY) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
};

// ============================================================================
// API Routes
// ============================================================================

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'eastern-crm-whatsapp',
    timestamp: new Date().toISOString()
  });
});

/**
 * QR Code Page - Serve HTML page for scanning
 */
app.get('/qr', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>WhatsApp QR Code - Eastern CRM</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
            color: white;
        }
        .container {
            text-align: center;
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 500px;
        }
        h1 {
            color: #128C7E;
            margin-bottom: 10px;
            font-size: 28px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 16px;
        }
        #qrcode {
            background: white;
            padding: 20px;
            border-radius: 10px;
            display: inline-block;
            margin: 20px 0;
        }
        .instructions {
            color: #444;
            text-align: left;
            margin: 20px 0;
            line-height: 1.8;
        }
        .instructions ol {
            padding-left: 20px;
        }
        .instructions li {
            margin: 10px 0;
        }
        .status {
            margin-top: 20px;
            padding: 15px;
            background: #f0f0f0;
            border-radius: 8px;
            color: #333;
            font-size: 14px;
        }
        .refresh-btn {
            margin-top: 20px;
            padding: 12px 30px;
            background: #25D366;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.3s;
        }
        .refresh-btn:hover {
            background: #128C7E;
        }
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #25D366;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 Link WhatsApp to Eastern CRM</h1>
        <p class="subtitle">Scan this QR code with your WhatsApp</p>

        <div id="qrcode">
            <div class="spinner"></div>
            <p>Loading QR code...</p>
        </div>

        <div class="instructions">
            <strong>How to scan:</strong>
            <ol>
                <li>Open <strong>WhatsApp</strong> on your phone</li>
                <li>Go to <strong>Settings → Linked Devices</strong></li>
                <li>Tap <strong>"Link a Device"</strong></li>
                <li>Point your camera at this QR code</li>
            </ol>
        </div>

        <div class="status">
            <strong>Status:</strong> <span id="status">Waiting for scan...</span>
        </div>

        <button class="refresh-btn" onclick="loadQR()">Refresh QR Code</button>
    </div>

    <script>
        async function loadQR() {
            const qrDiv = document.getElementById('qrcode');
            const statusSpan = document.getElementById('status');

            try {
                qrDiv.innerHTML = '<div class="spinner"></div><p>Loading...</p>';
                statusSpan.textContent = 'Fetching QR code...';

                const response = await fetch('/api/qr', {
                    headers: {
                        'Authorization': 'Bearer ${API_SECRET_KEY}'
                    }
                });

                const data = await response.json();

                if (data.qrCode) {
                    qrDiv.innerHTML = \`<img src="\${data.qrCode}" alt="WhatsApp QR Code" style="width: 300px; height: 300px;">\`;
                    statusSpan.textContent = 'QR code ready - scan now!';
                } else if (data.error) {
                    qrDiv.innerHTML = '<p style="color: red;">❌ ' + data.message + '</p>';
                    statusSpan.textContent = 'Error: ' + data.error;
                } else {
                    throw new Error('No QR code in response');
                }
            } catch (error) {
                qrDiv.innerHTML = '<p style="color: red;">❌ Failed to load QR code</p>';
                statusSpan.textContent = 'Error: ' + error.message;
                console.error('Error:', error);
            }
        }

        // Auto-refresh QR code every 30 seconds
        loadQR();
        setInterval(loadQR, 30000);

        // Check connection status every 5 seconds
        async function checkStatus() {
            try {
                const response = await fetch('/api/status', {
                    headers: {
                        'Authorization': 'Bearer ${API_SECRET_KEY}'
                    }
                });
                const data = await response.json();

                if (data.connected) {
                    document.getElementById('status').innerHTML =
                        '✅ <strong>Connected!</strong> Phone: ' + data.phoneNumber;
                    document.getElementById('qrcode').innerHTML =
                        '<div style="color: #25D366; font-size: 48px;">✅</div><p style="color: #128C7E;">Successfully linked!</p>';
                }
            } catch (error) {
                console.error('Status check failed:', error);
            }
        }

        setInterval(checkStatus, 5000);
    </script>
</body>
</html>
  `);
});

/**
 * Get WhatsApp connection status
 */
app.get('/api/status', authenticate, async (req, res) => {
  try {
    const status = await whatsappClient.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting status:', error);
    res.status(500).json({ error: 'Failed to get status', details: error.message });
  }
});

/**
 * Get QR code for initial WhatsApp authentication
 * Only works when not connected
 */
app.get('/api/qr', authenticate, async (req, res) => {
  try {
    const qrCode = await whatsappClient.getQRCode();

    if (!qrCode) {
      return res.status(400).json({
        error: 'QR code not available',
        message: 'Client is already authenticated or not ready'
      });
    }

    res.json({ qrCode });
  } catch (error) {
    console.error('Error getting QR code:', error);
    res.status(500).json({ error: 'Failed to get QR code', details: error.message });
  }
});

/**
 * Send a WhatsApp message to staff
 *
 * Request body:
 * {
 *   opsNumber: string,
 *   staffType: 'merchants' | 'kamala' | 'rinku',
 *   message: string,
 *   context: {
 *     targetDate: string,
 *     buyerCode: string,
 *     article: string
 *   }
 * }
 */
app.post('/api/send-message', authenticate, async (req, res) => {
  try {
    const { opsNumber, staffType, message, context } = req.body;

    // Validation
    if (!opsNumber || !staffType || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['opsNumber', 'staffType', 'message']
      });
    }

    if (!['merchants', 'kamala', 'rinku'].includes(staffType)) {
      return res.status(400).json({
        error: 'Invalid staffType',
        validValues: ['merchants', 'kamala', 'rinku']
      });
    }

    // Send message via WhatsApp client
    const result = await whatsappClient.sendMessage({
      opsNumber,
      staffType,
      message,
      context: context || {}
    });

    res.json(result);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message', details: error.message });
  }
});

/**
 * Webhook endpoint for incoming WhatsApp messages
 * This is called by the WhatsApp client when a message is received
 */
app.post('/webhook/incoming-message', async (req, res) => {
  try {
    const { from, message, timestamp } = req.body;

    console.log(`[Webhook] Incoming message from ${from}:`, message);

    // Route the message to the appropriate conversation
    await messageRouter.routeIncomingMessage({
      from,
      message,
      timestamp
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error handling incoming message:', error);
    res.status(500).json({ error: 'Failed to process message', details: error.message });
  }
});

/**
 * Manual disconnect (for testing/maintenance)
 */
app.post('/api/disconnect', authenticate, async (req, res) => {
  try {
    await whatsappClient.disconnect();
    res.json({ success: true, message: 'WhatsApp client disconnected' });
  } catch (error) {
    console.error('Error disconnecting:', error);
    res.status(500).json({ error: 'Failed to disconnect', details: error.message });
  }
});

/**
 * Manual reconnect (for testing/maintenance)
 */
app.post('/api/reconnect', authenticate, async (req, res) => {
  try {
    await whatsappClient.reconnect();
    res.json({ success: true, message: 'WhatsApp client reconnecting...' });
  } catch (error) {
    console.error('Error reconnecting:', error);
    res.status(500).json({ error: 'Failed to reconnect', details: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ============================================================================
// Server Startup
// ============================================================================

async function startServer() {
  try {
    console.log('='.repeat(60));
    console.log('Starting Eastern CRM WhatsApp Service');
    console.log('='.repeat(60));

    // Start Express server FIRST so Cloud Run health check passes
    app.listen(PORT, '0.0.0.0', () => {
      console.log('✓ Express server started');
      console.log(`✓ Listening on port ${PORT}`);
      console.log('='.repeat(60));
    });

    // Initialize WhatsApp client in background (after server is listening)
    console.log('Initializing WhatsApp client in background...');
    whatsappClient.initialize()
      .then(() => {
        console.log('✓ WhatsApp client initialized');
        console.log('='.repeat(60));
        console.log('WhatsApp Service is fully ready!');
        console.log('='.repeat(60));
      })
      .catch((error) => {
        console.error('Failed to initialize WhatsApp client:', error);
        console.error('Server will continue running, but WhatsApp features may not work');
      });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await whatsappClient.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await whatsappClient.disconnect();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
