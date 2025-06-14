'use client';

import PortfolioDashboard from '@/components/PortfolioDashboard';
import { PortfolioProvider } from '@/contexts/PortfolioContext';

export default function Home() {
  return (
    <PortfolioProvider>
      <PortfolioDashboard />
    </PortfolioProvider>
  );
}