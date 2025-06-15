import axios from 'axios';
import { Portfolio, Transaction, CoinSearchResult, CoinPrice, PortfolioMetrics } from '@/types';

// Use production backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-crypto-zjml.onrender.com/api';

// Debug logging to see what URL is being used
console.log('API_BASE_URL:', API_BASE_URL);

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Disable for production CORS
  timeout: 30000, // 30 second timeout for production
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Handle specific error cases
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.error('Backend server appears to be down. Please check if Django server is running.');
    }
    
    if (error.response?.status === 404) {
      console.error('API endpoint not found. Please check your Django URL configuration.');
      console.error('Attempted URL:', error.config?.url);
    }
    
    return Promise.reject(error);
  }
);

// Mock data for development when backend is unavailable
const MOCK_COINS: CoinSearchResult[] = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', thumb: '', market_cap_rank: 1 },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', thumb: '', market_cap_rank: 2 },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA', thumb: '', market_cap_rank: 3 },
  { id: 'solana', name: 'Solana', symbol: 'SOL', thumb: '', market_cap_rank: 4 },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE', thumb: '', market_cap_rank: 5 },
];

const MOCK_PRICES: Record<string, CoinPrice> = {
  'bitcoin': { 
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    current_price: 43000, 
    price_change_24h: 1200, 
    price_change_percentage_24h: 2.85,
    market_cap: 850000000000,
    volume_24h: 25000000000,
    last_updated: new Date().toISOString()
  },
  'ethereum': { 
    id: 'ethereum',
    symbol: 'eth',
    name: 'Ethereum',
    current_price: 2500, 
    price_change_24h: -50, 
    price_change_percentage_24h: -1.96,
    market_cap: 300000000000,
    volume_24h: 15000000000,
    last_updated: new Date().toISOString()
  },
  'cardano': { 
    id: 'cardano',
    symbol: 'ada',
    name: 'Cardano',
    current_price: 0.45, 
    price_change_24h: 0.02, 
    price_change_percentage_24h: 4.65,
    market_cap: 15000000000,
    volume_24h: 500000000,
    last_updated: new Date().toISOString()
  },
  'solana': { 
    id: 'solana',
    symbol: 'sol',
    name: 'Solana',
    current_price: 95, 
    price_change_24h: 3, 
    price_change_percentage_24h: 3.26,
    market_cap: 40000000000,
    volume_24h: 2000000000,
    last_updated: new Date().toISOString()
  },
  'dogecoin': { 
    id: 'dogecoin',
    symbol: 'doge',
    name: 'Dogecoin',
    current_price: 0.08, 
    price_change_24h: 0.001, 
    price_change_percentage_24h: 1.25,
    market_cap: 11000000000,
    volume_24h: 800000000,
    last_updated: new Date().toISOString()
  },
};

