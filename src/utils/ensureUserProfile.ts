import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  barbershop_id: string;
  role: 'admin' | 'receptionist' | 'barber';
  full_name: string;
  email: string;
}

export const ensureUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    // Check if user already has a profile
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingProfile) {
      return {
        id: existingProfile.id,
        user_id: existingProfile.user_id,
        barbershop_id: existingProfile.barbershop_id,
        role: existingProfile.role as 'admin' | 'receptionist' | 'barber',
        full_name: existingProfile.full_name,
        email: existingProfile.email
      };
    }

    // Get or create test barbershop
    let { data: barbershop } = await supabase
      .from('barbershops')
      .select('*')
      .eq('slug', 'test-barbershop')
      .single();

    if (!barbershop) {
      const { data: newBarbershop, error: barbershopError } = await supabase
        .from('barbershops')
        .insert({
          name: 'Test Barbershop',
          slug: 'test-barbershop',
          status: 'active',
          created_by: userId
        })
        .select()
        .single();

      if (barbershopError) throw barbershopError;
      barbershop = newBarbershop;
    }

    // Create admin profile for current user
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        barbershop_id: barbershop.id,
        role: 'admin' as const,
        full_name: 'Test Admin',
        email: 'admin@test.com'
      })
      .select()
      .single();

    if (profileError) throw profileError;

    return {
      id: newProfile.id,
      user_id: newProfile.user_id,
      barbershop_id: newProfile.barbershop_id,
      role: newProfile.role as 'admin' | 'receptionist' | 'barber',
      full_name: newProfile.full_name,
      email: newProfile.email
    };
  } catch (error) {
    console.error('Error ensuring user profile:', error);
    return null;
  }
};