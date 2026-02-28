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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// --- WhatsApp Icon ---
function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.438 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.558 0 11.894-5.335 11.897-11.893a11.83 11.83 0 00-3.481-8.417z"/>
    </svg>
  );
}

// --- Charge Form Schema ---
const chargeFormSchema = z.object({
  scratchedAmount: z.coerce.number().min(1, 'A quantidade deve ser pelo menos 1.'),
  discount: z.coerce.number().optional(),
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
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-start">
            <div className="space-y-1">
                 <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-accent">{client.name}</h3>
                    <Badge variant={visitStatus === 'visited' ? 'success' : 'destructive'} className="text-xs font-normal">
                      {visitStatus === 'visited' ? 'Visitado' : 'Não Visitado'}
                    </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <p>{client.route}</p>
                </div>
            </div>
            <a href={`https://wa.me/${client.phone}`} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:text-emerald-600 transition-colors">
                <WhatsAppIcon className="w-8 h-8"/>
                <span className="sr-only">WhatsApp</span>
            </a>
        </div>

        <div className="space-y-2 text-sm text-foreground/80">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="block hover:underline">
                <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{client.address}, {client.city}</span>
                </div>
            </a>
            <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span>Raspinha: {formatCurrency(client.raspinha)}</span>
            </div>
            <div className="flex items-center gap-3">
                <Percent className="w-4 h-4 text-muted-foreground" />
                <span>Comissão: {client.comissao}%</span>
            </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
            <Button size="sm" className="flex-1" onClick={() => onChargeClick(client)}>
                <DollarSign className="mr-2 h-4 w-4" />
                Nova Cobrança
            </Button>
            <Link href={`/clientes/editar/${client.id}`}>
              <Button size="icon" variant="outline" className="border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 hover:text-yellow-400">
                  <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="icon" variant="outline" className="border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400" onClick={() => onDeleteClick(client)}>
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
                    setIsCameraOpen(false); // Close camera view if permission is denied
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
    
    // Reset fields
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
    
    // Prepare the document data, filtering out undefined values to avoid Firestore errors
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
    
    if (values.kitStatus) chargeData.kitStatus = values.kitStatus;
    if (values.cartelaStatus) chargeData.cartelaStatus = values.cartelaStatus;
    if (values.frontCardImageUrl) chargeData.frontCardImageUrl = values.frontCardImageUrl;
    if (values.backCardImageUrl) chargeData.backCardImageUrl = values.backCardImageUrl;
    if (prizesForCharge.length > 0) chargeData.prizesGiven = prizesForCharge;
    
    try {
      // Get a new doc ID upfront
      const newChargeRef = doc(collection(firestore, 'cobrancas'));
      const chargeId = newChargeRef.id;

      // Initiate the writes without awaiting
      setDoc(newChargeRef, chargeData)
        .catch(async (error) => {
            const permissionError = new FirestorePermissionError({
                path: newChargeRef.path,
                operation: 'create',
                requestResourceData: chargeData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
      
      // Update prize stock
      for (const prizeGiven of prizesForCharge) {
        const prizeDocRef = doc(firestore, 'premios', prizeGiven.prizeId);
        updateDoc(prizeDocRef, {
            quantity: increment(-prizeGiven.quantity)
        }).catch(async (error) => {
            const permissionError = new FirestorePermissionError({
                path: prizeDocRef.path,
                operation: 'update',
                requestResourceData: { quantity: increment(-prizeGiven.quantity) },
            });
            errorEmitter.emit('permission-error', permissionError);
        });
      }

      toast({
        title: 'Cobrança Salva!',
        description: `A cobrança para ${selectedClient?.name} foi registrada com sucesso.`,
      });
      
      // Proceed with printing immediately using the ID we generated
      handlePrintReceipt({ ...chargeData, id: chargeId });

    } catch (error: any) {
      toast({
        title: 'Erro!',
        description: 'Não foi possível salvar a cobrança.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingCharge(false);
      handleChargeDialogClose(false);
      setFrontImage(null);
      setBackImage(null);
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
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-muted-foreground" />
                    <h1 className="text-3xl font-bold font-headline">
                        Gerenciar Clientes
                    </h1>
                </div>
                <Link href="/clientes/novo">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Novo Cliente
                    </Button>
                </Link>
            </div>
            <div className="text-center py-12 text-muted-foreground">
                <Loader2 className="mx-auto h-12 w-12 animate-spin" />
                <p className="mt-4">Carregando clientes...</p>
            </div>
        </div>
    )
  }

  return (
    <div className="space-y-6">
        <canvas ref={canvasRef} className="hidden"></canvas>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-muted-foreground" />
                <h1 className="text-3xl font-bold font-headline">
                    Gerenciar Clientes
                </h1>
            </div>
            <Link href="/clientes/novo">
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo Cliente
                </Button>
            </Link>
        </div>
        
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
                placeholder="Buscar por nome ou rota..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        <div className="space-y-8">
            {Object.entries(clientsByRoute).sort(([routeA], [routeB]) => routeA.localeCompare(routeB)).map(([routeName, { description, clients: routeClients }]) => (
                <div key={routeName} className="space-y-4">
                    <h2 className="text-xl font-semibold border-b border-border pb-2">
                        {routeName}
                        {description && <span className="text-sm font-normal text-muted-foreground ml-2">- {description}</span>}
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
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nova Cobrança para {selectedClient?.name}</DialogTitle>
                    <DialogDescription>
                    Insira os detalhes da venda para calcular e salvar a cobrança.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onChargeSubmit)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="scratchedAmount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Qtd. Raspadinhas</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Ex: 100" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="discount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Desconto (R$)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Ex: 10,00" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        
                        <Separator/>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="kitStatus"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>Kit</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="flex flex-col space-y-1"
                                            >
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl><RadioGroupItem value="manteve" /></FormControl>
                                                    <FormLabel className="font-normal">Manteve kit</FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl><RadioGroupItem value="novo" /></FormControl>
                                                    <FormLabel className="font-normal">Novo kit</FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="cartelaStatus"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>Cartela</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="flex flex-col space-y-1"
                                            >
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl><RadioGroupItem value="manteve" /></FormControl>
                                                    <FormLabel className="font-normal">Manteve cartela</FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl><RadioGroupItem value="nova" /></FormControl>
                                                    <FormLabel className="font-normal">Nova cartela</FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Separator/>
                        
                        <div className="space-y-4">
                            <h4 className="font-medium">Prêmios que saíram</h4>
                            <div className="space-y-2">
                                {prizesForCharge.map(p => (
                                    <div key={p.prizeId} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                                        <span>{p.prizeName} <span className="text-muted-foreground">x{p.quantity}</span></span>
                                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemovePrizeFromCharge(p.prizeId)}>
                                            <X className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                ))}
                                {prizesForCharge.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Nenhum prêmio adicionado.</p>}
                            </div>
                            <div className="flex gap-2 items-end">
                                <FormItem className="flex-1">
                                    <FormLabel>Prêmio</FormLabel>
                                    <Select onValueChange={(prizeId) => setSelectedPrizeForAdd(prizes?.find(p => p.id === prizeId) || null)} value={selectedPrizeForAdd?.id || ''}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione um prêmio" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {prizes?.filter(p => p.quantity > 0).map(prize => (
                                                <SelectItem key={prize.id} value={prize.id!}>
                                                    <div className="flex justify-between items-center w-full gap-4">
                                                        <span className="truncate text-xs">{prize.name}</span>
                                                        <span className="text-muted-foreground text-[10px] flex-shrink-0">Est: {prize.quantity}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                                <FormItem className="w-16">
                                    <FormLabel>Qtd.</FormLabel>
                                    <Input type="number" min="1" value={prizeQuantity} onChange={e => setPrizeQuantity(Number(e.target.value))} className="px-1" />
                                </FormItem>
                                <Button type="button" variant="secondary" onClick={handleAddPrizeToCharge} disabled={!selectedPrizeForAdd} size="sm" className="mb-0.5">Add</Button>
                            </div>
                        </div>
                        
                        <Separator/>

                        <div className="space-y-4">
                            <h4 className="font-medium">Fotos da Cartela</h4>
                            {isCameraOpen ? (
                                <div className="space-y-4 p-4 border rounded-md">
                                    <h5 className="font-semibold text-center">Câmera - {cameraFor === 'front' ? 'Frente' : 'Verso'}</h5>
                                    {hasCameraPermission === false && (
                                        <Alert variant="destructive">
                                            <AlertTitle>Acesso à Câmera Necessário</AlertTitle>
                                            <AlertDescription>
                                                Por favor, permita o acesso à câmera para tirar a foto.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                    <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                                    <div className="flex gap-2 justify-center">
                                        <Button type="button" onClick={handleTakePhoto} disabled={hasCameraPermission !== true}>
                                            <Camera className="mr-2 h-4 w-4" />
                                            Tirar Foto
                                        </Button>
                                        <Button type="button" variant="outline" onClick={() => setIsCameraOpen(false)}>Cancelar</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <FormLabel className="text-xs">Frente <span className="text-muted-foreground">(Opcional)</span></FormLabel>
                                        {frontImage ? (
                                            <div className="relative w-full aspect-video rounded-md overflow-hidden">
                                                <Image src={frontImage} alt="Frente da cartela" fill className="object-cover" />
                                                <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => { setFrontImage(null); form.setValue('frontCardImageUrl', undefined); }}>
                                                    <X className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button type="button" variant="outline" className="w-full h-16 flex-col gap-1 text-[10px]" onClick={() => openCamera('front')}>
                                                <Camera className="h-4 w-4" /> Adicionar Foto
                                            </Button>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <FormLabel className="text-xs">Verso <span className="text-muted-foreground">(Opcional)</span></FormLabel>
                                        {backImage ? (
                                            <div className="relative w-full aspect-video rounded-md overflow-hidden">
                                                <Image src={backImage} alt="Verso da cartela" fill className="object-cover" />
                                                <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => { setBackImage(null); form.setValue('backCardImageUrl', undefined); }}>
                                                    <X className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button type="button" variant="outline" className="w-full h-16 flex-col gap-1 text-[10px]" onClick={() => openCamera('back')}>
                                                <Camera className="h-4 w-4" /> Adicionar Foto
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {scratchedAmount > 0 && selectedClient && (
                            <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
                                <h4 className="font-semibold text-center">Resumo da Cobrança</h4>
                                <div className="space-y-2 text-sm">
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
                                <Separator />
                                <div className="flex justify-between items-center text-base font-bold">
                                    <span className="text-xs">Líquido Empresa</span>
                                    <span className="text-primary">{formatCurrency(chargeCalculations.finalNetRevenue)}</span>
                                </div>
                            </div>
                        )}

                        <Button type="submit" disabled={isSubmittingCharge || !scratchedAmount} className="w-full">
                            {isSubmittingCharge && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Cobrança
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente o cliente
                        <span className="font-bold"> {clientToDelete?.name} </span>
                        e todos os seus data associados.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setClientToDelete(null)}>Cancelar</AlertDialogCancel>
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
