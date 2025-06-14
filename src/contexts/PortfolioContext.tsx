'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Portfolio, Transaction, CoinPrice, PortfolioMetrics } from '@/types';
import { ApiService, WebSocketService } from '@/lib/api';

interface PortfolioState {
  portfolios: Portfolio[];
  selectedPortfolio: Portfolio | null;
  portfolioMetrics: PortfolioMetrics | null;
  coinPrices: Record<string, CoinPrice>;
  isLoading: boolean;
  error: string | null;
  wsConnected: boolean;
}

type PortfolioAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PORTFOLIOS'; payload: Portfolio[] }
  | { type: 'ADD_PORTFOLIO'; payload: Portfolio }
  | { type: 'DELETE_PORTFOLIO'; payload: string }
  | { type: 'SET_SELECTED_PORTFOLIO'; payload: Portfolio | null }
  | { type: 'ADD_TRANSACTION'; payload: { portfolioId: string; transaction: Transaction } }
  | { type: 'REMOVE_TRANSACTION'; payload: { portfolioId: string; transactionId: string } }
  | { type: 'SET_PORTFOLIO_METRICS'; payload: PortfolioMetrics | null }
  | { type: 'UPDATE_COIN_PRICES'; payload: Record<string, CoinPrice> }
  | { type: 'SET_WS_CONNECTED'; payload: boolean };

const initialState: PortfolioState = {
  portfolios: [],
  selectedPortfolio: null,
  portfolioMetrics: null,
  coinPrices: {},
  isLoading: false,
  error: null,
  wsConnected: false,
};

function portfolioReducer(state: PortfolioState, action: PortfolioAction): PortfolioState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_PORTFOLIOS':
      return { ...state, portfolios: action.payload, isLoading: false };
    
    case 'ADD_PORTFOLIO':
      return { 
        ...state, 
        portfolios: [...state.portfolios, action.payload], 
        isLoading: false 
      };
    
    case 'DELETE_PORTFOLIO':
      return {
        ...state,
        portfolios: state.portfolios.filter(p => p.id !== action.payload),
        selectedPortfolio: state.selectedPortfolio?.id === action.payload ? null : state.selectedPortfolio,
        isLoading: false
      };
    
    case 'SET_SELECTED_PORTFOLIO':
      return { ...state, selectedPortfolio: action.payload };
    
    case 'ADD_TRANSACTION':
      const updatedPortfolios = state.portfolios.map(portfolio => {
        if (portfolio.id === action.payload.portfolioId) {
          return {
            ...portfolio,
            transactions: [...(portfolio.transactions || []), action.payload.transaction],
            transaction_count: portfolio.transaction_count + 1
          };
        }
        return portfolio;
      });
      
      return {
        ...state,
        portfolios: updatedPortfolios,
        selectedPortfolio: state.selectedPortfolio?.id === action.payload.portfolioId
          ? {
              ...state.selectedPortfolio,
              transactions: [...(state.selectedPortfolio.transactions || []), action.payload.transaction],
              transaction_count: state.selectedPortfolio.transaction_count + 1
            }
          : state.selectedPortfolio
      };
    
    case 'REMOVE_TRANSACTION':
      const portfoliosAfterRemoval = state.portfolios.map(portfolio => {
        if (portfolio.id === action.payload.portfolioId) {
          return {
            ...portfolio,
            transactions: portfolio.transactions?.filter(t => t.id !== action.payload.transactionId) || [],
            transaction_count: Math.max(0, portfolio.transaction_count - 1)
          };
        }
        return portfolio;
      });
      
      return {
        ...state,
        portfolios: portfoliosAfterRemoval,
        selectedPortfolio: state.selectedPortfolio?.id === action.payload.portfolioId
          ? {
              ...state.selectedPortfolio,
              transactions: state.selectedPortfolio.transactions?.filter(t => t.id !== action.payload.transactionId) || [],
              transaction_count: Math.max(0, state.selectedPortfolio.transaction_count - 1)
            }
          : state.selectedPortfolio
      };
    
    case 'SET_PORTFOLIO_METRICS':
      return { ...state, portfolioMetrics: action.payload };
    
    case 'UPDATE_COIN_PRICES':
      return { ...state, coinPrices: { ...state.coinPrices, ...action.payload } };
    
    case 'SET_WS_CONNECTED':
      return { ...state, wsConnected: action.payload };
    
    default:
      return state;
  }
}

interface PortfolioContextValue extends PortfolioState {
  // Portfolio actions
  loadPortfolios: () => Promise<void>;
  createPortfolio: (name: string) => Promise<Portfolio>;
  deletePortfolio: (portfolioId: string) => Promise<void>;
  selectPortfolio: (portfolioId: string) => Promise<void>;
  
