import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, Package, Scissors, Star } from 'lucide-react';
import { useSalesAnalytics } from '@/hooks/useSalesAnalytics';
import { useServices } from '@/hooks/useServices';
import { useProducts } from '@/hooks/useProducts';

interface UpsellSuggestionsProps {
  currentItems: Array<{
    name: string;
    type: 'service' | 'product';
    id: string;
  }>;
  onAddItem: (item: { id: string; type: 'service' | 'product'; name: string; price: number; commission_rate: number }) => void;
}

export const UpsellSuggestions = ({ currentItems, onAddItem }: UpsellSuggestionsProps) => {
  const { getUpsellSuggestions, loading } = useSalesAnalytics();
  const { services } = useServices();
  const { data: products } = useProducts();

  if (loading || currentItems.length === 0) {
    return null;
  }

  const suggestions = getUpsellSuggestions(currentItems);

  if (suggestions.length === 0) {
    return null;
  }

  const handleAddSuggestion = (suggestion: any) => {
    if (suggestion.type === 'service') {
      const service = services.find(s => s.name === suggestion.item);
      if (service) {
        onAddItem({
          id: service.id,
          type: 'service',
          name: service.name,
          price: 0, // Preço será definido pela provider_services
          commission_rate: 50
        });
      }
    } else {
      const product = products?.find(p => p.name === suggestion.item);
      if (product) {
        onAddItem({
          id: product.id,
          type: 'product',
          name: product.name,
          price: product.selling_price,
          commission_rate: product.commission_rate || 0
        });
      }
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'text-green-600';
    if (confidence >= 50) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getConfidenceVariant = (confidence: number) => {
    if (confidence >= 70) return 'default';
    if (confidence >= 50) return 'secondary';
    return 'outline';
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Sugestões Inteligentes
          <Badge variant="secondary" className="ml-auto">
            IA
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-40">
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.item}-${suggestion.type}-${index}`}
                className="flex items-center justify-between p-3 bg-background/80 rounded-lg border"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-shrink-0">
                    {suggestion.type === 'service' ? (
                      <Scissors className="h-5 w-5 text-blue-500" />
                    ) : (
                      <Package className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{suggestion.item}</p>
                      <Badge 
                        variant={getConfidenceVariant(suggestion.confidence)}
                        className={getConfidenceColor(suggestion.confidence)}
                      >
                        <Star className="h-3 w-3 mr-1" />
                        {Math.round(suggestion.confidence)}%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {suggestion.reason}
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddSuggestion(suggestion)}
                  className="ml-2 flex-shrink-0"
                >
                  Adicionar
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Sugestões baseadas em padrões de compra dos últimos 90 dias
          </p>
        </div>
      </CardContent>
    </Card>
  );
};