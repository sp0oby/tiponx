import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(timestamp: string | Date): string {
  if (!timestamp) {
    return 'unknown time';
  }

  try {
    // If timestamp is already a Date object, use it directly
    let txDate: Date;
    if (timestamp instanceof Date) {
      txDate = timestamp;
    } else {
      // Handle both ISO formats (with Z and with +00:00)
      // First try to parse directly
      txDate = new Date(timestamp);
      
      // If that fails or gives an invalid date, try manual parsing
      if (isNaN(txDate.getTime())) {
        // Try to handle +00:00 format by replacing with Z
        const normalizedTimestamp = timestamp.replace(/\+00:00$/, 'Z');
        txDate = new Date(normalizedTimestamp);
      }
    }
    
    // Check if date is valid
    if (isNaN(txDate.getTime())) {
      console.error('Invalid date:', timestamp);
      return 'unknown time';
    }

    const now = new Date();
    const diffMs = now.getTime() - txDate.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffMins < 1440) { // Less than 24 hours
      const diffHours = Math.round(diffMins / 60);
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const diffDays = Math.round(diffMins / 1440);
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    }
  } catch (error) {
    console.error('Error formatting date:', error, 'for timestamp:', timestamp);
    return 'unknown time';
  }
}
