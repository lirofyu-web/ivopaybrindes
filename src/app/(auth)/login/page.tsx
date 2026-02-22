'use client';

import { AppLogo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/firebase';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21.328 12.373c0-7.36-5.968-13.328-13.328-13.328-7.36 0-13.328 5.969-13.328 13.328 0 6.578 4.773 12.04 11.034 13.13v-9.283h-3.32v-3.847h3.32v-2.93c0-3.287 1.99-5.11 4.97-5.11 1.42 0 2.64.106 2.995.153v3.44h-2.035c-1.595 0-1.905.758-1.905 1.87v2.472h3.81l-.496 3.848h-3.315v9.283c6.26-.09 11.034-5.552 11.034-13.13z" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

export default function LoginPage() {
    const { user, isLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && user) {
            router.replace('/clientes');
        }
    }, [user, isLoading, router]);


    const handleLogin = async () => {
        const auth = getAuth();
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error('Error during Google sign-in:', error);
        }
    };

    if (isLoading || user) {
        return null; // Or a loading spinner
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-md mx-4">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <AppLogo />
                    </div>
                    <CardTitle>Bem-vindo!</CardTitle>
                    <CardDescription>Faça login com sua conta Google para continuar.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button className="w-full" onClick={handleLogin}>
                        <GoogleIcon className="mr-2 h-5 w-5" />
                        Entrar com Google
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
