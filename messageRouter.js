/**
 * Message Router
 *
 * Routes incoming WhatsApp messages to the correct conversation
 * and triggers AI analysis via Cloud Function.
 */

const { db, admin } = require('./remoteauth-config');
const { v4: uuidv4 } = require('uuid');

// Staff phone mapping
const STAFF_PHONE_MAP = {
  '+923001234567': { type: 'merchants', name: 'Merchants Team' },
  '+923007654321': { type: 'kamala', name: 'Kamala' },
  '+923009876543': { type: 'rinku', name: 'Rinku' }
};

/**
 * Route an incoming message to the appropriate conversation
 */
async function routeIncomingMessage({ from, message, timestamp }) {
  try {
    const staff = STAFF_PHONE_MAP[from];

    if (!staff) {
      console.log(`[Router] Unknown staff number: ${from}`);
      return;
    }

    console.log(`[Router] Routing message from ${staff.name}: "${message}"`);

    // Find the most recent conversation with this staff member
    const conversation = await findRecentConversation(staff.type);

    if (!conversation) {
      console.log(`[Router] No active conversation found for ${staff.name}`);
      return;
    }

    // Save incoming message to conversation
    await saveIncomingMessage({
      conversationId: conversation.id,
      opsNumber: conversation.opsNumber,
      staffType: staff.type,
      staffName: staff.name,
      message,
      timestamp,
      targetDate: conversation.targetDate
    });

    console.log(`[Router] Message saved to conversation: ${conversation.id}`);
  } catch (error) {
    console.error('[Router] Error routing message:', error);
    throw error;
  }
}

/**
 * Find the most recent conversation with a staff member
 * (within the last 7 days)
 */
async function findRecentConversation(staffType) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const snapshot = await db
      .collection('whatsappConversations')
      .where('staffType', '==', staffType)
      .where('updatedAt', '>=', sevenDaysAgo.toISOString())
      .orderBy('updatedAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data();
  } catch (error) {
    console.error('[Router] Error finding conversation:', error);
    return null;
  }
}

/**
 * Save incoming message to Firestore and trigger AI analysis
 */
async function saveIncomingMessage({
  conversationId,
  opsNumber,
  staffType,
  staffName,
  message,
  timestamp,
  targetDate
}) {
  try {
    const messageId = uuidv4();

    const messageData = {
      id: messageId,
      direction: 'incoming',
      sender: staffName,
      text: message,
      timestamp,
      read: false, // Incoming messages start as unread
      status: 'delivered'
    };

    const conversationRef = db.collection('whatsappConversations').doc(conversationId);

    // Update conversation with new message
    await conversationRef.update({
      messages: admin.firestore.FieldValue.arrayUnion(messageData),
      lastMessageAt: timestamp,
      lastMessagePreview: message.substring(0, 50),
      unreadCount: admin.firestore.FieldValue.increment(1),
      updatedAt: timestamp
    });

    // Trigger AI analysis via Cloud Function
    await triggerAIAnalysis({
      messageId,
      conversationId,
      opsNumber,
      staffType,
      staffName,
      message,
      timestamp,
      targetDate
    });

    console.log(`[Router] Message saved and AI analysis triggered`);
  } catch (error) {
    console.error('[Router] Error saving incoming message:', error);
    throw error;
  }
}

/**
 * Trigger AI analysis of the incoming message
 * This calls the Cloud Function to parse the reply
 */
async function triggerAIAnalysis(data) {
  try {
    const webhookUrl = process.env.WEBHOOK_URL;

    if (!webhookUrl) {
      console.log('[Router] No webhook URL configured, skipping AI analysis');
      return;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`AI webhook returned ${response.status}`);
    }

    console.log('[Router] AI analysis triggered successfully');
  } catch (error) {
    console.error('[Router] Error triggering AI analysis:', error);
    // Don't throw - message was already saved
  }
}

module.exports = {
  routeIncomingMessage
};
