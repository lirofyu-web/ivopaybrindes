import { AddClientForm } from "@/components/forms/add-client-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NovoClientePage() {
    return (
        <div className="max-w-2xl mx-auto px-1 sm:px-0">
            <Card className="border-border/40 shadow-lg">
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-xl sm:text-2xl">Adicionar Novo Cliente</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Preencha os detalhes abaixo para cadastrar um novo cliente.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                    <AddClientForm />
                </CardContent>
            </Card>
        </div>
    );
}
