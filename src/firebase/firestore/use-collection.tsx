
import { useState, useEffect } from 'react';
import { collection, onSnapshot, type DocumentData } from 'firebase/firestore';
import { useFirestore } from '../provider';
import type { WithTimestamps } from '@/lib/types';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

function processDoc<T>(doc: DocumentData): WithTimestamps<T, 'createdAt' | 'updatedAt'> {
    const data = doc.data() as any;
    const processedData: any = { ...data, id: doc.id };

    for (const key in processedData) {
        // Verifica se é um Timestamp do Firebase ou se já é uma data (cache local)
        if (processedData[key]?.toDate) {
            processedData[key] = processedData[key].toDate();
        }
    }
    return processedData;
}


export function useCollection<T>(path: string) {
    const firestore = useFirestore();
    const [data, setData] = useState<WithTimestamps<T, 'createdAt' | 'updatedAt'>[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!firestore) {
            setIsLoading(false);
            return;
        };

        const collectionRef = collection(firestore, path);
        // includeMetadataChanges garante que o cache local dispare o snapshot imediatamente
        const unsubscribe = onSnapshot(collectionRef, 
            { includeMetadataChanges: true },
            (snapshot) => {
                const docs = snapshot.docs.map(doc => processDoc<T>(doc));
                setData(docs);
                setIsLoading(false);
            },
            async (err) => {
                const permissionError = new FirestorePermissionError({
                    path: collectionRef.path,
                    operation: 'list',
                });
                errorEmitter.emit('permission-error', permissionError);
                setError(err);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [path, firestore]);

    return { data, isLoading, error };
}
