import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface ClientReview {
  id: string;
  client_id: string;
  barbershop_id: string;
  barber_id: string;
  appointment_id?: string;
  nps_score: number;
  rating_stars?: number;
  review_text?: string;
  review_type: string;
  created_at: string;
  updated_at: string;
  // Joined data
  client_name?: string;
  barber_name?: string;
}

export interface ReviewMetrics {
  totalReviews: number;
  averageNPS: number;
  averageRating: number;
  npsDistribution: {
    promoters: number;
    passives: number;
    detractors: number;
  };
  monthlyTrend: Array<{
    month: string;
    average: number;
    count: number;
  }>;
}

export const useClientReviews = () => {
  const { profile } = useAuth();
  const [reviews, setReviews] = useState<ClientReview[]>([]);
  const [metrics, setMetrics] = useState<ReviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    if (!profile?.barbershop_id) return;

    try {
      setLoading(true);
      
      // Query reviews with joins using generic typing
      const { data, error } = await supabase
        .from('client_reviews' as any)
        .select(`
          *,
          clients!inner(name),
          profiles!inner(full_name)
        `)
        .eq('barbershop_id', profile.barbershop_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reviewsWithNames = data?.map((review: any) => ({
        ...review,
        client_name: review.clients?.name || 'Cliente',
        barber_name: review.profiles?.full_name || 'Barbeiro'
      })) || [];

      setReviews(reviewsWithNames);
      await calculateMetrics(reviewsWithNames);
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar avaliações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = async (reviewData: ClientReview[]) => {
    if (reviewData.length === 0) {
      setMetrics({
        totalReviews: 0,
        averageNPS: 0,
        averageRating: 0,
        npsDistribution: { promoters: 0, passives: 0, detractors: 0 },
        monthlyTrend: []
      });
      return;
    }

    // Calculate NPS distribution
    const promoters = reviewData.filter(r => r.nps_score >= 9).length;
    const passives = reviewData.filter(r => r.nps_score >= 7 && r.nps_score <= 8).length;
    const detractors = reviewData.filter(r => r.nps_score <= 6).length;

    // Calculate averages
    const averageNPS = reviewData.reduce((sum, r) => sum + r.nps_score, 0) / reviewData.length;
    const ratingsWithStars = reviewData.filter(r => r.rating_stars);
    const averageRating = ratingsWithStars.length > 0 
      ? ratingsWithStars.reduce((sum, r) => sum + (r.rating_stars || 0), 0) / ratingsWithStars.length 
      : 0;

    // Calculate monthly trend (last 6 months)
    const monthlyData: { [key: string]: { total: number; count: number } } = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    reviewData
      .filter(r => new Date(r.created_at) >= sixMonthsAgo)
      .forEach(review => {
        const monthKey = new Date(review.created_at).toISOString().slice(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { total: 0, count: 0 };
        }
        monthlyData[monthKey].total += review.nps_score;
        monthlyData[monthKey].count++;
      });

    const monthlyTrend = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        average: data.total / data.count,
        count: data.count
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    setMetrics({
      totalReviews: reviewData.length,
      averageNPS,
      averageRating,
      npsDistribution: { promoters, passives, detractors },
      monthlyTrend
    });
  };

  const addReview = async (reviewData: Omit<ClientReview, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('client_reviews' as any)
        .insert([reviewData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Avaliação registrada com sucesso!",
      });

      await fetchReviews(); // Refresh data
      return data;
    } catch (error) {
      console.error('Erro ao adicionar avaliação:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar avaliação.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('client_reviews' as any)
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Avaliação removida com sucesso!",
      });

      await fetchReviews(); // Refresh data
    } catch (error) {
      console.error('Erro ao remover avaliação:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover avaliação.",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (profile?.barbershop_id) {
      fetchReviews();
    }
  }, [profile?.barbershop_id]);

  return {
    reviews,
    metrics,
    loading,
    addReview,
    deleteReview,
    refetch: fetchReviews
  };
};