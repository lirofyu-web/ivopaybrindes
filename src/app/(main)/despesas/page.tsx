import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { TrendingDown } from "lucide-react";

export default function DespesasPage() {
  return (
    <div className="flex justify-center items-start h-full pt-16">
        <Card className="w-full max-w-md text-center">
            <CardHeader className="items-center">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                    <TrendingDown className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-headline">Controle de Despesas</CardTitle>
                <CardDescription>Esta funcionalidade está em desenvolvimento.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Em breve você poderá registrar e acompanhar suas despesas operacionais aqui.</p>
            </CardContent>
        </Card>
    </div>
  );
}
