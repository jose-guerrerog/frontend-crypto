// contexts/PortfolioContext.tsx
"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { Portfolio, Transaction, CoinPrice, PortfolioMetrics } from '@/types';
import { ApiService, WebSocketService } from '@/lib/api';
import { COINGECKO_ID_MAP } from '@/constants';

interface PortfolioState {
  portfolios: Portfolio[];
  selectedPortfolio: Portfolio | null;
  portfolioMetrics: PortfolioMetrics | null;
  valueHistory: { timestamp: string; value: number }[];
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
  | { type: 'DELETE_PORTFOLIO'; payload: number }
  | { type: 'SET_SELECTED_PORTFOLIO'; payload: Portfolio | null }
  | { type: 'ADD_TRANSACTION'; payload: { portfolioId: number; transaction: Transaction } }
  | { type: 'REMOVE_TRANSACTION'; payload: { portfolioId: number; transactionId: string } }
  | { type: 'SET_PORTFOLIO_METRICS'; payload: PortfolioMetrics | null }
  | { type: 'SET_VALUE_HISTORY'; payload: { timestamp: string; value: number }[] }
  | { type: 'UPDATE_COIN_PRICES'; payload: Record<string, CoinPrice> }
  | { type: 'SET_WS_CONNECTED'; payload: boolean }
  | { type: 'SET_BACKEND_AVAILABLE'; payload: boolean };

const initialState: PortfolioState = {
  portfolios: [],
  selectedPortfolio: null,
  portfolioMetrics: null,
  valueHistory: [],
  coinPrices: {},
  isLoading: false,
  error: null,
  wsConnected: false,
  backendAvailable: true,
};

function portfolioReducer(state: PortfolioState, action: PortfolioAction): PortfolioState {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, isLoading: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload, isLoading: false };
    case 'SET_PORTFOLIOS': return { ...state, portfolios: action.payload, isLoading: false, error: null };
    case 'ADD_PORTFOLIO': return { ...state, portfolios: [...state.portfolios, action.payload], isLoading: false, error: null };
    case 'DELETE_PORTFOLIO': return {
      ...state,
      portfolios: state.portfolios.filter(p => p.id !== action.payload),
      selectedPortfolio: state.selectedPortfolio?.id === action.payload ? null : state.selectedPortfolio,
      isLoading: false,
      error: null,
    };
    case 'SET_SELECTED_PORTFOLIO': return { ...state, selectedPortfolio: action.payload, error: null };
    case 'ADD_TRANSACTION': {
      const updatedPortfolios = state.portfolios.map(portfolio => portfolio.id === action.payload.portfolioId ? {
        ...portfolio,
        transactions: [...(portfolio.transactions || []), action.payload.transaction],
        transaction_count: portfolio.transaction_count + 1,
      } : portfolio);
      return {
        ...state,
        portfolios: updatedPortfolios,
        selectedPortfolio: state.selectedPortfolio?.id === action.payload.portfolioId ? {
          ...state.selectedPortfolio,
          transactions: [...(state.selectedPortfolio.transactions || []), action.payload.transaction],
          transaction_count: state.selectedPortfolio.transaction_count + 1,
        } : state.selectedPortfolio,
        error: null,
      };
    }
    case 'REMOVE_TRANSACTION': {
      const updated = state.portfolios.map(portfolio => portfolio.id === action.payload.portfolioId ? {
        ...portfolio,
        transactions: portfolio.transactions?.filter(t => t.id !== action.payload.transactionId) || [],
        transaction_count: Math.max(0, portfolio.transaction_count - 1),
      } : portfolio);
      return {
        ...state,
        portfolios: updated,
        selectedPortfolio: state.selectedPortfolio?.id === action.payload.portfolioId ? {
          ...state.selectedPortfolio,
          transactions: state.selectedPortfolio.transactions?.filter(t => t.id !== action.payload.transactionId) || [],
          transaction_count: Math.max(0, state.selectedPortfolio.transaction_count - 1),
        } : state.selectedPortfolio,
        error: null,
      };
    }
    case 'SET_PORTFOLIO_METRICS': return { ...state, portfolioMetrics: action.payload };
    case 'SET_VALUE_HISTORY': return { ...state, valueHistory: action.payload };
    case 'UPDATE_COIN_PRICES': return { ...state, coinPrices: { ...state.coinPrices, ...action.payload } };
    case 'SET_WS_CONNECTED': return { ...state, wsConnected: action.payload };
    case 'SET_BACKEND_AVAILABLE': return { ...state, backendAvailable: action.payload };
    default: return state;
  }
}

