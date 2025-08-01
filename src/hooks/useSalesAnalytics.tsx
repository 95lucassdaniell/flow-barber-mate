import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ProductCombo {
  items: string[];
  frequency: number;
  revenue: number;
  confidence: number;
}

export interface ServiceCombo {
  items: string[];
  frequency: number;
  revenue: number;
  confidence: number;
}

export interface CrossSellOpportunity {
  baseItem: string;
  baseItemType: 'service' | 'product';
  suggestedItem: string;
  suggestedItemType: 'service' | 'product';
  confidence: number;
  potentialRevenue: number;
  frequency: number;
}

export interface ClientPurchasePattern {
  clientId: string;
  clientName: string;
  averageTicket: number;
  preferredServices: string[];
  preferredProducts: string[];
  lastPurchaseDate: Date;
  frequencyDays: number;
  lifetimeValue: number;
  churnRisk: 'low' | 'medium' | 'high';
  nextSuggestedService?: string;
  nextSuggestedProduct?: string;
}

export interface SalesAnalytics {
  productCombos: ProductCombo[];
  serviceCombos: ServiceCombo[];
  crossSellOpportunities: CrossSellOpportunity[];
  clientPatterns: ClientPurchasePattern[];
  topPerformingServices: Array<{
    id: string;
    name: string;
    revenue: number;
    quantity: number;
    averagePrice: number;
    profitMargin: number;
  }>;
  topPerformingProducts: Array<{
    id: string;
    name: string;
    revenue: number;
    quantity: number;
    averagePrice: number;
    profitMargin: number;
  }>;
}

