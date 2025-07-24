import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface OpenCashModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (openingBalance?: number) => Promise<string | null>;
}

export const OpenCashModal = ({ open, onOpenChange, onConfirm }: OpenCashModalProps) => {
  const [openingBalance, setOpeningBalance] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const balance = parseFloat(openingBalance) || 0;
    if (balance < 0) {
      toast({
        title: "Valor inválido",
        description: "O valor inicial não pode ser negativo",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await onConfirm(balance);
      if (result) {
        setOpeningBalance("");
        onOpenChange(false);
        toast({
          title: "Caixa aberto",
          description: "Caixa aberto com sucesso!",
        });
      }
    } catch (error) {
      console.error("Erro ao abrir caixa:", error);
      toast({
        title: "Erro ao abrir caixa",
        description: "Não foi possível abrir o caixa. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Abrir Caixa</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openingBalance">Valor inicial do caixa</Label>
            <Input
              id="openingBalance"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Abrindo..." : "Abrir Caixa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};