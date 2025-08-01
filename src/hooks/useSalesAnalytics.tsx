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

export interface ServiceProductCombo {
  serviceName: string;
  productName: string;
  frequency: number;
  revenue: number;
  confidence: number;
}

export interface SalesAnalytics {
  serviceProductCombos: ServiceProductCombo[];
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
    serviceProductCombos: [],
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
      console.log('🔍 Iniciando análise de vendas para barbershop:', profile.barbershop_id);

      // Buscar vendas dos últimos 90 dias
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('id, client_id, final_amount, sale_date, created_at')
        .eq('barbershop_id', profile.barbershop_id)
        .gte('sale_date', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('created_at', { ascending: false });

      if (salesError) {
        console.error('❌ Erro ao buscar vendas:', salesError);
        throw salesError;
      }

      if (!sales || sales.length === 0) {
        console.log('❌ Nenhuma venda encontrada nos últimos 90 dias');
        setAnalytics({
          serviceProductCombos: [],
          productCombos: [],
          serviceCombos: [],
          crossSellOpportunities: [],
          clientPatterns: [],
          topPerformingServices: [],
          topPerformingProducts: [],
        });
        return;
      }

      console.log('📊 Vendas encontradas:', sales.length);

      // Buscar itens das vendas
      const saleIds = sales.map(sale => sale.id);
      const { data: saleItems, error: itemsError } = await supabase
        .from('sale_items')
        .select('id, sale_id, item_type, service_id, product_id, quantity, unit_price, total_price')
        .in('sale_id', saleIds);

      if (itemsError) {
        console.error('❌ Erro ao buscar itens das vendas:', itemsError);
        throw itemsError;
      }

      // Buscar clientes
      const clientIds = [...new Set(sales.map(sale => sale.client_id))];
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, name')
        .in('id', clientIds);

      if (clientsError) {
        console.error('❌ Erro ao buscar clientes:', clientsError);
        throw clientsError;
      }

      // Buscar serviços
      const serviceIds = [...new Set(saleItems?.filter(item => item.service_id).map(item => item.service_id) || [])];
      const { data: services, error: servicesError } = serviceIds.length > 0 ? await supabase
        .from('services')
        .select('id, name')
        .in('id', serviceIds) : { data: [], error: null };

      if (servicesError) {
        console.error('❌ Erro ao buscar serviços:', servicesError);
        throw servicesError;
      }

      // Buscar produtos
      const productIds = [...new Set(saleItems?.filter(item => item.product_id).map(item => item.product_id) || [])];
      const { data: products, error: productsError } = productIds.length > 0 ? await supabase
        .from('products')
        .select('id, name, cost_price')
        .in('id', productIds) : { data: [], error: null };

      if (productsError) {
        console.error('❌ Erro ao buscar produtos:', productsError);
        throw productsError;
      }

      // Criar maps para lookups rápidos
      const clientsMap = new Map(clients?.map(c => [c.id, c] as const) || []);
      const servicesMap = new Map(services?.map(s => [s.id, s] as const) || []);
      const productsMap = new Map(products?.map(p => [p.id, p] as const) || []);

      // Combinar dados
      const salesWithItems = sales.map(sale => ({
        ...sale,
        clients: clientsMap.get(sale.client_id),
        sale_items: (saleItems || [])
          .filter(item => item.sale_id === sale.id)
          .map(item => ({
            ...item,
            services: item.service_id ? servicesMap.get(item.service_id) : null,
            products: item.product_id ? productsMap.get(item.product_id) : null,
          }))
      })).filter(sale => sale.sale_items.length > 0);

      console.log('📊 Vendas com itens encontradas:', salesWithItems?.length || 0);

      if (!salesWithItems || salesWithItems.length === 0) {
        console.log('❌ Nenhuma venda com itens encontrada nos últimos 90 dias');
        setAnalytics({
          serviceProductCombos: [],
          productCombos: [],
          serviceCombos: [],
          crossSellOpportunities: [],
          clientPatterns: [],
          topPerformingServices: [],
          topPerformingProducts: [],
        });
        return;
      }

      // Log detalhado dos primeiros itens
      console.log('📋 Amostra de venda com itens:', JSON.stringify(salesWithItems[0], null, 2));
      
      // Contar total de itens
      const totalItems = salesWithItems.reduce((sum, sale) => sum + (sale.sale_items?.length || 0), 0);
      console.log('🛒 Total de itens encontrados:', totalItems);
      
      // Contar vendas com múltiplos itens
      const multiItemSales = salesWithItems.filter(sale => sale.sale_items && sale.sale_items.length > 1);
      console.log('📦 Vendas com múltiplos itens:', multiItemSales.length);

      console.log('🔄 Processando análises...');

      // Analisar combos serviço + produto (mais realístico para barbearias)
      const serviceProductCombos = analyzeServiceProductCombos(salesWithItems);
      console.log('🤝 Combos serviço+produto:', serviceProductCombos.length);

      // Analisar combos de produtos
      const productCombos = analyzeProductCombos(salesWithItems);
      console.log('📦 Combos de produtos:', productCombos.length);
      
      // Analisar combos de serviços
      const serviceCombos = analyzeServiceCombos(salesWithItems);
      console.log('✂️ Combos de serviços:', serviceCombos.length);
      
      // Analisar oportunidades de cross-sell
      const crossSellOpportunities = analyzeCrossSellOpportunities(salesWithItems);
      console.log('🎯 Oportunidades cross-sell:', crossSellOpportunities.length);
      
      // Analisar padrões de cliente
      const clientPatterns = analyzeClientPatterns(salesWithItems);
      console.log('👥 Padrões de clientes:', clientPatterns.length);
      
      // Analisar performance de serviços
      const topPerformingServices = analyzeServicePerformance(salesWithItems);
      console.log('🏆 Top serviços:', topPerformingServices.length);
      
      // Analisar performance de produtos
      const topPerformingProducts = analyzeProductPerformance(salesWithItems);
      console.log('🥇 Top produtos:', topPerformingProducts.length);

      const finalAnalytics = {
        serviceProductCombos,
        productCombos,
        serviceCombos,
        crossSellOpportunities,
        clientPatterns,
        topPerformingServices,
        topPerformingProducts,
      };

      console.log('✅ Análise concluída:', finalAnalytics);
      setAnalytics(finalAnalytics);

    } catch (error) {
      console.error('Erro ao calcular análise de vendas:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeServiceProductCombos = (sales: any[]): ServiceProductCombo[] => {
    const combos = new Map<string, { frequency: number; revenue: number }>();

    console.log('🔍 Analisando combos serviço + produto...');
    
    sales.forEach(sale => {
      const services = sale.sale_items
        .filter((item: any) => item.item_type === 'service' && item.services?.name)
        .map((item: any) => item.services.name);
      
      const products = sale.sale_items
        .filter((item: any) => item.item_type === 'product' && item.products?.name)
        .map((item: any) => item.products.name);

      // Criar combos serviço + produto
      services.forEach((service: string) => {
        products.forEach((product: string) => {
          const comboKey = `${service}|${product}`;
          const revenue = sale.final_amount;
          
          if (combos.has(comboKey)) {
            const current = combos.get(comboKey)!;
            combos.set(comboKey, {
              frequency: current.frequency + 1,
              revenue: current.revenue + revenue
            });
          } else {
            combos.set(comboKey, { frequency: 1, revenue });
          }
        });
      });
    });

    const result = Array.from(combos.entries())
      .map(([combo, data]) => {
        const [serviceName, productName] = combo.split('|');
        return {
          serviceName,
          productName,
          frequency: data.frequency,
          revenue: data.revenue,
          confidence: Math.min(data.frequency / sales.length * 100, 100)
        };
      })
      .filter(combo => combo.frequency >= 1) // Aceitar qualquer ocorrência
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 15);

    console.log('🤝 Combos serviço+produto encontrados:', result.length);
    if (result.length > 0) {
      console.log('🤝 Exemplo combo serviço+produto:', result[0]);
    }
    
    return result;
  };

