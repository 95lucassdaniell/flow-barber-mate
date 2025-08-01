import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  trend?: number;
  icon: React.ComponentType<{ className?: string }>;
  format?: "number" | "currency" | "percentage" | "days" | "rating";
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  trend, 
  icon: Icon, 
  format = "number" 
}) => {
  const formatValue = (val: number) => {
    switch (format) {
      case "currency":
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(val);
      case "percentage":
        return `${val.toFixed(1)}%`;
      case "days":
        return `${val} dias`;
      case "rating":
        return `${val.toFixed(1)}/10`;
      default:
        return val.toString();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value)}</div>
        <div className="flex items-center space-x-2">
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          {trend !== undefined && (
            <Badge 
              variant={trend >= 0 ? "default" : "secondary"}
              className="text-xs"
            >
              {trend >= 0 ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              {Math.abs(trend).toFixed(1)}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};