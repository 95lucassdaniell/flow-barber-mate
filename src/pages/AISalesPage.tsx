import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { SalesAnalyticsDashboard } from '@/components/ai/SalesAnalyticsDashboard';

const AISalesPage: React.FC = () => {
  return (
    <DashboardLayout activeTab="ai">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IA - Análise de Vendas</h1>
          <p className="text-muted-foreground">
            Analytics inteligentes de vendas, combos e oportunidades de cross-sell
          </p>
        </div>
        
        <SalesAnalyticsDashboard />
      </div>
    </DashboardLayout>
  );
};

export default AISalesPage;