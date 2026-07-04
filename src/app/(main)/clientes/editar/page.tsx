'use client';

import { AddClientForm } from "@/components/forms/add-client-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDoc } from "@/firebase";
import type { Client } from "@/lib/types";
import { notFound, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

function EditClientForm() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const { data: client, isLoading, error } = useDoc<Client>(id ? `clients/${id}` : '');

    if (!id) {
        return <div className="p-10 text-center">ID do cliente não encontrado na URL.</div>;
    }

    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Carregando cliente...</span>
        </div>
      );
    }

    if (error) {
        return <div className="p-10 text-center text-red-500">Erro ao carregar o cliente: {error.message}</div>;
    }

    if (!client) {
        return <div className="p-10 text-center text-muted-foreground">Cliente não encontrado no banco de dados.</div>;
    }

    return (
        <div className="max-w-2xl mx-auto px-1 sm:px-0">
            <Card className="border-border/40 shadow-lg">
                <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-xl sm:text-2xl">Editar Cliente: {client.name}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Altere os detalhes abaixo para atualizar o cliente.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                    <AddClientForm client={client} />
                </CardContent>
            </Card>
        </div>
    );
}

export default function EditarClientePage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <EditClientForm />
        </Suspense>
    );
}
