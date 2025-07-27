import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

interface CompactCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export const CompactCalendar = ({ selectedDate, onDateSelect }: CompactCalendarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' 
      ? subDays(selectedDate, 1) 
      : addDays(selectedDate, 1);
    onDateSelect(newDate);
  };

  const goToToday = () => {
    onDateSelect(new Date());
  };

  return (
    <div className="flex items-center gap-2 bg-card border rounded-lg p-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigateDate('prev')}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-8 justify-start text-left font-normal min-w-[200px]"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(selectedDate, "EEEE, dd/MM/yyyy", { locale: ptBR })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                onDateSelect(date);
                setIsOpen(false);
              }
            }}
            initialFocus
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="sm"
        onClick={() => navigateDate('next')}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={goToToday}
        className="h-8 px-3"
      >
        Hoje
      </Button>
    </div>
  );
};