# Vendor API Integration

This module provides a service (`VendorApiService`) for interacting with the external vendor stock API.

## Features

- Fetch all stock listings (with or without pagination)
- Place buy orders for stocks
- Input validation and robust error handling
- Structured logging using NestJS Logger

## Usage Example

```typescript
import { VendorApiService } from '@modules/shared/vendor/vendor-api.service';

const vendorApi = new VendorApiService();

// Fetch all stocks (no pagination)
const stocks = await vendorApi.fetchStockListings();

// Fetch all stocks with pagination
const allStocks = await vendorApi.fetchAllStockListingsWithPagination();

// Place a buy order
const buyResult = await vendorApi.buyStock('NVDA', 0.25, 5);
```

## Methods

### `fetchStockListings(): Promise<VendorStockApiResponse>`

Fetch all stock listings from the vendor API (no pagination).

### `fetchAllStockListingsWithPagination(): Promise<VendorStockApiResponse>`

Fetch all stock listings, handling pagination with `nextToken`.

### `buyStock(symbol: string, price: number, quantity: number): Promise<BuyStockResponse>`

Place a buy order for a stock symbol. Throws if input is invalid or the API call fails.

## Error Handling

- All methods throw on error. Use try/catch to handle failures.
- Logging is performed at appropriate levels (debug, log, warn, error) using NestJS Logger.

## Types

- All response types are defined in `vendor-stock-response.model.ts`.

---

For more details, see the JSDoc comments in `vendor-api.service.ts`.
