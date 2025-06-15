export type TransactionType = "buy" | "sell";

export interface Portfolio {
  id: string;
  name: string;
  created_at: string;
  transaction_count: number;
  transactions?: Transaction[];
}

export interface Transaction {
  id: string;
  coin_id: string;
  coin_name: string;
  coin_symbol: string;
  amount: number;
  price_usd: number;
  transaction_type: TransactionType;
  timestamp: string;
  total_value: number;
}

export interface CoinSearchResult {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  market_cap_rank?: number;
}

export interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  volume_24h: number;
  last_updated: string;
}

export interface PortfolioMetrics {
  total_value: number;
  total_cost: number;
  total_profit_loss: number;
  profit_loss_percentage: number;
  best_performer?: {
    coin_id: string;
    coin_name: string;
    coin_symbol: string;
    profit_loss_percentage: number;
    profit_loss: number;
  };
  worst_performer?: {
    coin_id: string;
    coin_name: string;
    coin_symbol: string;
    profit_loss_percentage: number;
    profit_loss: number;
  };
  asset_allocation: Record<string, number>;
}

export interface WebSocketMessage {
  type: 'price_update' | 'subscription_confirmed' | 'unsubscription_confirmed' | 'error' | 'pong';
  prices?: Record<string, CoinPrice>;
  subscribed_coins?: string[];
  newly_subscribed?: string[];
  unsubscribed?: string[];
  message?: string;
  timestamp?: string;
}

export interface AddTransactionForm {
  coin_id: string;
  coin_name: string;
  coin_symbol: string;
  amount: string;
  price_usd: string;
  transaction_type: TransactionType;
}