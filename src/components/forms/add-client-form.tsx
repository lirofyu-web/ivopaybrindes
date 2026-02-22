'use client';

import { useState } from 'react';
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
import { toast } from '@/hooks/use-toast';
import { Globe, Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  phone: z.string().min(10, 'Telefone inválido (inclua DDD).').max(15, 'Telefone inválido.'),
  address: z.string().min(2, 'Endereço deve ter pelo menos 2 caracteres.'),
  city: z.string().optional(),
  location: z
    .object({ lat: z.number(), lng: z.number() })
    .optional(),
});

export function AddClientForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationStatus, setLocationStatus] = useState('Salvar localização atual');
  const [isLocating, setIsLocating] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      city: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    console.log(values);

    // Simulate API call
    setTimeout(() => {
      toast({
        title: 'Sucesso!',
        description: `Cliente "${values.name}" adicionado.`,
      });
      setIsSubmitting(false);
      form.reset();
      setLocationStatus('Salvar localização atual');
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
              <FormLabel>Cidade</FormLabel>
              <FormControl>
                <Input placeholder="Ex: São Paulo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
            <FormLabel>Localização</FormLabel>
            <Button type="button" variant="outline" className="w-full" onClick={handleLocation} disabled={isLocating}>
                {isLocating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
                {locationStatus}
            </Button>
        </FormItem>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Cliente
        </Button>
      </form>
    </Form>
  );
}
