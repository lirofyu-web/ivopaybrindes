import { useState, useEffect } from 'react';
import { collection, onSnapshot, type DocumentData } from 'firebase/firestore';
import { useFirestore } from '../provider';
import type { WithTimestamps } from '@/lib/types';

function processDoc<T>(doc: DocumentData): WithTimestamps<T, 'createdAt' | 'updatedAt'> {
    const data = doc.data() as any;
    const processedData: any = { ...data, id: doc.id };

    for (const key in processedData) {
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
        const unsubscribe = onSnapshot(collectionRef,
            (snapshot) => {
                const docs = snapshot.docs.map(doc => processDoc<T>(doc));
                setData(docs);
                setIsLoading(false);
            },
            (err) => {
                console.error(`Error fetching collection ${path}:`, err);
                setError(err);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [path, firestore]);

    return { data, isLoading, error };
}
