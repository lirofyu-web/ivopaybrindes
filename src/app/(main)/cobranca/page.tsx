'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Filter } from "lucide-react";
import { mockCobrancas } from '@/lib/mock-cobrancas';
import { Badge } from "@/components/ui/badge";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(date: Date) {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export default function CobrancaPage() {
    const [selectedRoute, setSelectedRoute] = useState('all');

    const routes = useMemo(() => {
        const allRoutes = mockCobrancas.map(c => c.route);
        return ['all', ...Array.from(new Set(allRoutes))];
    }, []);

    const filteredCobrancas = useMemo(() => {
        const sorted = [...mockCobrancas].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        if (selectedRoute === 'all') {
            return sorted;
        }
        return sorted.filter(c => c.route === selectedRoute);
    }, [selectedRoute]);


  return (
    <div className="space-y-6">
        <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-muted-foreground" />
            <h1 className="text-3xl font-bold font-headline">
                Histórico de Cobranças
            </h1>
        </div>

        <Card>
            <CardHeader>
                <div className="flex sm:flex-row flex-col sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle>Cobranças Realizadas</CardTitle>
                        <CardDescription>
                            Aqui está a lista de todas as cobranças salvas no sistema.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Filtrar por Rota" />
                            </SelectTrigger>
                            <SelectContent>
                                {routes.map(route => (
                                    <SelectItem key={route} value={route}>{route === 'all' ? 'Todas as Rotas' : route}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Rota</TableHead>
                            <TableHead className="text-center">Data</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Prêmios</TableHead>
                            <TableHead className="text-right">Qtd. Rasp.</TableHead>
                            <TableHead className="text-right">Total Bruto</TableHead>
                            <TableHead className="text-right">Comissão</TableHead>
                            <TableHead className="text-right">Desconto</TableHead>
                            <TableHead className="text-right">Valor Líquido</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCobrancas.length > 0 ? (
                            filteredCobrancas
                                .map((cobranca) => (
                                    <TableRow key={cobranca.id}>
                                        <TableCell className="font-medium">{cobranca.clientName}</TableCell>
                                        <TableCell className="text-muted-foreground">{cobranca.route}</TableCell>
                                        <TableCell className="text-center text-muted-foreground">{formatDate(cobranca.createdAt)}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-xs text-muted-foreground">
                                                {cobranca.kitStatus && <span>Kit: <span className="font-medium text-foreground">{cobranca.kitStatus === 'novo' ? 'Novo' : 'Manteve'}</span></span>}
                                                {cobranca.cartelaStatus && <span>Cartela: <span className="font-medium text-foreground">{cobranca.cartelaStatus === 'nova' ? 'Nova' : 'Manteve'}</span></span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {cobranca.prizesGiven && cobranca.prizesGiven.length > 0 ? (
                                                <ul className="text-xs list-disc list-inside">
                                                    {cobranca.prizesGiven.map(p => <li key={p.prizeId}>{p.prizeName} (x{p.quantity})</li>)}
                                                </ul>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Nenhum</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">{cobranca.scratchedAmount}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(cobranca.grossRevenue)}</TableCell>
                                        <TableCell className="text-right text-destructive">-{formatCurrency(cobranca.commissionValue)}</TableCell>
                                        <TableCell className="text-right text-destructive">{cobranca.discount ? `-${formatCurrency(cobranca.discount)}` : formatCurrency(0)}</TableCell>
                                        <TableCell className="text-right font-semibold text-primary">{formatCurrency(cobranca.netRevenue)}</TableCell>
                                    </TableRow>
                                ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={10} className="h-24 text-center">
                                    Nenhuma cobrança registrada para a rota selecionada.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
