// Vendor stock API response types

export interface VendorStockItem {
  lastUpdated: string; // ISO date string
  change: number;
  price: number;
  name: string;
  sector: string;
  symbol: string;
}

export interface VendorStockData {
  items: VendorStockItem[];
  nextToken?: string;
}

export interface VendorStockApiResponse {
  status: number;
  data: VendorStockData;
}
