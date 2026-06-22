/**
 * logger.js — anonymous Firebase event logger for Python Loops
 *
 * Usage: import { logEvent } from './logger.js';
 *        logEvent('page_view', { page: 1, totalPages: 10 });
 *
 * Before deploying, replace the placeholder values in FIREBASE_CONFIG
 * with the real values from your Firebase project console:
 *   Firebase console → Project settings → Your apps → SDK setup and configuration
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore, collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ── Firebase project config ────────────────────────────────────────────────
// TODO: replace all placeholder values below with your real Firebase config
const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyAnocJnRZnvV9ZAa-uEwtnMDJfEH3KXjm0',
  authDomain:        'app-usage-stat-collector.firebaseapp.com',
  projectId:         'app-usage-stat-collector',
  storageBucket:     'app-usage-stat-collector.firebasestorage.app',
  messagingSenderId: '1002834517375',
  appId:             '1:1002834517375:web:a8e8c9b79b349578d70e4a',
};

// Firestore collection for this tool — change per tool on rollout
const COLLECTION = 'python-loops';

// ── Initialise Firebase ────────────────────────────────────────────────────
const app = initializeApp(FIREBASE_CONFIG);
const db  = getFirestore(app);

// ── Anonymous session ID ───────────────────────────────────────────────────
function getSessionId() {
  let id = sessionStorage.getItem('_logSessionId');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('_logSessionId', id);
  }
  return id;
}

// ── Session start time (for tool_complete total duration) ──────────────────
export function ensureSessionStart() {
  if (!sessionStorage.getItem('_logSessionStart')) {
    sessionStorage.setItem('_logSessionStart', Date.now().toString());
  }
}

export function getSessionStartMs() {
  return parseInt(sessionStorage.getItem('_logSessionStart') || Date.now(), 10);
}

// ── Public API ─────────────────────────────────────────────────────────────
/**
 * Log a single event to Firestore.
 * Silently swallows errors so the learning experience is never interrupted.
 *
 * @param {string} eventType — e.g. 'page_view', 'widget_interaction'
 * @param {Object} detail    — event-specific payload
 */
export async function logEvent(eventType, detail = {}) {
  try {
    await addDoc(collection(db, COLLECTION), {
      sessionId: getSessionId(),
      eventType,
      detail,
      timestamp: new Date().toISOString(),
    });
  } catch (_) {
    // Never surface errors — analytics must never break the page
  }
}
