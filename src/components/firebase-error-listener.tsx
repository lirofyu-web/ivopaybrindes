'use client';
import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';

export default function FirebaseErrorListener() {
    const { toast } = useToast();

    useEffect(() => {
        const handlePermissionError = (error: Error) => {
            if (process.env.NODE_ENV === 'development') {
                throw error;
            } else {
                console.error(error);
                toast({
                    variant: 'destructive',
                    title: 'Erro de Permissão',
                    description: 'Você não tem permissão para realizar esta ação.',
                });
            }
        };

        errorEmitter.on('permission-error', handlePermissionError);
        
    }, [toast]);

    return null;
}
