'use client'
import Link from 'next/link';
import { PlusCircle, Users, Search, MapPin, Percent, Edit, Trash2, DollarSign, Loader2, X, Camera } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Client, Prize, Cobranca, Route } from '@/lib/types';
import { useMemo, useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { differenceInDays } from 'date-fns';
import ReactDOMServer from 'react-dom/server';
import { Receipt } from '@/components/receipt';
import { useCollection, useFirestore } from '@/firebase';
import { collection, deleteDoc, doc, updateDoc, increment, setDoc } from 'firebase/firestore';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';


function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// --- WhatsApp Icon ---
function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
        <circle cx="12" cy="12" r="12" fill="#25D366"/>
        <path fill="#FFF" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.438 9.884-9.885 9.884"/>
    </svg>
  );
}

// --- Charge Form Schema ---
const chargeFormSchema = z.object({
  scratchedAmount: z.coerce.number().min(1, 'A quantidade deve ser pelo menos 1.'),
  discount: z.coerce.number().optional().default(0),
  kitStatus: z.enum(['manteve', 'novo']).optional(),
  cartelaStatus: z.enum(['manteve', 'nova']).optional(),
  prizesGiven: z.array(z.object({
    prizeId: z.string(),
    prizeName: z.string(),
    quantity: z.coerce.number().min(1),
  })).optional(),
  frontCardImageUrl: z.string().optional(),
  backCardImageUrl: z.string().optional(),
});


