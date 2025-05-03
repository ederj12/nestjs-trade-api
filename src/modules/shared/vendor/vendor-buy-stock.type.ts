export interface BuyStockRequest {
  price: number;
  quantity: number;
}

export interface BuyStockOrder {
  symbol: string;
  quantity: number;
  price: number;
  total: number;
}

export interface BuyStockResponse {
  status: number;
  message: string;
  data: {
    order: BuyStockOrder;
  };
}
