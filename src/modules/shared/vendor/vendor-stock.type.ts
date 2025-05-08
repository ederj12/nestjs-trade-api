// Vendor stock API response types

export interface VendorStockItem {
  lastUpdated: Date;
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
