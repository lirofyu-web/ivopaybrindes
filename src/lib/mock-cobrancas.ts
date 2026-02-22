import type { Cobranca } from '@/lib/types';

// Let's add some initial data to show on the page
export const mockCobrancas: Cobranca[] = [
  {
    id: '1',
    clientId: '1',
    clientName: 'João da Silva',
    createdAt: new Date('2024-07-20T10:00:00Z'),
    scratchedAmount: 100,
    scratchPrice: 2.00,
    commissionPercentage: 25,
    grossRevenue: 200.00,
    commissionValue: 50.00,
    netRevenue: 150.00,
    kitStatus: 'manteve',
    cartelaStatus: 'nova',
    prizesGiven: [
        { prizeId: '1', prizeName: 'Bicicleta', quantity: 1 }
    ]
  },
  {
    id: '2',
    clientId: '2',
    clientName: 'Maria Oliveira',
    createdAt: new Date('2024-07-19T14:30:00Z'),
    scratchedAmount: 150,
    scratchPrice: 2.50,
    commissionPercentage: 20,
    grossRevenue: 375.00,
    commissionValue: 75.00,
    discount: 25.00,
    netRevenue: 275.00,
    kitStatus: 'novo',
    cartelaStatus: 'nova',
  },
   {
    id: '3',
    clientId: '5',
    clientName: 'Francisco Santos',
    createdAt: new Date('2024-07-18T18:00:00Z'),
    scratchedAmount: 80,
    scratchPrice: 2.00,
    commissionPercentage: 25,
    grossRevenue: 160.00,
    commissionValue: 40.00,
    netRevenue: 120.00,
    kitStatus: 'manteve',
    cartelaStatus: 'manteve',
    prizesGiven: [
        { prizeId: '5', prizeName: 'Liquidificador', quantity: 2 }
    ]
  },
];
