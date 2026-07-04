'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { DollarSign, Filter, Printer, Calendar as CalendarIcon, Trash2, Loader2, Camera, MapPin, Calendar, Package, Layers, Gift } from "lucide-react";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { Route, Cobranca } from "@/lib/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import ReactDOMServer from 'react-dom/server';
import { Receipt } from '@/components/receipt';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { deleteDoc, doc } from "firebase/firestore";
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSuccessAnimation } from '@/components/success-animation-provider';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(date: Date) {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export default function CobrancaPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { triggerSuccess } = useSuccessAnimation();
    const { data: cobrancas, isLoading: isLoadingCobrancas } = useCollection<Cobranca>('cobrancas');
    const { data: routes, isLoading: isLoadingRoutes } = useCollection<Route>('rotas');
    const [selectedRoute, setSelectedRoute] = useState('all');
    const [date, setDate] = useState<DateRange | undefined>();
    const { toast } = useToast();

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [cobrancaToDelete, setCobrancaToDelete] = useState<Cobranca | null>(null);
    const [viewingPhotos, setViewingPhotos] = useState<Cobranca | null>(null);

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
        const reportContentNode = document.getElementById('report-content-desktop');
        if (!reportContentNode) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Por favor, habilite pop-ups para imprimir o relatório.');
            return;
        }

        const pageStyles = document.head.innerHTML;
        const contentClone = reportContentNode.cloneNode(true) as HTMLElement;
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
        
        const receiptHtml = ReactDOMServer.renderToString(<Receipt cobranca={cobranca} />);
        const pageStyles = document.head.innerHTML;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Recibo - ${cobranca.clientName}</title>
                    ${pageStyles}
                    <style>
                        @media print { @page { size: 80mm auto; margin: 0; } body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
                        body { width: 80mm; margin: 0; padding: 0; background: white; }
                    </style>
                </head>
                <body class="light">${receiptHtml}</body>
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
        if (!cobrancaToDelete || !firestore || !user) return;
        try {
            await deleteDoc(doc(firestore, 'users', user.uid, 'cobrancas', cobrancaToDelete.id!));
            triggerSuccess();
            toast({ title: 'Cobrança Excluída!', description: `A cobrança para "${cobrancaToDelete.clientName}" foi removida.`, variant: 'destructive' });
        } catch (error) {
            console.error("Error deleting charge:", error);
            toast({ title: 'Erro!', description: `Não foi possível excluir a cobrança.`, variant: 'destructive' });
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
    <div className="space-y-4 mobile-container">
        <div className="flex items-center gap-3 print:hidden">
            <DollarSign className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold font-headline">Histórico</h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 print:hidden">
            <div className="flex flex-1 gap-2">
                <Select value={selectedRoute} onValueChange={setSelectedRoute}>
                    <SelectTrigger className="flex-1 h-11"><SelectValue placeholder="Rota" /></SelectTrigger>
                    <SelectContent>
                        {routeOptions.map(route => (
                            <SelectItem key={route} value={route}>{route === 'all' ? 'Todas Rotas' : route}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("flex-1 h-11 justify-start text-left font-normal", !date && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (date.to ? `${format(date.from, "dd/MM")} - ${format(date.to, "dd/MM")}` : format(date.from, "dd/MM")) : <span>Período</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <CalendarComponent initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={1} />
                    </PopoverContent>
                </Popover>
            </div>
            <Button onClick={handlePrint} className="h-11 w-full sm:w-auto"><Printer className="mr-2 h-4 w-4" />Imprimir Relatório</Button>
        </div>

        {/* --- MOBILE VIEW (CARDS CENTRALIZADOS) --- */}
        <div className="grid gap-4 md:hidden">
            {filteredCobrancas.length > 0 ? (
                filteredCobrancas.map((cobranca) => (
                    <Card key={cobranca.id} className="bg-card/80 shadow-md border-border/40 overflow-hidden mx-auto w-full max-w-sm">
                        <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <h3 className="text-base font-bold text-accent leading-tight">{cobranca.clientName}</h3>
                                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                        <MapPin className="h-3 w-3" />
                                        <span>{cobranca.route}</span>
                                        <span className="mx-0.5">•</span>
                                        <Calendar className="h-3 w-3" />
                                        <span>{formatDate(cobranca.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                    {(cobranca.frontCardImageUrl || cobranca.backCardImageUrl) && (
                                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-primary/10 text-primary" onClick={() => setViewingPhotos(cobranca)}>
                                            <Camera className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-muted/50" onClick={() => handlePrintReceipt(cobranca)}>
                                        <Printer className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-destructive/10 text-destructive" onClick={() => handleDeleteRequest(cobranca)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5"><Package className="h-3 w-3 text-primary" /><span>Kit: {cobranca.kitStatus === 'novo' ? 'Novo' : 'Manteve'}</span></div>
                                    <div className="flex items-center gap-1.5"><Layers className="h-3 w-3 text-primary" /><span>Cartela: {cobranca.cartelaStatus === 'nova' ? 'Nova' : 'Manteve'}</span></div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5"><Gift className="h-3 w-3 text-primary" />
                                        <span className="truncate">
                                            {cobranca.prizesGiven && cobranca.prizesGiven.length > 0 ? `${cobranca.prizesGiven.length} prêmios` : 'Sem prêmios'}
                                        </span>
                                    </div>
                                    <div className="font-semibold">Rasp: {cobranca.scratchedAmount} un.</div>
                                </div>
                            </div>

                            <div className="bg-muted/30 rounded-lg p-2.5 space-y-1 text-[11px]">
                                <div className="flex justify-between"><span>Bruto</span><span>{formatCurrency(cobranca.grossRevenue)}</span></div>
                                <div className="flex justify-between text-destructive"><span>Comissão</span><span>-{formatCurrency(cobranca.commissionValue)}</span></div>
                                {cobranca.discount ? (
                                    <div className="flex justify-between text-destructive"><span>Desconto</span><span>-{formatCurrency(cobranca.discount)}</span></div>
                                ) : null}
                                <div className="flex justify-between font-bold text-sm text-primary pt-1 border-t mt-1">
                                    <span>LÍQUIDO</span>
                                    <span>{formatCurrency(cobranca.netRevenue)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-lg border border-dashed mx-auto w-full max-w-sm">
                    Nenhuma cobrança encontrada.
                </div>
            )}
            
            {filteredCobrancas.length > 0 && (
                 <Card className="bg-primary/5 border-primary/20 mx-auto w-full max-w-sm">
                    <CardContent className="p-4">
                        <h4 className="font-bold text-xs uppercase tracking-wider mb-2 text-primary text-center sm:text-left">Resumo do Período</h4>
                        <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between"><span>Total Raspadas:</span><span className="font-bold">{reportTotals.totalScratched}</span></div>
                            <div className="flex justify-between"><span>Total Bruto:</span><span className="font-bold">{formatCurrency(reportTotals.totalGross)}</span></div>
                            <div className="flex justify-between text-destructive"><span>Total Comissão:</span><span className="font-bold">-{formatCurrency(reportTotals.totalCommission)}</span></div>
                            <div className="flex justify-between text-destructive"><span>Total Desconto:</span><span className="font-bold">-{formatCurrency(reportTotals.totalDiscount)}</span></div>
                            <Separator className="my-1.5" />
                            <div className="flex justify-between text-base font-bold text-primary"><span>TOTAL LÍQUIDO:</span><span>{formatCurrency(reportTotals.totalNet)}</span></div>
                        </div>
                    </CardContent>
                 </Card>
            )}
        </div>

        {/* --- DESKTOP VIEW (TABLE) --- */}
        <Card className="hidden md:block">
            <CardContent className="p-0" id="report-content-desktop">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Rota</TableHead>
                            <TableHead className="text-center">Data</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Qtd.</TableHead>
                            <TableHead className="text-right">Bruto</TableHead>
                            <TableHead className="text-right">Comissão</TableHead>
                            <TableHead className="text-right">Desconto</TableHead>
                            <TableHead className="text-right">Líquido</TableHead>
                            <TableHead className="text-right actions-col">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCobrancas.map((c) => (
                            <TableRow key={c.id}>
                                <TableCell className="font-medium">{c.clientName}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{c.route}</TableCell>
                                <TableCell className="text-center text-xs">{formatDate(c.createdAt)}</TableCell>
                                <TableCell className="text-[10px] space-y-0.5">
                                    <div className="flex items-center gap-1 opacity-70">Kit: {c.kitStatus}</div>
                                    <div className="flex items-center gap-1 opacity-70">Card: {c.cartelaStatus}</div>
                                </TableCell>
                                <TableCell className="text-right font-mono">{c.scratchedAmount}</TableCell>
                                <TableCell className="text-right">{formatCurrency(c.grossRevenue)}</TableCell>
                                <TableCell className="text-right text-destructive">-{formatCurrency(c.commissionValue)}</TableCell>
                                <TableCell className="text-right text-destructive">{c.discount ? `-${formatCurrency(c.discount)}` : '-'}</TableCell>
                                <TableCell className="text-right font-bold text-primary">{formatCurrency(c.netRevenue)}</TableCell>
                                <TableCell className="text-right actions-col">
                                    <div className="flex justify-end gap-1">
                                        {(c.frontCardImageUrl || c.backCardImageUrl) && (
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => setViewingPhotos(c)}><Camera className="h-4 w-4" /></Button>
                                        )}
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrintReceipt(c)}><Printer className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteRequest(c)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={4}>Totais</TableCell>
                            <TableCell className="text-right">{reportTotals.totalScratched}</TableCell>
                            <TableCell className="text-right">{formatCurrency(reportTotals.totalGross)}</TableCell>
                            <TableCell className="text-right text-destructive">-{formatCurrency(reportTotals.totalCommission)}</TableCell>
                            <TableCell className="text-right text-destructive">-{formatCurrency(reportTotals.totalDiscount)}</TableCell>
                            <TableCell className="text-right font-bold text-primary">{formatCurrency(reportTotals.totalNet)}</TableCell>
                            <TableCell className="actions-col"></TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </CardContent>
        </Card>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent className="w-[90vw] rounded-lg">
                <AlertDialogHeader><AlertDialogTitle>Excluir?</AlertDialogTitle><AlertDialogDescription>Deseja remover a cobrança de {cobrancaToDelete?.clientName}?</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction className={cn(buttonVariants({ variant: "destructive" }))} onClick={handleConfirmDelete}>Excluir</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <Dialog open={!!viewingPhotos} onOpenChange={(open) => !open && setViewingPhotos(null)}>
            <DialogContent className="max-w-4xl w-[95vw] p-4 rounded-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader className="mb-4">
                    <DialogTitle>Fotos da Cartela - {viewingPhotos?.clientName}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <p className="text-xs font-bold uppercase text-muted-foreground text-center">Frente</p>
                        {viewingPhotos?.frontCardImageUrl ? (
                            <div className="relative aspect-[4/3] w-full border rounded-md overflow-hidden bg-muted">
                                <Image src={viewingPhotos.frontCardImageUrl} alt="Frente" fill className="object-contain" />
                            </div>
                        ) : (
                            <div className="aspect-[4/3] flex items-center justify-center bg-muted rounded-md text-xs text-muted-foreground">Sem foto da frente</div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs font-bold uppercase text-muted-foreground text-center">Verso</p>
                        {viewingPhotos?.backCardImageUrl ? (
                            <div className="relative aspect-[4/3] w-full border rounded-md overflow-hidden bg-muted">
                                <Image src={viewingPhotos.backCardImageUrl} alt="Verso" fill className="object-contain" />
                            </div>
                        ) : (
                            <div className="aspect-[4/3] flex items-center justify-center bg-muted rounded-md text-xs text-muted-foreground">Sem foto do verso</div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    </div>
  );
}
