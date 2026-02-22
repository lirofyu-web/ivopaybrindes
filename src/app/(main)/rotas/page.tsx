'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { MapPin, PlusCircle, Loader2, Edit, Trash2 } from "lucide-react";
import type { Route } from '@/lib/types';
import { mockRoutes } from '@/lib/mock-routes';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';

const routeFormSchema = z.object({
  name: z.string().min(3, 'O nome da rota deve ter pelo menos 3 caracteres.'),
  description: z.string().min(5, 'A descrição deve ter pelo menos 5 caracteres.'),
});

function RouteCard({ route, onEdit, onDelete }: { route: Route; onEdit: (route: Route) => void; onDelete: (route: Route) => void; }) {
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>{route.name}</CardTitle>
                <CardDescription>{route.description}</CardDescription>
            </CardHeader>
            <CardFooter className="mt-auto flex gap-2 p-4 pt-0">
                <Button variant="outline" size="sm" className="w-full" onClick={() => onEdit(route)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                </Button>
                <Button variant="destructive" size="icon" onClick={() => onDelete(route)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Deletar</span>
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function RotasPage() {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingRoute, setEditingRoute] = useState<Route | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [routeToDelete, setRouteToDelete] = useState<Route | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        try {
            const storedRoutesRaw = localStorage.getItem('mrd-brindes-routes');
            if (storedRoutesRaw) {
                setRoutes(JSON.parse(storedRoutesRaw));
            } else {
                localStorage.setItem('mrd-brindes-routes', JSON.stringify(mockRoutes));
                setRoutes(mockRoutes);
            }
        } catch (error) {
            console.error("Failed to read routes from localStorage", error);
            setRoutes(mockRoutes);
        }
        setIsLoading(false);
    }, []);

    const form = useForm<z.infer<typeof routeFormSchema>>({
        resolver: zodResolver(routeFormSchema),
        defaultValues: { name: '', description: '' },
    });

    const handleDialogOpen = (open: boolean) => {
        if (!open) {
            form.reset({ name: '', description: '' });
            setEditingRoute(null);
        }
        setIsDialogOpen(open);
    }
    
    const handleEdit = (route: Route) => {
        setEditingRoute(route);
        form.setValue('name', route.name);
        form.setValue('description', route.description);
        setIsDialogOpen(true);
    };

    const handleDeleteRequest = (route: Route) => {
        setRouteToDelete(route);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!routeToDelete) return;
        
        const updatedRoutes = routes.filter(r => r.id !== routeToDelete.id);
        localStorage.setItem('mrd-brindes-routes', JSON.stringify(updatedRoutes));
        setRoutes(updatedRoutes);

        toast({
            title: 'Rota Excluída!',
            description: `A rota "${routeToDelete.name}" foi removida.`,
            variant: 'destructive'
        });
        setIsDeleteDialogOpen(false);
        setRouteToDelete(null);
    };
    
    const onSubmit = (values: z.infer<typeof routeFormSchema>) => {
        setIsSubmitting(true);
        setTimeout(() => {
            if (editingRoute) {
                const updatedRoutes = routes.map(r => r.id === editingRoute.id ? { ...r, ...values } : r);
                setRoutes(updatedRoutes);
                localStorage.setItem('mrd-brindes-routes', JSON.stringify(updatedRoutes));
                toast({
                    title: 'Rota Atualizada!',
                    description: `A rota "${values.name}" foi atualizada.`,
                });
            } else {
                const newRoute: Route = {
                    id: `route-${Date.now()}`,
                    ...values
                };
                const updatedRoutes = [newRoute, ...routes];
                setRoutes(updatedRoutes);
                localStorage.setItem('mrd-brindes-routes', JSON.stringify(updatedRoutes));
                toast({
                    title: 'Rota Adicionada!',
                    description: `A rota "${values.name}" foi cadastrada.`,
                });
            }
            
            setIsSubmitting(false);
            handleDialogOpen(false);
        }, 500);
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                    <h1 className="text-3xl font-bold font-headline">
                        Gerenciar Rotas
                    </h1>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Nova Rota
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{editingRoute ? 'Editar Rota' : 'Adicionar Nova Rota'}</DialogTitle>
                            <DialogDescription>
                                Preencha os detalhes para {editingRoute ? 'editar a' : 'cadastrar uma nova'} rota.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome da Rota</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Rota 1" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Descrição da Região</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Ex: Região Central e bairros próximos" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingRoute ? 'Salvar Alterações' : 'Salvar Rota'}
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {routes.map(route => (
                    <RouteCard key={route.id} route={route} onEdit={handleEdit} onDelete={handleDeleteRequest} />
                ))}
            </div>
            {routes.length === 0 && (
                <div className="text-center py-12 text-muted-foreground col-span-full">
                    <p>Nenhuma rota cadastrada ainda.</p>
                </div>
            )}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente a rota
                            <span className="font-bold"> "{routeToDelete?.name}"</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setRouteToDelete(null)}>Cancelar</AlertDialogCancel>
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
