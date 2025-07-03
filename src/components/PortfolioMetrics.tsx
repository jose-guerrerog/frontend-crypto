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
import { Award, AlertTriangle } from "lucide-react";
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

  console.log("Raw coinPrices object", coinPrices);

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
    if (!selectedPortfolio?.transactions?.length || !coinPrices) return {};

    const grouped: Record<string, { amount: number; cost: number; symbol: string }> = {};

    for (const tx of selectedPortfolio.transactions) {
      const amt = parseFloat(tx.amount.toString());
      const cost = amt * parseFloat(tx.price_usd.toString());
      const id = tx.coin_id;
      const symbol = tx.coin_symbol;
      if (!grouped[id]) grouped[id] = { amount: 0, cost: 0, symbol };
      grouped[id].amount += amt;
      grouped[id].cost += cost;
    }

    const result: Record<string, any> = {};
    for (const id in grouped) {
      const { amount, cost, symbol } = grouped[id];
      
      // const geckoId = COINGECKO_ID_MAP[id] || id;
      const geckoId = COINGECKO_ID_MAP[id.toLowerCase()] || id.toLowerCase();
      console.log('printing')
      console.log(`coin_id: ${id}, geckoId: ${geckoId}, price: ${coinPrices[geckoId]?.usd}`);

      const current_price = coinPrices[geckoId]?.usd ?? 0;
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

      <div className="grid grid-cols-2 gap-4 mb-8">
        {metrics.best_performer && (
          <div className="bg-green-100 p-4 rounded-md">
            <div className="flex items-center mb-2 text-green-800 font-medium">
              <Award size={16} className="mr-2" /> Best Performer
            </div>
            <p className="text-lg font-bold">{metrics.best_performer.coin_symbol}</p>
            <p className="text-sm text-green-700">
              {formatPercentage(metrics.best_performer.profit_loss_percentage)} ({formatCurrency(metrics.best_performer.profit_loss)})
            </p>
          </div>
        )}

        {metrics.worst_performer && (
          <div className="bg-red-100 p-4 rounded-md">
            <div className="flex items-center mb-2 text-red-800 font-medium">
              <AlertTriangle size={16} className="mr-2" /> Worst Performer
            </div>
            <p className="text-lg font-bold">{metrics.worst_performer.coin_symbol}</p>
            <p className="text-sm text-red-700">
              {formatPercentage(metrics.worst_performer.profit_loss_percentage)} ({formatCurrency(metrics.worst_performer.profit_loss)})
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h4 className="text-base font-medium mb-4">Asset Allocation</h4>
          {assetAllocationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={assetAllocationData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, formatted }: any) => `${name.split(" ")[0]} ${formatted}`}
                >
                  {assetAllocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400">No allocation data available</p>
          )}
        </div>

        <div>
          <h4 className="text-base font-medium mb-4">Performance Comparison</h4>
          {performanceData.some((d) => d.value !== 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="coin" />
                <YAxis tickFormatter={(value) => `${value.toFixed(0)}%`} />
                <Tooltip content={<PerformanceTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {performanceData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.value >= 0 ? "#10B981" : "#EF4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400">No performance data available</p>
          )}
        </div>
      </div>

      <div className="mt-10">
        <h4 className="text-base font-medium mb-4">Asset Performance Breakdown</h4>
        <div className="overflow-auto">
          <table className="min-w-full text-sm text-left border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Coin</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Buy Price</th>
                <th className="p-2">Current Price</th>
                <th className="p-2">Current Value</th>
                <th className="p-2">Profit</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(breakdown).map((coin, index) => {
                const data = breakdown[coin];
                return (
                  <tr key={index} className="border-t">
                    <td className="p-2 font-medium">{coin}</td>
                    <td className="p-2">{data?.amount.toFixed(4)}</td>
                    <td className="p-2">${data?.buy_price.toFixed(2)}</td>
                    <td className="p-2">${data?.current_price.toFixed(2)}</td>
                    <td className="p-2">${data?.current_value.toFixed(2)}</td>
                    <td className={`p-2 ${data?.profit >= 0 ? "text-green-600" : "text-red-600"}`}>${data?.profit.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
