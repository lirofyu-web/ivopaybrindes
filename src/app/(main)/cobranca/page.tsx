'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { DollarSign, Filter, Printer, Calendar as CalendarIcon } from "lucide-react";
import { mockCobrancas } from '@/lib/mock-cobrancas';
import { Badge } from "@/components/ui/badge";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(date: Date) {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export default function CobrancaPage() {
    const [selectedRoute, setSelectedRoute] = useState('all');
    const [date, setDate] = useState<DateRange | undefined>();

    const routes = useMemo(() => {
        const allRoutes = mockCobrancas.map(c => c.route);
        return ['all', ...Array.from(new Set(allRoutes)).sort()];
    }, []);

    const filteredCobrancas = useMemo(() => {
        const sorted = [...mockCobrancas].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
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
    }, [selectedRoute, date]);

    const reportTotals = useMemo(() => {
        return filteredCobrancas.reduce((acc, cobranca) => {
            acc.totalScratched += cobranca.scratchedAmount;
            acc.totalGross += cobranca.grossRevenue;
            acc.totalCommission += cobranca.commissionValue;
            acc.totalDiscount += cobranca.discount || 0;
            acc.totalNet += cobranca.netRevenue;
            return acc;
        }, {
            totalScratched: 0,
            totalGross: 0,
            totalCommission: 0,
            totalDiscount: 0,
            totalNet: 0,
        });
    }, [filteredCobrancas]);


    const handlePrint = () => {
        const reportContentNode = document.getElementById('report-content');
        if (!reportContentNode) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Por favor, habilite pop-ups para imprimir o relatório.');
            return;
        }

        // Get all style/link tags from the main document head
        const pageStyles = document.head.innerHTML;

        // Clone the content to manipulate it for the popup
        const contentClone = reportContentNode.cloneNode(true) as HTMLElement;
        const printHeader = contentClone.querySelector('.print-only-header');
        
        // The print header is hidden by default on screen, let's show it in the popup
        if (printHeader) {
            printHeader.classList.remove('hidden');
        }

        // Construct the full HTML for the new window
        printWindow.document.write(`
            <html>
                <head>
                    <title>Relatório de Cobranças</title>
                    ${pageStyles}
                </head>
                <body class="dark bg-background p-6">
                    ${contentClone.innerHTML}
                </body>
            </html>
        `);

        printWindow.document.close();

        // Use a timeout to ensure all assets are loaded before triggering print
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 500);
    };

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-3 print:hidden">
            <DollarSign className="h-8 w-8 text-muted-foreground" />
            <h1 className="text-3xl font-bold font-headline">
                Histórico de Cobranças
            </h1>
        </div>

        <Card className="print:shadow-none print:border-none">
            <CardHeader className="print:hidden">
                <div className="flex sm:flex-row flex-col sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle>Cobranças Realizadas</CardTitle>
                        <CardDescription>
                            Filtre e imprima o relatório de cobranças.
                        </CardDescription>
                    </div>
                     <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
            </CardHeader>
            <CardContent id="report-content">
                 <div className="hidden print:block mb-6 print-only-header">
                    <h2 className="text-2xl font-bold">Relatório de Cobranças</h2>
                    <div className="text-sm text-muted-foreground">
                        <p><strong>Rota:</strong> {selectedRoute === 'all' ? 'Todas as Rotas' : selectedRoute}</p>
                        {date?.from && <p><strong>Período:</strong> {format(date.from, "dd/MM/yyyy")} {date.to ? `a ${format(date.to, "dd/MM/yyyy")}`: ''}</p>}
                    </div>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Rota</TableHead>
                            <TableHead className="text-center">Data</TableHead>
                            <TableHead className="print:hidden">Status</TableHead>
                            <TableHead className="print:hidden">Prêmios</TableHead>
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
                                        <TableCell className="print:hidden">
                                            <div className="flex flex-col text-xs text-muted-foreground">
                                                {cobranca.kitStatus && <span>Kit: <span className="font-medium text-foreground">{cobranca.kitStatus === 'novo' ? 'Novo' : 'Manteve'}</span></span>}
                                                {cobranca.cartelaStatus && <span>Cartela: <span className="font-medium text-foreground">{cobranca.cartelaStatus === 'nova' ? 'Nova' : 'Manteve'}</span></span>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="print:hidden">
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
                                    Nenhuma cobrança registrada para os filtros selecionados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    {filteredCobrancas.length > 0 && (
                        <TableFooter className="font-semibold border-t">
                            <TableRow>
                                <TableCell colSpan={5} className="text-left print:col-span-3">Total</TableCell>
                                <TableCell className="text-right">{reportTotals.totalScratched}</TableCell>
                                <TableCell className="text-right">{formatCurrency(reportTotals.totalGross)}</TableCell>
                                <TableCell className="text-right text-destructive">-{formatCurrency(reportTotals.totalCommission)}</TableCell>
                                <TableCell className="text-right text-destructive">-{formatCurrency(reportTotals.totalDiscount)}</TableCell>
                                <TableCell className="text-right text-primary">{formatCurrency(reportTotals.totalNet)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
