export type Client = {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  location?: {
    lat: number;
    lng: number;
  };
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  raspinha: number;
  comissao: number;
};

export type Prize = {
  id: string;
  name: string;
  imageUrl: string;
};
