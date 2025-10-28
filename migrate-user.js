// Usage:
//   node migrate-user.js --project=studio-170657449-62ce2 --old=7aDf... --new=m2QQ... [--dry-run] [--delete-old]

import process from 'node:process';
import admin from 'firebase-admin';

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);

const PROJECT_ID = args.project;
const OLD_ID = args.old;
const NEW_ID = args.new;
const DRY_RUN = Boolean(args['dry-run']);
const DELETE_OLD = Boolean(args['delete-old']);

if (!PROJECT_ID || !OLD_ID || !NEW_ID) {
  console.error('Uso: node migrate-user.js --project=ID --old=OLD_UID --new=NEW_UID [--dry-run] [--delete-old]');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    // No Firebase Studio, usa credenciais padrão da VM:
    credential: admin.credential.applicationDefault(),
    projectId: PROJECT_ID,
  });
}

const db = admin.firestore();

// Campos comuns que apontam para o dono e que queremos trocar old->new
const OWNER_KEYS = new Set(['userId', 'ownerId', 'uid', 'createdBy', 'updatedBy']);

function rewriteOwnerFields(data, oldId, newId) {
  if (!data || typeof data !== 'object') return data;
  const out = Array.isArray(data) ? [] : {};
  for (const [k, v] of Object.entries(data)) {
    if (v && typeof v === 'object') out[k] = rewriteOwnerFields(v, oldId, newId);
    else out[k] = (OWNER_KEYS.has(k) && v === oldId) ? newId : v;
  }
  return out;
}

async function copyDocRecursive(srcDocRef, dstDocRef, dryRun = false) {
  const snap = await srcDocRef.get();
  if (!snap.exists) return;
  const data = rewriteOwnerFields(snap.data(), OLD_ID, NEW_ID);
  if (dryRun) console.log(`[dry-run] SET ${dstDocRef.path}`);
  else await dstDocRef.set(data, { merge: true });

  const subcols = await srcDocRef.listCollections();
  for (const sub of subcols) {
    const dstSub = dstDocRef.collection(sub.id);
    const qSnap = await sub.get();
    for (const docSnap of qSnap.docs) {
      await copyDocRecursive(docSnap.ref, dstSub.doc(docSnap.id), dryRun);
    }
  }
}

async function deleteDocRecursive(docRef) {
  const writer = db.bulkWriter();
  async function del(ref) {
    const subcols = await ref.listCollections();
    for (const sub of subcols) {
      const qSnap = await sub.get();
      for (const d of qSnap.docs) await del(d.ref);
    }
    await writer.delete(ref);
  }
  await del(docRef);
  await writer.close();
}

async function main() {
  const oldUser = db.collection('users').doc(OLD_ID);
  const newUser = db.collection('users').doc(NEW_ID);
  const snap = await oldUser.get();
  if (!snap.exists) {
    console.error(`Origem não existe: users/${OLD_ID}`);
    process.exit(2);
  }

  console.log(`Migrando users/${OLD_ID} -> users/${NEW_ID} (proj: ${PROJECT_ID})`);
  if (DRY_RUN) console.log('*** MODO DRY-RUN ***');

  // 1) Doc do usuário
  const base = rewriteOwnerFields(snap.data(), OLD_ID, NEW_ID);
  if (DRY_RUN) console.log(`[dry-run] SET users/${NEW_ID}`);
  else await newUser.set(base, { merge: true });

  // 2) Subcoleções (jobs, income, expenses, …)
  const subs = await oldUser.listCollections();
  for (const sub of subs) {
    console.log(`> Subcoleção: ${sub.id}`);
    const q = await sub.get();
    for (const d of q.docs) {
      await copyDocRecursive(d.ref, newUser.collection(sub.id).doc(d.id), DRY_RUN);
    }
  }

  // 3) Apagar origem (opcional)
  if (DELETE_OLD) {
    if (DRY_RUN) console.log(`[dry-run] DELETE users/${OLD_ID} (recursivo)`);
    else {
      console.log(`Apagando origem users/${OLD_ID}…`);
      await deleteDocRecursive(oldUser);
    }
  }
  console.log('OK.');
}

main().catch(e => { console.error(e); process.exit(1); });
