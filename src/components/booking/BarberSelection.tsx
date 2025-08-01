import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Check, Star } from 'lucide-react';

interface Provider {
  id: string;
  full_name: string;
}

interface BarberSelectionProps {
  providers: Provider[];
  selectedBarberId?: string;
  serviceId: string;
  onSelect: (barberId: string) => void;
  getServicePrice: (serviceId: string, providerId?: string) => number;
}

export const BarberSelection = ({ 
  providers, 
  selectedBarberId, 
  serviceId,
  onSelect,
  getServicePrice 
}: BarberSelectionProps) => {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Escolha o barbeiro</h2>
        <p className="text-muted-foreground">Selecione um barbeiro ou deixe qualquer um atender</p>
      </div>

      <div className="space-y-3">
        {/* Any barber option */}
        <Card 
          className={`cursor-pointer transition-all ${
            selectedBarberId === 'any' ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-md'
          }`}
          onClick={() => onSelect('any')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Qualquer barbeiro</h3>
                  <p className="text-sm text-muted-foreground">Próximo disponível</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  R$ {getServicePrice(serviceId).toFixed(2)}
                </Badge>
                {selectedBarberId === 'any' && (
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Individual barbers */}
        {providers.map((provider) => {
          const isSelected = provider.id === selectedBarberId;
          const price = getServicePrice(serviceId, provider.id);
          
          return (
            <Card 
              key={provider.id}
              className={`cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-md'
              }`}
              onClick={() => onSelect(provider.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{provider.full_name}</h3>
                      <p className="text-sm text-muted-foreground">Barbeiro</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      R$ {price.toFixed(2)}
                    </Badge>
                    {isSelected && (
                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {providers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhum barbeiro disponível para este serviço</p>
        </div>
      )}
    </div>
  );
};