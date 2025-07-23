import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ProviderServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: {
    id: string;
    full_name: string;
  } | null;
}

const ProviderServicesModal = ({ isOpen, onClose, provider }: ProviderServicesModalProps) => {
  if (!provider) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar Serviços - {provider.full_name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p>Funcionalidade em desenvolvimento...</p>
          <p>Aqui você poderá configurar os preços dos serviços para este prestador.</p>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProviderServicesModal;