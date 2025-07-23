import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ProductsManagement } from '@/components/products/ProductsManagement';

const ProductsPage = () => {
  return (
    <DashboardLayout activeTab="produtos">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
            <p className="text-muted-foreground">
              Gerencie produtos, preços e estoque da sua barbearia
            </p>
          </div>
        </div>
        
        <ProductsManagement />
      </div>
    </DashboardLayout>
  );
};

export default ProductsPage;