'use client'
import Link from 'next/link';
import { PlusCircle, Users, Search, Home, Percent, Edit, Trash2, DollarSign, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Client } from '@/lib/types';
import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { mockClients } from '@/lib/mock-clients';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Separator } from '@/components/ui/separator';


function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// --- WhatsApp Icon ---
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

// --- Charge Form Schema ---
const chargeFormSchema = z.object({
  scratchedAmount: z.coerce.number().min(1, 'A quantidade deve ser pelo menos 1.'),
  discount: z.coerce.number().optional(),
});


// --- ClientCard component ---
function ClientCard({ client, onChargeClick }: { client: Client; onChargeClick: (client: Client) => void; }) {
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
                <span>Raspinha: {formatCurrency(client.raspinha)}</span>
            </div>
            <div className="flex items-center gap-3">
                <Percent className="w-4 h-4 text-muted-foreground" />
                <span>Comissão: {client.comissao}%</span>
            </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
            <Button size="sm" className="flex-1" onClick={() => onChargeClick(client)}>
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
  const [isChargeDialogOpen, setIsChargeDialogOpen] = useState(false);
  const [isSubmittingCharge, setIsSubmittingCharge] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof chargeFormSchema>>({
    resolver: zodResolver(chargeFormSchema),
    defaultValues: { scratchedAmount: 0, discount: 0 },
  });
  
  const scratchedAmount = form.watch('scratchedAmount');
  const discount = form.watch('discount') || 0;

  const chargeCalculations = useMemo(() => {
    if (!selectedClient || !scratchedAmount) {
      return { grossRevenue: 0, commissionValue: 0, netRevenue: 0, finalNetRevenue: 0 };
    }
    const grossRevenue = scratchedAmount * selectedClient.raspinha;
    const commissionValue = grossRevenue * (selectedClient.comissao / 100);
    const netRevenue = grossRevenue - commissionValue;
    const finalNetRevenue = netRevenue - discount;
    return { grossRevenue, commissionValue, netRevenue, finalNetRevenue };
  }, [selectedClient, scratchedAmount, discount]);


  const handleOpenChargeDialog = (client: Client) => {
    setSelectedClient(client);
    setIsChargeDialogOpen(true);
    form.reset();
  };

  const handleChargeDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedClient(null);
    }
    setIsChargeDialogOpen(open);
  }

  const onChargeSubmit = (values: z.infer<typeof chargeFormSchema>) => {
    setIsSubmittingCharge(true);
    
    // In a real app, you'd save this to a database.
    // For now, we just simulate with a toast message.
    console.log({
        clientId: selectedClient?.id,
        ...values,
        ...chargeCalculations
    });

    setTimeout(() => {
      toast({
        title: 'Cobrança Salva!',
        description: `A cobrança para ${selectedClient?.name} foi registrada com sucesso.`,
      });
      setIsSubmittingCharge(false);
      handleChargeDialogClose(false);
    }, 1000);
  };

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
                            <ClientCard key={client.id} client={client} onChargeClick={handleOpenChargeDialog} />
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
        <Dialog open={isChargeDialogOpen} onOpenChange={handleChargeDialogClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Nova Cobrança para {selectedClient?.name}</DialogTitle>
                    <DialogDescription>
                    Insira a quantidade de raspadinhas vendidas para calcular e salvar a cobrança.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onChargeSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="scratchedAmount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Quantidade de Raspadinhas Vendidas</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Ex: 100" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="discount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Desconto (R$)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Ex: 10,00" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        {scratchedAmount > 0 && selectedClient && (
                            <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
                                <h4 className="font-semibold text-center">Resumo da Cobrança</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Bruto ({scratchedAmount} x {formatCurrency(selectedClient.raspinha)})</span>
                                        <span>{formatCurrency(chargeCalculations.grossRevenue)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Comissão do Cliente ({selectedClient.comissao}%)</span>
                                        <span className="text-destructive">-{formatCurrency(chargeCalculations.commissionValue)}</span>
                                    </div>
                                    {discount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Desconto</span>
                                        <span className="text-destructive">-{formatCurrency(discount)}</span>
                                    </div>
                                    )}
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center text-base font-bold">
                                    <span>Valor Líquido (para a empresa)</span>
                                    <span className="text-primary">{formatCurrency(chargeCalculations.finalNetRevenue)}</span>
                                </div>
                            </div>
                        )}

                        <Button type="submit" disabled={isSubmittingCharge || !scratchedAmount} className="w-full">
                            {isSubmittingCharge && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Cobrança
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    </div>
  );
}