const PortfolioContext = createContext<any>(null);

let wsService: WebSocketService | null = null;

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(portfolioReducer, initialState);

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

  useEffect(() => {
    checkBackendStatus();
    wsService = new WebSocketService();
    const handleMessage = (message: any) => {
      if (message.type === 'price_update' && message.data) {
        dispatch({ type: 'UPDATE_COIN_PRICES', payload: message.data });
      } else {
        console.warn('⚠️ Unexpected WebSocket message:', message);
      }
    };
    wsService.onMessage(handleMessage);
    wsService.connect()
      .then(() => dispatch({ type: 'SET_WS_CONNECTED', payload: true }))
      .catch(() => dispatch({ type: 'SET_WS_CONNECTED', payload: false }));
    return () => {
      wsService?.removeMessageHandler(handleMessage);
      wsService?.disconnect();
    };
  }, [checkBackendStatus]);

  const selectPortfolio = useCallback(async (portfolioId: number) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const portfolio = await ApiService.getPortfolio(portfolioId);
      dispatch({ type: 'SET_SELECTED_PORTFOLIO', payload: portfolio });
      await loadPortfolioMetrics(portfolioId);
      const history = await ApiService.getPortfolioAnalytics(portfolioId);
      dispatch({ type: 'SET_VALUE_HISTORY', payload: [
        { timestamp: new Date().toISOString(), value: history.total_value },
      ] });
      if (portfolio.transactions?.length) {
        const coinIds = [...new Set(portfolio.transactions.map(t => t.coin_id))];
        subscribeToCoinPrices(coinIds);
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to load portfolio';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    }
  }, []);

  const loadPortfolios = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const portfolios = await ApiService.getPortfolios();
      dispatch({ type: 'SET_PORTFOLIOS', payload: portfolios });
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to load portfolios';
      dispatch({ type: 'SET_ERROR', payload: message });
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
      const message = error?.response?.data?.message || error?.message || 'Failed to create portfolio';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    }
  }, []);

  const deletePortfolio = useCallback(async (portfolioId: number) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      await ApiService.deletePortfolio(portfolioId);
      dispatch({ type: 'DELETE_PORTFOLIO', payload: portfolioId });
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to delete portfolio';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    }
  }, []);

  const addTransaction = useCallback(async (
    portfolioId: number,
    transaction: Omit<Transaction, 'id' | 'timestamp' | 'total_value'>
  ) => {
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      const tx = await ApiService.addTransaction(portfolioId, transaction);
      dispatch({ type: 'ADD_TRANSACTION', payload: { portfolioId, transaction: tx } });
      await loadPortfolioMetrics(portfolioId);
      subscribeToCoinPrices([transaction.coin_id]);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to add transaction';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    }
  }, []);

  const removeTransaction = useCallback(async (portfolioId: number, transactionId: string) => {
    dispatch({ type: 'SET_ERROR', payload: null });
    try {
      await ApiService.removeTransaction(portfolioId, transactionId);
      dispatch({ type: 'REMOVE_TRANSACTION', payload: { portfolioId, transactionId } });
      await loadPortfolioMetrics(portfolioId);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to remove transaction';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    }
  }, []);

  const loadPortfolioMetrics = useCallback(async (portfolioId: number) => {
    try {
      const metrics = await ApiService.getPortfolioAnalytics(portfolioId);
      console.log('📊 Fetched portfolio metrics:', metrics);  // <--- Add this
      dispatch({ type: 'SET_PORTFOLIO_METRICS', payload: metrics });
    } catch (error: any) {
      console.warn('Failed to load portfolio metrics:', error);
    }
  }, []);

  const subscribeToCoinPrices = useCallback((coinIds: string[]) => {
    const mappedIds = coinIds.map((id) => COINGECKO_ID_MAP[id] || id);
    if (wsService?.isConnected()) wsService.subscribe(coinIds);
  }, []);

  const unsubscribeFromCoinPrices = useCallback((coinIds: string[]) => {
    if (wsService?.isConnected()) wsService.unsubscribe(coinIds);
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  return (
    <PortfolioContext.Provider
      value={{
        ...state,
        valueHistory: state.valueHistory,
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
      }}
    >
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
