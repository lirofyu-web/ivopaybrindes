'use client';

import { useEffect, useState } from 'react';
import { initializeFirebase } from './';
import { FirebaseProvider } from './provider';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface FirebaseClientProviderProps {
  children: React.ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebaseInstances, setFirebaseInstances] = useState<{
    firebaseApp: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
  } | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  useEffect(() => {
    try {
        const instances = initializeFirebase();
        setFirebaseInstances(instances);
    } catch (e: any) {
        console.error("Firebase initialization failed:", e);
        setInitializationError(e.message);
    }
  }, []);

    if (initializationError) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background p-4">
                <Alert variant="destructive" className="max-w-lg">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro de Conexão com o Firebase</AlertTitle>
                    <AlertDescription>
                       <p className='mb-4'>A conexão com os serviços do Firebase falhou. A causa mais comum é uma configuração de projeto ausente ou inválida.</p>
                       <code className="text-xs relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono font-semibold">
                        {initializationError}
                       </code>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

  if (!firebaseInstances) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return <FirebaseProvider value={firebaseInstances}>{children}</FirebaseProvider>;
}
