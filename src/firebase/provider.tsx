'use client';
import { createContext, useContext } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import FirebaseErrorListener from '@/components/firebase-error-listener';

interface FirebaseContextValue {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

export const FirebaseProvider: React.FC<{
  children: React.ReactNode;
  value: FirebaseContextValue;
}> = ({ children, value }) => {
  return (
    <FirebaseContext.Provider value={value}>
        {children}
        <FirebaseErrorListener />
    </FirebaseContext.Provider>
  );
};

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}
export function useFirebaseApp() {
  return useFirebase().firebaseApp;
}
export function useAuth() {
  return useFirebase().auth;
}
export function useFirestore() {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
      return undefined;
    }
    return context.firestore;
}
