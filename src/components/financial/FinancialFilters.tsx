import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, Download } from "lucide-react";
import { format } from "date-fns";
import { useProviders } from "@/hooks/useProviders";

interface FinancialFiltersProps {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  onDateRangeChange: (range: { startDate: string; endDate: string }) => void;
  selectedBarber?: string;
  onBarberChange?: (barberId: string) => void;
  showBarberFilter?: boolean;
}

export default function FinancialFilters({
  dateRange,
  onDateRangeChange,
  selectedBarber,
  onBarberChange,
  showBarberFilter = true,
}: FinancialFiltersProps) {
  const { providers } = useProviders();

  const handleQuickFilter = (days: number) => {
    const endDate = format(new Date(), 'yyyy-MM-dd');
    const startDate = format(new Date(Date.now() - days * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
    onDateRangeChange({ startDate, endDate });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="grid gap-2">
            <Label htmlFor="start-date">Data Inicial</Label>
            <Input
              id="start-date"
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                onDateRangeChange({ ...dateRange, startDate: e.target.value })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="end-date">Data Final</Label>
            <Input
              id="end-date"
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                onDateRangeChange({ ...dateRange, endDate: e.target.value })
              }
            />
          </div>

          {showBarberFilter && (
            <div className="grid gap-2">
              <Label>Barbeiro</Label>
              <Select value={selectedBarber || "all"} onValueChange={(value) => onBarberChange?.(value === "all" ? "" : value)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todos os barbeiros" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os barbeiros</SelectItem>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter(7)}
            >
              7 dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter(30)}
            >
              30 dias
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter(90)}
            >
              90 dias
            </Button>
          </div>

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}