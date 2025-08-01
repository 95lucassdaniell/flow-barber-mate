import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Check } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
}

interface ServiceSelectionProps {
  services: Service[];
  selectedServiceId?: string;
  onSelect: (serviceId: string) => void;
}

export const ServiceSelection = ({ services, selectedServiceId, onSelect }: ServiceSelectionProps) => {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Escolha o serviço</h2>
        <p className="text-muted-foreground">Selecione o serviço que deseja</p>
      </div>

      <div className="space-y-3">
        {services.map((service) => {
          const isSelected = service.id === selectedServiceId;
          
          return (
            <Card 
              key={service.id}
              className={`cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-md'
              }`}
              onClick={() => onSelect(service.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{service.name}</h3>
                      {isSelected && (
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{service.duration_minutes} min</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {services.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhum serviço disponível no momento</p>
        </div>
      )}
    </div>
  );
};