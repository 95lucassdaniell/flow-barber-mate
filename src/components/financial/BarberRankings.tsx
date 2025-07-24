import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Crown, Medal, Award } from "lucide-react";
import type { BarberRanking } from "@/hooks/useFinancialData";

interface BarberRankingsProps {
  rankings: BarberRanking[];
}

export default function BarberRankings({ rankings }: BarberRankingsProps) {
  if (rankings.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Nenhum dado encontrado no período selecionado.
      </div>
    );
  }

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return <span className="text-sm font-medium">{position}º</span>;
    }
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Pos.</TableHead>
            <TableHead>Barbeiro</TableHead>
            <TableHead>Vendas</TableHead>
            <TableHead>Comissões</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rankings.map((barber, index) => (
            <TableRow key={barber.id}>
              <TableCell className="text-center">
                {getRankIcon(index + 1)}
              </TableCell>
              <TableCell className="font-medium">{barber.full_name}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {barber.salesCount} vendas
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  R$ {barber.totalCommissions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}