'use client';

import { AddClientForm } from "@/components/forms/add-client-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockClients } from "@/lib/mock-clients";
import type { Client } from "@/lib/types";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditarClientePage({ params }: { params: { id: string } }) {
    const [client, setClient] = useState<(Client & {prizes?: any[]}) | null | undefined>(undefined);

    useEffect(() => {
        const storedClientsRaw = localStorage.getItem('mrd-brindes-clients');
        let clients: Client[] = [];
        if (storedClientsRaw) {
          clients = JSON.parse(storedClientsRaw).map((c: any) => ({...c, createdAt: new Date(c.createdAt)}));
        } else {
          clients = mockClients; // fallback
        }
        const clientToEdit = clients.find(c => c.id === params.id) as (Client & {prizes?: any[]}) | undefined;

        if (clientToEdit) {
            clientToEdit.prizes = clientToEdit.prizes || [];
            setClient(clientToEdit);
        } else {
            setClient(null); // Not found
        }
    }, [params.id]);

    if (client === undefined) {
      return <div className="flex items-center justify-center h-full">Carregando...</div>;
    }

    if (!client) {
        notFound();
    }

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
