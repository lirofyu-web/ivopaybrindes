'use client';
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
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

  if (!persistenceEnabled) {
      try {
        await enableIndexedDbPersistence(firestore)
        persistenceEnabled = true;
      } catch (err: any) {
        if (err.code == 'failed-precondition') {
          console.warn('Firestore persistence failed. This is likely due to multiple tabs open.');
        } else if (err.code == 'unimplemented') {
          console.warn('The current browser does not support all of the features required to enable persistence.');
        }
      }
  }

  return { firebaseApp, auth, firestore };
}

export { initializeFirebase };
