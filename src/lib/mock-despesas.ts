import type { Despesa } from '@/lib/types';

export const mockDespesas: Despesa[] = [
  { id: 'despesa-1', description: 'Combustível', value: 150.75, createdAt: new Date('2024-07-22'), route: 'Rota 1' },
  { id: 'despesa-2', description: 'Almoço', value: 45.50, createdAt: new Date('2024-07-22'), route: 'Rota 1' },
  { id: 'despesa-3', description: 'Pedágio', value: 12.30, createdAt: new Date('2024-07-21'), route: 'Rota 2' },
  { id: 'despesa-4', description: 'Manutenção Pneu', value: 80.00, createdAt: new Date('2024-07-20'), route: 'Rota 3' },
];
