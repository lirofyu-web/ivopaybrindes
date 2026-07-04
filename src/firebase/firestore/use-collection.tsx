
import { useState, useEffect } from 'react';
import { collection, onSnapshot, type DocumentData } from 'firebase/firestore';
import { useFirestore } from '../provider';
import { useUser } from '../auth/use-user';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

function processDoc<T>(doc: DocumentData): T {
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
    const { user } = useUser();
    const [data, setData] = useState<T[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!firestore || !user) {
            if (!user) {
                setData(null);
                setIsLoading(false);
            }
            return;
        };

        const scopedPath = path.startsWith('users/') ? path : `users/${user.uid}/${path}`;
        const collectionRef = collection(firestore, scopedPath);
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
    }, [path, firestore, user]);

    return { data, isLoading, error };
}