export const useSalesAnalytics = () => {
  const { profile } = useAuth();
  const [analytics, setAnalytics] = useState<SalesAnalytics>({
    productCombos: [],
    serviceCombos: [],
    crossSellOpportunities: [],
    clientPatterns: [],
    topPerformingServices: [],
    topPerformingProducts: [],
  });
  const [loading, setLoading] = useState(false);

  const calculateMarketBasketAnalysis = async () => {
    if (!profile?.barbershop_id) return;

    try {
      setLoading(true);

      // Primeiro buscar vendas básicas dos últimos 90 dias
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('id, client_id, final_amount, created_at')
        .eq('barbershop_id', profile.barbershop_id)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;

      if (!salesData || salesData.length === 0) {
        console.log('Nenhuma venda encontrada nos últimos 90 dias');
        setAnalytics({
          productCombos: [],
          serviceCombos: [],
          crossSellOpportunities: [],
          clientPatterns: [],
          topPerformingServices: [],
          topPerformingProducts: [],
        });
        return;
      }

      // Buscar clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name')
        .eq('barbershop_id', profile.barbershop_id);

      // Buscar itens de venda
      const { data: saleItemsData, error: itemsError } = await supabase
        .from('sale_items')
        .select('sale_id, item_type, service_id, product_id, quantity, unit_price, total_price')
        .in('sale_id', salesData.map(s => s.id));

      // Buscar serviços
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id, name')
        .eq('barbershop_id', profile.barbershop_id);

      // Buscar produtos
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, cost_price')
        .eq('barbershop_id', profile.barbershop_id);

      // Criar mapas para lookup rápido
      const clientsMap = new Map(clientsData?.map(c => [c.id, c.name]) || []);
      const servicesMap = new Map(servicesData?.map(s => [s.id, s]) || []);
      const productsMap = new Map(productsData?.map(p => [p.id, p]) || []);

      // Combinar dados
      const sales = salesData.map(sale => ({
        ...sale,
        clients: { name: clientsMap.get(sale.client_id) || 'Cliente' },
        sale_items: (saleItemsData || [])
          .filter(item => item.sale_id === sale.id)
          .map(item => ({
            ...item,
            services: item.service_id ? servicesMap.get(item.service_id) : null,
            products: item.product_id ? productsMap.get(item.product_id) : null
          }))
      }));

      // Analisar combos de produtos
      const productCombos = analyzeProductCombos(sales);
      
      // Analisar combos de serviços
      const serviceCombos = analyzeServiceCombos(sales);
      
      // Analisar oportunidades de cross-sell
      const crossSellOpportunities = analyzeCrossSellOpportunities(sales);
      
      // Analisar padrões de cliente
      const clientPatterns = analyzeClientPatterns(sales);
      
      // Analisar performance de serviços
      const topPerformingServices = analyzeServicePerformance(sales);
      
      // Analisar performance de produtos
      const topPerformingProducts = analyzeProductPerformance(sales);

      setAnalytics({
        productCombos,
        serviceCombos,
        crossSellOpportunities,
        clientPatterns,
        topPerformingServices,
        topPerformingProducts,
      });

    } catch (error) {
      console.error('Erro ao calcular análise de vendas:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeProductCombos = (sales: any[]): ProductCombo[] => {
    const combos = new Map<string, { frequency: number; revenue: number }>();

    sales.forEach(sale => {
      const products = sale.sale_items
        .filter((item: any) => item.item_type === 'product' && item.products?.name)
        .map((item: any) => item.products.name);

      if (products.length < 2) return;

      // Gerar todas as combinações de 2 produtos
      for (let i = 0; i < products.length; i++) {
        for (let j = i + 1; j < products.length; j++) {
          const combo = [products[i], products[j]].sort().join(' + ');
          const revenue = sale.final_amount;
          
          if (combos.has(combo)) {
            const current = combos.get(combo)!;
            combos.set(combo, {
              frequency: current.frequency + 1,
              revenue: current.revenue + revenue
            });
          } else {
            combos.set(combo, { frequency: 1, revenue });
          }
        }
      }
    });

    return Array.from(combos.entries())
      .map(([combo, data]) => ({
        items: combo.split(' + '),
        frequency: data.frequency,
        revenue: data.revenue,
        confidence: Math.min(data.frequency / sales.length * 100, 100)
      }))
      .filter(combo => combo.frequency >= 3) // Mínimo 3 ocorrências
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  };

  const analyzeServiceCombos = (sales: any[]): ServiceCombo[] => {
    const combos = new Map<string, { frequency: number; revenue: number }>();

    sales.forEach(sale => {
      const services = sale.sale_items
        .filter((item: any) => item.item_type === 'service' && item.services?.name)
        .map((item: any) => item.services.name);

      if (services.length < 2) return;

      // Gerar todas as combinações de 2 serviços
      for (let i = 0; i < services.length; i++) {
        for (let j = i + 1; j < services.length; j++) {
          const combo = [services[i], services[j]].sort().join(' + ');
          const revenue = sale.final_amount;
          
          if (combos.has(combo)) {
            const current = combos.get(combo)!;
            combos.set(combo, {
              frequency: current.frequency + 1,
              revenue: current.revenue + revenue
            });
          } else {
            combos.set(combo, { frequency: 1, revenue });
          }
        }
      }
    });

    return Array.from(combos.entries())
      .map(([combo, data]) => ({
        items: combo.split(' + '),
        frequency: data.frequency,
        revenue: data.revenue,
        confidence: Math.min(data.frequency / sales.length * 100, 100)
      }))
      .filter(combo => combo.frequency >= 3)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  };

  const analyzeCrossSellOpportunities = (sales: any[]): CrossSellOpportunity[] => {
    const opportunities = new Map<string, { frequency: number; revenue: number }>();

    sales.forEach(sale => {
      const items = sale.sale_items.map((item: any) => ({
        name: item.item_type === 'service' ? item.services?.name : item.products?.name,
        type: item.item_type,
        price: item.unit_price
      })).filter((item: any) => item.name);

      // Analisar associações entre itens
      items.forEach((baseItem: any) => {
        items.forEach((suggestedItem: any) => {
          if (baseItem.name === suggestedItem.name) return;

          const key = `${baseItem.name}|${baseItem.type} -> ${suggestedItem.name}|${suggestedItem.type}`;
          
          if (opportunities.has(key)) {
            const current = opportunities.get(key)!;
            opportunities.set(key, {
              frequency: current.frequency + 1,
              revenue: current.revenue + suggestedItem.price
            });
          } else {
            opportunities.set(key, { frequency: 1, revenue: suggestedItem.price });
          }
        });
      });
    });

    return Array.from(opportunities.entries())
      .map(([key, data]) => {
        const [baseInfo, suggestedInfo] = key.split(' -> ');
        const [baseName, baseType] = baseInfo.split('|');
        const [suggestedName, suggestedType] = suggestedInfo.split('|');
        
        return {
          baseItem: baseName,
          baseItemType: baseType as 'service' | 'product',
          suggestedItem: suggestedName,
          suggestedItemType: suggestedType as 'service' | 'product',
          confidence: Math.min(data.frequency / sales.length * 100, 100),
          potentialRevenue: data.revenue / data.frequency,
          frequency: data.frequency
        };
      })
      .filter(opp => opp.frequency >= 3)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 20);
  };

  const analyzeClientPatterns = (sales: any[]): ClientPurchasePattern[] => {
    const clientData = new Map<string, any>();

    sales.forEach(sale => {
      const clientId = sale.client_id;
      const clientName = sale.clients?.name || 'Cliente';
      
      if (!clientData.has(clientId)) {
        clientData.set(clientId, {
          clientId,
          clientName,
          purchases: [],
          services: new Set(),
          products: new Set(),
          totalSpent: 0
        });
      }

      const client = clientData.get(clientId);
      client.purchases.push({
        date: new Date(sale.created_at),
        amount: sale.final_amount
      });
      client.totalSpent += sale.final_amount;

      sale.sale_items.forEach((item: any) => {
        if (item.item_type === 'service' && item.services?.name) {
          client.services.add(item.services.name);
        } else if (item.item_type === 'product' && item.products?.name) {
          client.products.add(item.products.name);
        }
      });
    });

    return Array.from(clientData.values()).map(client => {
      const purchases = client.purchases.sort((a: any, b: any) => b.date.getTime() - a.date.getTime());
      const averageTicket = client.totalSpent / purchases.length;
      const daysBetweenPurchases = purchases.length > 1 ? 
        (purchases[0].date.getTime() - purchases[purchases.length - 1].date.getTime()) / (1000 * 60 * 60 * 24) / (purchases.length - 1) : 30;
      
      const daysSinceLastPurchase = (Date.now() - purchases[0].date.getTime()) / (1000 * 60 * 60 * 24);
      
      let churnRisk: 'low' | 'medium' | 'high' = 'low';
      if (daysSinceLastPurchase > daysBetweenPurchases * 2) {
        churnRisk = 'high';
      } else if (daysSinceLastPurchase > daysBetweenPurchases * 1.5) {
        churnRisk = 'medium';
      }

      return {
        clientId: client.clientId,
        clientName: client.clientName,
        averageTicket,
        preferredServices: Array.from(client.services) as string[],
        preferredProducts: Array.from(client.products) as string[],
        lastPurchaseDate: purchases[0].date,
        frequencyDays: Math.round(daysBetweenPurchases),
        lifetimeValue: client.totalSpent,
        churnRisk
      };
    }).sort((a, b) => b.lifetimeValue - a.lifetimeValue);
  };

  const analyzeServicePerformance = (sales: any[]) => {
    const serviceStats = new Map<string, any>();

    sales.forEach(sale => {
      sale.sale_items.forEach((item: any) => {
        if (item.item_type === 'service' && item.services?.name) {
          const serviceId = item.service_id;
          const serviceName = item.services.name;
          
          if (!serviceStats.has(serviceId)) {
            serviceStats.set(serviceId, {
              id: serviceId,
              name: serviceName,
              revenue: 0,
              quantity: 0,
              totalPrice: 0
            });
          }
          
          const stats = serviceStats.get(serviceId);
          stats.revenue += item.total_price;
          stats.quantity += item.quantity;
          stats.totalPrice += item.total_price;
        }
      });
    });

    return Array.from(serviceStats.values())
      .map(service => ({
        ...service,
        averagePrice: service.revenue / service.quantity,
        profitMargin: 100 // Serviços geralmente têm alta margem
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  };

  const analyzeProductPerformance = (sales: any[]) => {
    const productStats = new Map<string, any>();

    sales.forEach(sale => {
      sale.sale_items.forEach((item: any) => {
        if (item.item_type === 'product' && item.products?.name) {
          const productId = item.product_id;
          const productName = item.products.name;
          const costPrice = item.products.cost_price || 0;
          
          if (!productStats.has(productId)) {
            productStats.set(productId, {
              id: productId,
              name: productName,
              revenue: 0,
              quantity: 0,
              totalCost: 0,
              totalPrice: 0
            });
          }
          
          const stats = productStats.get(productId);
          stats.revenue += item.total_price;
          stats.quantity += item.quantity;
          stats.totalCost += costPrice * item.quantity;
          stats.totalPrice += item.total_price;
        }
      });
    });

    return Array.from(productStats.values())
      .map(product => ({
        ...product,
        averagePrice: product.revenue / product.quantity,
        profitMargin: product.totalCost > 0 ? ((product.revenue - product.totalCost) / product.revenue) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  };

  const getUpsellSuggestions = (currentItems: Array<{name: string, type: 'service' | 'product'}>) => {
    const suggestions: Array<{
      item: string;
      type: 'service' | 'product';
      confidence: number;
      reason: string;
    }> = [];

    currentItems.forEach(currentItem => {
      // Encontrar oportunidades de cross-sell baseadas no item atual
      const opportunities = analytics.crossSellOpportunities.filter(
        opp => opp.baseItem === currentItem.name && opp.baseItemType === currentItem.type
      );

      opportunities.forEach(opp => {
        const isAlreadyInCart = currentItems.some(
          item => item.name === opp.suggestedItem && item.type === opp.suggestedItemType
        );

        if (!isAlreadyInCart) {
          suggestions.push({
            item: opp.suggestedItem,
            type: opp.suggestedItemType,
            confidence: opp.confidence,
            reason: `Clientes que compraram "${currentItem.name}" também compraram "${opp.suggestedItem}"`
          });
        }
      });
    });

    // Sugestões baseadas em combos populares
    analytics.serviceCombos.forEach(combo => {
      const hasOneItem = combo.items.some(item => 
        currentItems.some(current => current.name === item && current.type === 'service')
      );
      
      if (hasOneItem) {
        combo.items.forEach(item => {
          const isAlreadyInCart = currentItems.some(
            current => current.name === item && current.type === 'service'
          );
          
          if (!isAlreadyInCart) {
            suggestions.push({
              item,
              type: 'service',
              confidence: combo.confidence,
              reason: `Combo popular: ${combo.items.join(' + ')}`
            });
          }
        });
      }
    });

    analytics.productCombos.forEach(combo => {
      const hasOneItem = combo.items.some(item => 
        currentItems.some(current => current.name === item && current.type === 'product')
      );
      
      if (hasOneItem) {
        combo.items.forEach(item => {
          const isAlreadyInCart = currentItems.some(
            current => current.name === item && current.type === 'product'
          );
          
          if (!isAlreadyInCart) {
            suggestions.push({
              item,
              type: 'product',
              confidence: combo.confidence,
              reason: `Combo popular: ${combo.items.join(' + ')}`
            });
          }
        });
      }
    });

    // Remover duplicatas e ordenar por confiança
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) => 
      index === self.findIndex(s => s.item === suggestion.item && s.type === suggestion.type)
    );

    return uniqueSuggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  };

  useEffect(() => {
    if (profile?.barbershop_id) {
      calculateMarketBasketAnalysis();
    }
  }, [profile?.barbershop_id]);

  return {
    analytics,
    loading,
    refetchAnalytics: calculateMarketBasketAnalysis,
    getUpsellSuggestions
  };
};