// Triangle Healthy Kitchen nutrition and portion calculation helpers.

import { MEAL_CATEGORIES, MEAL_SELECTION_PACKAGES } from '@/types/subscription';

export interface BmrInputs {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
  fitnessGoal: 'weight_loss' | 'maintenance' | 'muscle_gain';
}

export interface CalculatedNutrition {
  bmr: number;
  tdee: number;
  recommendedCalories: number;
  recommendedProteinGrams: number;
  recommendedCarbsGrams: number;
  recommendedFatGrams: number;
  suggestedCategory: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  suggestedPackageId: string;
}

// Mifflin-St Jeor BMR & Activity Multiplier Formulas
export function calculateBmrAndTdee(inputs: BmrInputs): CalculatedNutrition {
  const { weightKg, heightCm, ageYears, gender, activityLevel, fitnessGoal } = inputs;

  let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * ageYears);
  if (gender === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    athlete: 1.9,
  };

  const activityMult = multipliers[activityLevel] || 1.375;
  const tdee = Math.round(bmr * activityMult);

  let goalAdj = 0;
  if (fitnessGoal === 'weight_loss') goalAdj = -0.20; // 20% deficit
  else if (fitnessGoal === 'muscle_gain') goalAdj = +0.15; // 15% surplus

  const recommendedCalories = Math.round(tdee * (1 + goalAdj));

  // Macro Splits (40% Protein, 35% Carbs, 25% Fat)
  const proteinCalories = recommendedCalories * 0.40;
  const carbsCalories = recommendedCalories * 0.35;
  const fatCalories = recommendedCalories * 0.25;

  const recommendedProteinGrams = Math.round(proteinCalories / 4);
  const recommendedCarbsGrams = Math.round(carbsCalories / 4);
  const recommendedFatGrams = Math.round(fatCalories / 9);

  // Determine Category A - F match
  let suggestedCategory: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' = 'A';
  if (recommendedCalories >= 2000) suggestedCategory = 'B';
  else if (recommendedCalories >= 1800) suggestedCategory = 'C';
  else if (recommendedCalories >= 1600) suggestedCategory = 'E';
  else if (recommendedCalories >= 1400) suggestedCategory = 'A';
  else if (recommendedCalories >= 1300) suggestedCategory = 'D';
  else suggestedCategory = 'F';

  // Determine Package Match
  let suggestedPackageId = '3m1s';
  if (recommendedCalories <= 1300) suggestedPackageId = '2m1s';
  else if (recommendedCalories <= 1500) suggestedPackageId = '3m';
  else if (recommendedCalories <= 1800) suggestedPackageId = '3m1s';
  else if (recommendedCalories <= 2200) suggestedPackageId = '3m2s';
  else if (recommendedCalories <= 2500) suggestedPackageId = '4m1s';
  else if (recommendedCalories <= 2800) suggestedPackageId = '4m2s';
  else suggestedPackageId = 'custom';

  return {
    bmr: Math.round(bmr),
    tdee,
    recommendedCalories,
    recommendedProteinGrams,
    recommendedCarbsGrams,
    recommendedFatGrams,
    suggestedCategory,
    suggestedPackageId,
  };
}

// Ingredient Nutrition Database (Grams per 100g cooked)
export const INGREDIENT_NUTRITION_DB: Record<string, { label: string, calories: number, protein: number, carbs: number, fat: number }> = {
  chickenBreast: { label: 'Chicken breast, cooked', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  beefCooked: { label: 'Lean beef, cooked', calories: 217, protein: 26, carbs: 0, fat: 12 },
  salmonCooked: { label: 'Salmon, cooked', calories: 208, protein: 20, carbs: 0, fat: 13 },
  shrimpCooked: { label: 'Shrimp, cooked', calories: 99, protein: 24, carbs: 0.2, fat: 0.3 },
  whiteFishCooked: { label: 'White fish, cooked', calories: 105, protein: 22, carbs: 0, fat: 1.5 },
  whiteRiceCooked: { label: 'White rice, cooked', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  bukhariRiceCooked: { label: 'Bukhari rice, cooked', calories: 165, protein: 3, carbs: 30, fat: 3 },
  couscousCooked: { label: 'Couscous, cooked', calories: 112, protein: 3.8, carbs: 23.2, fat: 0.2 },
  pastaCooked: { label: 'Pasta, cooked', calories: 158, protein: 5.8, carbs: 30.9, fat: 0.9 },
  sweetPotatoCooked: { label: 'Sweet potato, cooked', calories: 86, protein: 1.6, carbs: 20.1, fat: 0.1 },
};
