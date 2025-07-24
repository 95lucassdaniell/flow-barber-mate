import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

interface OpeningHours {
  [key: string]: {
    open: string;
    close: string;
  };
}

interface BarbershopSettings {
  id: string;
  name: string;
  opening_hours: OpeningHours;
}

export const useBarbershopSettings = () => {
  const [settings, setSettings] = useState<BarbershopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const fetchSettings = async () => {
    if (!profile?.barbershop_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("barbershops")
        .select("id, name, opening_hours")
        .eq("id", profile.barbershop_id)
        .single();

      if (error) throw error;

      setSettings({
        ...data,
        opening_hours: data.opening_hours as OpeningHours,
      });
    } catch (error) {
      console.error("Error fetching barbershop settings:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações da barbearia",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if a time slot is in the past
  const isTimeSlotInPast = (date: Date, timeSlot: string, safetyMarginMinutes: number = 30): boolean => {
    const now = new Date();
    const appointmentDateTime = new Date(date);
    const [hours, minutes] = timeSlot.split(':').map(Number);
    appointmentDateTime.setHours(hours, minutes, 0, 0);
    
    // Add safety margin to current time
    const safetyTime = new Date(now.getTime() + safetyMarginMinutes * 60000);
    
    return appointmentDateTime <= safetyTime;
  };

  // Generate ALL time slots based on opening hours (including past ones)
  const generateAllTimeSlots = (date: Date, intervalMinutes: number = 30): string[] => {
    if (!settings?.opening_hours) return [];

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    const dayHours = settings.opening_hours[dayName];

    if (!dayHours?.open || !dayHours?.close) return [];

    const slots: string[] = [];
    const [openHour, openMinute] = dayHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = dayHours.close.split(':').map(Number);

    const startTime = openHour * 60 + openMinute; // Convert to minutes
    const endTime = closeHour * 60 + closeMinute; // Convert to minutes

    for (let time = startTime; time <= endTime - intervalMinutes; time += intervalMinutes) {
      const hours = Math.floor(time / 60);
      const minutes = time % 60;
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }

    return slots;
  };

  // Generate time slots based on opening hours (only available ones)
  const generateTimeSlots = (date: Date, intervalMinutes: number = 30): string[] => {
    return generateAllTimeSlots(date, intervalMinutes).filter(timeString => 
      !isTimeSlotInPast(date, timeString)
    );
  };

  // Check if a time slot is available for booking
  const isTimeSlotAvailable = (date: Date, timeSlot: string): boolean => {
    if (!isOpenOnDate(date)) return false;
    if (isTimeSlotInPast(date, timeSlot)) return false;
    return true;
  };

  // Check if barbershop is open on a specific date
  const isOpenOnDate = (date: Date): boolean => {
    if (!settings?.opening_hours) return false;

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    const dayHours = settings.opening_hours[dayName];

    return !!(dayHours?.open && dayHours?.close);
  };

  // Get opening hours for a specific date
  const getOpeningHoursForDate = (date: Date) => {
    if (!settings?.opening_hours) return null;

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    return settings.opening_hours[dayName] || null;
  };

  useEffect(() => {
    fetchSettings();
  }, [profile?.barbershop_id]);

  return {
    settings,
    loading,
    generateTimeSlots,
    generateAllTimeSlots,
    isOpenOnDate,
    getOpeningHoursForDate,
    isTimeSlotInPast,
    isTimeSlotAvailable,
    refetchSettings: fetchSettings,
  };
};