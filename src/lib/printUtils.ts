export const printReceipt = (receiptElement: HTMLElement) => {
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Não foi possível abrir a janela de impressão. Verifique se o bloqueador de pop-ups está desabilitado.');
    return;
  }

  const receiptContent = receiptElement.outerHTML;
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Cupom - Comanda</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: 'Courier New', monospace;
          }
          ${receiptElement.querySelector('style')?.innerHTML || ''}
        </style>
      </head>
      <body>
        ${receiptContent}
      </body>
    </html>
  `);
  
  printWindow.document.close();
  
  // Aguardar o carregamento do conteúdo antes de imprimir
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

export const printReceiptDirectly = () => {
  window.print();
};