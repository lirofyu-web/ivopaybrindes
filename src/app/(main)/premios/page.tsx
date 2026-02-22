'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { mockPrizes } from '@/lib/mock-prizes';
import type { Prize } from '@/lib/types';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Gift, PlusCircle, Loader2, Image as ImageIcon, Trash2, Edit } from 'lucide-react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

// --- Add Prize Form Schema ---
const prizeFormSchema = z.object({
  name: z.string().min(3, { message: 'O nome do prêmio deve ter pelo menos 3 caracteres.' }),
});

// --- Prize Card Component ---
function PrizeCard({ prize, onEdit, onDelete }: { prize: Prize; onEdit: (prize: Prize) => void; onDelete: (prizeId: string) => void; }) {
    return (
        <Card className="overflow-hidden flex flex-col">
            <div className="relative aspect-video w-full">
                <Image
                    src={prize.imageUrl}
                    alt={prize.name}
                    fill
                    className="object-cover"
                    data-ai-hint="prize item"
                />
            </div>
            <CardHeader className="p-4 flex-1">
                <CardTitle className="text-lg">{prize.name}</CardTitle>
            </CardHeader>
            <CardFooter className="p-4 pt-0 flex gap-2">
                <Button variant="outline" size="sm" className="w-full" onClick={() => onEdit(prize)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                </Button>
                <Button variant="destructive" size="icon" onClick={() => onDelete(prize.id)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Deletar</span>
                </Button>
            </CardFooter>
        </Card>
    );
}

// --- Main Page Component ---
export default function PremiosPage() {
    const [prizes, setPrizes] = useState<Prize[]>(mockPrizes);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof prizeFormSchema>>({
        resolver: zodResolver(prizeFormSchema),
        defaultValues: { name: '' },
    });

    const handleDialogOpen = (open: boolean) => {
        if (!open) {
            // Reset form on close
            form.reset();
            setEditingPrize(null);
            setImagePreview(null);
            setImageFile(null);
        }
        setIsDialogOpen(open);
    }
    
    const handleEdit = (prize: Prize) => {
        setEditingPrize(prize);
        form.setValue('name', prize.name);
        setImagePreview(prize.imageUrl);
        setIsDialogOpen(true);
    };

    const handleDelete = (prizeId: string) => {
        // Here you would typically call an API to delete the prize
        setPrizes(prizes.filter(p => p.id !== prizeId));
        toast({
            title: 'Prêmio Deletado!',
            description: 'O prêmio foi removido da sua lista.',
        });
    };

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const onSubmit = (values: z.infer<typeof prizeFormSchema>) => {
        if (!imagePreview) {
            toast({
                variant: 'destructive',
                title: 'Imagem faltando',
                description: 'Por favor, selecione uma imagem para o prêmio.',
            });
            return;
        }

        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            if (editingPrize) {
                // Update existing prize
                const updatedPrizes = prizes.map(p => p.id === editingPrize.id ? { ...p, name: values.name, imageUrl: imagePreview } : p);
                setPrizes(updatedPrizes);
                toast({
                    title: 'Prêmio Atualizado!',
                    description: `O prêmio "${values.name}" foi atualizado com sucesso.`,
                });
            } else {
                // Add new prize
                const newPrize: Prize = {
                    id: (prizes.length + 1).toString(),
                    name: values.name,
                    imageUrl: imagePreview,
                };
                setPrizes([newPrize, ...prizes]);
                toast({
                    title: 'Prêmio Adicionado!',
                    description: `O prêmio "${values.name}" foi cadastrado com sucesso.`,
                });
            }
            
            setIsSubmitting(false);
            handleDialogOpen(false);
        }, 1000);
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
                                    <FormItem>
                                        <FormLabel>Imagem do Prêmio</FormLabel>
                                        <FormControl>
                                             <Input id="picture" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                        </FormControl>
                                        <label htmlFor="picture" className={cn("block w-full aspect-video rounded-md border-2 border-dashed border-muted-foreground/30 cursor-pointer", imagePreview ? 'border-solid' : '')}>
                                            {imagePreview ? (
                                                <div className="relative w-full h-full">
                                                    <Image src={imagePreview} alt="Preview do prêmio" fill className="object-contain rounded-md" />
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                                    <ImageIcon className="h-12 w-12" />
                                                    <span className="mt-2 text-sm">Clique para selecionar</span>
                                                </div>
                                            )}
                                        </label>
                                    </FormItem>
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
            
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {prizes.map(prize => (
                    <PrizeCard key={prize.id} prize={prize} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
            </div>
            {prizes.length === 0 && (
                <div className="text-center py-12 text-muted-foreground col-span-full">
                    <p>Nenhum prêmio cadastrado ainda.</p>
                </div>
            )}
        </div>
    );
}
