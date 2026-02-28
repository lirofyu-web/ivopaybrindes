
'use client';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { firebaseConfig } from './config';

// Hooks
export { useUser } from './auth/use-user';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { useAuth, useFirebase, useFirebaseApp, useFirestore } from './provider';

// Providers
export { FirebaseClientProvider } from './client-provider';
export { FirebaseProvider } from './provider';


let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let persistenceEnabled = false;

async function initializeFirebase() {
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  } else {
    firebaseApp = getApps()[0];
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  }

  // Ativação da persistência offline para funcionamento sem internet
  if (!persistenceEnabled && typeof window !== 'undefined') {
      try {
        await enableMultiTabIndexedDbPersistence(firestore);
        persistenceEnabled = true;
      } catch (err: any) {
        if (err.code == 'failed-precondition') {
          console.warn('Persistência offline falhou: Múltiplas abas abertas.');
        } else if (err.code == 'unimplemented') {
          console.warn('O navegador não suporta persistência offline.');
        }
      }
  }

  return { firebaseApp, auth, firestore };
}

export { initializeFirebase };
