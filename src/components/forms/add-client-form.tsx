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
import { useToast } from '@/hooks/use-toast';
import { Globe, Loader2, X, Plus } from 'lucide-react';
import type { Prize, Client, Route } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { useCollection, useFirestore } from '@/firebase';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { useSuccessAnimation } from '@/components/success-animation-provider';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  phone: z.string().min(10, 'Telefone inválido (inclua DDD).').max(15, 'Telefone inválido.'),
  address: z.string().min(2, 'Endereço deve ter pelo menos 2 caracteres.'),
  city: z.string().min(5, 'Cidade / Estado deve ter pelo menos 5 caracteres.'),
  route: z.string().min(1, 'Você deve selecionar uma rota.'),
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

export function AddClientForm({ client }: { client?: Client }) {
  const router = useRouter();
  const firestore = useFirestore();
  const { triggerSuccess } = useSuccessAnimation();
  const { data: routes, isLoading: isLoadingRoutes } = useCollection<Route>('rotas');
  const { data: prizes, isLoading: isLoadingPrizes } = useCollection<Prize>('premios');
  const { toast } = useToast();

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
      prizes: [],
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


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;
    setIsSubmitting(true);

    const clientData = {
      ...values,
      createdAt: client?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    
    try {
      if (isEditing && client?.id) {
          const clientDocRef = doc(firestore, 'clients', client.id);
          await updateDoc(clientDocRef, clientData);
          triggerSuccess();
          toast({
            title: 'Sucesso!',
            description: `Cliente "${values.name}" atualizado.`,
          });
          router.push('/clientes');
      } else {
          await addDoc(collection(firestore, 'clients'), { ...clientData, status: 'active' });
          triggerSuccess();
          toast({
            title: 'Sucesso!',
            description: `Cliente "${values.name}" adicionado.`,
          });
          form.reset();
          setLocationStatus('Salvar localização atual');
          setInitialPrizes([]);
      }
    } catch (error) {
      console.error("Failed to save client:", error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível salvar os dados do cliente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const handleLocation = () => {
    if (!navigator.geolocation) {
        setLocationStatus('Geolocalização não suportada.');
        return;
    }
    setIsLocating(true);
    setLocationStatus('Buscando...');
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            form.setValue('location', { lat: latitude, lng: longitude }, { shouldValidate: true });

            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
                if (!response.ok) throw new Error('Falha ao buscar endereço.');

                const data = await response.json();
                
                if (data.address) {
                    const city = data.address.city || data.address.town || data.address.village;
                    const state = data.address.state;
                    const road = data.address.road;
                    const house_number = data.address.house_number;
                    
                    if (city && state) {
                        form.setValue('city', `${city} - ${state}`, { shouldValidate: true });
                    }
                    if (road) {
                       form.setValue('address', `${road}${house_number ? ', ' + house_number : ''}`, { shouldValidate: true });
                    }
                    toast({
                        title: 'Localização obtida!',
                        description: 'Endereço preenchido automaticamente.'
                    })
                }
            } catch (error) {
                console.error("Erro ao buscar endereço:", error);
            } finally {
                setLocationStatus('Localização salva!');
                setIsLocating(false);
            }
        },
        (error) => {
            console.error(error);
            setLocationStatus('Erro ao buscar.');
            setIsLocating(false);
            toast({
                title: 'Erro de localização',
                description: 'Verifique as permissões do navegador.',
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
            description: `Apenas ${selectedPrizeForAdd.quantity} disponíveis.`
        });
        return;
    }

    const newPrizeEntry = { prizeId: selectedPrizeForAdd.id!, prizeName: selectedPrizeForAdd.name, quantity: prizeQuantity };
    
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

  const isLoading = isLoadingRoutes || isLoadingPrizes;

  if (isLoading) {
    return (
       <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-sm font-semibold">Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: João da Silva" className="h-11" {...field} />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-sm font-semibold">Telefone</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="Ex: 11987654321" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="route"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-sm font-semibold">Rota</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger className="h-11">
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {routes?.map(route => (
                                <SelectItem key={route.id} value={route.name}>{route.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-sm font-semibold">Endereço</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Rua das Flores, 123" className="h-11" {...field} />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-sm font-semibold">Cidade / Estado</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Goiânia - GO" className="h-11" {...field} />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="raspinha"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-sm font-semibold">Raspinha (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comissao"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-sm font-semibold">Comissão (%)</FormLabel>
                  <FormControl>
                    <Input type="number" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
        </div>

        <FormItem className="space-y-1">
            <FormLabel className="text-sm font-semibold">Localização GPS</FormLabel>
            <Button 
                type="button" 
                variant="outline" 
                className="w-full h-11 border-primary/30 text-primary hover:bg-primary/5" 
                onClick={handleLocation} 
                disabled={isLocating}
            >
                {isLocating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
                {locationStatus}
            </Button>
        </FormItem>

        <Separator className="my-2" />

        <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                Kit de Prêmios
            </h4>
            
            <div className="flex flex-wrap gap-2">
                {initialPrizes.map(p => (
                    <Badge key={p.prizeId} variant="secondary" className="pl-3 pr-1 py-1 gap-1 text-xs">
                        {p.prizeName} x{p.quantity}
                        <Button type="button" variant="ghost" size="icon" className="h-4 w-4 rounded-full" onClick={() => handleRemovePrize(p.prizeId)}>
                            <X className="h-3 w-3"/>
                        </Button>
                    </Badge>
                ))}
                {initialPrizes.length === 0 && (
                    <p className="text-xs text-muted-foreground italic w-full text-center py-2 border border-dashed rounded-md bg-muted/20">
                        Nenhum item no kit inicial.
                    </p>
                )}
            </div>

            <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormItem className="space-y-1">
                        <FormLabel className="text-xs">Item</FormLabel>
                        <Select onValueChange={(id) => setSelectedPrizeForAdd(prizes?.find(p => p.id === id) || null)} value={selectedPrizeForAdd?.id || ''}>
                            <FormControl>
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Escolher" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {prizes?.map(prize => (
                                    <SelectItem key={prize.id} value={prize.id!}>
                                        {prize.name} ({prize.quantity})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormItem>
                    <div className="flex gap-2 items-end">
                        <FormItem className="flex-1 space-y-1">
                            <FormLabel className="text-xs">Qtd.</FormLabel>
                            <Input type="number" min="1" value={prizeQuantity} onChange={e => setPrizeQuantity(Number(e.target.value))} className="h-9 text-xs" />
                        </FormItem>
                        <Button type="button" variant="secondary" size="sm" onClick={handleAddPrize} disabled={!selectedPrizeForAdd} className="h-9">
                            <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                    </div>
                </div>
            </div>
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-base font-bold shadow-xl">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditing ? 'Atualizar Cliente' : 'Finalizar Cadastro')}
        </Button>
      </form>
    </Form>
  );
}