// --- ClientCard component ---
function ClientCard({ client, onChargeClick, onDeleteClick, visitStatus }: { client: Client; onChargeClick: (client: Client) => void; onDeleteClick: (client: Client) => void; visitStatus: 'visited' | 'not-visited' }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${client.address}, ${client.city}`)}`;

  return (
    <Card className="bg-card/80 shadow-lg border-border/50">
      <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        <div className="flex justify-between items-start">
            <div className="space-y-1 flex-1 min-w-0 pr-2">
                 <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-accent truncate max-w-full">{client.name}</h3>
                    <Badge variant={visitStatus === 'visited' ? 'success' : 'destructive'} className="text-[10px] sm:text-xs font-normal">
                      {visitStatus === 'visited' ? 'Visitado' : 'Não Visitado'}
                    </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <p>{client.route}</p>
                </div>
            </div>
            <a href={`https://wa.me/${client.phone}`} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                <WhatsAppIcon className="w-10 h-10"/>
                <span className="sr-only">WhatsApp</span>
            </a>
        </div>

        <div className="space-y-2 text-xs sm:text-sm text-foreground/80">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="block hover:underline">
                <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{client.address}, {client.city}</span>
                </div>
            </a>
            <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span>Raspinha: {formatCurrency(client.raspinha)}</span>
            </div>
            <div className="flex items-center gap-3">
                <Percent className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span>Comissão: {client.comissao}%</span>
            </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
            <Button size="sm" className="flex-1 text-xs" onClick={() => onChargeClick(client)}>
                <DollarSign className="mr-1 h-3.5 w-3.5" />
                Cobrança
            </Button>
            <Link href={`/clientes/editar/${client.id}`} className="flex-shrink-0">
              <Button size="icon" variant="outline" className="h-9 w-9 border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500">
                  <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="icon" variant="outline" className="h-9 w-9 border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-500" onClick={() => onDeleteClick(client)}>
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Main Page Component ---
export default function ClientesPage() {
  const firestore = useFirestore();
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>('clients');
  const { data: allCobrancas, isLoading: isLoadingCobrancas } = useCollection<Cobranca>('cobrancas');
  const { data: routes, isLoading: isLoadingRoutes } = useCollection<Route>('rotas');
  const { data: prizes, isLoading: isLoadingPrizes } = useCollection<Prize>('premios');

  const [searchTerm, setSearchTerm] = useState('');
  const [isChargeDialogOpen, setIsChargeDialogOpen] = useState(false);
  const [isSubmittingCharge, setIsSubmittingCharge] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  
  // State for prizes in the dialog
  const [prizesForCharge, setPrizesForCharge] = useState<{prizeId: string, prizeName: string, quantity: number}[]>([]);
  const [selectedPrizeForAdd, setSelectedPrizeForAdd] = useState<Prize | null>(null);
  const [prizeQuantity, setPrizeQuantity] = useState(1);
  
  // Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraFor, setCameraFor] = useState<'front' | 'back' | null>(null);
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);

  const isLoading = isLoadingClients || isLoadingCobrancas || isLoadingRoutes || isLoadingPrizes;

  const form = useForm<z.infer<typeof chargeFormSchema>>({
    resolver: zodResolver(chargeFormSchema),
    defaultValues: { scratchedAmount: 0, discount: 0, prizesGiven: [] },
  });
  
  const scratchedAmount = form.watch('scratchedAmount');
  const discount = form.watch('discount') || 0;

    useEffect(() => {
        setCurrentDate(new Date());
    }, []);

    useEffect(() => {
        let stream: MediaStream | null = null;
        const getCameraPermission = async () => {
            if (isCameraOpen) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                    setHasCameraPermission(true);
                } catch (error) {
                    console.error('Error accessing camera:', error);
                    setHasCameraPermission(false);
                    toast({
                        variant: 'destructive',
                        title: 'Acesso à Câmera Negado',
                        description: 'Por favor, habilite a permissão da câmera nas configurações do seu navegador.',
                    });
                    setIsCameraOpen(false); 
                }
            }
        };
        getCameraPermission();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
             if (videoRef.current && videoRef.current.srcObject) {
                const mediaStream = videoRef.current.srcObject as MediaStream;
                mediaStream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
        };
    }, [isCameraOpen, toast]);

  const chargeCalculations = useMemo(() => {
    if (!selectedClient || !scratchedAmount) {
      return { grossRevenue: 0, commissionValue: 0, netRevenue: 0, finalNetRevenue: 0 };
    }
    const grossRevenue = scratchedAmount * selectedClient.raspinha;
    const commissionValue = grossRevenue * (selectedClient.comissao / 100);
    const netRevenue = grossRevenue - commissionValue;
    const finalNetRevenue = netRevenue - discount;
    return { grossRevenue, commissionValue, netRevenue, finalNetRevenue };
  }, [selectedClient, scratchedAmount, discount]);


  const handleOpenChargeDialog = (client: Client) => {
    setSelectedClient(client);
    setIsChargeDialogOpen(true);
    form.reset({ scratchedAmount: 0, discount: 0, prizesGiven: [] });
    setPrizesForCharge([]);
    setFrontImage(null);
    setBackImage(null);
    setIsCameraOpen(false);
    setHasCameraPermission(null);
    setSelectedPrizeForAdd(null);
    setPrizeQuantity(1);
  };

  const handleChargeDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedClient(null);
      setIsCameraOpen(false);
    }
    setIsChargeDialogOpen(open);
  }

  const handleDeleteRequest = (client: Client) => {
    setClientToDelete(client);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete || !firestore) return;
    
    try {
      await deleteDoc(doc(firestore, 'clients', clientToDelete.id!));
      toast({
        title: 'Cliente Excluído!',
        description: `O cliente "${clientToDelete.name}" foi removido com sucesso.`,
        variant: 'destructive'
      });
    } catch (error) {
      console.error("Error deleting client:", error);
      toast({
        title: 'Erro!',
        description: 'Não foi possível excluir o cliente.',
        variant: 'destructive'
      });
    }
    setIsDeleteDialogOpen(false);
    setClientToDelete(null);
  };

  const handleAddPrizeToCharge = () => {
    if (!selectedPrizeForAdd || prizeQuantity <= 0) return;
    
    const availableStock = prizes?.find(p => p.id === selectedPrizeForAdd.id)?.quantity ?? 0;

    if (prizeQuantity > availableStock) {
        toast({
            variant: 'destructive',
            title: 'Estoque Insuficiente',
            description: `Só existem ${availableStock} unidades de ${selectedPrizeForAdd.name} em estoque.`
        });
        return;
    }

    const newPrizeEntry = { prizeId: selectedPrizeForAdd.id!, prizeName: selectedPrizeForAdd.name, quantity: prizeQuantity };
    
    setPrizesForCharge(prev => {
        const existingPrizeIndex = prev.findIndex(p => p.prizeId === newPrizeEntry.prizeId);
        let updatedPrizes;
        if (existingPrizeIndex > -1) {
            updatedPrizes = [...prev];
            updatedPrizes[existingPrizeIndex].quantity += newPrizeEntry.quantity;
        } else {
            updatedPrizes = [...prev, newPrizeEntry];
        }
        form.setValue('prizesGiven', updatedPrizes);
        return updatedPrizes;
    });
    
    setSelectedPrizeForAdd(null);
    setPrizeQuantity(1);
  };
  
  const handleRemovePrizeFromCharge = (prizeId: string) => {
      const updatedPrizes = prizesForCharge.filter(p => p.prizeId !== prizeId);
      setPrizesForCharge(updatedPrizes);
      form.setValue('prizesGiven', updatedPrizes);
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

    const handleTakePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (context) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUri = canvas.toDataURL('image/jpeg');
            
            if (cameraFor === 'front') {
                setFrontImage(dataUri);
                form.setValue('frontCardImageUrl', dataUri);
            } else if (cameraFor === 'back') {
                setBackImage(dataUri);
                form.setValue('backCardImageUrl', dataUri);
            }
            setIsCameraOpen(false);
            setCameraFor(null);
        }
    };

    const openCamera = (type: 'front' | 'back') => {
        setCameraFor(type);
        setIsCameraOpen(true);
    }

  const onChargeSubmit = async (values: z.infer<typeof chargeFormSchema>) => {
    if (!selectedClient || !firestore) return;
    setIsSubmittingCharge(true);
    
    // Create a clean data object to avoid undefined values which Firestore rejects
    const chargeData: any = {
        clientId: selectedClient.id!,
        clientName: selectedClient.name,
        route: selectedClient.route,
        createdAt: new Date(),
        scratchedAmount: values.scratchedAmount,
        scratchPrice: selectedClient.raspinha,
        commissionPercentage: selectedClient.comissao,
        grossRevenue: chargeCalculations.grossRevenue,
        commissionValue: chargeCalculations.commissionValue,
        netRevenue: chargeCalculations.finalNetRevenue,
        discount: values.discount || 0,
    };
    
    // Explicitly add optional fields only if they have values
    if (values.kitStatus) chargeData.kitStatus = values.kitStatus;
    if (values.cartelaStatus) chargeData.cartelaStatus = values.cartelaStatus;
    if (values.frontCardImageUrl) chargeData.frontCardImageUrl = values.frontCardImageUrl;
    if (values.backCardImageUrl) chargeData.backCardImageUrl = values.backCardImageUrl;
    if (prizesForCharge && prizesForCharge.length > 0) chargeData.prizesGiven = prizesForCharge;
    
    try {
      const newChargeRef = doc(collection(firestore, 'cobrancas'));
      const chargeId = newChargeRef.id;

      await setDoc(newChargeRef, chargeData);
      
      // Update prize stocks
      for (const prizeGiven of prizesForCharge) {
        const prizeDocRef = doc(firestore, 'premios', prizeGiven.prizeId);
        await updateDoc(prizeDocRef, {
            quantity: increment(-prizeGiven.quantity)
        });
      }

      toast({
        title: 'Cobrança Salva!',
        description: `A cobrança para ${selectedClient?.name} foi registrada com sucesso.`,
      });
      
      handlePrintReceipt({ ...chargeData, id: chargeId });

      handleChargeDialogClose(false);
      form.reset();
      setPrizesForCharge([]);
      setFrontImage(null);
      setBackImage(null);

    } catch (error: any) {
      console.error("Error saving charge:", error);
      toast({
        title: 'Erro ao Salvar!',
        description: error.message || 'Não foi possível salvar a cobrança. Verifique sua conexão e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingCharge(false);
    }
  };

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    if (!searchTerm) return clients;
    return clients.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.route.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, clients]);

  const clientVisitStatus = useMemo(() => {
    const statusMap = new Map<string, 'visited' | 'not-visited'>();
    if (!allCobrancas || !clients || !currentDate) {
        clients?.forEach(client => statusMap.set(client.id!, 'not-visited'));
        return statusMap;
    };
    const now = currentDate;
    
    const sortedCobrancas = [...allCobrancas].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    clients.forEach(client => {
      const lastCharge = sortedCobrancas.find(c => c.clientId === client.id);
      if (lastCharge && differenceInDays(now, lastCharge.createdAt) <= 25) {
        statusMap.set(client.id!, 'visited');
      } else {
        statusMap.set(client.id!, 'not-visited');
      }
    });
    return statusMap;
  }, [allCobrancas, clients, currentDate]);

  const clientsByRoute = useMemo(() => {
    if (!filteredClients || !routes) return {};

    const routeDescriptionMap = new Map<string, string>();
    routes.forEach(r => routeDescriptionMap.set(r.name, r.description));

    return filteredClients.reduce((acc, client) => {
      const routeName = client.route;
      if (!acc[routeName]) {
        acc[routeName] = {
          description: routeDescriptionMap.get(routeName) || '',
          clients: []
        };
      }
      acc[routeName].clients.push(client);
      return acc;
    }, {} as Record<string, { description: string; clients: Client[] }>);
  }, [filteredClients, routes]);


  if (isLoading) {
    return (
        <div className="space-y-6 px-4">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-muted-foreground" />
                    <h1 className="text-2xl font-bold font-headline">
                        Gerenciar Clientes
                    </h1>
                </div>
            </div>
            <div className="text-center py-12 text-muted-foreground">
                <Loader2 className="mx-auto h-12 w-12 animate-spin" />
                <p className="mt-4">Carregando clientes...</p>
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-4 mobile-container">
        <canvas ref={canvasRef} className="hidden"></canvas>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <Users className="h-8 w-8 text-muted-foreground" />
                <h1 className="text-2xl sm:text-3xl font-bold font-headline text-left">
                    Clientes
                </h1>
            </div>
            <Link href="/clientes/novo" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto h-11">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo Cliente
                </Button>
            </Link>
        </div>
        
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
                placeholder="Buscar por nome ou rota..."
                className="pl-10 h-11"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        <div className="space-y-6">
            {Object.entries(clientsByRoute).sort(([routeA], [routeB]) => routeA.localeCompare(routeB)).map(([routeName, { description, clients: routeClients }]) => (
                <div key={routeName} className="space-y-3">
                    <h2 className="text-base font-semibold border-b border-border pb-1.5 px-1 flex items-baseline gap-2">
                        {routeName}
                        {description && <span className="text-[10px] font-normal text-muted-foreground truncate">- {description}</span>}
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {routeClients.map(client => (
                            <ClientCard 
                                key={client.id} 
                                client={client} 
                                onChargeClick={handleOpenChargeDialog}
                                onDeleteClick={handleDeleteRequest}
                                visitStatus={clientVisitStatus.get(client.id!) || 'not-visited'}
                             />
                        ))}
                    </div>
                </div>
            ))}
            {filteredClients.length === 0 && !isLoading && (
                <div className="text-center py-12 text-muted-foreground">
                    <p>Nenhum cliente encontrado.</p>
                </div>
            )}
        </div>

        <Dialog open={isChargeDialogOpen} onOpenChange={handleChargeDialogClose}>
            <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-lg">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-lg">Cobrança: {selectedClient?.name}</DialogTitle>
                    <DialogDescription className="text-xs">
                    Insira os detalhes da venda para calcular e salvar.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onChargeSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="scratchedAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">Qtd. Rasp.</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Ex: 100" className="h-10" {...field} />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="discount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">Desconto (R$)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="0,00" className="h-10" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )}
                            />
                        </div>
                        
                        <Separator/>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <FormField
                                control={form.control}
                                name="kitStatus"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-xs">Kit Brindes</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="flex flex-col space-y-1"
                                            >
                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                    <FormControl><RadioGroupItem value="manteve" /></FormControl>
                                                    <FormLabel className="font-normal text-xs">Manteve</FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                    <FormControl><RadioGroupItem value="novo" /></FormControl>
                                                    <FormLabel className="font-normal text-xs">Recebeu Novo</FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="cartelaStatus"
                                render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <FormLabel className="text-xs">Cartela</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="flex flex-col space-y-1"
                                            >
                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                    <FormControl><RadioGroupItem value="manteve" /></FormControl>
                                                    <FormLabel className="font-normal text-xs">Manteve</FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-2 space-y-0">
                                                    <FormControl><RadioGroupItem value="nova" /></FormControl>
                                                    <FormLabel className="font-normal text-xs">Recebeu Nova</FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Separator/>
                        
                        <div className="space-y-3">
                            <h4 className="font-medium text-xs">Prêmios que saíram</h4>
                            <div className="space-y-1.5">
                                {prizesForCharge.map(p => (
                                    <div key={p.prizeId} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-[11px]">
                                        <span className="truncate mr-2">{p.prizeName} <span className="text-muted-foreground ml-1">x{p.quantity}</span></span>
                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemovePrizeFromCharge(p.prizeId)}>
                                            <X className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                ))}
                                {prizesForCharge.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-1">Nenhum prêmio saiu.</p>}
                            </div>
                            <div className="flex gap-2 items-end">
                                <FormItem className="flex-1 min-w-0">
                                    <FormLabel className="text-[10px]">Prêmio</FormLabel>
                                    <Select onValueChange={(prizeId) => setSelectedPrizeForAdd(prizes?.find(p => p.id === prizeId) || null)} value={selectedPrizeForAdd?.id || ''}>
                                        <FormControl>
                                            <SelectTrigger className="h-9 text-xs">
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {prizes?.filter(p => p.quantity > 0).map(prize => (
                                                <SelectItem key={prize.id} value={prize.id!}>
                                                    <div className="flex justify-between items-center w-full min-w-[200px] gap-2">
                                                        <span className="truncate text-xs flex-1">{prize.name}</span>
                                                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground whitespace-nowrap">Est: {prize.quantity}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                                <FormItem className="w-16">
                                    <FormLabel className="text-[10px]">Qtd.</FormLabel>
                                    <Input type="number" min="1" value={prizeQuantity} onChange={e => setPrizeQuantity(Number(e.target.value))} className="h-9 px-1.5 text-xs" />
                                </FormItem>
                                <Button type="button" variant="secondary" onClick={handleAddPrizeToCharge} disabled={!selectedPrizeForAdd} size="sm" className="h-9 text-[11px] px-2">Add</Button>
                            </div>
                        </div>
                        
                        <Separator/>

                        <div className="space-y-3">
                            <h4 className="font-medium text-xs">Fotos da Cartela <span className="text-[10px] text-muted-foreground font-normal ml-1">(Opcional)</span></h4>
                            {isCameraOpen ? (
                                <div className="space-y-3 p-3 border rounded-md">
                                    <h5 className="font-semibold text-center text-[10px]">Câmera - {cameraFor === 'front' ? 'Frente' : 'Verso'}</h5>
                                    {hasCameraPermission === false && (
                                        <Alert variant="destructive" className="p-2">
                                            <AlertDescription className="text-[10px]">
                                                Permita o acesso à câmera nas configurações.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                    <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                                    <div className="flex gap-2 justify-center">
                                        <Button type="button" size="sm" onClick={handleTakePhoto} disabled={hasCameraPermission !== true} className="text-xs h-9">
                                            <Camera className="mr-1.5 h-3.5 w-3.5" />
                                            Tirar Foto
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" onClick={() => setIsCameraOpen(false)} className="text-xs h-9">Cancelar</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <FormLabel className="text-[10px]">Frente</FormLabel>
                                        {frontImage ? (
                                            <div className="relative w-full aspect-video rounded-md overflow-hidden border">
                                                <Image src={frontImage} alt="Frente" fill className="object-cover" />
                                                <Button type="button" variant="destructive" size="icon" className="absolute top-0.5 right-0.5 h-6 w-6" onClick={() => { setFrontImage(null); form.setValue('frontCardImageUrl', undefined); }}>
                                                    <X className="h-3.5 w-3.5"/>
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button type="button" variant="outline" className="w-full h-14 flex-col gap-1 text-[10px]" onClick={() => openCamera('front')}>
                                                <Camera className="h-4 w-4" /> Foto Frente
                                            </Button>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <FormLabel className="text-[10px]">Verso</FormLabel>
                                        {backImage ? (
                                            <div className="relative w-full aspect-video rounded-md overflow-hidden border">
                                                <Image src={backImage} alt="Verso" fill className="object-cover" />
                                                <Button type="button" variant="destructive" size="icon" className="absolute top-0.5 right-0.5 h-6 w-6" onClick={() => { setBackImage(null); form.setValue('backCardImageUrl', undefined); }}>
                                                    <X className="h-3.5 w-3.5"/>
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button type="button" variant="outline" className="w-full h-14 flex-col gap-1 text-[10px]" onClick={() => openCamera('back')}>
                                                <Camera className="h-4 w-4" /> Foto Verso
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {scratchedAmount > 0 && selectedClient && (
                            <div className="space-y-2 rounded-lg border bg-muted/50 p-3">
                                <h4 className="font-semibold text-center text-xs">Resumo da Cobrança</h4>
                                <div className="space-y-1.5 text-[11px]">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Bruto</span>
                                        <span>{formatCurrency(chargeCalculations.grossRevenue)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Comissão ({selectedClient.comissao}%)</span>
                                        <span className="text-destructive">-{formatCurrency(chargeCalculations.commissionValue)}</span>
                                    </div>
                                    {discount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Desconto</span>
                                        <span className="text-destructive">-{formatCurrency(discount)}</span>
                                    </div>
                                    )}
                                </div>
                                <Separator className="my-1.5" />
                                <div className="flex justify-between items-center font-bold">
                                    <span className="text-[10px] uppercase">Líquido Empresa</span>
                                    <span className="text-primary text-sm">{formatCurrency(chargeCalculations.finalNetRevenue)}</span>
                                </div>
                            </div>
                        )}

                        <Button type="submit" disabled={isSubmittingCharge || !scratchedAmount} className="w-full h-12 text-sm">
                            {isSubmittingCharge && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Cobrança
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent className="w-[90vw] rounded-lg">
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Cliente?</AlertDialogTitle>
                    <AlertDialogDescription className="text-xs sm:text-sm">
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o cliente
                        <span className="font-bold"> {clientToDelete?.name} </span>.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel onClick={() => setClientToDelete(null)} className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        className={cn(buttonVariants({ variant: "destructive" }), "w-full sm:w-auto")}
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