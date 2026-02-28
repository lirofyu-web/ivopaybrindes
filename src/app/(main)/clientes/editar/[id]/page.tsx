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
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Carregando cliente...</span>
        </div>
      );
    }

    if (!client) {
        notFound();
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
