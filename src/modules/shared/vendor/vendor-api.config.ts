export interface VendorApiConfig {
  baseURL: string;
  apiKey: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
}

export const vendorApiConfig: VendorApiConfig = {
  baseURL: process.env.VENDOR_API_URL || 'https://api.challenge.fusefinance.com/stocks',
  apiKey: process.env.VENDOR_API_KEY || '',
  timeout: parseInt(process.env.VENDOR_API_TIMEOUT || '10000', 10),
  maxRetries: parseInt(process.env.VENDOR_API_MAX_RETRIES || '3', 10),
  retryDelay: parseInt(process.env.VENDOR_API_RETRY_DELAY || '1000', 10),
};
