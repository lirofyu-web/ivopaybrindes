'use client'
import Link from 'next/link';
import { PlusCircle, Users, Search, Home, Percent, Edit, Trash2, DollarSign, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Client, Prize, Cobranca } from '@/lib/types';
import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { mockClients } from '@/lib/mock-clients';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockPrizes } from '@/lib/mock-prizes';
import { mockCobrancas } from '@/lib/mock-cobrancas';
import { Badge } from '@/components/ui/badge';
import { differenceInDays } from 'date-fns';
import { buttonVariants } from '@/components/ui/button';


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
  kitStatus: z.enum(['manteve', 'novo']).optional(),
  cartelaStatus: z.enum(['manteve', 'nova']).optional(),
  prizesGiven: z.array(z.object({
    prizeId: z.string(),
    prizeName: z.string(),
    quantity: z.coerce.number().min(1),
  })).optional(),
});


// --- ClientCard component ---
function ClientCard({ client, onChargeClick, onDeleteClick, visitStatus }: { client: Client; onChargeClick: (client: Client) => void; onDeleteClick: (client: Client) => void; visitStatus: 'visited' | 'not-visited' }) {
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
                 <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold text-accent">{client.name}</h3>
                    <Badge variant={visitStatus === 'visited' ? 'success' : 'destructive'} className="text-xs font-normal">
                      {visitStatus === 'visited' ? 'Visitado' : 'Não Visitado'}
                    </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <p>{client.route}</p>
                    <span className="text-xs">&bull;</span>
                    <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${statusColor}`}></span>
                        <span className="capitalize">{client.status}</span>
                    </span>
                </div>
            </div>
            <a href={`https://wa.me/${client.phone}`} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="w-6 h-6"/>
                <span className="sr-only">WhatsApp</span>
            </a>
        </div>

        <div className="space-y-2 text-sm text-foreground/80">
            <div className="flex items-center gap-3">
                <Home className="w-4 h-4 text-muted-foreground" />
                <span>{client.address}, {client.city}</span>
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
            <Link href={`/clientes/editar/${client.id}`}>
              <Button size="icon" variant="outline" className="border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 hover:text-yellow-400">
                  <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="icon" variant="outline" className="border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400" onClick={() => onDeleteClick(client)}>
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Main Page Component ---
export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [isChargeDialogOpen, setIsChargeDialogOpen] = useState(false);
  const [isSubmittingCharge, setIsSubmittingCharge] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const { toast } = useToast();

  const [newlyAddedCobrancas, setNewlyAddedCobrancas] = useState<Cobranca[]>([]);
  const allCobrancas = useMemo(() => [...newlyAddedCobrancas, ...mockCobrancas], [newlyAddedCobrancas]);

  // State for prizes in the dialog
  const [prizesForCharge, setPrizesForCharge] = useState<{prizeId: string, prizeName: string, quantity: number}[]>([]);
  const [selectedPrizeForAdd, setSelectedPrizeForAdd] = useState<Prize | null>(null);
  const [prizeQuantity, setPrizeQuantity] = useState(1);

  const form = useForm<z.infer<typeof chargeFormSchema>>({
    resolver: zodResolver(chargeFormSchema),
    defaultValues: { scratchedAmount: 0, discount: 0, prizesGiven: [] },
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
    setPrizesForCharge([]);
    setSelectedPrizeForAdd(null);
    setPrizeQuantity(1);
  };

  const handleChargeDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedClient(null);
    }
    setIsChargeDialogOpen(open);
  }

  const handleDeleteRequest = (client: Client) => {
    setClientToDelete(client);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!clientToDelete) return;
    setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
    toast({
      title: 'Cliente Excluído!',
      description: `O cliente "${clientToDelete.name}" foi removido com sucesso.`,
      variant: 'destructive'
    });
    setIsDeleteDialogOpen(false);
    setClientToDelete(null);
  };

  const handleAddPrizeToCharge = () => {
    if (!selectedPrizeForAdd || prizeQuantity <= 0) return;
    
    if (prizeQuantity > selectedPrizeForAdd.quantity) {
        toast({
            variant: 'destructive',
            title: 'Estoque Insuficiente',
            description: `Só existem ${selectedPrizeForAdd.quantity} unidades de ${selectedPrizeForAdd.name} em estoque.`
        });
        return;
    }

    const newPrizeEntry = { prizeId: selectedPrizeForAdd.id, prizeName: selectedPrizeForAdd.name, quantity: prizeQuantity };
    
    setPrizesForCharge(prev => {
        const existingPrizeIndex = prev.findIndex(p => p.prizeId === newPrizeEntry.prizeId);
        let updatedPrizes;
        if (existingPrizeIndex > -1) {
            updatedPrizes = [...prev];
            updatedPrizes[existingPrizeIndex].quantity += newPrizeEntry.quantity;
        } else {
            updatedPrizes = [...prev, newPrizeEntry];
        }
        form.setValue('prizesGiven', updatedPrizes);
        return updatedPrizes;
    });
    
    // Reset fields
    setSelectedPrizeForAdd(null);
    setPrizeQuantity(1);
  };
  
  const handleRemovePrizeFromCharge = (prizeId: string) => {
      const updatedPrizes = prizesForCharge.filter(p => p.prizeId !== prizeId);
      setPrizesForCharge(updatedPrizes);
      form.setValue('prizesGiven', updatedPrizes);
  };

  const onChargeSubmit = (values: z.infer<typeof chargeFormSchema>) => {
    if (!selectedClient) return;
    setIsSubmittingCharge(true);
    
    const newCharge: Cobranca = {
        id: `cobranca-${Date.now()}`,
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        route: selectedClient.route,
        createdAt: new Date(),
        scratchedAmount: values.scratchedAmount,
        scratchPrice: selectedClient.raspinha,
        commissionPercentage: selectedClient.comissao,
        grossRevenue: chargeCalculations.grossRevenue,
        commissionValue: chargeCalculations.commissionValue,
        netRevenue: chargeCalculations.finalNetRevenue,
        discount: values.discount,
        kitStatus: values.kitStatus,
        cartelaStatus: values.cartelaStatus,
        prizesGiven: prizesForCharge,
    };
    
    console.log(newCharge);

    // In a real app, you'd save this to a database and update prize stock.
    // For this mock implementation, we add it to a state to see the visit status update.
    setNewlyAddedCobrancas(prev => [newCharge, ...prev]);

    setTimeout(() => {
      toast({
        title: 'Cobrança Salva!',
        description: `A cobrança para ${selectedClient?.name} foi registrada com sucesso.`,
      });
      setIsSubmittingCharge(false);
      handleChargeDialogClose(false);
    }, 500);
  };

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    return clients.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.route.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, clients]);

  const clientVisitStatus = useMemo(() => {
    const statusMap = new Map<string, 'visited' | 'not-visited'>();
    const now = new Date();
    
    const sortedCobrancas = [...allCobrancas].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    clients.forEach(client => {
      const lastCharge = sortedCobrancas.find(c => c.clientId === client.id);
      if (lastCharge && differenceInDays(now, lastCharge.createdAt) <= 25) {
        statusMap.set(client.id, 'visited');
      } else {
        statusMap.set(client.id, 'not-visited');
      }
    });
    return statusMap;
  }, [allCobrancas, clients]);

  const clientsByRoute = useMemo(() => {
    return filteredClients.reduce((acc, client) => {
      const route = client.route;
      if (!acc[route]) {
        acc[route] = [];
      }
      acc[route].push(client);
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
                placeholder="Buscar por nome ou rota..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        <div className="space-y-8">
            {Object.entries(clientsByRoute).sort(([routeA], [routeB]) => routeA.localeCompare(routeB)).map(([route, clients]) => (
                <div key={route} className="space-y-4">
                    <h2 className="text-xl font-semibold border-b border-border pb-2">{route}</h2>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {clients.map(client => (
                            <ClientCard 
                                key={client.id} 
                                client={client} 
                                onChargeClick={handleOpenChargeDialog}
                                onDeleteClick={handleDeleteRequest}
                                visitStatus={clientVisitStatus.get(client.id) || 'not-visited'}
                             />
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
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Nova Cobrança para {selectedClient?.name}</DialogTitle>
                    <DialogDescription>
                    Insira os detalhes da venda para calcular e salvar a cobrança.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onChargeSubmit)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="scratchedAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Qtd. Raspadinhas</FormLabel>
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
                        </div>
                        
                        <Separator/>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="kitStatus"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>Kit</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="flex flex-col space-y-1"
                                            >
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl><RadioGroupItem value="manteve" /></FormControl>
                                                    <FormLabel className="font-normal">Manteve kit</FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl><RadioGroupItem value="novo" /></FormControl>
                                                    <FormLabel className="font-normal">Novo kit</FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="cartelaStatus"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>Cartela</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="flex flex-col space-y-1"
                                            >
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl><RadioGroupItem value="manteve" /></FormControl>
                                                    <FormLabel className="font-normal">Manteve cartela</FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl><RadioGroupItem value="nova" /></FormControl>
                                                    <FormLabel className="font-normal">Nova cartela</FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Separator/>
                        
                        <div className="space-y-4">
                            <h4 className="font-medium">Prêmios que saíram</h4>
                            <div className="space-y-2">
                                {prizesForCharge.map(p => (
                                    <div key={p.prizeId} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                                        <span>{p.prizeName} <span className="text-muted-foreground">x{p.quantity}</span></span>
                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemovePrizeFromCharge(p.prizeId)}>
                                            <X className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                ))}
                                {prizesForCharge.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Nenhum prêmio adicionado.</p>}
                            </div>
                            <div className="flex gap-2 items-end">
                                <FormItem className="flex-1">
                                    <FormLabel>Prêmio</FormLabel>
                                    <Select onValueChange={(prizeId) => setSelectedPrizeForAdd(mockPrizes.find(p => p.id === prizeId) || null)} value={selectedPrizeForAdd?.id || ''}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione um prêmio" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {mockPrizes.filter(p => p.quantity > 0).map(prize => (
                                                <SelectItem key={prize.id} value={prize.id}>
                                                    <div className="flex justify-between w-full">
                                                        <span>{prize.name}</span>
                                                        <span className="text-muted-foreground text-xs">Estoque: {prize.quantity}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                                <FormItem className="w-24">
                                    <FormLabel>Qtd.</FormLabel>
                                    <Input type="number" min="1" value={prizeQuantity} onChange={e => setPrizeQuantity(Number(e.target.value))} />
                                </FormItem>
                                <Button type="button" variant="secondary" onClick={handleAddPrizeToCharge} disabled={!selectedPrizeForAdd}>Adicionar</Button>
                            </div>
                        </div>


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
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o cliente
                        <span className="font-bold"> {clientToDelete?.name} </span>
                        e todos os seus dados associados.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setClientToDelete(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        className={buttonVariants({ variant: "destructive" })}
                        onClick={handleConfirmDelete}
                    >
                        Excluir
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
