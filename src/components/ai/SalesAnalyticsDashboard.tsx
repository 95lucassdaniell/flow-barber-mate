import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Package, 
  Scissors, 
  Users, 
  Target,
  AlertTriangle,
  Crown,
  ShoppingBag
} from 'lucide-react';
import { useSalesAnalytics } from '@/hooks/useSalesAnalytics';

export const SalesAnalyticsDashboard = () => {
  const { analytics, loading } = useSalesAnalytics();

  // Debug logging
  console.log('🎯 SalesAnalyticsDashboard - Loading:', loading);
  console.log('🎯 SalesAnalyticsDashboard - Analytics:', analytics);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getChurnRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  const getChurnRiskVariant = (risk: string) => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              <h3 className="font-medium">Combos de Produtos</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{analytics.productCombos.length}</p>
            <p className="text-sm text-muted-foreground">Identificados</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Scissors className="h-5 w-5 text-green-500" />
              <h3 className="font-medium">Combos de Serviços</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{analytics.serviceCombos.length}</p>
            <p className="text-sm text-muted-foreground">Identificados</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              <h3 className="font-medium">Oportunidades</h3>
            </div>
            <p className="text-2xl font-bold mt-2">{analytics.crossSellOpportunities.length}</p>
            <p className="text-sm text-muted-foreground">Cross-sell</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h3 className="font-medium">Risco Churn</h3>
            </div>
            <p className="text-2xl font-bold mt-2">
              {analytics.clientPatterns.filter(p => p.churnRisk === 'high').length}
            </p>
            <p className="text-sm text-muted-foreground">Clientes em risco</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="combos" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="combos">Combos</TabsTrigger>
          <TabsTrigger value="opportunities">Oportunidades</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="combos" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Combos de Serviços */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="h-5 w-5" />
                  Combos de Serviços Mais Populares
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-4">
                    {analytics.serviceCombos.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <p>Nenhum combo de serviços identificado</p>
                        <p className="text-xs mt-2">
                          {loading ? 'Carregando...' : 'Vendas analisadas: ' + (analytics.clientPatterns?.length || 0)}
                        </p>
                      </div>
                    ) : (
                      analytics.serviceCombos.map((combo, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{combo.items.join(' + ')}</h4>
                            <Badge variant="outline">
                              {Math.round(combo.confidence)}%
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Frequência:</span>
                              <span className="ml-1 font-medium">{combo.frequency}x</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Receita:</span>
                              <span className="ml-1 font-medium">R$ {combo.revenue.toFixed(2)}</span>
                            </div>
                          </div>
                          <Progress value={combo.confidence} className="mt-2" />
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Combos de Produtos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Combos de Produtos Mais Populares
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-4">
                    {analytics.productCombos.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <p>Nenhum combo de produtos identificado</p>
                        <p className="text-xs mt-2">
                          {loading ? 'Carregando...' : 'Vendas analisadas: ' + (analytics.clientPatterns?.length || 0)}
                        </p>
                      </div>
                    ) : (
                      analytics.productCombos.map((combo, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{combo.items.join(' + ')}</h4>
                            <Badge variant="outline">
                              {Math.round(combo.confidence)}%
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Frequência:</span>
                              <span className="ml-1 font-medium">{combo.frequency}x</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Receita:</span>
                              <span className="ml-1 font-medium">R$ {combo.revenue.toFixed(2)}</span>
                            </div>
                          </div>
                          <Progress value={combo.confidence} className="mt-2" />
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Oportunidades de Cross-sell
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {analytics.crossSellOpportunities.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma oportunidade de cross-sell identificada
                    </p>
                  ) : (
                    analytics.crossSellOpportunities.map((opp, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {opp.baseItemType === 'service' ? (
                              <Scissors className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Package className="h-4 w-4 text-green-500" />
                            )}
                            <span className="font-medium">{opp.baseItem}</span>
                            <span className="text-muted-foreground">→</span>
                            {opp.suggestedItemType === 'service' ? (
                              <Scissors className="h-4 w-4 text-blue-500" />
                            ) : (
                              <Package className="h-4 w-4 text-green-500" />
                            )}
                            <span className="font-medium">{opp.suggestedItem}</span>
                          </div>
                          <Badge variant="outline">
                            {Math.round(opp.confidence)}%
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Frequência:</span>
                            <span className="ml-1 font-medium">{opp.frequency}x</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Receita Pot.:</span>
                            <span className="ml-1 font-medium">R$ {opp.potentialRevenue.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Confiança:</span>
                            <span className="ml-1 font-medium">{Math.round(opp.confidence)}%</span>
                          </div>
                        </div>
                        <Progress value={opp.confidence} className="mt-2" />
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Padrões de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {analytics.clientPatterns.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum padrão de cliente identificado
                    </p>
                  ) : (
                    analytics.clientPatterns.map((client, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-yellow-500" />
                            <span className="font-medium">{client.clientName}</span>
                          </div>
                          <Badge variant={getChurnRiskVariant(client.churnRisk)}>
                            Risco: {client.churnRisk}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">LTV:</span>
                            <p className="font-medium">R$ {client.lifetimeValue.toFixed(2)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Ticket Médio:</span>
                            <p className="font-medium">R$ {client.averageTicket.toFixed(2)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Frequência:</span>
                            <p className="font-medium">{client.frequencyDays} dias</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Última Compra:</span>
                            <p className="font-medium">
                              {client.lastPurchaseDate.toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {(client.preferredServices.length > 0 || client.preferredProducts.length > 0) && (
                          <div className="mt-3 pt-3 border-t">
                            {client.preferredServices.length > 0 && (
                              <div className="mb-2">
                                <span className="text-sm text-muted-foreground">Serviços Preferidos:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {client.preferredServices.slice(0, 3).map((service, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {service}
                                    </Badge>
                                  ))}
                                  {client.preferredServices.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{client.preferredServices.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {client.preferredProducts.length > 0 && (
                              <div>
                                <span className="text-sm text-muted-foreground">Produtos Preferidos:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {client.preferredProducts.slice(0, 3).map((product, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {product}
                                    </Badge>
                                  ))}
                                  {client.preferredProducts.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{client.preferredProducts.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Serviços */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="h-5 w-5" />
                  Top Serviços por Receita
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-3">
                    {analytics.topPerformingServices.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum dado de serviços disponível
                      </p>
                    ) : (
                      analytics.topPerformingServices.map((service, index) => (
                        <div key={service.id} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">#{index + 1}</Badge>
                            <div>
                              <p className="font-medium">{service.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {service.quantity} vendas
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              R$ {service.revenue.toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              R$ {service.averagePrice.toFixed(2)} médio
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Top Produtos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Top Produtos por Receita
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80">
                  <div className="space-y-3">
                    {analytics.topPerformingProducts.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum dado de produtos disponível
                      </p>
                    ) : (
                      analytics.topPerformingProducts.map((product, index) => (
                        <div key={product.id} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">#{index + 1}</Badge>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {product.quantity} vendas
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              R$ {product.revenue.toFixed(2)}
                            </p>
                            <div className="text-sm text-muted-foreground">
                              <span>R$ {product.averagePrice.toFixed(2)} médio</span>
                              <span className="ml-2">
                                {product.profitMargin.toFixed(1)}% margem
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};