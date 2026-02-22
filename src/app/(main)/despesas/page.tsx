'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { TrendingDown, PlusCircle, Loader2, Filter, Printer, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import type { Despesa } from '@/lib/types';
import { mockDespesas } from '@/lib/mock-despesas';
import { mockClients } from '@/lib/mock-clients';
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// --- Form Schema ---
const despesaFormSchema = z.object({
  description: z.string().min(3, 'A descrição deve ter pelo menos 3 caracteres.'),
  value: z.coerce.number().min(0.01, 'O valor deve ser maior que zero.'),
  route: z.string().min(1, 'Selecione uma rota.'),
});

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(date: Date) {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export default function DespesasPage() {
    const [despesas, setDespesas] = useState<Despesa[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    // Filters
    const [selectedRoute, setSelectedRoute] = useState('all');
    const [date, setDate] = useState<DateRange | undefined>();

    // Delete dialog
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [despesaToDelete, setDespesaToDelete] = useState<Despesa | null>(null);

    // Load data from localStorage
    useEffect(() => {
        try {
            const storedDespesasRaw = localStorage.getItem('mrd-brindes-despesas');
            if (storedDespesasRaw) {
                const parsedDespesas = JSON.parse(storedDespesasRaw).map((d: any) => ({
                    ...d,
                    createdAt: new Date(d.createdAt),
                }));
                setDespesas(parsedDespesas);
            } else {
                localStorage.setItem('mrd-brindes-despesas', JSON.stringify(mockDespesas));
                setDespesas(mockDespesas);
            }
        } catch (error) {
            console.error("Failed to read expenses from localStorage", error);
            setDespesas(mockDespesas);
        }
        setIsLoading(false);
    }, []);

    const routes = useMemo(() => {
        const allClientRoutes = mockClients.map(c => c.route);
        // Also include routes that might only exist on expenses but not on clients
        const allExpenseRoutes = despesas.map(d => d.route);
        return ['all', ...Array.from(new Set([...allClientRoutes, ...allExpenseRoutes])).sort()];
    }, [despesas]);

    const form = useForm<z.infer<typeof despesaFormSchema>>({
        resolver: zodResolver(despesaFormSchema),
        defaultValues: { description: '', value: 0, route: '' },
    });

    const filteredDespesas = useMemo(() => {
        const sorted = [...despesas].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        return sorted.filter(d => {
            const routeMatch = selectedRoute === 'all' || d.route === selectedRoute;
            
            let dateMatch = true;
            if (date?.from) {
                const fromDate = new Date(date.from);
                fromDate.setHours(0, 0, 0, 0);
                dateMatch = d.createdAt >= fromDate;
            }
            if (date?.to) {
                const toDate = new Date(date.to);
                toDate.setHours(23, 59, 59, 999);
                dateMatch = dateMatch && d.createdAt <= toDate;
            }
            
            return routeMatch && dateMatch;
        });
    }, [despesas, selectedRoute, date]);

    const totalDespesas = useMemo(() => {
        return filteredDespesas.reduce((acc, despesa) => acc + despesa.value, 0);
    }, [filteredDespesas]);

    const handlePrint = () => {
        const reportContentNode = document.getElementById('report-content');
        if (!reportContentNode) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Por favor, habilite pop-ups para imprimir o relatório.');
            return;
        }

        const pageStyles = document.head.innerHTML;
        const contentClone = reportContentNode.cloneNode(true) as HTMLElement;
        const printHeader = contentClone.querySelector('.print-only-header');
        
        if (printHeader) {
            printHeader.classList.remove('hidden');
        }

        printWindow.document.write(`
            <html>
                <head>
                    <title>Relatório de Despesas</title>
                    ${pageStyles}
                </head>
                <body class="dark bg-background p-6">
                    ${contentClone.innerHTML}
                </body>
            </html>
        `);

        printWindow.document.close();
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 500);
    };

    const onSubmit = (values: z.infer<typeof despesaFormSchema>) => {
        setIsSubmitting(true);

        const newDespesa: Despesa = {
            id: `despesa-${Date.now()}`,
            createdAt: new Date(),
            ...values
        };

        const updatedDespesas = [newDespesa, ...despesas];
        setDespesas(updatedDespesas);
        localStorage.setItem('mrd-brindes-despesas', JSON.stringify(updatedDespesas));

        setTimeout(() => {
            toast({
                title: 'Despesa Adicionada!',
                description: `A despesa "${values.description}" foi registrada.`,
            });
            setIsSubmitting(false);
            setIsDialogOpen(false);
            form.reset();
        }, 500);
    }

    const handleDeleteRequest = (despesa: Despesa) => {
        setDespesaToDelete(despesa);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!despesaToDelete) return;
        
        const updatedDespesas = despesas.filter((d) => d.id !== despesaToDelete.id);
        localStorage.setItem('mrd-brindes-despesas', JSON.stringify(updatedDespesas));
        setDespesas(updatedDespesas);

        toast({
            title: 'Despesa Excluída!',
            description: `A despesa "${despesaToDelete.description}" foi removida.`,
            variant: 'destructive'
        });
        setIsDeleteDialogOpen(false);
        setDespesaToDelete(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-3">
                    <TrendingDown className="h-8 w-8 text-muted-foreground" />
                    <h1 className="text-3xl font-bold font-headline">Controle de Despesas</h1>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Nova Despesa
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Adicionar Nova Despesa</DialogTitle>
                            <DialogDescription>
                                Preencha os detalhes para registrar uma nova despesa.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Descrição</FormLabel>
                                            <FormControl><Input placeholder="Ex: Combustível" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Valor (R$)</FormLabel>
                                            <FormControl><Input type="number" step="0.01" placeholder="Ex: 150.00" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="route"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Rota</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {routes.filter(r=>r!=='all').map(route => (<SelectItem key={route} value={route}>{route}</SelectItem>))}
                                            </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                </div>
                                <Button type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Salvar Despesa
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="print:shadow-none print:border-none">
                <CardHeader className="print:hidden">
                    <div className="flex sm:flex-row flex-col sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle>Histórico de Despesas</CardTitle>
                            <CardDescription>Filtre e imprima o relatório de despesas.</CardDescription>
                        </div>
                         <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                                    <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filtrar por Rota" /></SelectTrigger>
                                    <SelectContent>
                                        {routes.map(route => (<SelectItem key={route} value={route}>{route === 'all' ? 'Todas as Rotas' : route}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Popover>
                                <PopoverTrigger asChild>
                                  <Button id="date" variant={"outline"} className={cn("w-full sm:w-[260px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.from ? (date.to ? (<>{format(date.from, "dd/MM/yyyy")} - {format(date.to, "dd/MM/yyyy")}</>) : (format(date.from, "dd/MM/yyyy"))) : (<span>Selecione um período</span>)}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                  <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2}/>
                                </PopoverContent>
                              </Popover>
                            <Button onClick={handlePrint} className="w-full sm:w-auto">
                                <Printer className="mr-2 h-4 w-4" />
                                Imprimir
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent id="report-content">
                     <div className="hidden print:block mb-6 print-only-header">
                        <h2 className="text-2xl font-bold">Relatório de Despesas</h2>
                        <div className="text-sm text-muted-foreground">
                            <p><strong>Rota:</strong> {selectedRoute === 'all' ? 'Todas as Rotas' : selectedRoute}</p>
                            {date?.from && <p><strong>Período:</strong> {format(date.from, "dd/MM/yyyy")} {date.to ? `a ${format(date.to, "dd/MM/yyyy")}`: ''}</p>}
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Rota</TableHead>
                                <TableHead className="text-center">Data</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                                <TableHead className="w-[50px] print:hidden"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredDespesas.length > 0 ? (
                                filteredDespesas.map((despesa) => (
                                    <TableRow key={despesa.id}>
                                        <TableCell className="font-medium">{despesa.description}</TableCell>
                                        <TableCell className="text-muted-foreground">{despesa.route}</TableCell>
                                        <TableCell className="text-center text-muted-foreground">{formatDate(despesa.createdAt)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(despesa.value)}</TableCell>
                                        <TableCell className="print:hidden">
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDeleteRequest(despesa)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">Nenhuma despesa registrada para os filtros selecionados.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        {filteredDespesas.length > 0 && (
                            <TableFooter className="font-semibold border-t">
                                <TableRow>
                                    <TableCell colSpan={3} className="text-left">Total</TableCell>
                                    <TableCell className="text-right">{formatCurrency(totalDespesas)}</TableCell>
                                    <TableCell className="print:hidden"></TableCell>
                                </TableRow>
                            </TableFooter>
                        )}
                    </Table>
                </CardContent>
            </Card>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente a despesa
                            <span className="font-bold"> "{despesaToDelete?.description}"</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDespesaToDelete(null)}>Cancelar</AlertDialogCancel>
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
