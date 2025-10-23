/**
 * RemoteAuth Configuration for Firestore
 *
 * This implements a custom RemoteAuth store that saves WhatsApp Web session
 * data to Firebase Firestore instead of the local filesystem.
 *
 * This is essential for Cloud Run because the file system is ephemeral.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
// Handle private key - Railway stores it with literal \n characters
let privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (privateKey) {
  // Remove surrounding quotes if present
  privateKey = privateKey.replace(/^["']|["']$/g, '');
  // Replace literal \n with actual newlines (MUST be done before any trimming)
  privateKey = privateKey.replace(/\\n/g, '\n');
  // Only trim leading/trailing whitespace, preserve internal newlines
  privateKey = privateKey.trim();

  console.log('[Firebase] Private key first 50 chars:', privateKey.substring(0, 50));
  console.log('[Firebase] Private key last 50 chars:', privateKey.substring(privateKey.length - 50));
  console.log('[Firebase] Private key contains newlines:', privateKey.includes('\n'));
}

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: privateKey,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

/**
 * Firestore RemoteAuth Store
 *
 * Implements the RemoteAuth interface for whatsapp-web.js
 */
class FirestoreStore {
  constructor(options = {}) {
    this.sessionId = options.sessionId || 'default';
    this.collection = options.collection || 'whatsappSessions';
  }

  /**
 * Save session data to Firestore
   */
  async save(data) {
    try {
      const { session } = data;

      await db.collection(this.collection).doc(this.sessionId).set({
        session: JSON.stringify(session),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`[RemoteAuth] Session saved to Firestore: ${this.sessionId}`);
      return true;
    } catch (error) {
      console.error('[RemoteAuth] Error saving session:', error);
      throw error;
    }
  }

  /**
   * Load session data from Firestore
   */
  async extract() {
    try {
      const doc = await db.collection(this.collection).doc(this.sessionId).get();

      if (!doc.exists) {
        console.log(`[RemoteAuth] No existing session found for: ${this.sessionId}`);
        return null;
      }

      const data = doc.data();
      const session = JSON.parse(data.session);

      console.log(`[RemoteAuth] Session loaded from Firestore: ${this.sessionId}`);
      return { session };
    } catch (error) {
      console.error('[RemoteAuth] Error loading session:', error);
      return null;
    }
  }

  /**
   * Delete session data from Firestore
   */
  async delete() {
    try {
      await db.collection(this.collection).doc(this.sessionId).delete();
      console.log(`[RemoteAuth] Session deleted from Firestore: ${this.sessionId}`);
      return true;
    } catch (error) {
      console.error('[RemoteAuth] Error deleting session:', error);
      throw error;
    }
  }

  /**
   * Check if session exists in Firestore
   */
  async sessionExists() {
    try {
      const doc = await db.collection(this.collection).doc(this.sessionId).get();
      return doc.exists;
    } catch (error) {
      console.error('[RemoteAuth] Error checking session existence:', error);
      return false;
    }
  }
}

module.exports = { FirestoreStore, db, admin };
