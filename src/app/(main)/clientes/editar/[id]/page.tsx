'use client';

import { AddClientForm } from "@/components/forms/add-client-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDoc } from "@/firebase";
import type { Client } from "@/lib/types";
import { notFound } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function EditarClientePage({ params }: { params: { id: string } }) {
    const { data: client, isLoading } = useDoc<Client>(`clients/${params.id}`);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando cliente...</span>
        </div>
      );
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
