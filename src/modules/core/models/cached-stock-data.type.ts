export interface CachedStockData {
  symbol: string;
  price: number;
  currency: string;
  timestamp: Date;
  [key: string]: unknown;
}
