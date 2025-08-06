import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClientReviews } from '@/hooks/useClientReviews';
import { StatCard } from '@/components/ui/stat-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Star, 
  TrendingUp, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Minus,
  Search,
  Trash2,
  Copy,
  RefreshCw,
  Users
} from 'lucide-react';
import { useBarbershopSlug } from '@/hooks/useBarbershopSlug';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const ReviewsManagement: React.FC = () => {
  const { reviews, metrics, providers, loading, deleteReview, refetch } = useClientReviews();
  const { slug, loading: slugLoading } = useBarbershopSlug();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.barber_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.review_text?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProvider = selectedProvider === 'all' || 
      (selectedProvider === 'unspecified' && !review.barber_id) ||
      review.barber_id === selectedProvider;
    
    return matchesSearch && matchesProvider;
  });

  const getNPSCategory = (score: number) => {
    if (score >= 9) return { label: 'Promotor', color: 'bg-green-500', icon: ThumbsUp };
    if (score >= 7) return { label: 'Neutro', color: 'bg-yellow-500', icon: Minus };
    return { label: 'Detrator', color: 'bg-red-500', icon: ThumbsDown };
  };

  const getStarRating = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  const handleCopyReviewLink = async () => {
    if (!slug) {
      toast({
        title: "Erro",
        description: "Não foi possível gerar o link de avaliação",
        variant: "destructive",
      });
      return;
    }

    const reviewLink = `${window.location.origin}/review/${slug}`;
    
    try {
      await navigator.clipboard.writeText(reviewLink);
      toast({
        title: "Link copiado!",
        description: "O link de avaliação foi copiado para a área de transferência",
      });
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas Resumo */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total de Avaliações"
            value={metrics.totalReviews}
            subtitle="avaliações coletadas"
            icon={MessageSquare}
            format="number"
          />
          <StatCard
            title="NPS Médio"
            value={metrics.averageNPS}
            subtitle="nota média (0-10)"
            icon={TrendingUp}
            format="rating"
          />
          <StatCard
            title="Estrelas Médias"
            value={metrics.averageRating}
            subtitle="classificação média"
            icon={Star}
            format="rating"
          />
          <StatCard
            title="Promotores"
            value={metrics.npsDistribution.promoters}
            subtitle={`${metrics.npsDistribution.passives} neutros, ${metrics.npsDistribution.detractors} detratores`}
            icon={ThumbsUp}
            format="number"
          />
        </div>
      )}

      {/* Ações e Filtros */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <div className="flex flex-1 gap-4 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar avaliações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por prestador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Todos os prestadores
                </div>
              </SelectItem>
              <SelectItem value="unspecified">
                <div className="flex items-center text-muted-foreground">
                  <Minus className="w-4 h-4 mr-2" />
                  Não me lembro
                </div>
              </SelectItem>
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-primary mr-2" />
                    {provider.full_name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({provider.role === 'admin' ? 'Admin' : 
                        provider.role === 'receptionist' ? 'Recepcionista' : 'Barbeiro'})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={refetch}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            variant="outline"
            onClick={handleCopyReviewLink}
            disabled={slugLoading || !slug}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copiar Link
          </Button>
        </div>
      </div>

      {/* Lista de Avaliações */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Todas ({reviews.length})</TabsTrigger>
          <TabsTrigger value="promoters">
            Promotores ({metrics?.npsDistribution.promoters || 0})
          </TabsTrigger>
          <TabsTrigger value="passives">
            Neutros ({metrics?.npsDistribution.passives || 0})
          </TabsTrigger>
          <TabsTrigger value="detractors">
            Detratores ({metrics?.npsDistribution.detractors || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredReviews.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'Nenhuma avaliação encontrada' : 'Nenhuma avaliação ainda'}
                </p>
                {!searchTerm && (
                  <p className="text-sm text-muted-foreground mt-2">
                    As avaliações aparecerão aqui conforme forem coletadas
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredReviews.map((review) => {
                const npsCategory = getNPSCategory(review.nps_score);
                const CategoryIcon = npsCategory.icon;

                return (
                  <Card key={review.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-base">
                            {review.client_name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Atendido por {review.barber_name} • {' '}
                            {format(new Date(review.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${npsCategory.color} text-white`}>
                            <CategoryIcon className="w-3 h-3 mr-1" />
                            {npsCategory.label}
                          </Badge>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover avaliação</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja remover esta avaliação? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteReview(review.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {review.nps_score}
                            </div>
                            <div className="text-xs text-muted-foreground">NPS</div>
                          </div>
                          {review.star_rating && (
                            <div className="text-center">
                              {getStarRating(review.star_rating)}
                              <div className="text-xs text-muted-foreground mt-1">
                                {review.star_rating}/5 estrelas
                              </div>
                            </div>
                          )}
                        </div>
                        {review.review_text && (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm italic">"{review.review_text}"</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Filtros por categoria NPS */}
        {['promoters', 'passives', 'detractors'].map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            {filteredReviews
              .filter((review) => {
                if (category === 'promoters') return review.nps_score >= 9;
                if (category === 'passives') return review.nps_score >= 7 && review.nps_score <= 8;
                return review.nps_score <= 6;
              })
              .map((review) => {
                const npsCategory = getNPSCategory(review.nps_score);
                const CategoryIcon = npsCategory.icon;

                return (
                  <Card key={review.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-base">
                            {review.client_name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Atendido por {review.barber_name} • {' '}
                            {format(new Date(review.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${npsCategory.color} text-white`}>
                            <CategoryIcon className="w-3 h-3 mr-1" />
                            {npsCategory.label}
                          </Badge>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover avaliação</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja remover esta avaliação? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteReview(review.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {review.nps_score}
                            </div>
                            <div className="text-xs text-muted-foreground">NPS</div>
                          </div>
                          {review.star_rating && (
                            <div className="text-center">
                              {getStarRating(review.star_rating)}
                              <div className="text-xs text-muted-foreground mt-1">
                                {review.star_rating}/5 estrelas
                              </div>
                            </div>
                          )}
                        </div>
                        {review.review_text && (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm italic">"{review.review_text}"</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ReviewsManagement;