/**
 * WhatsApp Client with RemoteAuth
 *
 * Manages the WhatsApp Web connection using whatsapp-web.js with
 * Firestore-based session storage (RemoteAuth).
 */

const { Client, RemoteAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const { FirestoreStore, db, admin } = require('./remoteauth-config');
const { v4: uuidv4 } = require('uuid');

const SESSION_ID = process.env.WHATSAPP_SESSION_ID || 'eastern-mills-production';
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// Staff contacts configuration
const STAFF_CONTACTS = {
  merchants: {
    name: 'Merchants Team',
    phone: '+923001234567' // TODO: Update with actual number
  },
  kamala: {
    name: 'Kamala (Test - Your Phone)',
    phone: '+918756266111' // TESTING: Your phone number
  },
  rinku: {
    name: 'Rinku',
    phone: '+923009876543' // TODO: Update with actual number
  }
};

class WhatsAppClientManager {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.qrCode = null;
    this.phoneNumber = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Initialize the WhatsApp client
   */
  async initialize() {
    console.log('[WhatsApp] Initializing client with RemoteAuth...');

    // Create Firestore store
    const store = new FirestoreStore({
      sessionId: SESSION_ID,
      collection: 'whatsappSessions'
    });

    // Initialize WhatsApp client with RemoteAuth
    this.client = new Client({
      authStrategy: new RemoteAuth({
        clientId: SESSION_ID,
        store: store,
        backupSyncIntervalMs: 300000 // Backup every 5 minutes
      }),
      puppeteer: {
        headless: 'new',
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions',
          '--disable-background-networking',
          '--disable-default-apps',
          '--disable-sync',
          '--metrics-recording-only',
          '--mute-audio',
          '--no-default-browser-check',
          '--hide-scrollbars'
        ],
        timeout: 90000 // Increase timeout to 90 seconds
      }
    });

    this.attachEventHandlers();

    // Start the client
    await this.client.initialize();
  }

  /**
   * Attach event handlers to the WhatsApp client
   */
  attachEventHandlers() {
    // QR Code received (for initial authentication)
    this.client.on('qr', async (qr) => {
      console.log('[WhatsApp] QR Code received');
      this.qrCode = await QRCode.toDataURL(qr);
    });

    // Remote session saved
    this.client.on('remote_session_saved', () => {
      console.log('[WhatsApp] Session saved to Firestore');
    });

    // Authenticated successfully
    this.client.on('authenticated', () => {
      console.log('[WhatsApp] Authenticated successfully');
      this.qrCode = null; // Clear QR code after authentication
    });

    // Client is ready
    this.client.on('ready', async () => {
      this.isReady = true;
      this.reconnectAttempts = 0;

      // Get phone number
      const info = this.client.info;
      this.phoneNumber = info.wid.user;

      console.log('✓ WhatsApp client is ready');
      console.log(`✓ Connected as: +${this.phoneNumber}`);
    });

    // Incoming message
    this.client.on('message', async (message) => {
      console.log(`[WhatsApp] Message received from ${message.from}: ${message.body}`);
      await this.handleIncomingMessage(message);
    });

    // Disconnected
    this.client.on('disconnected', async (reason) => {
      console.log(`[WhatsApp] Disconnected: ${reason}`);
      this.isReady = false;
      this.qrCode = null;

      // Attempt to reconnect
      await this.attemptReconnect();
    });

    // Authentication failure
    this.client.on('auth_failure', (message) => {
      console.error('[WhatsApp] Authentication failure:', message);
      this.isReady = false;
    });

    // Loading screen
    this.client.on('loading_screen', (percent, message) => {
      console.log(`[WhatsApp] Loading: ${percent}% - ${message}`);
    });
  }

  /**
   * Handle incoming WhatsApp messages
   */
  async handleIncomingMessage(message) {
    try {
      // Extract phone number from message.from (format: 923001234567@c.us)
      const phoneNumber = '+' + message.from.split('@')[0];

      // Check if message is from a known staff member
      const staffType = this.getStaffTypeFromPhone(phoneNumber);

      if (!staffType) {
        console.log(`[WhatsApp] Ignoring message from unknown number: ${phoneNumber}`);
        return;
      }

      // Forward to webhook for AI processing
      if (WEBHOOK_URL) {
        await this.forwardToWebhook({
          from: phoneNumber,
          staffType,
          message: message.body,
          timestamp: new Date(message.timestamp * 1000).toISOString(),
          messageId: message.id.id
        });
      }
    } catch (error) {
      console.error('[WhatsApp] Error handling incoming message:', error);
    }
  }

  /**
   * Forward incoming message to Cloud Function webhook
   */
  async forwardToWebhook(data) {
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`);
      }

      console.log('[WhatsApp] Message forwarded to webhook successfully');
    } catch (error) {
      console.error('[WhatsApp] Error forwarding to webhook:', error);
    }
  }

  /**
   * Get staff type from phone number
   */
  getStaffTypeFromPhone(phoneNumber) {
    for (const [type, contact] of Object.entries(STAFF_CONTACTS)) {
      if (contact.phone === phoneNumber) {
        return type;
      }
    }
    return null;
  }

  /**
   * Send a message to a staff member
   */
  async sendMessage({ opsNumber, staffType, message, context }) {
    if (!this.isReady) {
      throw new Error('WhatsApp client is not ready');
    }

    const staff = STAFF_CONTACTS[staffType];
    if (!staff) {
      throw new Error(`Invalid staff type: ${staffType}`);
    }

    try {
      // Format phone number for WhatsApp (remove + and add @c.us)
      const chatId = staff.phone.substring(1) + '@c.us';

      // Send message
      const sentMessage = await this.client.sendMessage(chatId, message);

      // Store in Firestore conversation
      const conversationId = `${opsNumber.toLowerCase()}_${staffType}`;
      const messageId = uuidv4();

      await this.saveMessageToFirestore({
        conversationId,
        messageId,
        opsNumber,
        staffType,
        staffPhone: staff.phone,
        staffName: staff.name,
        message,
        context,
        direction: 'outgoing',
        timestamp: new Date().toISOString(),
        whatsappMessageId: sentMessage.id.id
      });

      console.log(`[WhatsApp] Message sent to ${staff.name} for ${opsNumber}`);

      return {
        success: true,
        messageId,
        conversationId,
        timestamp: new Date().toISOString(),
        whatsappMessageId: sentMessage.id.id
      };
    } catch (error) {
      console.error('[WhatsApp] Error sending message:', error);
      throw error;
    }
  }

  /**
   * Save message to Firestore conversation
   */
  async saveMessageToFirestore({
    conversationId,
    messageId,
    opsNumber,
    staffType,
    staffPhone,
    staffName,
    message,
    context,
    direction,
    timestamp,
    whatsappMessageId
  }) {
    try {
      const conversationRef = db.collection('whatsappConversations').doc(conversationId);
      const conversationDoc = await conversationRef.get();

      const messageData = {
        id: messageId,
        direction,
        sender: direction === 'outgoing' ? 'You' : staffName,
        text: message,
        timestamp,
        read: direction === 'outgoing', // Outgoing messages are auto-marked as read
        status: 'sent',
        whatsappMessageId
      };

      if (conversationDoc.exists) {
        // Update existing conversation
        await conversationRef.update({
          messages: admin.firestore.FieldValue.arrayUnion(messageData),
          lastMessageAt: timestamp,
          lastMessagePreview: message.substring(0, 50),
          updatedAt: timestamp
        });
      } else {
        // Create new conversation
        await conversationRef.set({
          id: conversationId,
          opsNumber,
          staffType,
          staffPhone,
          staffName,
          messages: [messageData],
          lastMessageAt: timestamp,
          lastMessagePreview: message.substring(0, 50),
          unreadCount: 0,
          targetDate: context.targetDate || '',
          buyerCode: context.buyerCode || '',
          article: context.article || '',
          createdAt: timestamp,
          updatedAt: timestamp
        });
      }

      console.log(`[Firestore] Message saved to conversation: ${conversationId}`);
    } catch (error) {
      console.error('[Firestore] Error saving message:', error);
    }
  }

  /**
   * Get QR code for initial setup
   */
  async getQRCode() {
    return this.qrCode;
  }

  /**
   * Get client status
   */
  async getStatus() {
    return {
      connected: this.isReady,
      sessionId: SESSION_ID,
      phoneNumber: this.phoneNumber ? `+${this.phoneNumber}` : null,
      hasQRCode: !!this.qrCode
    };
  }

  /**
   * Attempt to reconnect after disconnection
   */
  async attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WhatsApp] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s

    console.log(`[WhatsApp] Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      await this.client.initialize();
    } catch (error) {
      console.error('[WhatsApp] Reconnection failed:', error);
    }
  }

  /**
   * Manual reconnect
   */
  async reconnect() {
    console.log('[WhatsApp] Manual reconnect requested');
    this.reconnectAttempts = 0;
    await this.client.destroy();
    await this.initialize();
  }

  /**
   * Disconnect the client
   */
  async disconnect() {
    if (this.client) {
      await this.client.destroy();
      this.isReady = false;
      console.log('[WhatsApp] Client disconnected');
    }
  }
}

// Singleton instance
const clientManager = new WhatsAppClientManager();

module.exports = clientManager;
