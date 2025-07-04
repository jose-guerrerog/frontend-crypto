import { AddTransactionForm, CoinSearchResult } from "@/types";

export const FALLBACK_COIN_RESULTS: CoinSearchResult[] = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "BTC",
    thumb: "",
    market_cap_rank: 1,
  },
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    thumb: "",
    market_cap_rank: 2,
  },
  {
    id: "cardano",
    name: "Cardano",
    symbol: "ADA",
    thumb: "",
    market_cap_rank: 3,
  },
];

export const DEFAULT_FORM_DATA: AddTransactionForm = {
  coin_id: "",
  coin_name: "",
  coin_symbol: "",
  amount: "",
  price_usd: "",
  transaction_type: "buy",
};