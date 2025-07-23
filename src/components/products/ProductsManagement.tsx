import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/hooks/useProducts';
import { ProductsList } from './ProductsList';
import { 
  Package, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp,
  ShoppingCart,
  BarChart3
} from 'lucide-react';

export const ProductsManagement = () => {
  const { data: products = [] } = useProducts();

  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.is_active).length;
  const lowStockProducts = products.filter(p => p.stock_quantity <= p.min_stock_alert).length;
  
  const totalStockValue = products.reduce((total, product) => {
    return total + (product.cost_price * product.stock_quantity);
  }, 0);

  const averageMargin = products.length > 0 
    ? products.reduce((total, product) => {
        if (product.cost_price > 0 && product.selling_price > 0) {
          const margin = ((product.selling_price - product.cost_price) / product.selling_price) * 100;
          return total + margin;
        }
        return total;
      }, 0) / products.length
    : 0;

  const topCategories = products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(topCategories)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {activeProducts} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockProducts}</div>
            <p className="text-xs text-muted-foreground">
              produtos precisam reposição
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor do Estoque</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalStockValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              valor total investido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {averageMargin.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              margem de lucro média
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Insights e Alertas */}
      {(lowStockProducts > 0 || sortedCategories.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alertas de Estoque */}
          {lowStockProducts > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Alertas de Estoque
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {products
                    .filter(p => p.stock_quantity <= p.min_stock_alert)
                    .slice(0, 5)
                    .map((product) => (
                      <div key={product.id} className="flex justify-between items-center p-2 bg-orange-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.category}</p>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          {product.stock_quantity} restantes
                        </Badge>
                      </div>
                    ))}
                  {lowStockProducts > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      +{lowStockProducts - 5} produtos com estoque baixo
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Categorias */}
          {sortedCategories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Principais Categorias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sortedCategories.map(([category, count]) => (
                    <div key={category} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </span>
                      </div>
                      <Badge variant="secondary">{count} produtos</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Lista de Produtos */}
      <ProductsList />
    </div>
  );
};