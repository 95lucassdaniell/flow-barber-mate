import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { useBarberSelection } from "@/hooks/useBarberSelection";

export const BarberSelector = () => {
  const { 
    barbers, 
    selectedBarberId, 
    selectedBarber,
    handleBarberChange, 
    canChangeBarber,
    loading 
  } = useBarberSelection();

  if (loading) {
    return <div className="animate-pulse h-10 bg-muted rounded-md w-48" />;
  }

  if (!canChangeBarber && selectedBarber) {
    // Barber view - show only their name
    return (
      <div className="flex items-center space-x-3">
        <Avatar className="w-8 h-8">
          <AvatarFallback>
            {selectedBarber.full_name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{selectedBarber.full_name}</p>
          <Badge variant="secondary" className="text-xs">
            Minha Agenda
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <User className="w-5 h-5 text-muted-foreground" />
      <Select value={selectedBarberId} onValueChange={handleBarberChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Selecione o barbeiro" />
        </SelectTrigger>
        <SelectContent>
          {barbers.map((barber) => (
            <SelectItem key={barber.id} value={barber.id}>
              <div className="flex items-center space-x-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs">
                    {barber.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <span>{barber.full_name}</span>
                {barber.role === 'admin' && (
                  <Badge variant="outline" className="text-xs">Admin</Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};