
import { Timestamp } from 'firebase/firestore';

// Helper type to convert Timestamp fields to Date.
export type WithTimestamps<T, K extends keyof T> = Omit<T, K> & {
  [P in K]: Date;
};

type BaseType = {
  id?: string;
}

export type Client = BaseType & {
  name: string;
  phone: string;
  address: string;
  city: string;
  route: string;
  location?: {
    lat: number;
    lng: number;
  };
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  updatedAt?: Date;
  raspinha: number;
  comissao: number;
  currentDebt?: number;
  prizes?: {
      prizeId: string;
      prizeName: string;
      quantity: number;
  }[];
};

export type Prize = BaseType & {
  name: string;
  imageUrl: string;
  quantity: number;
};

export type Cobranca = BaseType & {
  clientId: string;
  clientName: string;
  route: string;
  createdAt: Date;
  scratchedAmount: number;
  scratchPrice: number;
  commissionPercentage: number;
  grossRevenue: number;
  commissionValue: number;
  netRevenue: number;
  discount?: number;
  kitStatus?: 'manteve' | 'novo';
  cartelaStatus?: 'manteve' | 'nova';
  frontCardImageUrl?: string;
  backCardImageUrl?: string;
  prizesGiven?: {
      prizeId: string;
      prizeName: string;
      quantity: number;
  }[];
};

export type Despesa = BaseType & {
  description: string;
  value: number;
  createdAt: Date;
  route: string;
};

export type Route = BaseType & {
  name: string;
  description: string;
};

// Firestore document types (with Timestamps)
export type ClientDocument = Omit<Client, 'createdAt' | 'updatedAt'> & {
  createdAt: Timestamp;
  updatedAt?: Timestamp;
};

export type CobrancaDocument = Omit<Cobranca, 'createdAt'> & {
  createdAt: Timestamp;
};

export type DespesaDocument = Omit<Despesa, 'createdAt'> & {
  createdAt: Timestamp;
};
