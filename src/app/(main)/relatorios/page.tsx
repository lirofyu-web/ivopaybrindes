'use client';

import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Printer, Filter, Calendar as CalendarIcon, Package, Layers, Gift, Archive, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import type { Route, Cobranca, Prize } from '@/lib/types';
import { useCollection } from '@/firebase';

export default function RelatoriosPage() {
    const { data: cobrancas, isLoading: isLoadingCobrancas } = useCollection<Cobranca>('cobrancas');
    const { data: routes, isLoading: isLoadingRoutes } = useCollection<Route>('rotas');
    const { data: prizes, isLoading: isLoadingPrizes } = useCollection<Prize>('premios');

    const [selectedRoute, setSelectedRoute] = useState('all');
    const [date, setDate] = useState<DateRange | undefined>();

    const isLoading = isLoadingCobrancas || isLoadingRoutes || isLoadingPrizes;

    const routeOptions = useMemo(() => {
        if (!routes) return ['all'];
        return ['all', ...routes.map(r => r.name).sort()];
    }, [routes]);

    const filteredCobrancas = useMemo(() => {
        if (!cobrancas) return [];
        const sorted = [...cobrancas].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        return sorted.filter(c => {
            const routeMatch = selectedRoute === 'all' || c.route === selectedRoute;
            
            let dateMatch = true;
            if (date?.from) {
                const fromDate = new Date(date.from);
                fromDate.setHours(0, 0, 0, 0);
                dateMatch = c.createdAt >= fromDate;
            }
            if (date?.to) {
                const toDate = new Date(date.to);
                toDate.setHours(23, 59, 59, 999);
                dateMatch = dateMatch && c.createdAt <= toDate;
            }
            
            return routeMatch && dateMatch;
        });
    }, [cobrancas, selectedRoute, date]);

    const reportData = useMemo(() => {
        const data = {
            kitsNovos: 0,
            kitsMantidos: 0,
            cartelasNovas: 0,
            cartelasMantidas: 0,
            prizesGiven: new Map<string, { prizeName: string, quantity: number }>(),
        };

        for (const cobranca of filteredCobrancas) {
            if (cobranca.kitStatus === 'novo') data.kitsNovos++;
            if (cobranca.kitStatus === 'manteve') data.kitsMantidos++;
            if (cobranca.cartelaStatus === 'nova') data.cartelasNovas++;
            if (cobranca.cartelaStatus === 'manteve') data.cartelasMantidas++;

            if (cobranca.prizesGiven) {
                for (const prize of cobranca.prizesGiven) {
                    if (data.prizesGiven.has(prize.prizeId)) {
                        data.prizesGiven.get(prize.prizeId)!.quantity += prize.quantity;
                    } else {
                        data.prizesGiven.set(prize.prizeId, { prizeName: prize.prizeName, quantity: prize.quantity });
                    }
                }
            }
        }
        
        return {
            ...data,
            prizesGiven: Array.from(data.prizesGiven.values()).sort((a, b) => b.quantity - a.quantity),
        }

    }, [filteredCobrancas]);

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
                    <title>Relatório Geral</title>
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
                <BarChart className="h-8 w-8 text-muted-foreground" />
                <h1 className="text-3xl font-bold font-headline">Relatório Geral</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filtrar por Rota" />
                        </SelectTrigger>
                        <SelectContent>
                            {routeOptions.map(route => (
                                <SelectItem key={route} value={route}>{route === 'all' ? 'Todas as Rotas' : route}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-full sm:w-[260px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                            <>
                                {format(date.from, "dd/MM/yyyy")} -{" "}
                                {format(date.to, "dd/MM/yyyy")}
                            </>
                            ) : (
                            format(date.from, "dd/MM/yyyy")
                            )
                        ) : (
                            <span>Selecione um período</span>
                        )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>
                <Button onClick={handlePrint} className="w-full sm:w-auto">
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimir
                </Button>
            </div>
        </div>

        <div id="report-content" className="space-y-6">
            <div className="hidden print:block mb-6 print-only-header">
                <h2 className="text-2xl font-bold">Relatório Geral</h2>
                <div className="text-sm text-muted-foreground">
                    <p><strong>Rota:</strong> {selectedRoute === 'all' ? 'Todas as Rotas' : selectedRoute}</p>
                    {date?.from && <p><strong>Período:</strong> {format(date.from, "dd/MM/yyyy")} {date.to ? `a ${format(date.to, "dd/MM/yyyy")}`: ''}</p>}
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Kits & Cartelas */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Status de Kits e Cartelas</CardTitle>
                        <CardDescription>Contagem no período selecionado.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center">
                            <Package className="h-6 w-6 text-primary mr-4"/>
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium leading-none">Kits de Prêmios</p>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Novos: <span className="font-bold text-foreground">{reportData.kitsNovos}</span></span>
                                    <span>Mantidos: <span className="font-bold text-foreground">{reportData.kitsMantidos}</span></span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <Layers className="h-6 w-6 text-accent mr-4"/>
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium leading-none">Cartelas de Raspinhas</p>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                   <span>Novas: <span className="font-bold text-foreground">{reportData.cartelasNovas}</span></span>
                                   <span>Mantidas: <span className="font-bold text-foreground">{reportData.cartelasMantidas}</span></span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                 {/* Current Prize Stock */}
                <Card>
                    <CardHeader>
                        <CardTitle>Estoque de Prêmios</CardTitle>
                        <CardDescription>Visão geral do estoque atual.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {prizes && prizes.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Prêmio</TableHead>
                                        <TableHead className="text-right">Quantidade</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {prizes.map(prize => (
                                        <TableRow key={prize.id}>
                                            <TableCell>{prize.name}</TableCell>
                                            <TableCell className="text-right">{prize.quantity}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                             <div className="text-center py-8 text-muted-foreground">
                                <Archive className="mx-auto h-8 w-8" />
                                <p className="mt-2 text-sm">Nenhum prêmio em estoque.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Prizes Given */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Prêmios Entregues</CardTitle>
                        <CardDescription>Total de prêmios que saíram no período selecionado.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {reportData.prizesGiven.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Prêmio</TableHead>
                                        <TableHead className="text-right">Quantidade Entregue</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reportData.prizesGiven.map(prize => (
                                        <TableRow key={prize.prizeName}>
                                            <TableCell>{prize.prizeName}</TableCell>
                                            <TableCell className="text-right">{prize.quantity}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">
                                <Gift className="mx-auto h-8 w-8" />
                                <p className="mt-2 text-sm">Nenhum prêmio saiu no período selecionado.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
