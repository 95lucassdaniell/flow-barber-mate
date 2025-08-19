
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ScheduleBlock, ScheduleBlockInput } from '@/hooks/useScheduleBlocks';
import { Barber } from '@/types/appointment';

interface ScheduleBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (blockData: ScheduleBlockInput) => Promise<boolean>;
  block?: ScheduleBlock;
  barbers: Barber[];
  defaultDate?: Date;
  defaultTime?: string;
  defaultBarberId?: string;
}

const daysOfWeek = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
];

export const ScheduleBlockModal = ({
  isOpen,
  onClose,
  onSave,
  block,
  barbers,
  defaultDate,
  defaultTime,
  defaultBarberId
}: ScheduleBlockModalProps) => {
  // Prevent rendering when modal is closed to avoid Radix Select errors
  if (!isOpen) return null;
  const [formData, setFormData] = useState<ScheduleBlockInput>({
    provider_id: '',
    title: '',
    description: '',
    block_date: '',
    start_time: '',
    end_time: '',
    is_full_day: false,
    recurrence_type: 'none',
    days_of_week: [],
    start_date: '',
    end_date: '',
  });

  const [blockDate, setBlockDate] = useState<Date>();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (block) {
      setFormData({
        provider_id: block.provider_id || '',
        title: block.title,
        description: block.description || '',
        block_date: block.block_date || '',
        start_time: block.start_time,
        end_time: block.end_time,
        is_full_day: block.is_full_day,
        recurrence_type: block.recurrence_type,
        days_of_week: block.days_of_week || [],
        start_date: block.start_date || '',
        end_date: block.end_date || '',
      });

      if (block.block_date) setBlockDate(new Date(block.block_date));
      if (block.start_date) setStartDate(new Date(block.start_date));
      if (block.end_date) setEndDate(new Date(block.end_date));
    } else {
      // Reset form with defaults
      setFormData({
        provider_id: defaultBarberId || '',
        title: 'Bloqueio',
        description: '',
        block_date: defaultDate ? format(defaultDate, 'yyyy-MM-dd') : '',
        start_time: defaultTime || '12:00',
        end_time: defaultTime ? 
          format(new Date(`1970-01-01T${defaultTime}:00`).getTime() + 60 * 60 * 1000, 'HH:mm') : 
          '13:00',
        is_full_day: false,
        recurrence_type: 'none',
        days_of_week: [],
        start_date: '',
        end_date: '',
      });

      setBlockDate(defaultDate);
      setStartDate(undefined);
      setEndDate(undefined);
    }
  }, [block, defaultDate, defaultTime, defaultBarberId, isOpen]);

  const handleSave = async () => {
    setLoading(true);
    
    const blockData = {
      ...formData,
      provider_id: formData.provider_id || undefined,
      block_date: blockDate ? format(blockDate, 'yyyy-MM-dd') : undefined,
      start_date: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
      end_date: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
    };

    const success = await onSave(blockData);
    if (success) {
      onClose();
    }
    setLoading(false);
  };

  const handleDayToggle = (dayValue: number) => {
    const currentDays = formData.days_of_week || [];
    const newDays = currentDays.includes(dayValue)
      ? currentDays.filter(d => d !== dayValue)
      : [...currentDays, dayValue];
    
    setFormData(prev => ({ ...prev, days_of_week: newDays }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {block ? 'Editar Bloqueio' : 'Novo Bloqueio de Horário'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Almoço, Reunião, Folga"
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detalhes do bloqueio..."
            />
          </div>

          <div>
            <Label htmlFor="provider">Barbeiro</Label>
            <Select
              value={formData.provider_id || 'all'}
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                provider_id: value === 'all' ? undefined : value 
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar barbeiro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os barbeiros</SelectItem>
                {barbers
                  .filter(barber => barber.id && barber.id.trim() !== '')
                  .map((barber) => (
                    <SelectItem key={barber.id} value={barber.id}>
                      {barber.full_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="recurrence">Tipo de Bloqueio</Label>
            <Select
              value={formData.recurrence_type}
              onValueChange={(value: 'none' | 'weekly') => 
                setFormData(prev => ({ ...prev, recurrence_type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Data específica</SelectItem>
                <SelectItem value="weekly">Recorrente (semanal)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.recurrence_type === 'none' && (
            <div>
              <Label>Data do Bloqueio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {blockDate ? format(blockDate, "dd 'de' MMMM", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={blockDate}
                    onSelect={setBlockDate}
                    locale={ptBR}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {formData.recurrence_type === 'weekly' && (
            <div>
              <Label>Dias da Semana</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {daysOfWeek.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={formData.days_of_week?.includes(day.value)}
                      onCheckedChange={() => handleDayToggle(day.value)}
                    />
                    <Label htmlFor={`day-${day.value}`} className="text-sm">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {formData.recurrence_type === 'weekly' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Início (opcional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd/MM", { locale: ptBR }) : "Início"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Data Fim (opcional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd/MM", { locale: ptBR }) : "Fim"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      locale={ptBR}
                      disabled={(date) => startDate ? date < startDate : false}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="is_full_day"
              checked={formData.is_full_day}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_full_day: checked }))}
            />
            <Label htmlFor="is_full_day">Dia inteiro</Label>
          </div>

          {!formData.is_full_day && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Hora Início</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="end_time">Hora Fim</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || !formData.title}
            className="flex-1"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