  const analyzeProductCombos = (sales: any[]): ProductCombo[] => {
    const combos = new Map<string, { frequency: number; revenue: number }>();

    console.log('🔍 Analisando combos de produtos...');
    
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

    const result = Array.from(combos.entries())
      .map(([combo, data]) => ({
        items: combo.split(' + '),
        frequency: data.frequency,
        revenue: data.revenue,
        confidence: Math.min(data.frequency / sales.length * 100, 100)
      }))
      .filter(combo => combo.frequency >= 1) // Aceitar qualquer ocorrência
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);

    console.log('📦 Combos de produtos encontrados:', result.length);
    if (result.length > 0) {
      console.log('📦 Exemplo combo produto:', result[0]);
    }
    
    return result;
  };

  const analyzeServiceCombos = (sales: any[]): ServiceCombo[] => {
    const combos = new Map<string, { frequency: number; revenue: number }>();

    console.log('🔍 Analisando combos de serviços...');
    
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

    const result = Array.from(combos.entries())
      .map(([combo, data]) => ({
        items: combo.split(' + '),
        frequency: data.frequency,
        revenue: data.revenue,
        confidence: Math.min(data.frequency / sales.length * 100, 100)
      }))
      .filter(combo => combo.frequency >= 1) // Aceitar qualquer ocorrência
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);

    console.log('✂️ Combos de serviços encontrados:', result.length);
    if (result.length > 0) {
      console.log('✂️ Exemplo combo serviço:', result[0]);
    }
    
    return result;
  };

  const analyzeCrossSellOpportunities = (sales: any[]): CrossSellOpportunity[] => {
    const serviceToProduct = new Map<string, Map<string, number>>();
    const productToProduct = new Map<string, Map<string, number>>();

    console.log('🎯 Analisando oportunidades de cross-sell (foco serviço → produto)...');

    sales.forEach(sale => {
      const services = sale.sale_items
        .filter((item: any) => item.item_type === 'service' && item.services?.name)
        .map((item: any) => ({ name: item.services.name, price: item.unit_price }));
      
      const products = sale.sale_items
        .filter((item: any) => item.item_type === 'product' && item.products?.name)
        .map((item: any) => ({ name: item.products.name, price: item.unit_price }));

      // Analisar padrões serviço → produto (mais comum em barbearias)
      services.forEach(service => {
        products.forEach(product => {
          if (!serviceToProduct.has(service.name)) {
            serviceToProduct.set(service.name, new Map());
          }
          
          const serviceProducts = serviceToProduct.get(service.name)!;
          const currentCount = serviceProducts.get(product.name) || 0;
          serviceProducts.set(product.name, currentCount + 1);
        });
      });

      // Analisar alguns padrões produto → produto (limitado)
      for (let i = 0; i < products.length; i++) {
        for (let j = i + 1; j < products.length; j++) {
          const product1 = products[i];
          const product2 = products[j];
          
          [
            { base: product1.name, suggested: product2.name },
            { base: product2.name, suggested: product1.name }
          ].forEach(({ base, suggested }) => {
            if (!productToProduct.has(base)) {
              productToProduct.set(base, new Map());
            }
            
            const baseProducts = productToProduct.get(base)!;
            const currentCount = baseProducts.get(suggested) || 0;
            baseProducts.set(suggested, currentCount + 1);
          });
        }
      }
    });

    const result: CrossSellOpportunity[] = [];

    // Processar oportunidades serviço → produto
    serviceToProduct.forEach((products, serviceName) => {
      products.forEach((frequency, productName) => {
        if (frequency >= 1) {
          const confidence = (frequency / sales.length) * 100;
          
          result.push({
            baseItem: serviceName,
            baseItemType: 'service',
            suggestedItem: productName,
            suggestedItemType: 'product',
            confidence,
            frequency,
            potentialRevenue: frequency * 25 // Estimativa baseada no valor médio de produtos
          });
        }
      });
    });

    // Processar algumas oportunidades produto → produto (limitado)
    productToProduct.forEach((suggestedProducts, baseName) => {
      suggestedProducts.forEach((frequency, suggestedName) => {
        if (frequency >= 2) { // Threshold mais alto para produto → produto
          const confidence = (frequency / sales.length) * 100;
          
          result.push({
            baseItem: baseName,
            baseItemType: 'product',
            suggestedItem: suggestedName,
            suggestedItemType: 'product',
            confidence,
            frequency,
            potentialRevenue: frequency * 20
          });
        }
      });
    });

    const finalResult = result
      .sort((a, b) => {
        // Priorizar oportunidades serviço → produto
        if (a.baseItemType === 'service' && b.baseItemType === 'product') return -1;
        if (a.baseItemType === 'product' && b.baseItemType === 'service') return 1;
        return b.confidence - a.confidence;
      })
      .slice(0, 15);

    console.log('🎯 Oportunidades de cross-sell encontradas:', finalResult.length);
    return finalResult;
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