// Helper function to check if backend is available
const isBackendAvailable = async (): Promise<boolean> => {
  try {
    // Use the correct health endpoint from your Django URLs
    const healthUrl = API_BASE_URL.replace('/api', '') + '/health/';
    console.log('Checking health at:', healthUrl);
    const response = await axios.get(healthUrl, { timeout: 2000 });
    return response.status === 200;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

export class ApiService {
  // Portfolio management
  static async getPortfolios(): Promise<Portfolio[]> {
    try {
      const response = await apiClient.get('/portfolios/');
      // Your backend returns results in a different format
      return response.data.results || response.data.portfolios || [];
    } catch (error) {
      console.warn('Failed to fetch portfolios from backend, using mock data');
      // Return mock data for development
      return [
        {
          id: '1',
          name: 'My Crypto Portfolio',
          transaction_count: 0,
          transactions: [],
          created_at: new Date().toISOString(),
        }
      ];
    }
  }

  static async createPortfolio(name: string): Promise<Portfolio> {
    console.log('🔍 ApiService: Creating portfolio with name:', name);
    console.log('🔍 ApiService: API_BASE_URL:', API_BASE_URL);
    console.log('🔍 ApiService: Full URL will be:', `${API_BASE_URL}/portfolios/`);
    
    try {
      const response = await apiClient.post('/portfolios/', { name });
      console.log('✅ ApiService: Portfolio created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ ApiService: Portfolio creation failed!');
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
      });
      
      // DON'T RETURN MOCK DATA - THROW THE REAL ERROR
      throw error;
    }
  }

  static async getPortfolio(portfolioId: string): Promise<Portfolio> {
    try {
      const response = await apiClient.get(`/portfolios/${portfolioId}/`);
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch portfolio from backend, using mock data');
      // Return mock portfolio for development
      return {
        id: portfolioId,
        name: 'My Crypto Portfolio',
        transaction_count: 0,
        transactions: [],
        created_at: new Date().toISOString(),
      };
    }
  }

  static async deletePortfolio(portfolioId: string): Promise<void> {
    try {
      await apiClient.delete(`/portfolios/${portfolioId}/`);
    } catch (error) {
      console.warn('Failed to delete portfolio on backend');
      throw error;
    }
  }

  static async addTransaction(
    portfolioId: string,
    transaction: Omit<Transaction, 'id' | 'timestamp' | 'total_value'>
  ): Promise<Transaction> {
    console.log('🔍 ApiService: Adding transaction to portfolio:', portfolioId);
    console.log('🔍 ApiService: Transaction data:', transaction);
    console.log('🔍 ApiService: Full URL will be:', `${API_BASE_URL}/portfolios/${portfolioId}/transactions/`);
    
    try {
      const response = await apiClient.post(`/portfolios/${portfolioId}/transactions/`, transaction);
      console.log('✅ ApiService: Transaction added successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ ApiService: Transaction creation failed!');
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        portfolioId: portfolioId,
        transaction: transaction,
      });
      
      // DON'T RETURN MOCK DATA - THROW THE REAL ERROR
      throw error;
    }
  }

  static async removeTransaction(portfolioId: string, transactionId: string): Promise<void> {
    try {
      await apiClient.delete(`/portfolios/${portfolioId}/transactions/${transactionId}/`);
    } catch (error) {
      console.warn('Failed to remove transaction from backend');
      // For mock mode, we'll just ignore the error
    }
  }

  // Portfolio analytics
  static async getPortfolioAnalytics(portfolioId: string): Promise<PortfolioMetrics> {
    try {
      const response = await apiClient.get(`/portfolios/${portfolioId}/analytics/`);
      return response.data;
    } catch (error) {
      console.warn('Failed to fetch analytics from backend, using mock data');
      // Return mock analytics for development
      return {
        total_value: 50000,
        total_cost: 45000,
        total_profit_loss: 5000,
        profit_loss_percentage: 11.11,
        asset_allocation: {
          'Bitcoin (BTC)': 60.0,
          'Ethereum (ETH)': 25.0,
          'Cardano (ADA)': 15.0,
        },
        best_performer: {
          coin_id: 'bitcoin',
          coin_name: 'Bitcoin',
          coin_symbol: 'BTC',
          profit_loss: 3000,
          profit_loss_percentage: 15.0,
        },
        worst_performer: {
          coin_id: 'ethereum',
          coin_name: 'Ethereum',
          coin_symbol: 'ETH',
          profit_loss: -500,
          profit_loss_percentage: -2.0,
        },
      };
    }
  }

  // Cryptocurrency data
  static async searchCoins(query: string): Promise<CoinSearchResult[]> {
    try {
      const response = await apiClient.get('/coins/search/', {
        params: { q: query }
      });
      return response.data.coins;
    } catch (error) {
      console.warn('Failed to search coins from backend, using mock data');
      // Return filtered mock coins for development
      return MOCK_COINS.filter(coin => 
        coin.name.toLowerCase().includes(query.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(query.toLowerCase())
      );
    }
  }

  static async getCoinPrices(coinIds: string[]): Promise<Record<string, CoinPrice>> {
    try {
      const response = await apiClient.get('/coins/prices/', {
        params: { ids: coinIds.join(',') }
      });
      return response.data.prices;
    } catch (error) {
      console.warn('Failed to fetch coin prices from backend, using mock data');
      // Return mock prices for development
      const mockPrices: Record<string, CoinPrice> = {};
      coinIds.forEach(coinId => {
        if (MOCK_PRICES[coinId]) {
          mockPrices[coinId] = MOCK_PRICES[coinId];
        }
      });
      return mockPrices;
    }
  }

  // Health check endpoint
  static async healthCheck(): Promise<boolean> {
    try {
      // Use the correct health endpoint from your Django URLs
      const healthUrl = API_BASE_URL.replace('/api', '') + '/health/';
      console.log('Health check URL:', healthUrl);
      const response = await axios.get(healthUrl, { timeout: 2000 });
      console.log('Health check response:', response.status);
      return response.status === 200;
    } catch (error) {
      console.error('Health check error:', error);
      return false;
    }
  }
}

// WebSocket service for real-time price updates
export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5 seconds
  private messageHandlers: ((message: any) => void)[] = [];

  connect(url: string = `${process.env.NEXT_PUBLIC_WS_URL}/prices/`): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.messageHandlers.forEach(handler => handler(data));
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.attemptReconnect(url);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          console.warn('WebSocket connection failed. Real-time price updates disabled.');
          reject(error);
        };
      } catch (error) {
        console.warn('WebSocket not supported or connection failed');
        reject(error);
      }
    });
  }

  private attemptReconnect(url: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(url).catch(() => {
          // If reconnect fails, attemptReconnect will be called again by onclose
        });
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached. Real-time updates disabled.');
    }
  }

  subscribe(coinIds: string[]) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'subscribe',
        coin_ids: coinIds
      }));
    } else {
      console.warn('WebSocket not connected. Cannot subscribe to price updates.');
    }
  }

  unsubscribe(coinIds: string[]) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'unsubscribe',
        coin_ids: coinIds
      }));
    }
  }

  ping() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'ping',
        timestamp: new Date().toISOString()
      }));
    }
  }

  onMessage(handler: (message: any) => void) {
    this.messageHandlers.push(handler);
  }

  removeMessageHandler(handler: (message: any) => void) {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers = [];
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}