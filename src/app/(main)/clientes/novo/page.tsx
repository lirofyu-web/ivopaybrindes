import { AddClientForm } from "@/components/forms/add-client-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NovoClientePage() {
    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Adicionar Novo Cliente</CardTitle>
                    <CardDescription>Preencha os detalhes abaixo para cadastrar um novo cliente.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AddClientForm />
                </CardContent>
            </Card>
        </div>
    );
}
