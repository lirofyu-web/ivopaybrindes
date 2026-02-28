'use client';

import { useMemo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { Client, Cobranca } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Map as MapIcon, Search, Maximize, Minimize, Printer } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { differenceInDays, format } from 'date-fns';
import { useCollection } from '@/firebase';
import ReactDOMServer from 'react-dom/server';

// Componente Interno para o Relatório de Impressão
const TripReport = ({ clients, routeName }: { clients: Client[], routeName?: string }) => (
  <div className="p-8 bg-white text-black font-sans">
    <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
      <div>
        <h1 className="text-2xl font-bold uppercase">Relatório de Viagem</h1>
        <p className="text-sm">MRD Brindes - Guia de Visitação</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold">Data: {format(new Date(), 'dd/MM/yyyy')}</p>
        {routeName && <p className="text-sm">Rota: {routeName}</p>}
      </div>
    </div>

    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b-2 border-black">
          <th className="py-2 px-1 text-left text-xs w-12 text-center">SIM</th>
          <th className="py-2 px-1 text-left text-xs w-12 text-center">NÃO</th>
          <th className="py-2 px-2 text-left text-xs">CLIENTE</th>
          <th className="py-2 px-2 text-left text-xs">CIDADE</th>
          <th className="py-2 px-2 text-left text-xs">ENDEREÇO</th>
        </tr>
      </thead>
      <tbody>
        {clients.map((client, index) => (
          <tr key={client.id || index} className="border-b border-gray-300">
            <td className="py-3 px-1 text-center"><div className="w-5 h-5 border border-black mx-auto"></div></td>
            <td className="py-3 px-1 text-center"><div className="w-5 h-5 border border-black mx-auto"></div></td>
            <td className="py-3 px-2 text-sm font-bold uppercase">{client.name}</td>
            <td className="py-3 px-2 text-xs">{client.city}</td>
            <td className="py-3 px-2 text-[10px] leading-tight text-gray-700">{client.address}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <div className="mt-8 pt-4 border-t border-dashed border-gray-400">
      <p className="text-[10px] text-gray-500 text-center italic">Gerado via MRD Brindes App - Documento para uso em campo.</p>
    </div>
  </div>
);

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

    const handlePrintTrip = () => {
        if (clientsWithLocation.length === 0) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Por favor, habilite pop-ups para imprimir o relatório.');
            return;
        }

        const reportHtml = ReactDOMServer.renderToString(
            <TripReport 
                clients={clientsWithLocation} 
                routeName={searchTerm.length > 2 ? searchTerm : undefined} 
            />
        );

        printWindow.document.write(`
            <html>
                <head>
                    <title>Relatório de Viagem - MRD Brindes</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        @media print {
                            body { margin: 0; padding: 0; }
                            @page { margin: 1cm; }
                        }
                    </style>
                </head>
                <body>
                    ${reportHtml}
                </body>
            </html>
        `);

        printWindow.document.close();
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 500);
    };


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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <MapIcon className="h-8 w-8 text-muted-foreground" />
                    <h1 className="text-2xl sm:text-3xl font-bold font-headline">
                        Mapa de Clientes
                    </h1>
                </div>
                <Button 
                    variant="outline" 
                    className="h-11 shadow-sm border-primary/20 text-primary hover:bg-primary/5"
                    onClick={handlePrintTrip}
                    disabled={clientsWithLocation.length === 0}
                >
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir Viagem
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
                <Card className={cn(
                    "md:col-span-1 flex flex-col",
                    viewMode === 'map-full' && 'hidden',
                    viewMode === 'list-full' && 'md:col-span-3'
                )}>
                    <CardHeader className="p-4">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-base sm:text-lg">Clientes com Localização</CardTitle>
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
                                placeholder="Buscar cliente ou rota..."
                                className="pl-10 h-10"
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
                                        className="w-full justify-start h-auto py-2 px-3 border-b border-border/10 last:border-0"
                                        onClick={() => setSelectedClient(client)}
                                    >
                                        <div className="text-left w-full">
                                            <p className="font-semibold text-sm truncate">{client.name}</p>
                                            <div className="flex justify-between items-center">
                                                <p className="text-[10px] text-muted-foreground">{client.route}</p>
                                                <span className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    clientVisitStatus.get(client.id!) === 'visited' ? 'bg-green-500' : 'bg-red-500'
                                                )}></span>
                                            </div>
                                        </div>
                                    </Button>
                                )) : (
                                     <div className="text-center py-12 text-muted-foreground">
                                        <p className="text-sm">Nenhum cliente encontrado.</p>
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
