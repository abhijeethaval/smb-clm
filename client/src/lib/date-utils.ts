/**
 * Format a date in a human-readable format
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
};

/**
 * Format a date with time in a human-readable format
 */
export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return "—";
  return new Date(date).toLocaleString();
};

/**
 * Calculate days until a date
 */
export const daysUntil = (date: string | Date | null | undefined): number | null => {
  if (!date) return null;
  
  const targetDate = new Date(date);
  const today = new Date();
  
  // Reset time component for accurate day calculation
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Check if a date is in the past
 */
export const isDatePast = (date: string | Date | null | undefined): boolean => {
  if (!date) return false;
  
  const targetDate = new Date(date);
  const today = new Date();
  
  // Reset time component for accurate comparison
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  
  return targetDate < today;
};

/**
 * Format a relative time string (e.g., "2 days ago", "in 3 days")
 */
export const formatRelativeTime = (date: string | Date | null | undefined): string => {
  if (!date) return "—";
  
  const targetDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - targetDate.getTime();
  const diffSecs = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffSecs / 60);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);
  
  if (diffSecs < 60) {
    return "Just now";
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(date);
  }
};

/**
 * Calculate if a contract is expiring soon (within 30 days)
 */
export const isExpiringSoon = (date: string | Date | null | undefined): boolean => {
  if (!date) return false;
  
  const days = daysUntil(date);
  return days !== null && days > 0 && days <= 30;
};
