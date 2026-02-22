'use client'
import Link from 'next/link';
import { PlusCircle, Users, Search, Home, Percent, Edit, Trash2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Client } from '@/lib/types';
import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { mockClients } from '@/lib/mock-clients';

// --- ClientCard component ---

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-green-400 hover:text-green-300"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
  );
}

function ClientCard({ client }: { client: Client }) {
  const statusColor =
    client.status === 'active'
      ? 'bg-green-500'
      : client.status === 'inactive'
      ? 'bg-red-500'
      : 'bg-yellow-500';

  return (
    <Card className="bg-card/80 overflow-hidden shadow-lg border-border/50">
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-start">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-accent">{client.name}</h3>
                    <span className={`w-2.5 h-2.5 rounded-full ${statusColor}`}></span>
                </div>
                <p className="text-sm text-muted-foreground">{client.city}</p>
            </div>
            <a href={`https://wa.me/${client.phone}`} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="w-6 h-6"/>
                <span className="sr-only">WhatsApp</span>
            </a>
        </div>

        <div className="space-y-2 text-sm text-foreground/80">
            <div className="flex items-center gap-3">
                <Home className="w-4 h-4 text-muted-foreground" />
                <span>{client.address}</span>
            </div>
            <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span>Raspinha: R$ {client.raspinha.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-3">
                <Percent className="w-4 h-4 text-muted-foreground" />
                <span>Comissão: {client.comissao}%</span>
            </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
            <Button size="sm" className="flex-1">
                <DollarSign className="mr-2 h-4 w-4" />
                Nova Cobrança
            </Button>
            <Button size="icon" variant="outline" className="border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 hover:text-yellow-400">
                <Edit className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" className="border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400">
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Main Page Component ---
export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = useMemo(() => {
    if (!searchTerm) return mockClients;
    return mockClients.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const clientsByCity = useMemo(() => {
    return filteredClients.reduce((acc, client) => {
      const city = client.city;
      if (!acc[city]) {
        acc[city] = [];
      }
      acc[city].push(client);
      return acc;
    }, {} as Record<string, Client[]>);
  }, [filteredClients]);

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-muted-foreground" />
                <h1 className="text-3xl font-bold font-headline">
                    Gerenciar Clientes
                </h1>
            </div>
            <Link href="/clientes/novo">
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo Cliente
                </Button>
            </Link>
        </div>
        
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
                placeholder="Buscar por nome ou cidade..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        <div className="space-y-8">
            {Object.entries(clientsByCity).sort(([cityA], [cityB]) => cityA.localeCompare(cityB)).map(([city, clients]) => (
                <div key={city} className="space-y-4">
                    <h2 className="text-xl font-semibold border-b border-border pb-2">{city}</h2>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {clients.map(client => (
                            <ClientCard key={client.id} client={client} />
                        ))}
                    </div>
                </div>
            ))}
            {filteredClients.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <p>Nenhum cliente encontrado.</p>
                </div>
            )}
        </div>
    </div>
  );
}
