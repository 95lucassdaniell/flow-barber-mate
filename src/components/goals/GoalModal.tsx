import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useProviders } from "@/hooks/useProviders";
import { useServices } from "@/hooks/useServices";
import { useProducts } from "@/hooks/useProducts";
import { Goal, CreateGoalData } from "@/hooks/useGoalsManagement";

interface GoalModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGoalData) => void;
  initialData?: Goal | null;
}

const GoalModal = ({ open, onClose, onSubmit, initialData }: GoalModalProps) => {
  const [formData, setFormData] = useState({
    provider_id: "",
    goal_type: "",
    target_value: "",
    period_start: "",
    period_end: "",
    specific_service_id: "",
    specific_product_id: "",
  });

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [loading, setLoading] = useState(false);

  const { providers } = useProviders();
  const { services } = useServices();
  const { data: products = [] } = useProducts();

  // Filter only barbers for goals
  const barbers = providers.filter(p => p.role === 'barber' && p.is_active);

  useEffect(() => {
    if (initialData) {
      setFormData({
        provider_id: initialData.provider_id,
        goal_type: initialData.goal_type,
        target_value: initialData.target_value.toString(),
        period_start: initialData.period_start,
        period_end: initialData.period_end,
        specific_service_id: initialData.specific_service_id || "",
        specific_product_id: initialData.specific_product_id || "",
      });
      setStartDate(new Date(initialData.period_start));
      setEndDate(new Date(initialData.period_end));
    } else {
      // Reset form for new goal
      setFormData({
        provider_id: "",
        goal_type: "",
        target_value: "",
        period_start: "",
        period_end: "",
        specific_service_id: "",
        specific_product_id: "",
      });
      setStartDate(undefined);
      setEndDate(undefined);
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.provider_id || !formData.goal_type || !formData.target_value || !startDate || !endDate) {
      return;
    }

    setLoading(true);

    const goalData: CreateGoalData = {
      provider_id: formData.provider_id,
      goal_type: formData.goal_type,
      target_value: parseFloat(formData.target_value),
      period_start: format(startDate, 'yyyy-MM-dd'),
      period_end: format(endDate, 'yyyy-MM-dd'),
    };

    if (formData.specific_service_id) {
      goalData.specific_service_id = formData.specific_service_id;
    }
    if (formData.specific_product_id) {
      goalData.specific_product_id = formData.specific_product_id;
    }

    await onSubmit(goalData);
    setLoading(false);
  };

  const goalTypes = [
    { value: 'service_quantity', label: 'Quantidade de Serviços' },
    { value: 'service_value', label: 'Valor em Serviços (R$)' },
    { value: 'product_quantity', label: 'Quantidade de Produtos' },
    { value: 'product_value', label: 'Valor em Produtos (R$)' },
    { value: 'specific_service', label: 'Serviço Específico' },
    { value: 'specific_product', label: 'Produto Específico' },
  ];

  const needsSpecificService = formData.goal_type === 'specific_service';
  const needsSpecificProduct = formData.goal_type === 'specific_product';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Meta' : 'Nova Meta'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="provider">Prestador *</Label>
            <Select
              value={formData.provider_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, provider_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um prestador" />
              </SelectTrigger>
              <SelectContent>
                {barbers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Goal Type */}
          <div className="space-y-2">
            <Label htmlFor="goal_type">Tipo de Meta *</Label>
            <Select
              value={formData.goal_type}
              onValueChange={(value) => {
                setFormData(prev => ({ 
                  ...prev, 
                  goal_type: value,
                  specific_service_id: "",
                  specific_product_id: ""
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de meta" />
              </SelectTrigger>
              <SelectContent>
                {goalTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Specific Service Selection */}
          {needsSpecificService && (
            <div className="space-y-2">
              <Label htmlFor="specific_service">Serviço Específico *</Label>
              <Select
                value={formData.specific_service_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, specific_service_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Specific Product Selection */}
          {needsSpecificProduct && (
            <div className="space-y-2">
              <Label htmlFor="specific_product">Produto Específico *</Label>
              <Select
                value={formData.specific_product_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, specific_product_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Target Value */}
          <div className="space-y-2">
            <Label htmlFor="target_value">
              Valor Alvo * 
              {formData.goal_type.includes('value') && ' (R$)'}
              {formData.goal_type.includes('quantity') && ' (unidades)'}
            </Label>
            <Input
              id="target_value"
              type="number"
              step={formData.goal_type.includes('value') ? "0.01" : "1"}
              min="0"
              value={formData.target_value}
              onChange={(e) => setFormData(prev => ({ ...prev, target_value: e.target.value }))}
              placeholder={formData.goal_type.includes('value') ? "0,00" : "0"}
              required
            />
          </div>

          {/* Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data de Fim *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => !startDate || date <= startDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : initialData ? "Atualizar Meta" : "Criar Meta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GoalModal;