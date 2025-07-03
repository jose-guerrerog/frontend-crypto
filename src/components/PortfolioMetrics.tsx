"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { usePortfolio } from "@/contexts/PortfolioContext";

const COINGECKO_ID_MAP: Record<string, string> = {
  btc: "bitcoin",
  eth: "ethereum",
  sol: "solana",
  doge: "dogecoin",
  ada: "cardano",
};

const COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#84CC16", "#6366F1",
];

export default function PortfolioMetrics() {
  const { portfolioMetrics, isLoading, selectedPortfolio, coinPrices } = usePortfolio();

  console.log("📊 Raw coinPrices object:", coinPrices);

  if (isLoading) return <p>Loading portfolio metrics...</p>;
  if (!portfolioMetrics?.metrics) return <p>No metrics found for this portfolio.</p>;

  const { metrics } = portfolioMetrics;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

  const formatPercentage = (value: number) =>
    `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

  const assetAllocationData = Object.entries(metrics.asset_allocation ?? {}).map(
    ([asset, percentage]) => ({
      name: asset,
      value: percentage,
      formatted: typeof percentage === "number" ? `${percentage.toFixed(1)}%` : "",
    })
  );

  const breakdown = React.useMemo(() => {
    if (!selectedPortfolio?.transactions?.length || !coinPrices || Object.keys(coinPrices).length === 0) {
      console.warn("⚠️ Missing transactions or coin prices");
      return {};
    }

    const grouped: Record<string, { amount: number; cost: number; symbol: string }> = {};

    for (const tx of selectedPortfolio.transactions) {
      const amt = parseFloat(tx.amount.toString());
      const cost = amt * parseFloat(tx.price_usd.toString());
      const id = tx.coin_id.toLowerCase();
      const symbol = tx.coin_symbol;
      if (!grouped[id]) grouped[id] = { amount: 0, cost: 0, symbol };
      grouped[id].amount += amt;
      grouped[id].cost += cost;
    }

    const result: Record<string, any> = {};
    for (const id in grouped) {
      const { amount, cost, symbol } = grouped[id];
      const geckoId = COINGECKO_ID_MAP[id] || id;
      const coinData = coinPrices[geckoId];

      console.log("🔍 coin_id:", id, "geckoId:", geckoId, "price:", coinData?.usd);

      if (!coinData || coinData.usd === undefined) {
        console.warn(`⚠️ Missing price for ${geckoId}`);
        continue;
      }

      const current_price = coinData.usd;
      const current_value = amount * current_price;

      result[symbol] = {
        amount,
        buy_price: cost / amount,
        current_price,
        current_value,
        profit: current_value - cost,
      };
    }

    return result;
  }, [selectedPortfolio, coinPrices]);

  const performanceData = [
    {
      name: "Best Performer",
      coin: metrics.best_performer?.coin_symbol || "N/A",
      value: metrics.best_performer?.profit_loss_percentage || 0,
      amount: metrics.best_performer?.profit_loss || 0,
    },
    {
      name: "Worst Performer",
      coin: metrics.worst_performer?.coin_symbol || "N/A",
      value: metrics.worst_performer?.profit_loss_percentage || 0,
      amount: metrics.worst_performer?.profit_loss || 0,
    },
  ];

  const CustomTooltip = ({ active, payload }: any) =>
    active && payload?.length ? (
      <div className="bg-white border border-gray-200 rounded-md text-sm p-3">
        <p>{payload[0].name}</p>
        <p>{payload[0].value.toFixed(1)}%</p>
      </div>
    ) : null;

  const PerformanceTooltip = ({ active, payload }: any) =>
    active && payload?.length ? (
      <div className="bg-white border border-gray-200 rounded-md text-sm p-3">
        <p>{payload[0].payload.coin}</p>
        <p>{formatPercentage(payload[0].payload.value)}</p>
        <p>{formatCurrency(payload[0].payload.amount)}</p>
      </div>
    ) : null;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
      <h3 className="text-lg font-semibold mb-5">Portfolio Analytics</h3>

      {/* 🔹 Asset Allocation Pie Chart */}
      <div className="h-60 mb-6">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={assetAllocationData}
              dataKey="value"
              nameKey="name"
              outerRadius="100%"
              label={({ name }) => name}
            >
              {assetAllocationData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 🔹 Best/Worst Performer Bar Chart */}
      <div className="h-60 mb-6">
        <ResponsiveContainer>
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={<PerformanceTooltip />} />
            <Bar dataKey="value">
              {performanceData.map((_, index) => (
                <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 🔹 Breakdown Table */}
      <div className="overflow-x-auto mt-6">
        <table className="min-w-full text-sm text-left border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 font-medium">Coin</th>
              <th className="px-4 py-2 font-medium">Amount</th>
              <th className="px-4 py-2 font-medium">Buy Price</th>
              <th className="px-4 py-2 font-medium">Current Price</th>
              <th className="px-4 py-2 font-medium">Value</th>
              <th className="px-4 py-2 font-medium">Profit</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(breakdown).map(([symbol, info]: any, idx) => (
              <tr key={idx} className="border-t">
                <td className="px-4 py-2">{symbol.toUpperCase()}</td>
                <td className="px-4 py-2">{info.amount.toFixed(4)}</td>
                <td className="px-4 py-2">{formatCurrency(info.buy_price)}</td>
                <td className="px-4 py-2">{formatCurrency(info.current_price)}</td>
                <td className="px-4 py-2">{formatCurrency(info.current_value)}</td>
                <td className={`px-4 py-2 ${info.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {formatCurrency(info.profit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
