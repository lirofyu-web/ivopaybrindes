export type Client = {
  id: string;
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
  raspinha: number;
  comissao: number;
  prizes?: {
      prizeId: string;
      prizeName: string;
      quantity: number;
  }[];
};

export type Prize = {
  id: string;
  name: string;
  imageUrl: string;
  quantity: number;
};

export type Cobranca = {
  id: string;
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
  prizesGiven?: {
      prizeId: string;
      prizeName: string;
      quantity: number;
  }[];
};
