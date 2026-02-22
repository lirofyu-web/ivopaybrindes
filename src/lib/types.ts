export type Client = {
  id: string;
  name: string;
  phone: string;
  address?: string;
  city?: string;
  location?: {
    lat: number;
    lng: number;
  };
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
};
