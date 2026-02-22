import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function ConfiguracoesPage() {
  return (
    <div className="flex justify-center items-start h-full pt-16">
        <Card className="w-full max-w-md text-center">
            <CardHeader className="items-center">
                <div className="p-3 rounded-full bg-primary/10 mb-4">
                    <Settings className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-headline">Configurações</CardTitle>
                <CardDescription>Esta funcionalidade está em desenvolvimento.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Em breve você poderá personalizar as configurações do aplicativo por aqui.</p>
            </CardContent>
        </Card>
    </div>
  );
}
