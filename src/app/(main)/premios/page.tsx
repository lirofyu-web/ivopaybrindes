'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Prize } from '@/lib/types';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Gift, PlusCircle, Loader2, Edit, Trash2, Camera, X } from 'lucide-react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore } from '@/firebase';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// --- Add Prize Form Schema ---
const prizeFormSchema = z.object({
  name: z.string().min(3, { message: 'O nome do prêmio deve ter pelo menos 3 caracteres.' }),
  quantity: z.coerce.number().min(0, { message: 'A quantidade não pode ser negativa.' }),
  imageUrl: z.string().min(1, { message: 'A imagem do prêmio é obrigatória.' }),
});

// --- Prize Card Component ---
function PrizeCard({ prize, onEdit, onDelete }: { prize: Prize; onEdit: (prize: Prize) => void; onDelete: (prizeId: string) => void; }) {
    return (
        <Card className="overflow-hidden flex flex-col">
            <div className="relative aspect-video w-full">
                <Image
                    src={prize.imageUrl || 'https://placehold.co/400x300/27272a/71717a?text=Sem+Imagem'}
                    alt={prize.name}
                    fill
                    className="object-cover"
                    data-ai-hint="prize item"
                />
                 <Badge variant={prize.quantity > 0 ? 'default' : 'destructive'} className="absolute top-2 right-2">
                    {prize.quantity > 0 ? `Estoque: ${prize.quantity}` : 'Esgotado'}
                </Badge>
            </div>
            <CardHeader className="p-4 flex-1">
                <CardTitle className="text-lg">{prize.name}</CardTitle>
            </CardHeader>
            <CardFooter className="p-4 pt-0 flex gap-2">
                <Button variant="outline" size="sm" className="w-full" onClick={() => onEdit(prize)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                </Button>
                <Button variant="destructive" size="icon" onClick={() => onDelete(prize.id!)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Deletar</span>
                </Button>
            </CardFooter>
        </Card>
    );
}

// --- Main Page Component ---
export default function PremiosPage() {
    const firestore = useFirestore();
    const { data: prizes, isLoading } = useCollection<Prize>('premios');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
    const { toast } = useToast();

    // Camera state
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [prizeImage, setPrizeImage] = useState<string | null>(null);


    const form = useForm<z.infer<typeof prizeFormSchema>>({
        resolver: zodResolver(prizeFormSchema),
        defaultValues: { name: '', quantity: 0, imageUrl: '' },
    });

    useEffect(() => {
        if (isCameraOpen) {
            const getCameraPermission = async () => {
                try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
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
                }
            };
            getCameraPermission();
        } else {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
        }
    }, [isCameraOpen, toast]);

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
            
            setPrizeImage(dataUri);
            form.setValue('imageUrl', dataUri, { shouldValidate: true });
            
            setIsCameraOpen(false);
        }
    };

    const openCamera = () => {
        setIsCameraOpen(true);
    }

    const handleDialogOpen = (open: boolean) => {
        if (!open) {
            form.reset({ name: '', quantity: 0, imageUrl: '' });
            setEditingPrize(null);
            setPrizeImage(null);
            setIsCameraOpen(false);
            setHasCameraPermission(null);
        }
        setIsDialogOpen(open);
    }
    
    const handleEdit = (prize: Prize) => {
        setEditingPrize(prize);
        form.setValue('name', prize.name);
        form.setValue('quantity', prize.quantity);
        form.setValue('imageUrl', prize.imageUrl);
        setPrizeImage(prize.imageUrl);
        setIsDialogOpen(true);
    };

    const handleDelete = async (prizeId: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, 'premios', prizeId));
            toast({
                title: 'Prêmio Deletado!',
                description: 'O prêmio foi removido da sua lista.',
                variant: 'destructive'
            });
        } catch (error) {
            toast({
                title: 'Erro!',
                description: 'Não foi possível deletar o prêmio.',
                variant: 'destructive'
            });
            console.error("Error deleting prize:", error);
        }
    };
    
    const onSubmit = async (values: z.infer<typeof prizeFormSchema>) => {
        if (!firestore) return;
        setIsSubmitting(true);
        
        try {
            if (editingPrize) {
                const prizeDocRef = doc(firestore, 'premios', editingPrize.id!);
                await updateDoc(prizeDocRef, values);
                toast({
                    title: 'Prêmio Atualizado!',
                    description: `O prêmio "${values.name}" foi atualizado com sucesso.`,
                });
            } else {
                await addDoc(collection(firestore, 'premios'), values);
                toast({
                    title: 'Prêmio Adicionado!',
                    description: `O prêmio "${values.name}" foi cadastrado com sucesso.`,
                });
            }
            handleDialogOpen(false);
        } catch (error) {
             toast({
                title: 'Erro!',
                description: 'Não foi possível salvar o prêmio.',
                variant: 'destructive'
            });
            console.error("Error saving prize:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="space-y-6">
            <canvas ref={canvasRef} className="hidden"></canvas>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Gift className="h-8 w-8 text-muted-foreground" />
                    <h1 className="text-3xl font-bold font-headline">
                        Gerenciar Prêmios
                    </h1>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Novo Prêmio
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{editingPrize ? 'Editar Prêmio' : 'Adicionar Novo Prêmio'}</DialogTitle>
                            <DialogDescription>
                                Preencha os detalhes para {editingPrize ? 'editar o' : 'cadastrar um novo'} prêmio.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="space-y-4">
                                     <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome do Prêmio</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: Bicicleta Aro 29" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="quantity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Quantidade em Estoque</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="Ex: 10" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="imageUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Imagem do Prêmio</FormLabel>
                                                {isCameraOpen ? (
                                                    <div className="space-y-4 p-4 border rounded-md">
                                                        <h5 className="font-semibold text-center">Câmera</h5>
                                                        {hasCameraPermission === false && (
                                                            <Alert variant="destructive">
                                                                <AlertTitle>Acesso à Câmera Necessário</AlertTitle>
                                                                <AlertDescription>
                                                                    Por favor, permita o acesso à câmera para tirar a foto.
                                                                </AlertDescription>
                                                            </Alert>
                                                        )}
                                                        <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted />
                                                        <div className="flex gap-2 justify-center">
                                                            <Button type="button" onClick={handleTakePhoto} disabled={hasCameraPermission !== true}>
                                                                <Camera className="mr-2 h-4 w-4" />
                                                                Tirar Foto
                                                            </Button>
                                                            <Button type="button" variant="outline" onClick={() => setIsCameraOpen(false)}>Cancelar</Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {prizeImage ? (
                                                            <div className="relative w-full aspect-video rounded-md overflow-hidden">
                                                                <Image src={prizeImage} alt="Imagem do prêmio" fill className="object-cover" />
                                                                <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => { setPrizeImage(null); form.setValue('imageUrl', ''); }}>
                                                                    <X className="h-4 w-4"/>
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <Button type="button" variant="outline" className="w-full h-24" onClick={openCamera}>
                                                                <Camera className="mr-2 h-5 w-5" /> Adicionar Imagem
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingPrize ? 'Salvar Alterações' : 'Salvar Prêmio'}
                                </Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                 <div className="text-center py-12 text-muted-foreground">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin" />
                    <p className="mt-4">Carregando prêmios...</p>
                </div>
            ) : (
                <>
                    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {prizes?.map(prize => (
                            <PrizeCard key={prize.id} prize={prize} onEdit={handleEdit} onDelete={handleDelete} />
                        ))}
                    </div>
                    {prizes?.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground col-span-full">
                            <p>Nenhum prêmio cadastrado ainda.</p>
                        </div>
                    )}
                </>
            )}
            
        </div>
    );
}
