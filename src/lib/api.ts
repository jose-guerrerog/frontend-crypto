import axios from 'axios';
import { Portfolio, Transaction, CoinSearchResult, CoinPrice, PortfolioMetrics } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for session management
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export class ApiService {
  // Portfolio management
  static async getPortfolios(): Promise<Portfolio[]> {
    const response = await apiClient.get('/portfolios/');
    return response.data.portfolios;
  }

  static async createPortfolio(name: string): Promise<Portfolio> {
    const response = await apiClient.post('/portfolios/', { name });
    return response.data;
  }

  static async getPortfolio(portfolioId: string): Promise<Portfolio> {
    const response = await apiClient.get(`/portfolios/${portfolioId}/`);
    return response.data;
  }

  static async deletePortfolio(portfolioId: string): Promise<void> {
    await apiClient.delete(`/portfolios/${portfolioId}/`);
  }

  // Transaction management
  static async addTransaction(
    portfolioId: string,
    transaction: Omit<Transaction, 'id' | 'timestamp' | 'total_value'>
  ): Promise<Transaction> {
    const response = await apiClient.post(`/portfolios/${portfolioId}/transactions/`, transaction);
    return response.data;
  }

  static async removeTransaction(portfolioId: string, transactionId: string): Promise<void> {
    await apiClient.delete(`/portfolios/${portfolioId}/transactions/${transactionId}/`);
  }

  // Portfolio analytics
  static async getPortfolioAnalytics(portfolioId: string): Promise<PortfolioMetrics> {
    const response = await apiClient.get(`/portfolios/${portfolioId}/analytics/`);
    return response.data;
  }

  // Cryptocurrency data
  static async searchCoins(query: string): Promise<CoinSearchResult[]> {
    const response = await apiClient.get('/coins/search/', {
      params: { q: query }
    });
    return response.data.coins;
  }

  static async getCoinPrices(coinIds: string[]): Promise<Record<string, CoinPrice>> {
    const response = await apiClient.get('/coins/prices/', {
      params: { ids: coinIds.join(',') }
    });
    return response.data.prices;
  }
}

// WebSocket service for real-time price updates
export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5 seconds
  private messageHandlers: ((message: any) => void)[] = [];

  connect(url: string = 'ws://localhost:8000/ws/prices/'): Promise<void> {
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
          reject(error);
        };
      } catch (error) {
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
      console.error('Max reconnection attempts reached');
    }
  }

  subscribe(coinIds: string[]) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'subscribe',
        coin_ids: coinIds
      }));
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