'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { mockClients } from '@/lib/mock-clients';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map, List, User, PanelLeftClose, PanelLeftOpen, Maximize, Minimize } from 'lucide-react';
import type { Client } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { mockCobrancas } from '@/lib/mock-cobrancas';
import { Badge } from '@/components/ui/badge';
import { differenceInDays } from 'date-fns';

export default function RotasPage() {
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isListCollapsed, setIsListCollapsed] = useState(false);
    const [fullScreenMode, setFullScreenMode] = useState<'none' | 'map' | 'list'>('none');

    const ClientMap = useMemo(() => dynamic(
        () => import('@/components/map/client-map'),
        {
            loading: () => <Skeleton className="h-full w-full rounded-lg" />,
            ssr: false
        }
    ), []);

    const clientsWithLocation = useMemo(() => mockClients.filter(c => c.location), []);
    
    const clientVisitStatus = useMemo(() => {
        const statusMap = new Map<string, 'visited' | 'not-visited'>();
        const now = new Date();

        const sortedCobrancas = [...mockCobrancas].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        clientsWithLocation.forEach(client => {
        const lastCharge = sortedCobrancas.find(c => c.clientId === client.id);
        if (lastCharge && differenceInDays(now, lastCharge.createdAt) <= 25) {
            statusMap.set(client.id, 'visited');
        } else {
            statusMap.set(client.id, 'not-visited');
        }
        });
        return statusMap;
    }, [clientsWithLocation]);

    const isFullScreen = fullScreenMode !== 'none';

    return (
        <div className={cn(!isFullScreen && "space-y-6")}>
            <div className={cn(
                "flex items-center gap-3",
                isFullScreen && "hidden"
            )}>
                <Map className="h-8 w-8 text-muted-foreground" />
                <h1 className="text-3xl font-bold font-headline">
                    Rotas de Clientes
                </h1>
            </div>
            <div className={cn(
                "relative flex flex-col lg:flex-row gap-4",
                isFullScreen 
                    ? "fixed inset-0 z-50 bg-background p-4" 
                    : "h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)]"
            )}>
                
                {/* --- SHARED BUTTONS --- */}
                <Button
                    size="icon"
                    variant="outline"
                    className={cn(
                        "absolute top-2 left-2 z-20 bg-card/80 backdrop-blur-sm hidden",
                        isListCollapsed && !isFullScreen && 'lg:flex'
                    )}
                    onClick={() => setIsListCollapsed(false)}
                    aria-label="Mostrar lista de clientes"
                >
                    <PanelLeftOpen className="h-5 w-5" />
                </Button>

                <Button
                    size="icon"
                    variant="outline"
                    className={cn(
                        "absolute top-2 right-2 z-50 bg-card/80 backdrop-blur-sm",
                        !isFullScreen && 'hidden'
                    )}
                    onClick={() => setFullScreenMode('none')}
                    aria-label="Sair da tela cheia"
                >
                    <Minimize className="h-5 w-5" />
                </Button>

                {/* --- RENDER LOGIC --- */}
                
                {/* List View (Normal or Fullscreen) */}
                {(fullScreenMode === 'none' || fullScreenMode === 'list') && (
                    <Card className={cn(
                        "flex flex-col transition-all duration-300 ease-in-out",
                        // Fullscreen
                        fullScreenMode === 'list' && "h-full w-full",
                        // Normal
                        fullScreenMode === 'none' && "h-1/3 lg:h-full",
                        isListCollapsed && fullScreenMode === 'none' ? 'lg:w-0 lg:scale-x-0 lg:opacity-0 lg:p-0 lg:border-0' : 'lg:w-1/3'
                    )} style={fullScreenMode === 'none' ? {transformOrigin: 'left'} : {}}>
                        <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 p-4">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <List className="h-6 w-6 shrink-0" />
                                <CardTitle className="text-xl truncate">Clientes</CardTitle>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className={cn(fullScreenMode !== 'none' && "hidden")}
                                    onClick={() => setFullScreenMode('list')}
                                    aria-label="Expandir lista"
                                >
                                    <Maximize className="h-5 w-5" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className={cn("hidden", fullScreenMode === 'none' && "lg:flex")}
                                    onClick={() => setIsListCollapsed(true)}
                                    aria-label="Esconder lista de clientes"
                                >
                                    <PanelLeftClose className="h-5 w-5" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-hidden">
                            <ScrollArea className="h-full px-2">
                                <div className="space-y-2 py-2">
                                    {clientsWithLocation.map(client => {
                                        const visitStatus = clientVisitStatus.get(client.id) || 'not-visited';
                                        return (
                                            <Button
                                                key={client.id}
                                                variant={selectedClient?.id === client.id ? "secondary" : "ghost"}
                                                className="w-full justify-start h-auto py-2"
                                                onClick={() => setSelectedClient(client)}
                                            >
                                                <div className="flex items-center gap-3 w-full">
                                                    <User className="h-5 w-5 text-muted-foreground" />
                                                    <div className="text-left flex-1">
                                                        <p className="font-semibold">{client.name}</p>
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-xs text-muted-foreground">{client.route}</p>
                                                            <Badge variant={visitStatus === 'visited' ? 'success' : 'destructive'} className="text-xs font-normal">
                                                                {visitStatus === 'visited' ? 'Visitado' : 'Não Visitado'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Button>
                                        )
                                    })}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                )}
                
                {/* Map View (Normal or Fullscreen) */}
                {(fullScreenMode === 'none' || fullScreenMode === 'map') && (
                    <div className={cn(
                        "flex-1",
                        fullScreenMode === 'map' ? "h-full w-full" : "h-2/3 lg:h-full",
                    )}>
                      <Card className="h-full">
                          <CardContent className="p-0 h-full relative">
                              <ClientMap clients={clientsWithLocation} selectedClient={selectedClient} />
                              <Button
                                  size="icon"
                                  variant="outline"
                                  className={cn(
                                      "absolute top-2 right-2 z-10 bg-card/80 backdrop-blur-sm",
                                      fullScreenMode !== 'none' && 'hidden'
                                  )}
                                  onClick={() => setFullScreenMode('map')}
                                  aria-label="Expandir mapa"
                              >
                                  <Maximize className="h-5 w-5" />
                              </Button>
                          </CardContent>
                      </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
