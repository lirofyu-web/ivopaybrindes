import { AddClientForm } from "@/components/forms/add-client-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockClients } from "@/lib/mock-clients";
import type { Client } from "@/lib/types";
import { notFound } from "next/navigation";

export default function EditarClientePage({ params }: { params: { id: string } }) {
    // In a real app, you'd fetch this from a database.
    const client = mockClients.find(c => c.id === params.id) as (Client & {prizes?: any[]}) | undefined;

    if (!client) {
        notFound();
    }

    // The prizes are not on the client object in the mock data. 
    // We'll mock them as an empty array for now.
    client.prizes = client.prizes || [];

    return (
        <div className="max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Editar Cliente: {client.name}</CardTitle>
                    <CardDescription>Altere os detalhes abaixo para atualizar o cliente.</CardDescription>
                </CardHeader>
                <CardContent>
                    <AddClientForm client={client} />
                </CardContent>
            </Card>
        </div>
    );
}
