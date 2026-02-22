'use client';

import { useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { Client, Cobranca } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Map as MapIcon, Search, Maximize, Minimize } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { differenceInDays } from 'date-fns';
import { useCollection } from '@/firebase';

// Dynamically import the map component to avoid SSR issues with Leaflet
const ClientMap = dynamic(() => import('@/components/map/client-map'), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center bg-muted"><Loader2 className="h-8 w-8 animate-spin" /></div>
});

export default function MapaPage() {
    const { data: clients, isLoading: isLoadingClients } = useCollection<Client>('clients');
    const { data: allCobrancas, isLoading: isLoadingCobrancas } = useCollection<Cobranca>('cobrancas');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'default' | 'list-full' | 'map-full'>('default');
    const [currentDate, setCurrentDate] = useState<Date | null>(null);

    const isLoading = isLoadingClients || isLoadingCobrancas;

    useEffect(() => {
        setCurrentDate(new Date());
    }, []);

    const clientsWithLocation = useMemo(() => {
        if (!clients) return [];
        const filtered = clients.filter(client => client.location);
        if (!searchTerm) {
            return filtered;
        }
        return filtered.filter(client => 
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.route.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [clients, searchTerm]);

    const clientVisitStatus = useMemo(() => {
        const statusMap = new Map<string, 'visited' | 'not-visited'>();
        if (!clients || !allCobrancas || !currentDate) {
            clients?.forEach(client => statusMap.set(client.id!, 'not-visited'));
            return statusMap;
        }
        
        const now = currentDate;
        const sortedCobrancas = [...allCobrancas].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        clients.forEach(client => {
          const lastCharge = sortedCobrancas.find(c => c.clientId === client.id);
          if (lastCharge && differenceInDays(now, lastCharge.createdAt) <= 25) {
            statusMap.set(client.id!, 'visited');
          } else {
            statusMap.set(client.id!, 'not-visited');
          }
        });
        return statusMap;
    }, [allCobrancas, clients, currentDate]);


    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                <p className="mt-4 ml-4">Carregando mapa e clientes...</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <MapIcon className="h-8 w-8 text-muted-foreground" />
                <h1 className="text-3xl font-bold font-headline">
                    Mapa de Clientes
                </h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
                <Card className={cn(
                    "md:col-span-1 flex flex-col",
                    viewMode === 'map-full' && 'hidden',
                    viewMode === 'list-full' && 'md:col-span-3'
                )}>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Clientes com Localização</CardTitle>
                             <div className="hidden md:flex">
                                {viewMode === 'list-full' ? (
                                    <Button variant="ghost" size="icon" onClick={() => setViewMode('default')}>
                                        <Minimize className="h-5 w-5" />
                                    </Button>
                                ) : (
                                    <Button variant="ghost" size="icon" onClick={() => setViewMode('list-full')}>
                                        <Maximize className="h-5 w-5" />
                                    </Button>
                                )}
                            </div>
                        </div>
                         <div className="relative pt-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input 
                                placeholder="Buscar cliente..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow p-0 overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="p-2 space-y-2">
                                {clientsWithLocation.length > 0 ? clientsWithLocation.map(client => (
                                    <Button 
                                        key={client.id}
                                        variant={selectedClient?.id === client.id ? 'secondary' : 'ghost'}
                                        className="w-full justify-start h-auto py-2"
                                        onClick={() => setSelectedClient(client)}
                                    >
                                        <div className="text-left">
                                            <p className="font-semibold">{client.name}</p>
                                            <p className="text-xs text-muted-foreground">{client.route}</p>
                                        </div>
                                    </Button>
                                )) : (
                                     <div className="text-center py-12 text-muted-foreground">
                                        <p>Nenhum cliente com localização encontrada.</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
                <div className={cn(
                    "h-full w-full relative",
                    viewMode === 'default' && 'md:col-span-2',
                    viewMode === 'list-full' && 'hidden',
                    viewMode === 'map-full' && 'md:col-span-3'
                )}>
                    <div className="absolute top-2 right-2 z-[1000] hidden md:block">
                       {viewMode === 'map-full' ? (
                            <Button variant="secondary" size="icon" onClick={() => setViewMode('default')}>
                                <Minimize className="h-5 w-5" />
                            </Button>
                        ) : (
                            <Button variant="secondary" size="icon" onClick={() => setViewMode('map-full')}>
                                <Maximize className="h-5 w-5" />
                            </Button>
                        )}
                    </div>
                    <ClientMap clients={clientsWithLocation} selectedClient={selectedClient} visitStatus={clientVisitStatus} />
                </div>
            </div>
        </div>
    );
}
