'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { mockClients } from '@/lib/mock-clients';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map, List, User } from 'lucide-react';
import type { Client } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

export default function RotasPage() {
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    const ClientMap = useMemo(() => dynamic(
        () => import('@/components/map/client-map'),
        {
            loading: () => <Skeleton className="h-full w-full rounded-lg" />,
            ssr: false
        }
    ), []);

    const clientsWithLocation = useMemo(() => mockClients.filter(c => c.location), []);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Map className="h-8 w-8 text-muted-foreground" />
                <h1 className="text-3xl font-bold font-headline">
                    Rotas de Clientes
                </h1>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)]">
                <Card className="lg:col-span-1 flex flex-col">
                    <CardHeader className="flex-row items-center gap-2 space-y-0 p-4">
                        <List className="h-6 w-6" />
                        <CardTitle className="text-xl">Clientes</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-1">
                        <ScrollArea className="h-full px-2">
                            <div className="space-y-2 py-2">
                                {clientsWithLocation.map(client => (
                                    <Button
                                        key={client.id}
                                        variant={selectedClient?.id === client.id ? "secondary" : "ghost"}
                                        className="w-full justify-start h-auto py-2"
                                        onClick={() => setSelectedClient(client)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <User className="h-5 w-5 text-muted-foreground" />
                                            <div className="text-left">
                                                <p className="font-semibold">{client.name}</p>
                                                <p className="text-xs text-muted-foreground">{client.city}</p>
                                            </div>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardContent className="p-0 h-full">
                        <ClientMap clients={clientsWithLocation} selectedClient={selectedClient} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