  // Transaction actions
  addTransaction: (portfolioId: string, transaction: Omit<Transaction, 'id' | 'timestamp' | 'total_value'>) => Promise<void>;
  removeTransaction: (portfolioId: string, transactionId: string) => Promise<void>;
  
  // Analytics
  loadPortfolioMetrics: (portfolioId: string) => Promise<void>;
  
  // Real-time data
  subscribeToCoinPrices: (coinIds: string[]) => void;
  unsubscribeFromCoinPrices: (coinIds: string[]) => void;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

let wsService: WebSocketService | null = null;

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(portfolioReducer, initialState);

  // Initialize WebSocket connection
  useEffect(() => {
    wsService = new WebSocketService();
    
    const handleWebSocketMessage = (message: any) => {
      if (message.type === 'price_update' && message.prices) {
        dispatch({ type: 'UPDATE_COIN_PRICES', payload: message.prices });
      }
    };

    wsService.onMessage(handleWebSocketMessage);
    
    wsService.connect()
      .then(() => {
        dispatch({ type: 'SET_WS_CONNECTED', payload: true });
      })
      .catch((error) => {
        console.error('Failed to connect to WebSocket:', error);
        dispatch({ type: 'SET_WS_CONNECTED', payload: false });
      });

    return () => {
      if (wsService) {
        wsService.removeMessageHandler(handleWebSocketMessage);
        wsService.disconnect();
      }
    };
  }, []);

  const loadPortfolios = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const portfolios = await ApiService.getPortfolios();
      dispatch({ type: 'SET_PORTFOLIOS', payload: portfolios });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load portfolios' });
    }
  };

  const createPortfolio = async (name: string): Promise<Portfolio> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const portfolio = await ApiService.createPortfolio(name);
      dispatch({ type: 'ADD_PORTFOLIO', payload: portfolio });
      return portfolio;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create portfolio' });
      throw error;
    }
  };

  const deletePortfolio = async (portfolioId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await ApiService.deletePortfolio(portfolioId);
      dispatch({ type: 'DELETE_PORTFOLIO', payload: portfolioId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete portfolio' });
      throw error;
    }
  };

  const selectPortfolio = async (portfolioId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const portfolio = await ApiService.getPortfolio(portfolioId);
      dispatch({ type: 'SET_SELECTED_PORTFOLIO', payload: portfolio });
      
      // Load metrics for the selected portfolio
      await loadPortfolioMetrics(portfolioId);
      
      // Subscribe to price updates for coins in this portfolio
      if (portfolio.transactions && portfolio.transactions.length > 0) {
        const coinIds = [...new Set(portfolio.transactions.map(t => t.coin_id))];
        subscribeToCoinPrices(coinIds);
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load portfolio' });
      throw error;
    }
  };

  const addTransaction = async (
    portfolioId: string, 
    transaction: Omit<Transaction, 'id' | 'timestamp' | 'total_value'>
  ) => {
    try {
      const newTransaction = await ApiService.addTransaction(portfolioId, transaction);
      dispatch({ 
        type: 'ADD_TRANSACTION', 
        payload: { portfolioId, transaction: newTransaction } 
      });
      
      // Reload metrics after adding transaction
      await loadPortfolioMetrics(portfolioId);
      
      // Subscribe to price updates for the new coin
      subscribeToCoinPrices([transaction.coin_id]);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add transaction' });
      throw error;
    }
  };

  const removeTransaction = async (portfolioId: string, transactionId: string) => {
    try {
      await ApiService.removeTransaction(portfolioId, transactionId);
      dispatch({ 
        type: 'REMOVE_TRANSACTION', 
        payload: { portfolioId, transactionId } 
      });
      
      // Reload metrics after removing transaction
      await loadPortfolioMetrics(portfolioId);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove transaction' });
      throw error;
    }
  };

  const loadPortfolioMetrics = async (portfolioId: string) => {
    try {
      const metrics = await ApiService.getPortfolioAnalytics(portfolioId);
      dispatch({ type: 'SET_PORTFOLIO_METRICS', payload: metrics });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load portfolio metrics' });
    }
  };

  const subscribeToCoinPrices = (coinIds: string[]) => {
    if (wsService && wsService.isConnected()) {
      wsService.subscribe(coinIds);
    }
  };

  const unsubscribeFromCoinPrices = (coinIds: string[]) => {
    if (wsService && wsService.isConnected()) {
      wsService.unsubscribe(coinIds);
    }
  };

  const contextValue: PortfolioContextValue = {
    ...state,
    loadPortfolios,
    createPortfolio,
    deletePortfolio,
    selectPortfolio,
    addTransaction,
    removeTransaction,
    loadPortfolioMetrics,
    subscribeToCoinPrices,
    unsubscribeFromCoinPrices,
  };

  return (
    <PortfolioContext.Provider value={contextValue}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}