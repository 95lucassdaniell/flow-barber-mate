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
  const isTimeSlotInPast = (date: Date, timeSlot: string, safetyMarginMinutes: number = 2): boolean => {
    // Create dates in local timezone to avoid UTC confusion
    const now = new Date();
    const [hours, minutes] = timeSlot.split(':').map(Number);
    
    // Create appointment date in local timezone
    const appointmentDateTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hours,
      minutes,
      0,
      0
    );
    
    // For today, use minimal safety margin (2 minutes)
    // For future dates, no safety margin needed
    const isToday = date.toDateString() === now.toDateString();
    const actualMargin = isToday ? safetyMarginMinutes : 0;
    
    const safetyTime = new Date(now.getTime() + actualMargin * 60000);
    const isPastTime = appointmentDateTime <= safetyTime;
    
    console.log('🕒 Time validation (LOCAL TIMEZONE):', {
      timeSlot,
      date: date.toISOString().split('T')[0],
      appointmentDateTime: appointmentDateTime.toLocaleString('pt-BR'),
      now: now.toLocaleString('pt-BR'),
      safetyTime: safetyTime.toLocaleString('pt-BR'),
      isToday,
      actualMargin,
      isPast: isPastTime,
      // Additional debug info
      appointmentTimestamp: appointmentDateTime.getTime(),
      safetyTimestamp: safetyTime.getTime(),
      timeDiffMinutes: Math.round((appointmentDateTime.getTime() - safetyTime.getTime()) / 60000)
    });
    
    return isPastTime;
  };

  // Generate ALL time slots based on opening hours (including past ones)
  const generateAllTimeSlots = (date: Date, intervalMinutes: number = 15): string[] => {
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

  // Generate time slots based on opening hours considering service duration
  const generateTimeSlots = (date: Date, intervalMinutes: number = 15, serviceDurationMinutes: number = 15): string[] => {
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

    // Generate slots ensuring service can finish before closing
    for (let time = startTime; time <= endTime - serviceDurationMinutes; time += intervalMinutes) {
      const hours = Math.floor(time / 60);
      const minutes = time % 60;
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      // Only include if not in the past
      if (!isTimeSlotInPast(date, timeString)) {
        slots.push(timeString);
      }
    }

    // Removed excessive logging for performance

    return slots;
  };

  // Check if a time slot is available for booking considering service duration
  // NOTE: This function only checks basic availability (open hours, not in past)
  // For appointment conflicts, use getAvailableTimeSlots from useAppointments
  const isTimeSlotAvailable = (date: Date, timeSlot: string, serviceDurationMinutes: number = 15): boolean => {
    console.log('🔍 isTimeSlotAvailable checking:', { 
      date: date.toISOString().split('T')[0], 
      timeSlot, 
      serviceDurationMinutes 
    });

    if (!isOpenOnDate(date)) {
      console.log('❌ Barbershop closed on this date');
      return false;
    }
    
    if (isTimeSlotInPast(date, timeSlot)) {
      console.log('❌ Time slot is in the past');
      return false;
    }

    // Check if service can finish before closing time
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()];
    const dayHours = settings?.opening_hours?.[dayName];

    if (!dayHours?.close) {
      console.log('❌ No closing time defined for this day');
      return false;
    }

    const [slotHours, slotMinutes] = timeSlot.split(':').map(Number);
    const [closeHours, closeMinutes] = dayHours.close.split(':').map(Number);
    
    const slotTimeInMinutes = slotHours * 60 + slotMinutes;
    const closeTimeInMinutes = closeHours * 60 + closeMinutes;
    const serviceEndTime = slotTimeInMinutes + serviceDurationMinutes;

    const canFinishBeforeClosing = serviceEndTime <= closeTimeInMinutes;

    if (!canFinishBeforeClosing) {
      console.log('❌ Service cannot finish before closing time:', {
        slotTime: timeSlot,
        serviceEndTime: `${Math.floor(serviceEndTime / 60)}:${(serviceEndTime % 60).toString().padStart(2, '0')}`,
        closingTime: dayHours.close
      });
      return false;
    }

    console.log('✅ Time slot is available (basic check only - no appointment conflicts checked)');
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