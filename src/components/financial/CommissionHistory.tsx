import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CommissionData } from "@/hooks/useFinancialData";

interface CommissionHistoryProps {
  commissions: CommissionData[];
  showBarberColumn?: boolean;
  compact?: boolean;
}

export default function CommissionHistory({ 
  commissions, 
  showBarberColumn = true,
  compact = false 
}: CommissionHistoryProps) {
  if (commissions.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Nenhuma comissão encontrada no período selecionado.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            {showBarberColumn && <TableHead>Barbeiro</TableHead>}
            <TableHead>Cliente</TableHead>
            <TableHead>Valor da Venda</TableHead>
            <TableHead>Comissão</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {commissions.slice(0, compact ? 5 : commissions.length).map((commission) => (
            <TableRow key={commission.id}>
              <TableCell>
                {format(new Date(commission.commission_date), 'dd/MM/yyyy', { locale: ptBR })}
              </TableCell>
              {showBarberColumn && (
                <TableCell>{commission.barber.full_name}</TableCell>
              )}
              <TableCell>{commission.sale.client.name}</TableCell>
              <TableCell>
                R$ {Number(commission.sale.final_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  R$ {Number(commission.commission_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}