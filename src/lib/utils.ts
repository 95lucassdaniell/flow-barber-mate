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

// Schedule constants
export const SLOT_HEIGHT_PX = 40;
export const SLOT_DURATION_MINUTES = 15;

// Schedule utility functions
export function calculateSlotsCount(durationMinutes: number): number {
  return Math.ceil(durationMinutes / SLOT_DURATION_MINUTES);
}

export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function isTimeInRange(checkTime: string, startTime: string, endTime: string): boolean {
  const checkMinutes = parseTimeToMinutes(checkTime);
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  
  return checkMinutes >= startMinutes && checkMinutes < endMinutes;
}
