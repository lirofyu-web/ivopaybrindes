'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { mockClients } from '@/lib/mock-clients';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map, List, User, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import type { Client } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function RotasPage() {
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isListCollapsed, setIsListCollapsed] = useState(false);

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
            <div className="relative flex flex-col lg:flex-row gap-4 h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)]">
                
                <Button
                    size="icon"
                    variant="outline"
                    className={cn(
                        "absolute top-2 left-2 z-20 bg-card/80 backdrop-blur-sm hidden",
                        isListCollapsed && 'lg:flex'
                    )}
                    onClick={() => setIsListCollapsed(false)}
                    aria-label="Mostrar lista de clientes"
                >
                    <PanelLeftOpen className="h-5 w-5" />
                </Button>

                <Card className={cn(
                    "flex flex-col transition-all duration-300 ease-in-out lg:h-full",
                    "h-1/3",
                    isListCollapsed ? 'lg:w-0 lg:scale-x-0 lg:opacity-0 lg:p-0 lg:border-0' : 'lg:w-1/3'
                )} style={{transformOrigin: 'left'}}>
                    <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 p-4">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <List className="h-6 w-6 shrink-0" />
                            <CardTitle className="text-xl truncate">Clientes</CardTitle>
                        </div>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="hidden lg:flex"
                            onClick={() => setIsListCollapsed(true)}
                            aria-label="Esconder lista de clientes"
                        >
                            <PanelLeftClose className="h-5 w-5" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-hidden">
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
                
                <div className="flex-1 h-2/3 lg:h-full">
                  <Card className="h-full">
                      <CardContent className="p-0 h-full">
                          <ClientMap clients={clientsWithLocation} selectedClient={selectedClient} />
                      </CardContent>
                  </Card>
                </div>
            </div>
        </div>
    );
}
