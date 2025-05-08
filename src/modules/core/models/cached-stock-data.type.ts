export interface CachedStockData {
  id: string;
  symbol: string;
  price: number;
  lastUpdated: Date;
  name: string;
  sector: string;
  change: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  currency: string;
  [key: string]: unknown;
}
