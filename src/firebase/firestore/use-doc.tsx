import { useState, useEffect } from 'react';
import { doc, onSnapshot, type DocumentData } from 'firebase/firestore';
import { useFirestore } from '../provider';
import type { WithTimestamps } from '@/lib/types';

function processDoc<T>(doc: DocumentData): WithTimestamps<T, 'createdAt' | 'updatedAt'> | null {
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
    const [data, setData] = useState<WithTimestamps<T, 'createdAt' | 'updatedAt'> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!firestore || !path) {
            setIsLoading(false);
            return;
        }

        const docRef = doc(firestore, path);
        const unsubscribe = onSnapshot(docRef,
            (docSnapshot) => {
                setData(processDoc<T>(docSnapshot));
                setIsLoading(false);
            },
            (err) => {
                console.error(`Error fetching doc ${path}:`, err);
                setError(err);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [path, firestore]);

    return { data, isLoading, error };
}
