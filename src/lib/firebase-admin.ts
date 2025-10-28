
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      // As credenciais são obtidas automaticamente do ambiente do Google Cloud
      // quando implantado no App Hosting.
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const adminDb = admin.firestore();
