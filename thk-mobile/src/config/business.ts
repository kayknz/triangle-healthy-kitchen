/**
 * Centralized business logic constants to avoid duplication and hardcoding in UI components.
 */

export const BUSINESS_RULES = {
  // Time before a menu period where selections are locked (milliseconds)
  MENU_LOCK_WINDOW: 48 * 60 * 60 * 1000,

  // Default delivery windows if not specified by user
  DEFAULT_WINDOWS: {
    breakfast: '7-9 AM',
    lunch: '12-2 PM',
    dinner: '6-8 PM'
  },

  // Subscription duration calculations (in days)
  DURATIONS: {
    DAILY: 1,
    WEEKLY: 6,
    MONTHLY: 24
  },

  // Reward system
  CASHBACK_PERCENTAGE: 0.1, // 10% cash back in points
  POINTS_PER_DELIVERY: 10
};
