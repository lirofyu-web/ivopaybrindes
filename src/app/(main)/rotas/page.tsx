'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { mockClients } from '@/lib/mock-clients';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Map } from 'lucide-react';

export default function RotasPage() {
    const ClientMap = useMemo(() => dynamic(
        () => import('@/components/map/client-map'),
        {
            loading: () => <Skeleton className="h-full w-full rounded-lg" />,
            ssr: false
        }
    ), []);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Map className="h-8 w-8 text-muted-foreground" />
                <h1 className="text-3xl font-bold font-headline">
                    Rotas de Clientes
                </h1>
            </div>
            <Card>
                <CardContent className="p-2 h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)]">
                    <ClientMap clients={mockClients} />
                </CardContent>
            </Card>
        </div>
    );
}
