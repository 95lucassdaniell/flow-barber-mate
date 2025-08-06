import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ClientInsights } from '@/components/ai/ClientInsights';

const AIClientsPage: React.FC = () => {
  return (
    <DashboardLayout activeTab="ai">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IA - Análise de Clientes</h1>
          <p className="text-muted-foreground">
            Segmentação inteligente e análise de avaliações dos clientes
          </p>
        </div>
        
        <ClientInsights />
      </div>
    </DashboardLayout>
  );
};

export default AIClientsPage;