import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Star } from 'lucide-react';
import ClientSegments from '@/components/crm/ClientSegments';
import ReviewsManagement from '@/components/crm/ReviewsManagement';

export const ClientInsights: React.FC = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="segments" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="segments">
            <Users className="h-4 w-4 mr-2" />
            Segmentação
          </TabsTrigger>
          <TabsTrigger value="reviews">
            <Star className="h-4 w-4 mr-2" />
            Avaliações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="segments" className="space-y-6">
          <ClientSegments />
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <ReviewsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};