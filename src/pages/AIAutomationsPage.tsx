import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { AutomationsManager } from '@/components/ai/AutomationsManager';

const AIAutomationsPage: React.FC = () => {
  return (
    <DashboardLayout activeTab="ai">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IA - Automações</h1>
          <p className="text-muted-foreground">
            Configure automações inteligentes de marketing e comunicação
          </p>
        </div>
        
        <AutomationsManager />
      </div>
    </DashboardLayout>
  );
};

export default AIAutomationsPage;