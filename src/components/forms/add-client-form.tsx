'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Globe, Loader2, X } from 'lucide-react';
import type { Prize, Client } from '@/lib/types';
import { mockPrizes } from '@/lib/mock-prizes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  phone: z.string().min(10, 'Telefone inválido (inclua DDD).').max(15, 'Telefone inválido.'),
  address: z.string().min(2, 'Endereço deve ter pelo menos 2 caracteres.'),
  city: z.string().min(5, 'Cidade / Estado deve ter pelo menos 5 caracteres.'),
  route: z.string().min(2, 'A rota deve ter pelo menos 2 caracteres.'),
  raspinha: z.coerce.number().min(0, 'O valor deve ser positivo.'),
  comissao: z.coerce.number().min(0, 'A comissão deve ser positiva.').max(100, 'A comissão não pode passar de 100%.'),
  location: z
    .object({ lat: z.number(), lng: z.number() })
    .optional(),
  prizes: z.array(z.object({
    prizeId: z.string(),
    prizeName: z.string(),
    quantity: z.coerce.number().min(1),
  })).optional(),
});

export function AddClientForm({ client }: { client?: Client & {prizes?: any[]} }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationStatus, setLocationStatus] = useState('Salvar localização atual');
  const [isLocating, setIsLocating] = useState(false);

  const [initialPrizes, setInitialPrizes] = useState<{prizeId: string, prizeName: string, quantity: number}[]>([]);
  const [selectedPrizeForAdd, setSelectedPrizeForAdd] = useState<Prize | null>(null);
  const [prizeQuantity, setPrizeQuantity] = useState(1);
  
  const isEditing = !!client;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditing ? {
      ...client,
      route: client.route || '',
      city: client.city || '',
      prizes: client.prizes || [] 
    } : {
      name: '',
      phone: '',
      address: '',
      city: '',
      route: '',
      raspinha: 2.0,
      comissao: 25,
      prizes: []
    },
  });

  useEffect(() => {
    if (isEditing && client.location) {
        setLocationStatus('Localização salva!');
    }
    if (isEditing && client.prizes) {
        setInitialPrizes(client.prizes);
        form.setValue('prizes', client.prizes);
    }
  }, [client, isEditing, form]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    setTimeout(() => {
      try {
        const storedClientsRaw = localStorage.getItem('mrd-brindes-clients');
        const storedClients: Client[] = storedClientsRaw ? JSON.parse(storedClientsRaw).map((c: any) => ({...c, createdAt: new Date(c.createdAt)})) : [];
        
        let updatedClients: Client[];

        if (isEditing && client) {
            updatedClients = storedClients.map(c => c.id === client.id ? { ...c, ...values } : c);
            toast({
              title: 'Sucesso!',
              description: `Cliente "${values.name}" atualizado.`,
            });
        } else {
            const newClient: Client = {
                id: `client-${Date.now()}`,
                status: 'active',
                createdAt: new Date(),
                ...values,
            };
            updatedClients = [newClient, ...storedClients];
            toast({
              title: 'Sucesso!',
              description: `Cliente "${values.name}" adicionado.`,
            });
        }

        localStorage.setItem('mrd-brindes-clients', JSON.stringify(updatedClients));

        setIsSubmitting(false);
        if (isEditing) {
          router.push('/clientes');
          router.refresh();
        } else {
          form.reset({
            name: '',
            phone: '',
            address: '',
            city: '',
            route: '',
            raspinha: 2.0,
            comissao: 25,
            prizes: []
          });
          setLocationStatus('Salvar localização atual');
          setInitialPrizes([]);
          setSelectedPrizeForAdd(null);
          setPrizeQuantity(1);
        }
      } catch (error) {
        console.error("Failed to save to localStorage", error);
        toast({
          title: 'Erro!',
          description: 'Não foi possível salvar os dados do cliente.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
      }
    }, 1000);
  }
  
  const handleLocation = () => {
    if (!navigator.geolocation) {
        setLocationStatus('Geolocalização não suportada.');
        return;
    }
    setIsLocating(true);
    setLocationStatus('Buscando...');
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            form.setValue('location', { lat: latitude, lng: longitude }, { shouldValidate: true });
            setLocationStatus('Localização salva!');
            setIsLocating(false);
            toast({
                title: 'Localização obtida!',
                description: 'A localização atual foi salva com sucesso.'
            })
        },
        (error) => {
            console.error(error);
            setLocationStatus('Erro ao buscar. Tente novamente.');
            setIsLocating(false);
            toast({
                title: 'Erro de localização',
                description: 'Não foi possível obter a localização. Verifique as permissões do navegador.',
                variant: 'destructive'
            })
        }
    );
  };

  const handleAddPrize = () => {
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
    
    setInitialPrizes(prev => {
        const existingPrizeIndex = prev.findIndex(p => p.prizeId === newPrizeEntry.prizeId);
        let updatedPrizes;
        if (existingPrizeIndex > -1) {
            updatedPrizes = [...prev];
            updatedPrizes[existingPrizeIndex].quantity += newPrizeEntry.quantity;
        } else {
            updatedPrizes = [...prev, newPrizeEntry];
        }
        form.setValue('prizes', updatedPrizes);
        return updatedPrizes;
    });
    
    setSelectedPrizeForAdd(null);
    setPrizeQuantity(1);
  };
  
  const handleRemovePrize = (prizeId: string) => {
      const updatedPrizes = initialPrizes.filter(p => p.prizeId !== prizeId);
      setInitialPrizes(updatedPrizes);
      form.setValue('prizes', updatedPrizes);
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: João da Silva" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone (com atalho para WhatsApp)</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="Ex: 11987654321" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Rua das Flores, 123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cidade / Estado</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Goiânia - GO" {...field} />
              </FormControl>
              <FormDescription>
                A cidade e o estado onde o cliente está localizado.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="route"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rota / Região de Cobrança</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Goiânia - Setor Sul" {...field} />
              </FormControl>
              <FormDescription>
                Esta região será usada para agrupar clientes e facilitar os acertos e relatórios.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="raspinha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor da Raspinha (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="Ex: 2.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comissao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comissão (%)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ex: 25" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <FormItem>
            <FormLabel>Localização</FormLabel>
            <Button type="button" variant="outline" className="w-full" onClick={handleLocation} disabled={isLocating}>
                {isLocating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
                {locationStatus}
            </Button>
        </FormItem>

        <Separator />

        <div className="space-y-4">
            <h4 className="font-medium">Prêmios Iniciais (Kit)</h4>
            <div className="space-y-2">
                {initialPrizes.map(p => (
                    <div key={p.prizeId} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                        <span>{p.prizeName} <span className="text-muted-foreground">x{p.quantity}</span></span>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemovePrize(p.prizeId)}>
                            <X className="h-4 w-4"/>
                        </Button>
                    </div>
                ))}
                {initialPrizes.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Nenhum prêmio adicionado ao kit inicial.</p>}
            </div>
            <div className="flex gap-2 items-end">
                <FormItem className="flex-1">
                    <FormLabel>Adicionar Prêmio</FormLabel>
                    <Select onValueChange={(prizeId) => setSelectedPrizeForAdd(mockPrizes.find(p => p.id === prizeId) || null)} value={selectedPrizeForAdd?.id || ''}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um prêmio" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {mockPrizes.map(prize => (
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
                <Button type="button" variant="secondary" onClick={handleAddPrize} disabled={!selectedPrizeForAdd}>Adicionar</Button>
            </div>
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Salvar Alterações' : 'Salvar Cliente'}
        </Button>
      </form>
    </Form>
  );
}
