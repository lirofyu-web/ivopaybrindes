'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Prize } from '@/lib/types';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Gift, PlusCircle, Loader2, Image as ImageIcon, Trash2, Edit } from 'lucide-react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore } from '@/firebase';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';

// --- Add Prize Form Schema ---
const prizeFormSchema = z.object({
  name: z.string().min(3, { message: 'O nome do prêmio deve ter pelo menos 3 caracteres.' }),
  quantity: z.coerce.number().min(0, { message: 'A quantidade não pode ser negativa.' }),
  imageUrl: z.string().url({ message: 'Por favor, insira uma URL de imagem válida.' }),
});

// --- Prize Card Component ---
function PrizeCard({ prize, onEdit, onDelete }: { prize: Prize; onEdit: (prize: Prize) => void; onDelete: (prizeId: string) => void; }) {
    return (
        <Card className="overflow-hidden flex flex-col">
            <div className="relative aspect-video w-full">
                <Image
                    src={prize.imageUrl || 'https://placehold.co/400x300/27272a/71717a?text=Sem+Imagem'}
                    alt={prize.name}
                    fill
                    className="object-cover"
                    data-ai-hint="prize item"
                />
                 <Badge variant={prize.quantity > 0 ? 'default' : 'destructive'} className="absolute top-2 right-2">
                    {prize.quantity > 0 ? `Estoque: ${prize.quantity}` : 'Esgotado'}
                </Badge>
            </div>
            <CardHeader className="p-4 flex-1">
                <CardTitle className="text-lg">{prize.name}</CardTitle>
            </CardHeader>
            <CardFooter className="p-4 pt-0 flex gap-2">
                <Button variant="outline" size="sm" className="w-full" onClick={() => onEdit(prize)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                </Button>
                <Button variant="destructive" size="icon" onClick={() => onDelete(prize.id!)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Deletar</span>
                </Button>
            </CardFooter>
        </Card>
    );
}

// --- Main Page Component ---
export default function PremiosPage() {
    const firestore = useFirestore();
    const { data: prizes, isLoading } = useCollection<Prize>('premios');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof prizeFormSchema>>({
        resolver: zodResolver(prizeFormSchema),
        defaultValues: { name: '', quantity: 0, imageUrl: '' },
    });

    const handleDialogOpen = (open: boolean) => {
        if (!open) {
            form.reset({ name: '', quantity: 0, imageUrl: '' });
            setEditingPrize(null);
        }
        setIsDialogOpen(open);
    }
    
    const handleEdit = (prize: Prize) => {
        setEditingPrize(prize);
        form.setValue('name', prize.name);
        form.setValue('quantity', prize.quantity);
        form.setValue('imageUrl', prize.imageUrl);
        setIsDialogOpen(true);
    };

    const handleDelete = async (prizeId: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, 'premios', prizeId));
            toast({
                title: 'Prêmio Deletado!',
                description: 'O prêmio foi removido da sua lista.',
                variant: 'destructive'
            });
        } catch (error) {
            toast({
                title: 'Erro!',
                description: 'Não foi possível deletar o prêmio.',
                variant: 'destructive'
            });
            console.error("Error deleting prize:", error);
        }
    };
    
    const onSubmit = async (values: z.infer<typeof prizeFormSchema>) => {
        if (!firestore) return;
        setIsSubmitting(true);
        
        try {
            if (editingPrize) {
                const prizeDocRef = doc(firestore, 'premios', editingPrize.id!);
                await updateDoc(prizeDocRef, values);
                toast({
                    title: 'Prêmio Atualizado!',
                    description: `O prêmio "${values.name}" foi atualizado com sucesso.`,
                });
            } else {
                await addDoc(collection(firestore, 'premios'), values);
                toast({
                    title: 'Prêmio Adicionado!',
                    description: `O prêmio "${values.name}" foi cadastrado com sucesso.`,
                });
            }
            handleDialogOpen(false);
        } catch (error) {
             toast({
                title: 'Erro!',
                description: 'Não foi possível salvar o prêmio.',
                variant: 'destructive'
            });
            console.error("Error saving prize:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Gift className="h-8 w-8 text-muted-foreground" />
                    <h1 className="text-3xl font-bold font-headline">
                        Gerenciar Prêmios
                    </h1>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Novo Prêmio
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{editingPrize ? 'Editar Prêmio' : 'Adicionar Novo Prêmio'}</DialogTitle>
                            <DialogDescription>
                                Preencha os detalhes para {editingPrize ? 'editar o' : 'cadastrar um novo'} prêmio.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="space-y-4">
                                     <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome do Prêmio</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: Bicicleta Aro 29" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="quantity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Quantidade em Estoque</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="Ex: 10" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="imageUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>URL da Imagem do Prêmio</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://exemplo.com/imagem.png" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingPrize ? 'Salvar Alterações' : 'Salvar Prêmio'}
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                 <div className="text-center py-12 text-muted-foreground">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin" />
                    <p className="mt-4">Carregando prêmios...</p>
                </div>
            ) : (
                <>
                    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {prizes?.map(prize => (
                            <PrizeCard key={prize.id} prize={prize} onEdit={handleEdit} onDelete={handleDelete} />
                        ))}
                    </div>
                    {prizes?.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground col-span-full">
                            <p>Nenhum prêmio cadastrado ainda.</p>
                        </div>
                    )}
                </>
            )}
            
        </div>
    );
}
