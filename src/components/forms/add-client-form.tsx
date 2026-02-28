'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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
  phone: z.string().min(10, 'Telefone inválido.').max(15, 'Telefone inválido.'),
  address: z.string().min(2, 'Endereço deve ter pelo menos 2 caracteres.'),
  city: z.string().min(5, 'Cidade / Estado deve ter pelo menos 5 caracteres.'),
  route: z.string().min(1, 'Selecione uma rota.'),
  raspinha: z.coerce.number().min(0, 'Valor positivo.'),
  comissao: z.coerce.number().min(0).max(100),
  location: z.object({ lat: z.number(), lng: z.number() }).optional(),
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
  const { data: routes } = useCollection<Route>('rotas');
  const { data: prizes } = useCollection<Prize>('premios');
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationStatus, setLocationStatus] = useState('Salvar localização GPS');
  const [isLocating, setIsLocating] = useState(false);
  const [initialPrizes, setInitialPrizes] = useState<{prizeId: string, prizeName: string, quantity: number}[]>([]);
  const [selectedPrizeForAdd, setSelectedPrizeForAdd] = useState<Prize | null>(null);
  const [prizeQuantity, setPrizeQuantity] = useState(1);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: client ? {
      ...client,
      route: client.route || '',
      city: client.city || '',
      prizes: client.prizes || [] 
    } : {
      name: '', phone: '', address: '', city: '', route: '', raspinha: 2.0, comissao: 25, prizes: [],
    },
  });

  useEffect(() => {
    if (client?.location) setLocationStatus('Localização salva!');
    if (client?.prizes) setInitialPrizes(client.prizes);
  }, [client]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!firestore) return;
    setIsSubmitting(true);

    const clientData: any = {
      ...values,
      updatedAt: new Date(),
    };

    if (!client) clientData.createdAt = new Date();
    
    // Limpeza de campos nulos ou indefinidos para evitar erros no Firestore
    Object.keys(clientData).forEach(key => (clientData[key] === undefined || clientData[key] === null) && delete clientData[key]);
    if (!values.location) delete clientData.location;
    if (!values.prizes || values.prizes.length === 0) delete clientData.prizes;
    
    try {
      if (client?.id) {
          await updateDoc(doc(firestore, 'clients', client.id), clientData);
          triggerSuccess();
          toast({ title: 'Sucesso!', description: 'Cliente atualizado.' });
          router.push('/clientes');
      } else {
          await addDoc(collection(firestore, 'clients'), { ...clientData, status: 'active' });
          triggerSuccess();
          toast({ title: 'Sucesso!', description: 'Cliente cadastrado.' });
          router.push('/clientes');
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro!', description: 'Falha ao salvar.' });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const handleLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    setLocationStatus('Buscando...');
    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const { latitude, longitude } = pos.coords;
            form.setValue('location', { lat: latitude, lng: longitude });
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
                const data = await res.json();
                if (data.address) {
                    const city = data.address.city || data.address.town || data.address.village;
                    if (city && data.address.state) form.setValue('city', `${city} - ${data.address.state}`);
                    if (data.address.road) form.setValue('address', `${data.address.road}${data.address.house_number ? ', ' + data.address.house_number : ''}`);
                    toast({ title: 'GPS OK!', description: 'Endereço atualizado.' });
                }
            } finally {
                setLocationStatus('Localização salva!');
                setIsLocating(false);
            }
        },
        () => {
            setLocationStatus('Erro ao buscar.');
            setIsLocating(false);
        }
    );
  };

  const handleAddPrize = () => {
    if (!selectedPrizeForAdd || prizeQuantity <= 0) return;
    const updated = [...initialPrizes];
    const idx = updated.findIndex(p => p.prizeId === selectedPrizeForAdd.id);
    if (idx > -1) updated[idx].quantity += prizeQuantity;
    else updated.push({ prizeId: selectedPrizeForAdd.id!, prizeName: selectedPrizeForAdd.name, quantity: prizeQuantity });
    setInitialPrizes(updated);
    form.setValue('prizes', updated);
    setSelectedPrizeForAdd(null);
    setPrizeQuantity(1);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>Nome Completo</FormLabel><FormControl><Input className="h-11" {...field} /></FormControl><FormMessage/></FormItem>
        )}/>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input type="tel" className="h-11" {...field} /></FormControl></FormItem>
            )}/>
            <FormField control={form.control} name="route" render={({ field }) => (
                <FormItem><FormLabel>Rota</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="h-11"><SelectValue placeholder="Selecione"/></SelectTrigger></FormControl>
                        <SelectContent>{routes?.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}</SelectContent>
                    </Select>
                </FormItem>
            )}/>
        </div>

        <FormField control={form.control} name="address" render={({ field }) => (
            <FormItem><FormLabel>Endereço</FormLabel><FormControl><Input className="h-11" {...field} /></FormControl></FormItem>
        )}/>

        <FormField control={form.control} name="city" render={({ field }) => (
            <FormItem><FormLabel>Cidade / Estado</FormLabel><FormControl><Input className="h-11" {...field} /></FormControl></FormItem>
        )}/>

        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="raspinha" render={({ field }) => (
                <FormItem><FormLabel>Raspinha (R$)</FormLabel><FormControl><Input type="number" step="0.01" className="h-11" {...field} /></FormControl></FormItem>
            )}/>
            <FormField control={form.control} name="comissao" render={({ field }) => (
                <FormItem><FormLabel>Comissão (%)</FormLabel><FormControl><Input type="number" className="h-11" {...field} /></FormControl></FormItem>
            )}/>
        </div>

        <Button type="button" variant="outline" className="w-full h-11 border-primary/30" onClick={handleLocation} disabled={isLocating}>
            {isLocating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
            {locationStatus}
        </Button>

        <Separator/>

        <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase text-muted-foreground">Kit de Prêmios Inicial</h4>
            <div className="flex flex-wrap gap-2">
                {initialPrizes.map(p => (
                    <Badge key={p.prizeId} variant="secondary" className="pl-3 pr-1 py-1 gap-1">
                        {p.prizeName} x{p.quantity}
                        <Button type="button" variant="ghost" size="icon" className="h-4 w-4 rounded-full" onClick={() => {
                            const up = initialPrizes.filter(x => x.prizeId !== p.prizeId);
                            setInitialPrizes(up); form.setValue('prizes', up);
                        }}><X className="h-3 w-3"/></Button>
                    </Badge>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 border rounded-lg bg-muted/20">
                <Select onValueChange={(id) => setSelectedPrizeForAdd(prizes?.find(p => p.id === id) || null)} value={selectedPrizeForAdd?.id || ''}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Escolher Item"/></SelectTrigger>
                    <SelectContent>{prizes?.map(p => <SelectItem key={p.id} value={p.id!}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
                <div className="flex gap-2">
                    <Input type="number" value={prizeQuantity} onChange={e => setPrizeQuantity(Number(e.target.value))} className="h-10 w-20" />
                    <Button type="button" variant="secondary" onClick={handleAddPrize} className="flex-1 h-10"><Plus className="h-4 w-4 mr-1"/> Add</Button>
                </div>
            </div>
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-base font-bold shadow-lg">
          {isSubmitting ? <Loader2 className="animate-spin" /> : (client ? 'Atualizar Cliente' : 'Finalizar Cadastro')}
        </Button>
      </form>
    </Form>
  );
}