import Link from 'next/link';
import { PlusCircle, MoreHorizontal, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { Client } from '@/lib/types';

const mockClients: Client[] = [
  { id: '1', name: 'João da Silva', phone: '5511987654321', city: 'São Paulo', status: 'active', createdAt: new Date() },
  { id: '2', name: 'Maria Oliveira', phone: '5521912345678', city: 'Rio de Janeiro', status: 'active', createdAt: new Date() },
  { id: '3', name: 'Carlos Pereira', phone: '5531988887777', city: 'Belo Horizonte', status: 'inactive', createdAt: new Date() },
  { id: '4', name: 'Ana Costa', phone: '5571999998888', city: 'Salvador', status: 'pending', createdAt: new Date() },
  { id: '5', name: 'Francisco Santos', phone: '5585987651234', city: 'Fortaleza', status: 'active', createdAt: new Date() },
];

function formatPhoneNumber(phone: string) {
    const cleaned = ('' + phone).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{2})(\d{5})(\d{4})$/);
    if (match) {
        return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}`;
    }
    return phone;
}


export default function ClientesPage() {
  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <CardTitle>Clientes</CardTitle>
            <CardDescription>Gerencie seus clientes e veja seus detalhes.</CardDescription>
        </div>
        <Link href="/clientes/novo">
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Cliente
            </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">Cidade</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden md:table-cell">Desde</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <div className="font-medium">{client.name}</div>
                  <div className="text-sm text-muted-foreground md:hidden">{client.city}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{client.city}</TableCell>
                <TableCell className="hidden sm:table-cell">
                    <Badge variant={client.status === 'active' ? 'default' : client.status === 'inactive' ? 'destructive' : 'secondary'}>
                        {client.status === 'active' ? 'Ativo' : client.status === 'inactive' ? 'Inativo' : 'Pendente'}
                    </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">{client.createdAt.toLocaleDateString()}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a href={`https://wa.me/${client.phone}`} target="_blank" rel="noopener noreferrer" className="flex items-center">
                            <Phone className="mr-2 h-4 w-4" /> WhatsApp
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">Deletar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
