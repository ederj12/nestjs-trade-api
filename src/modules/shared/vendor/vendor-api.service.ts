/**
 * VendorApiService: Service for interacting with the external vendor stock API.
 *
 * Usage example:
 *
 * import { VendorApiService } from '@modules/shared/vendor/vendor-api.service';
 * const vendorApi = new VendorApiService();
 * const stocks = await vendorApi.fetchStockListings();
 * const buyResult = await vendorApi.buyStock('NVDA', 0.25, 5);
 */

import axios from 'axios';
import type { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { Logger, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { VendorStockApiResponse } from './vendor-stock.type';
import type { BuyStockRequest, BuyStockResponse } from './vendor-buy-stock.type';
import type { VendorApiConfig } from './vendor-api.type';

@Injectable()
export class VendorApiService {
  private client: AxiosInstance;
  private retryCount: Map<string, number> = new Map();
  private readonly logger = new Logger(VendorApiService.name);
  private readonly config: VendorApiConfig;

  constructor(private readonly configService: ConfigService) {
    const config = this.configService.get<VendorApiConfig>('vendorApi');

    if (!config) {
      throw new Error('Vendor API config is missing. Please check your configuration.');
    }

    this.config = config;
    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (config.headers) {
          (config.headers as Record<string, string>)['x-api-key'] = this.config.apiKey;
        }
        this.logger.debug(
          `API Request: ${config.method?.toUpperCase()} ${config.url} | params: ${JSON.stringify(config.params)} | data: ${JSON.stringify(config.data)}`,
        );
        return config;
      },
      (error: any) => Promise.reject(error),
    );

    // Response interceptor with retry logic
    this.client.interceptors.response.use(
      (response: AxiosResponse<any>) => {
        this.logger.debug(
          `API Response: ${response.status} ${response.config.url} | data: ${JSON.stringify(response.data)}`,
        );
        if (response.config.url) {
          this.retryCount.delete(response.config.url);
        }
        return response;
      },
      async (error: AxiosError) => {
        const config = error.config as InternalAxiosRequestConfig | undefined;
        if (config && config.url) {
          const currentRetryCount = this.retryCount.get(config.url) || 0;
          if (
            currentRetryCount < this.config.maxRetries &&
            (error.code === 'ECONNABORTED' ||
              error.code === 'ETIMEDOUT' ||
              (error.response && error.response.status && error.response.status >= 500))
          ) {
            this.retryCount.set(config.url, currentRetryCount + 1);
            this.logger.warn(
              `Retrying request to ${config.url} (${currentRetryCount + 1}/${this.config.maxRetries}) due to error: ${error.message}`,
            );
            await new Promise(resolve =>
              setTimeout(resolve, this.config.retryDelay * (currentRetryCount + 1)),
            );
            return this.client(config);
          }
          this.retryCount.delete(config.url);
        }
        this.logger.error('API Error', {
          url: config?.url,
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        return Promise.reject(error);
      },
    );
  }

  // Expose the client for use in other services
  getClient(): AxiosInstance {
    return this.client;
  }

  /**
   * Buy a stock by symbol
   * @param symbol Stock symbol (e.g., 'NVDA')
   * @param price Price per unit (must be > 0)
   * @param quantity Number of units to buy (must be > 0)
   * @returns {Promise<BuyStockResponse>} Vendor API response for the buy order
   * @throws {Error} If input is invalid or the API call fails
   */
  async buyStock(symbol: string, price: number, quantity: number): Promise<BuyStockResponse> {
    const url = `/stocks/${encodeURIComponent(symbol)}/buy`;
    const body: BuyStockRequest = { price, quantity };
    try {
      const { data } = await this.client.post<BuyStockResponse>(url, body);
      this.logger.log(`Buy order placed: ${JSON.stringify(data.data.order)}`);
      return data;
    } catch (error) {
      this.logger.error(
        `Failed to buy stock ${symbol}:`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Fetch all stock listings from the vendor API (no pagination)
   * @returns {Promise<VendorStockApiResponse>} Vendor API response with stock listings
   */
  async fetchStockListings(): Promise<VendorStockApiResponse> {
    try {
      this.logger.debug('Fetching all stock listings from vendor API');
      const { data } = await this.client.get<VendorStockApiResponse>('/stocks');
      this.logger.log(`Fetched ${data.data.items.length} stocks from vendor API`);
      return data;
    } catch (error) {
      this.logger.error(
        'Failed to fetch stock listings from vendor API',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  /**
   * Fetch all stock listings from the vendor API, handling pagination with nextToken
   * Aggregates all items into a single response.
   * @returns {Promise<VendorStockApiResponse>} Vendor API response with all stock listings
   */
  async fetchAllStockListingsWithPagination(): Promise<VendorStockApiResponse> {
    this.logger.debug('Fetching all stock listings from vendor API with pagination');
    let allItems: VendorStockApiResponse['data']['items'] = [];
    let nextToken: string | undefined = undefined;
    let page = 0;
    const maxPages = 20;
    let lastResponse: VendorStockApiResponse | undefined = undefined;

    do {
      const url: string = nextToken
        ? `/stocks?nextToken=${encodeURIComponent(nextToken)}`
        : '/stocks';
      this.logger.debug(`Fetching page ${page + 1} from vendor API: ${url}`);
      const { data } = await this.client.get<VendorStockApiResponse>(url);
      if (!data.data || !Array.isArray(data.data.items)) {
        this.logger.warn(
          `Unexpected response structure on page ${page + 1}: ${JSON.stringify(data)}`,
        );
        break;
      }
      allItems = allItems.concat(data.data.items);
      nextToken = data.data.nextToken;
      lastResponse = data;
      page++;
      if (page >= maxPages) {
        this.logger.warn('Reached max pagination limit while fetching stock listings');
        break;
      }
    } while (nextToken);

    if (!lastResponse) {
      throw new Error('No response received from vendor API');
    }
    this.logger.log(`Fetched total ${allItems.length} stocks from vendor API (pagination)`);
    return {
      ...lastResponse,
      data: {
        ...lastResponse.data,
        items: allItems,
        nextToken: undefined,
      },
    };
  }
}
