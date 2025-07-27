import { formatCurrency } from "@/lib/utils";

interface ReceiptTemplateProps {
  command: any;
  barbershop: any;
  paymentMethod: string;
  discount?: number;
  notes?: string;
}

export const ReceiptTemplate = ({ 
  command, 
  barbershop, 
  paymentMethod, 
  discount = 0, 
  notes 
}: ReceiptTemplateProps) => {
  const total = command.total_amount || 0;
  const discountAmount = (total * discount) / 100;
  const finalAmount = total - discountAmount;

  return (
    <div className="receipt-template max-w-sm mx-auto p-4 font-mono text-sm bg-white text-black">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-template, .receipt-template * {
            visibility: visible;
          }
          .receipt-template {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: none;
            margin: 0;
            padding: 10px;
            background: white !important;
            color: black !important;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>
      
      <div className="text-center mb-4">
        <h2 className="font-bold text-lg">{barbershop?.name || "BARBEARIA"}</h2>
        {barbershop?.address && <p className="text-xs">{barbershop.address}</p>}
        {barbershop?.phone && <p className="text-xs">Tel: {barbershop.phone}</p>}
        <div className="border-t border-dashed border-gray-400 my-2"></div>
        <p className="text-xs">CUPOM NÃO FISCAL</p>
      </div>

      <div className="mb-4">
        <p><strong>Comanda:</strong> #{command.command_number}</p>
        <p><strong>Data:</strong> {new Date(command.created_at).toLocaleString('pt-BR')}</p>
        {command.client?.name && <p><strong>Cliente:</strong> {command.client.name}</p>}
        {command.barber?.full_name && <p><strong>Profissional:</strong> {command.barber.full_name}</p>}
      </div>

      <div className="border-t border-dashed border-gray-400 my-2"></div>

      <div className="mb-4">
        <p className="font-bold mb-2">ITENS:</p>
        {command.command_items?.map((item: any, index: number) => (
          <div key={index} className="flex justify-between mb-1">
            <div className="flex-1">
              <p className="text-xs">{item.service?.name || item.product?.name}</p>
              <p className="text-xs text-gray-600">
                {item.quantity}x {formatCurrency(item.unit_price)}
              </p>
            </div>
            <p className="text-xs">{formatCurrency(item.quantity * item.unit_price)}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-gray-400 my-2"></div>

      <div className="mb-4">
        <div className="flex justify-between">
          <p>Subtotal:</p>
          <p>{formatCurrency(total)}</p>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <p>Desconto ({discount}%):</p>
            <p>-{formatCurrency(discountAmount)}</p>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg border-t border-dashed border-gray-400 pt-1">
          <p>TOTAL:</p>
          <p>{formatCurrency(finalAmount)}</p>
        </div>
      </div>

      <div className="mb-4">
        <p><strong>Forma de Pagamento:</strong> {paymentMethod}</p>
        {notes && (
          <div className="mt-2">
            <p><strong>Observações:</strong></p>
            <p className="text-xs">{notes}</p>
          </div>
        )}
      </div>

      <div className="text-center mt-4 text-xs">
        <div className="border-t border-dashed border-gray-400 mb-2"></div>
        <p>Obrigado pela preferência!</p>
        <p>Volte sempre!</p>
      </div>
    </div>
  );
};