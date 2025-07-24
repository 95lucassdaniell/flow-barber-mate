import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { AIInsights } from '@/components/ai/AIInsights';

const AIPage: React.FC = () => {
  return (
    <DashboardLayout activeTab="ai">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IA Preditiva</h1>
          <p className="text-muted-foreground">
            Análises inteligentes e previsões para otimizar seu negócio
          </p>
        </div>
        
        <AIInsights />
      </div>
    </DashboardLayout>
  );
};

export default AIPage;