import type { Client } from '@/lib/types';

export const mockClients: Client[] = [
    { id: '3', name: 'Carlos Pereira', phone: '5531988887777', city: 'Belo Horizonte', status: 'inactive', createdAt: new Date(), addressLine1: 'Praça da Liberdade, 789', raspinha: 2.00, comissao: 25, location: { lat: -19.916681, lng: -43.934494 } },
    { id: '6', name: 'Pedro Almeida', phone: '5548987654321', city: 'Belo Horizonte', status: 'active', createdAt: new Date(), addressLine1: 'Rua Fictícia, 987', raspinha: 2.00, comissao: 20, location: { lat: -19.9245, lng: -43.9351 } },
    { id: '1', name: 'João da Silva', phone: '5511987654321', city: 'São Paulo', status: 'active', createdAt: new Date(), addressLine1: 'Rua Exemplo, 123', raspinha: 2.00, comissao: 25, location: { lat: -23.55052, lng: -46.633308 } },
    { id: '2', name: 'Maria Oliveira', phone: '5521912345678', city: 'Rio de Janeiro', status: 'active', createdAt: new Date(), addressLine1: 'Avenida Teste, 456', raspinha: 2.50, comissao: 20, location: { lat: -22.906847, lng: -43.172897 } },
    { id: '4', name: 'Ana Costa', phone: '5571999998888', city: 'Salvador', status: 'pending', createdAt: new Date(), addressLine1: 'Largo do Pelourinho, 10', raspinha: 3.00, comissao: 30, location: { lat: -12.977742, lng: -38.501629 } },
    { id: '5', name: 'Francisco Santos', phone: '5585987651234', city: 'Porto Alegre', status: 'active', createdAt: new Date(), addressLine1: 'Beira Mar, 777', raspinha: 2.00, comissao: 25, location: { lat: -30.034642, lng: -51.217659 } },
];
