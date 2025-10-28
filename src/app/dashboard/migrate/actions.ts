
'use server';

import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/lib/firebase-admin';
import { headers } from 'next/headers';

const SOURCE_UID = '7aDfCRJ90HNiN2se655nys4glUX2';
const DESTINATION_UID = 'm2QQbgIIKoQldL7iE4yDR1ItkYL2';
// Apenas este email pode executar a migração
const ADMIN_EMAIL = 'henriquegoncal@gmail.com'; 

interface MigrateState {
  message: string;
  success: boolean;
}

async function verifyUserIsAdmin() {
    const authorization = headers().get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      throw new Error('Missing or invalid authorization token.');
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(idToken);
    
    if (decodedToken.email !== ADMIN_EMAIL) {
        throw new Error('Permission denied. You are not authorized to perform this action.');
    }
}


async function transferCollection(collectionName: string): Promise<{ count: number }> {
    const sourceCollectionRef = adminDb.collection('users').doc(SOURCE_UID).collection(collectionName);
    const destinationCollectionRef = adminDb.collection('users').doc(DESTINATION_UID).collection(collectionName);

    const snapshot = await sourceCollectionRef.get();
    
    if (snapshot.empty) {
        return { count: 0 };
    }

    const batch = adminDb.batch();
    snapshot.docs.forEach(doc => {
        const docRef = destinationCollectionRef.doc(doc.id);
        batch.set(docRef, doc.data());
    });

    await batch.commit();
    return { count: snapshot.size };
}


export async function migrateData(prevState: MigrateState, formData: FormData): Promise<MigrateState> {
  try {
    // 1. Verificar se o usuário logado é o administrador
    await verifyUserIsAdmin();

    // 2. Transferir a coleção 'jobs'
    const { count: jobsCount } = await transferCollection('jobs');
    
    // 3. Transferir a coleção 'crew'
    const { count: crewCount } = await transferCollection('crew');

    const message = `Migração concluída com sucesso! ${jobsCount} job(s) e ${crewCount} membro(s) da equipe foram transferidos.`;
    return { message, success: true };

  } catch (error: any) {
    console.error("Migration failed:", error);
    return { message: error.message || 'Ocorreu um erro desconhecido durante a migração.', success: false };
  }
}
