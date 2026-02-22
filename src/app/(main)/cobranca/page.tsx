'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { DollarSign, Filter, Printer, Calendar as CalendarIcon, Trash2, Loader2, Camera } from "lucide-react";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { Route, Cobranca } from "@/lib/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import ReactDOMServer from 'react-dom/server';
import { Receipt } from '@/components/receipt';
import { useCollection, useFirestore } from '@/firebase';
import { deleteDoc, doc } from "firebase/firestore";
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(date: Date) {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export default function CobrancaPage() {
    const firestore = useFirestore();
    const { data: cobrancas, isLoading: isLoadingCobrancas } = useCollection<Cobranca>('cobrancas');
    const { data: routes, isLoading: isLoadingRoutes } = useCollection<Route>('rotas');
    const [selectedRoute, setSelectedRoute] = useState('all');
    const [date, setDate] = useState<DateRange | undefined>();
    const { toast } = useToast();

    // Delete dialog state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [cobrancaToDelete, setCobrancaToDelete] = useState<Cobranca | null>(null);

    // Image preview state
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const isLoading = isLoadingCobrancas || isLoadingRoutes;

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

        const pageStyles = document.head.innerHTML;
        const contentClone = reportContentNode.cloneNode(true) as HTMLElement;
        const printHeader = contentClone.querySelector('.print-only-header');
        
        if (printHeader) {
            printHeader.classList.remove('hidden');
        }
        
        // Remove actions column header and cells from clone
        contentClone.querySelectorAll('.actions-col').forEach(el => el.remove());

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
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 500);
    };
    
    const handlePrintReceipt = (cobranca: Cobranca) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast({
                variant: 'destructive',
                title: 'Erro ao imprimir',
                description: 'Por favor, habilite pop-ups para gerar o recibo.',
            });
            return;
        }
        
        const receiptHtml = ReactDOMServer.renderToString(
          <Receipt cobranca={cobranca} />
        );

        const pageStyles = document.head.innerHTML;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Recibo - ${cobranca.clientName}</title>
                    ${pageStyles}
                    <style>
                        @media print {
                            @page { 
                                size: 80mm auto;
                                margin: 0;
                            }
                            body {
                                -webkit-print-color-adjust: exact !important;
                                print-color-adjust: exact !important;
                            }
                        }
                        body {
                            width: 80mm;
                            margin: 0;
                            padding: 0;
                            background: white;
                        }
                    </style>
                </head>
                <body class="light">
                    ${receiptHtml}
                </body>
            </html>
        `);

        printWindow.document.close();
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 500);
    };

    const handleDeleteRequest = (cobranca: Cobranca) => {
        setCobrancaToDelete(cobranca);
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!cobrancaToDelete || !firestore) return;
        
        try {
            await deleteDoc(doc(firestore, 'cobrancas', cobrancaToDelete.id!));
            toast({
                title: 'Cobrança Excluída!',
                description: `A cobrança para "${cobrancaToDelete.clientName}" foi removida.`,
                variant: 'destructive'
            });
        } catch (error) {
            console.error("Error deleting charge:", error);
            toast({
                title: 'Erro!',
                description: `Não foi possível excluir a cobrança.`,
                variant: 'destructive'
            });
        }

        setIsDeleteDialogOpen(false);
        setCobrancaToDelete(null);
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
                            <TableHead className="print:hidden actions-col">Fotos</TableHead>
                            <TableHead className="text-right">Qtd. Rasp.</TableHead>
                            <TableHead className="text-right">Total Bruto</TableHead>
                            <TableHead className="text-right">Comissão</TableHead>
                            <TableHead className="text-right">Desconto</TableHead>
                            <TableHead className="text-right">Valor Líquido</TableHead>
                            <TableHead className="text-right print:hidden actions-col">Ações</TableHead>
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
                                        <TableCell className="print:hidden actions-col">
                                            <div className="flex items-center gap-1">
                                                {cobranca.frontCardImageUrl && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewImage(cobranca.frontCardImageUrl!)}>
                                                        <Camera className="h-4 w-4" />
                                                        <span className="sr-only">Ver Foto da Frente</span>
                                                    </Button>
                                                )}
                                                {cobranca.backCardImageUrl && (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewImage(cobranca.backCardImageUrl!)}>
                                                        <Camera className="h-4 w-4 text-accent" />
                                                        <span className="sr-only">Ver Foto do Verso</span>
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">{cobranca.scratchedAmount}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(cobranca.grossRevenue)}</TableCell>
                                        <TableCell className="text-right text-destructive">-{formatCurrency(cobranca.commissionValue)}</TableCell>
                                        <TableCell className="text-right text-destructive">{cobranca.discount ? `-${formatCurrency(cobranca.discount)}` : formatCurrency(0)}</TableCell>
                                        <TableCell className="text-right font-semibold text-primary">{formatCurrency(cobranca.netRevenue)}</TableCell>
                                        <TableCell className="print:hidden actions-col">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrintReceipt(cobranca)}>
                                                    <Printer className="h-4 w-4" />
                                                    <span className="sr-only">Imprimir Recibo</span>
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteRequest(cobranca)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                    <span className="sr-only">Excluir Cobrança</span>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={12} className="h-24 text-center">
                                    Nenhuma cobrança registrada para os filtros selecionados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    {filteredCobrancas.length > 0 && (
                        <TableFooter className="font-semibold border-t">
                            <TableRow>
                                <TableCell colSpan={6} className="text-left print:col-span-3">Total</TableCell>
                                <TableCell className="text-right">{reportTotals.totalScratched}</TableCell>
                                <TableCell className="text-right">{formatCurrency(reportTotals.totalGross)}</TableCell>
                                <TableCell className="text-right text-destructive">-{formatCurrency(reportTotals.totalCommission)}</TableCell>
                                <TableCell className="text-right text-destructive">-{formatCurrency(reportTotals.totalDiscount)}</TableCell>
                                <TableCell className="text-right text-primary">{formatCurrency(reportTotals.totalNet)}</TableCell>
                                <TableCell className="print:hidden actions-col"></TableCell>
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
                        Esta ação não pode ser desfeita. A cobrança para <span className="font-bold">{cobrancaToDelete?.clientName}</span> será excluída permanentemente.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setCobrancaToDelete(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        className={buttonVariants({ variant: "destructive" })}
                        onClick={handleConfirmDelete}
                    >
                        Excluir
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Visualizar Imagem</DialogTitle>
                </DialogHeader>
                {previewImage && (
                    <div className="relative aspect-video w-full">
                        <Image src={previewImage} alt="Visualização da cartela" fill className="object-contain" />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    </div>
  );
}
