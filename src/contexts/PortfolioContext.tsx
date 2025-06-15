'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Portfolio, Transaction, CoinPrice, PortfolioMetrics, AddTransactionForm } from '@/types';
import { ApiService, WebSocketService } from '@/lib/api';

interface PortfolioState {
  portfolios: Portfolio[];
  selectedPortfolio: Portfolio | null;
  portfolioMetrics: PortfolioMetrics | null;
  coinPrices: Record<string, CoinPrice>;
  isLoading: boolean;
  error: string | null;
  wsConnected: boolean;
  backendAvailable: boolean;
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
  | { type: 'SET_WS_CONNECTED'; payload: boolean }
  | { type: 'SET_BACKEND_AVAILABLE'; payload: boolean };

const initialState: PortfolioState = {
  portfolios: [],
  selectedPortfolio: null,
  portfolioMetrics: null,
  coinPrices: {},
  isLoading: false,
  error: null,
  wsConnected: false,
  backendAvailable: true,
};

function portfolioReducer(state: PortfolioState, action: PortfolioAction): PortfolioState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_PORTFOLIOS':
      return { ...state, portfolios: action.payload, isLoading: false, error: null };
    
    case 'ADD_PORTFOLIO':
      return { 
        ...state, 
        portfolios: [...state.portfolios, action.payload], 
        isLoading: false,
        error: null 
      };
    
    case 'DELETE_PORTFOLIO':
      return {
        ...state,
        portfolios: state.portfolios.filter(p => p.id !== action.payload),
        selectedPortfolio: state.selectedPortfolio?.id === action.payload ? null : state.selectedPortfolio,
        isLoading: false,
        error: null
      };
    
    case 'SET_SELECTED_PORTFOLIO':
      return { ...state, selectedPortfolio: action.payload, error: null };
    
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
          : state.selectedPortfolio,
        error: null
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
          : state.selectedPortfolio,
        error: null
      };
    
    case 'SET_PORTFOLIO_METRICS':
      return { ...state, portfolioMetrics: action.payload };
    
    case 'UPDATE_COIN_PRICES':
      return { ...state, coinPrices: { ...state.coinPrices, ...action.payload } };
    
    case 'SET_WS_CONNECTED':
      return { ...state, wsConnected: action.payload };
    
    case 'SET_BACKEND_AVAILABLE':
      return { ...state, backendAvailable: action.payload };
    
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
  
  // Utils
  clearError: () => void;
  checkBackendStatus: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

let wsService: WebSocketService | null = null;

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(portfolioReducer, initialState);

  // Check backend availability
  const checkBackendStatus = useCallback(async () => {
    try {
      const isAvailable = await ApiService.healthCheck();
      dispatch({ type: 'SET_BACKEND_AVAILABLE', payload: isAvailable });
      if (!isAvailable) {
        dispatch({ type: 'SET_ERROR', payload: 'Backend server is not available. Using offline mode.' });
      }
    } catch (error) {
      dispatch({ type: 'SET_BACKEND_AVAILABLE', payload: false });
      dispatch({ type: 'SET_ERROR', payload: 'Backend server is not available. Using offline mode.' });
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    // Check backend status first
    checkBackendStatus();

    wsService = new WebSocketService();
    
    const handleWebSocketMessage = (message: any) => {
      if (message.type === 'price_update' && message.prices) {
        dispatch({ type: 'UPDATE_COIN_PRICES', payload: message.prices });
      }
    };

    wsService.onMessage(handleWebSocketMessage);
    
    // Try to connect to WebSocket, but don't fail if it's not available
    wsService.connect()
      .then(() => {
        dispatch({ type: 'SET_WS_CONNECTED', payload: true });
      })
      .catch((error) => {
        console.warn('WebSocket connection failed, real-time updates disabled:', error);
        dispatch({ type: 'SET_WS_CONNECTED', payload: false });
      });

    return () => {
      if (wsService) {
        wsService.removeMessageHandler(handleWebSocketMessage);
        wsService.disconnect();
      }
    };
  }, [checkBackendStatus]);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const loadPortfolios = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const portfolios = await ApiService.getPortfolios();
      dispatch({ type: 'SET_PORTFOLIOS', payload: portfolios });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load portfolios';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      // Still set empty portfolios array to avoid infinite loading
      dispatch({ type: 'SET_PORTFOLIOS', payload: [] });
    }
  }, []);

  const createPortfolio = useCallback(async (name: string): Promise<Portfolio> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const portfolio = await ApiService.createPortfolio(name);
      dispatch({ type: 'ADD_PORTFOLIO', payload: portfolio });
      return portfolio;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create portfolio';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const deletePortfolio = useCallback(async (portfolioId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      await ApiService.deletePortfolio(portfolioId);
      dispatch({ type: 'DELETE_PORTFOLIO', payload: portfolioId });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete portfolio';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const selectPortfolio = useCallback(async (portfolioId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
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
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load portfolio';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const addTransaction = useCallback(async (
    portfolioId: string, 
    transaction: Omit<Transaction, 'id' | 'timestamp' | 'total_value'>
  ) => {
    dispatch({ type: 'SET_ERROR', payload: null });
    
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
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to add transaction';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const removeTransaction = useCallback(async (portfolioId: string, transactionId: string) => {
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      await ApiService.removeTransaction(portfolioId, transactionId);
      dispatch({ 
        type: 'REMOVE_TRANSACTION', 
        payload: { portfolioId, transactionId } 
      });
      
      // Reload metrics after removing transaction
      await loadPortfolioMetrics(portfolioId);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to remove transaction';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, []);

  const loadPortfolioMetrics = useCallback(async (portfolioId: string) => {
    try {
      const metrics = await ApiService.getPortfolioAnalytics(portfolioId);
      dispatch({ type: 'SET_PORTFOLIO_METRICS', payload: metrics });
    } catch (error: any) {
      console.warn('Failed to load portfolio metrics:', error);
      // Don't show error for metrics, just log it
    }
  }, []);

  const subscribeToCoinPrices = useCallback((coinIds: string[]) => {
    if (wsService && wsService.isConnected()) {
      wsService.subscribe(coinIds);
    }
  }, []);

  const unsubscribeFromCoinPrices = useCallback((coinIds: string[]) => {
    if (wsService && wsService.isConnected()) {
      wsService.unsubscribe(coinIds);
    }
  }, []);

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
    clearError,
    checkBackendStatus,
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