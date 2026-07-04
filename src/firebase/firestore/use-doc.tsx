import { useState, useEffect } from 'react';
import { doc, onSnapshot, type DocumentData } from 'firebase/firestore';
import { useFirestore } from '../provider';
import { useUser } from '../auth/use-user';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

function processDoc<T>(doc: DocumentData): T | null {
    if (!doc.exists()) {
        return null;
    }

    const data = doc.data() as any;
    const processedData: any = { ...data, id: doc.id };

    for (const key in processedData) {
        if (processedData[key]?.toDate) { 
            processedData[key] = processedData[key].toDate();
        }
    }
    return processedData;
}


export function useDoc<T>(path: string) {
    const firestore = useFirestore();
    const { user } = useUser();
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!firestore || !path || !user) {
            if (!user || !path) {
                setData(null);
                setIsLoading(false);
            }
            return;
        }

        const scopedPath = path.startsWith('users/') ? path : `users/${user.uid}/${path}`;
        const docRef = doc(firestore, scopedPath);
        const unsubscribe = onSnapshot(docRef,
            (docSnapshot) => {
                setData(processDoc<T>(docSnapshot));
                setIsLoading(false);
            },
            async (err) => {
                const permissionError = new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'get',
                });
                errorEmitter.emit('permission-error', permissionError);
                setError(err);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [path, firestore, user]);

    return { data, isLoading, error };
}
