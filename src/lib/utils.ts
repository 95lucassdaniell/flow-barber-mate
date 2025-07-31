import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Schedule constants - Google Calendar style
export const MINUTES_PER_HOUR = 60;
export const PIXELS_PER_HOUR = 60; // 1 hora = 60px
export const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / MINUTES_PER_HOUR; // 1px por minuto
export const HOUR_LINE_HEIGHT = PIXELS_PER_HOUR;

// Schedule utility functions
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToPixels(minutes: number): number {
  return minutes * PIXELS_PER_MINUTE;
}

export function calculateAppointmentTop(startTime: string, dayStartTime: string): number {
  const startMinutes = parseTimeToMinutes(startTime);
  const dayStartMinutes = parseTimeToMinutes(dayStartTime);
  return minutesToPixels(startMinutes - dayStartMinutes);
}

export function calculateAppointmentHeight(startTime: string, endTime: string): number {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  return minutesToPixels(endMinutes - startMinutes);
}

export function generateTimeSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  
  for (let minutes = startMinutes; minutes < endMinutes; minutes += 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    slots.push(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);
  }
  
  return slots;
}

export function isTimeInRange(checkTime: string, startTime: string, endTime: string): boolean {
  const checkMinutes = parseTimeToMinutes(checkTime);
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  
  return checkMinutes >= startMinutes && checkMinutes < endMinutes;
}
