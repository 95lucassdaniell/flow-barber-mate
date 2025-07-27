import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpRight, ArrowDownRight, DollarSign } from "lucide-react";
import { useCashMovements } from "@/hooks/useCashMovements";
import { useToast } from "@/hooks/use-toast";

interface AddCashMovementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddCashMovementModal = ({ open, onOpenChange }: AddCashMovementModalProps) => {
  const [type, setType] = useState<'entry' | 'exit'>('entry');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { addMovement } = useCashMovements();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim() || !amount) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a descrição e o valor.",
        variant: "destructive",
      });
      return;
    }

    const amountValue = parseFloat(amount);
    if (amountValue <= 0) {
      toast({
        title: "Valor inválido",
        description: "O valor deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const success = await addMovement({
        type,
        description: description.trim(),
        amount: amountValue,
        notes: notes.trim() || undefined,
      });

      if (success) {
        // Reset form
        setType('entry');
        setDescription('');
        setAmount('');
        setNotes('');
        onOpenChange(false);
        
        toast({
          title: "Movimentação registrada",
          description: `${type === 'entry' ? 'Entrada' : 'Saída'} de R$ ${amountValue.toFixed(2)} registrada com sucesso.`,
        });
      }
    } catch (error) {
      console.error("Erro ao adicionar movimentação:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
      // Reset form when closing
      setType('entry');
      setDescription('');
      setAmount('');
      setNotes('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Nova Movimentação de Caixa
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Movimentação</Label>
            <Select value={type} onValueChange={(value: 'entry' | 'exit') => setType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entry">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                    Entrada
                  </div>
                </SelectItem>
                <SelectItem value="exit">
                  <div className="flex items-center gap-2">
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                    Saída
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição <span className="text-red-500">*</span></Label>
            <Input
              id="description"
              placeholder="Ex: Compra de material, troco, sangria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor <span className="text-red-500">*</span></Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Informações adicionais sobre a movimentação..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="min-w-[100px]"
            >
              {isLoading ? "Salvando..." : "Registrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};