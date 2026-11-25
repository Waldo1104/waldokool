// ============================================================================
// Waldo Kool Travel - Firebase Cloud Firestore Backup & Realtime Sync Engine
// File: firebase-backup.js
// ============================================================================

/**
 * HƯỚNG DẪN CẤU HÌNH FIREBASE CỦA BẠN:
 * 1. Vào https://console.firebase.google.com/
 * 2. Tạo một dự án mới (ví dụ: 'waldo-kool-travel')
 * 3. Vào Build -> Firestore Database -> Create database (chọn Test mode)
 * 4. Vào Project settings -> Add app (chọn biểu tượng Web </>) -> Copy config dán vào bên dưới:
 */

const FIREBASE_CONFIG = window.FIREBASE_CUSTOM_CONFIG || {
  apiKey: "AIzaSyYOUR_API_KEY_HERE",
  authDomain: "waldo-kool-travel.firebaseapp.com",
  projectId: "waldo-kool-travel",
  storageBucket: "waldo-kool-travel.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

const FirebaseBackupEngine = {
  isInitialized: false,
  db: null,

  // 1. Initialize Firebase App
  init: function() {
    if (typeof firebase === 'undefined') {
      console.warn('[Firebase] SDK script not loaded yet.');
      return false;
    }
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
      this.db = firebase.firestore();
      this.isInitialized = true;
      console.info('[Firebase] Connected to Cloud Firestore successfully!');
      return true;
    } catch (e) {
      console.warn('[Firebase] Init notice (Using local fallback):', e.message);
      return false;
    }
  },

  // 2. Backup a New Booking to Cloud Firestore
  backupBooking: async function(bookingData) {
    // Luôn lưu local trước
    console.info('[Firebase Backup] Processing booking backup for:', bookingData.booking_id);

    if (this.isInitialized && this.db && FIREBASE_CONFIG.apiKey !== "AIzaSyYOUR_API_KEY_HERE") {
      try {
        await this.db.collection('bookings').doc(bookingData.booking_id).set({
          ...bookingData,
          cloud_synced_at: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.info(`[Firebase Cloud] ✓ Booking ${bookingData.booking_id} backed up to Cloud Firestore!`);
        return { success: true, cloud: true };
      } catch (err) {
        console.error('[Firebase Cloud Error]:', err);
        return { success: true, cloud: false, err: err.message };
      }
    } else {
      console.info(`[Firebase Standby] Local backup active. Set your Firebase Config keys to enable live cloud sync.`);
      return { success: true, cloud: false, reason: 'standby_mode' };
    }
  },

  // 3. Backup Full Database (Bookings, Emails, Sub-Admins)
  backupAllToCloud: async function() {
    const bookings = JSON.parse(localStorage.getItem('tourflow_bookings') || '[]');
    const emails = JSON.parse(localStorage.getItem('waldo_kool_sent_emails') || '[]');
    const admins = JSON.parse(localStorage.getItem('tourflow_admins') || '[]');

    const backupSnapshot = {
      backup_timestamp: new Date().toISOString(),
      source: 'Waldo Kool Travel Admin Portal',
      total_bookings: bookings.length,
      total_emails: emails.length,
      bookings: bookings,
      emails: emails,
      sub_admins: admins.filter(a => a.role === 'sub_admin')
    };

    if (this.isInitialized && this.db && FIREBASE_CONFIG.apiKey !== "AIzaSyYOUR_API_KEY_HERE") {
      try {
        const docRef = await this.db.collection('system_backups').add({
          ...backupSnapshot,
          created_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, cloudId: docRef.id };
      } catch (e) {
        return { success: false, error: e.message };
      }
    } else {
      // Export snapshot as downloadable JSON file as instant backup fallback
      const blob = new Blob([JSON.stringify(backupSnapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `waldo-kool-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return { success: true, localFile: true };
    }
  }
};

window.FirebaseBackupEngine = FirebaseBackupEngine;

// Auto init if Firebase script is present
document.addEventListener('DOMContentLoaded', () => {
  FirebaseBackupEngine.init();
});
