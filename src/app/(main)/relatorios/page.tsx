
'use client';

import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { BarChart, Printer, Filter, Calendar as CalendarIcon, Package, Layers, Gift, Archive, Loader2, Wallet, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import type { Route, Cobranca, Prize, Client, DebtTransaction, Despesa } from '@/lib/types';
import { useCollection } from '@/firebase';
import { Separator } from '@/components/ui/separator';

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(date: Date) {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export default function RelatoriosPage() {
    const { data: cobrancas, isLoading: isLoadingCobrancas } = useCollection<Cobranca>('cobrancas');
    const { data: routes, isLoading: isLoadingRoutes } = useCollection<Route>('rotas');
    const { data: prizes, isLoading: isLoadingPrizes } = useCollection<Prize>('premios');
    const { data: clients, isLoading: isLoadingClients } = useCollection<Client>('clients');
    const { data: debtTransactions, isLoading: isLoadingDebts } = useCollection<DebtTransaction>('debt_transactions');
    const { data: despesas, isLoading: isLoadingDespesas } = useCollection<Despesa>('despesas');

    const [selectedRoute, setSelectedRoute] = useState('all');
    const [date, setDate] = useState<DateRange | undefined>();

    const isLoading = isLoadingCobrancas || isLoadingRoutes || isLoadingPrizes || isLoadingClients || isLoadingDebts || isLoadingDespesas;

    const routeOptions = useMemo(() => {
        if (!routes) return ['all'];
        return ['all', ...routes.map(r => r.name).sort()];
    }, [routes]);

    const filteredCobrancas = useMemo(() => {
        if (!cobrancas) return [];
        return cobrancas.filter(c => {
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

    const filteredDebtTransactions = useMemo(() => {
        if (!debtTransactions) return [];
        return debtTransactions.filter(t => {
            const routeMatch = selectedRoute === 'all' || t.route === selectedRoute;
            let dateMatch = true;
            if (date?.from) {
                const fromDate = new Date(date.from);
                fromDate.setHours(0, 0, 0, 0);
                dateMatch = t.createdAt >= fromDate;
            }
            if (date?.to) {
                const toDate = new Date(date.to);
                toDate.setHours(23, 59, 59, 999);
                dateMatch = dateMatch && t.createdAt <= toDate;
            }
            return routeMatch && dateMatch;
        });
    }, [debtTransactions, selectedRoute, date]);

    const filteredDespesas = useMemo(() => {
        if (!despesas) return [];
        return despesas.filter(d => {
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

    const reportData = useMemo(() => {
        const data = {
            kitsNovos: 0,
            kitsMantidos: 0,
            cartelasNovas: 0,
            cartelasMantidas: 0,
            prizesGiven: new Map<string, { prizeName: string, quantity: number }>(),
            totalCurrentDebt: 0,
            debtPaymentsReceived: 0,
            indebtedClients: [] as Client[],
            totalNetRevenue: 0,
            totalDespesas: 0,
        };

        // Dados de cobranças
        for (const cobranca of filteredCobrancas) {
            data.totalNetRevenue += cobranca.netRevenue;
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

        // Dados de dívidas atuais (Clientes)
        if (clients) {
            clients.forEach(c => {
                if (selectedRoute === 'all' || c.route === selectedRoute) {
                    const debt = c.currentDebt || 0;
                    data.totalCurrentDebt += debt;
                    if (debt > 0) data.indebtedClients.push(c);
                }
            });
        }

        // Recebimentos de dívidas no período
        filteredDebtTransactions.forEach(t => {
            if (t.type === 'sub') {
                data.debtPaymentsReceived += t.amount;
            }
        });
        
        // Despesas
        for (const despesa of filteredDespesas) {
            data.totalDespesas += despesa.value;
        }

        const saldoFinal = data.totalNetRevenue + data.debtPaymentsReceived - data.totalDespesas;

        return {
            ...data,
            saldoFinal,
            prizesGiven: Array.from(data.prizesGiven.values()).sort((a, b) => b.quantity - a.quantity),
            indebtedClients: data.indebtedClients.sort((a, b) => (b.currentDebt || 0) - (a.currentDebt || 0)),
        }

    }, [filteredCobrancas, clients, filteredDebtTransactions, filteredDespesas, selectedRoute]);

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

        printWindow.document.write(`<html><head><title>Relatório Geral</title>${pageStyles}</head><body class="dark bg-background p-6">${contentClone.innerHTML}</body></html>`);
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
                <h1 className="text-3xl font-bold font-headline">Relatórios</h1>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                        <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Rota" /></SelectTrigger>
                        <SelectContent>
                            {routeOptions.map(route => (<SelectItem key={route} value={route}>{route === 'all' ? 'Todas as Rotas' : route}</SelectItem>))}
                        </SelectContent>
                    </Select>
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button id="date" variant={"outline"} className={cn("w-full sm:w-[260px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (date.to ? <>{format(date.from, "dd/MM/yyyy")} - {format(date.to, "dd/MM/yyyy")}</> : format(date.from, "dd/MM/yyyy")) : <span>Período</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2}/>
                    </PopoverContent>
                </Popover>
                <Button onClick={handlePrint} className="w-full sm:w-auto"><Printer className="mr-2 h-4 w-4" />Imprimir</Button>
            </div>
        </div>

        <div id="report-content" className="space-y-6">
            <div className="hidden print:block mb-6 print-only-header">
                <h2 className="text-2xl font-bold">Relatório Financeiro e de Estoque</h2>
                <div className="text-sm text-muted-foreground">
                    <p><strong>Rota:</strong> {selectedRoute === 'all' ? 'Todas as Rotas' : selectedRoute}</p>
                    {date?.from && <p><strong>Período:</strong> {format(date.from, "dd/MM/yyyy")} {date.to ? `a ${format(date.to, "dd/MM/yyyy")}`: ''}</p>}
                </div>
            </div>

            {/* SEÇÃO DRE: LUCRO E PREJUÍZO */}
            <div className="grid grid-cols-1 gap-6">
                <Card className={cn("border-2", reportData.saldoFinal >= 0 ? "border-success/50 bg-success/5" : "border-destructive/50 bg-destructive/5")}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl">Resultado do Período (Lucro / Prejuízo)</CardTitle>
                        <CardDescription>Balanço geral das entradas e saídas financeiras.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid sm:grid-cols-3 gap-4">
                            <div className="space-y-1 bg-background/60 p-3 rounded-lg border">
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Wallet className="h-4 w-4 text-success"/> Entradas Totais</p>
                                <p className="text-xl font-bold text-success">{formatCurrency(reportData.totalNetRevenue + reportData.debtPaymentsReceived)}</p>
                                <p className="text-[10px] text-muted-foreground">Cobranças: {formatCurrency(reportData.totalNetRevenue)} | Dívidas Rec.: {formatCurrency(reportData.debtPaymentsReceived)}</p>
                            </div>
                            <div className="space-y-1 bg-background/60 p-3 rounded-lg border">
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><TrendingDown className="h-4 w-4 text-destructive"/> Saídas (Despesas)</p>
                                <p className="text-xl font-bold text-destructive">-{formatCurrency(reportData.totalDespesas)}</p>
                            </div>
                            <div className="space-y-1 bg-background/80 p-3 rounded-lg border-2 border-primary/20 relative overflow-hidden">
                                <div className={cn("absolute inset-0 opacity-10", reportData.saldoFinal >= 0 ? "bg-success" : "bg-destructive")}></div>
                                <p className="text-sm font-medium text-muted-foreground relative z-10">Saldo Final</p>
                                <p className={cn("text-2xl font-black relative z-10", reportData.saldoFinal >= 0 ? "text-success" : "text-destructive")}>{formatCurrency(reportData.saldoFinal)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* SEÇÃO DE DÍVIDAS E KITS */}
            <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">Resumo de Dívidas</CardTitle>
                        </div>
                        <CardDescription>Valores pendentes e recebidos.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center bg-background/50 p-3 rounded-lg border border-destructive/20">
                            <span className="text-sm font-medium">Total em Dívidas Ativas:</span>
                            <span className="text-lg font-bold text-destructive">{formatCurrency(reportData.totalCurrentDebt)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-background/50 p-3 rounded-lg border border-success/20">
                            <span className="text-sm font-medium">Recebimentos no Período:</span>
                            <span className="text-lg font-bold text-success">{formatCurrency(reportData.debtPaymentsReceived)}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-muted-foreground" />
                            <CardTitle className="text-lg">Kits & Cartelas</CardTitle>
                        </div>
                        <CardDescription>Movimentação de material.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Kits Novos:</span>
                            <span className="font-bold">{reportData.kitsNovos}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Kits Mantidos:</span>
                            <span className="font-bold">{reportData.kitsMantidos}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Cartelas Novas:</span>
                            <span className="font-bold">{reportData.cartelasNovas}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Cartelas Mantidas:</span>
                            <span className="font-bold">{reportData.cartelasMantidas}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                 {/* Clientes com Dívida */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Clientes Inadimplentes</CardTitle>
                        <CardDescription>Quem deve atualmente na rota.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {reportData.indebtedClients.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead className="text-right">Dívida</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reportData.indebtedClients.map(c => (
                                        <TableRow key={c.id}>
                                            <TableCell className="py-2">{c.name}</TableCell>
                                            <TableCell className="text-right py-2 font-bold text-destructive">{formatCurrency(c.currentDebt || 0)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                             <div className="text-center py-8 text-muted-foreground text-sm">Sem dívidas ativas.</div>
                        )}
                    </CardContent>
                </Card>

                {/* Histórico de Recebimentos */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Recebimentos de Dívidas</CardTitle>
                        <CardDescription>Pagamentos feitos no período.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {filteredDebtTransactions.filter(t => t.type === 'sub').length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Data</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDebtTransactions.filter(t => t.type === 'sub').map(t => (
                                        <TableRow key={t.id}>
                                            <TableCell className="py-2">{t.clientName}</TableCell>
                                            <TableCell className="py-2 text-xs">{formatDate(t.createdAt)}</TableCell>
                                            <TableCell className="text-right py-2 font-bold text-success">{formatCurrency(t.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground text-sm">Nenhum pagamento recebido.</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Estoque de Prêmios */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Estoque Atual</CardTitle></CardHeader>
                    <CardContent>
                        {prizes && prizes.length > 0 ? (
                            <Table>
                                <TableHeader><TableRow><TableHead>Prêmio</TableHead><TableHead className="text-right">Qtd.</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {prizes.map(p => (<TableRow key={p.id}><TableCell className="py-1">{p.name}</TableCell><TableCell className="text-right py-1">{p.quantity}</TableCell></TableRow>))}
                                </TableBody>
                            </Table>
                        ) : <div className="text-center py-8 text-muted-foreground text-sm">Vazio.</div>}
                    </CardContent>
                </Card>

                {/* Prêmios Entregues */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Prêmios Saídos</CardTitle></CardHeader>
                    <CardContent>
                        {reportData.prizesGiven.length > 0 ? (
                            <Table>
                                <TableHeader><TableRow><TableHead>Prêmio</TableHead><TableHead className="text-right">Saídas</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {reportData.prizesGiven.map(p => (<TableRow key={p.prizeName}><TableCell className="py-1">{p.prizeName}</TableCell><TableCell className="text-right py-1 font-bold">{p.quantity}</TableCell></TableRow>))}
                                </TableBody>
                            </Table>
                        ) : <div className="text-center py-8 text-muted-foreground text-sm">Nenhum prêmio saiu.</div>}
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
