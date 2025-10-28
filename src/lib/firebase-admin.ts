
import * as admin from 'firebase-admin';

let adminDb: admin.firestore.Firestore;

if (!admin.apps.length) {
  try {
    // Quando implantado no App Hosting, as credenciais são obtidas 
    // automaticamente do ambiente do Google Cloud.
    admin.initializeApp();
  } catch (error: any) {
    // Em um ambiente local, você pode precisar configurar as credenciais manualmente.
    // Verifique a documentação do Firebase Admin SDK para mais detalhes.
    // Ex: process.env.GOOGLE_APPLICATION_CREDENTIALS
    console.error('Firebase admin initialization error. Make sure you have the correct credentials set up.', error);
  }
}

adminDb = admin.firestore();

export { adminDb };
