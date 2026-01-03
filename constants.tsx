
import { Category } from './types';

export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.FOOD]: '#F87171', // Red
  [Category.SHOPPING]: '#60A5FA', // Blue
  [Category.HEALTH]: '#34D399', // Green
  [Category.TRANSPORT]: '#FBBF24', // Yellow
  [Category.UTILITIES]: '#A78BFA', // Purple
  [Category.ENTERTAINMENT]: '#F472B6', // Pink
  [Category.HOUSING]: '#FB923C', // Orange
  [Category.MISC]: '#94A3B8', // Slate
};

export const CATEGORY_ICONS: Record<Category, string> = {
  [Category.FOOD]: 'fa-utensils',
  [Category.SHOPPING]: 'fa-bag-shopping',
  [Category.HEALTH]: 'fa-heart-pulse',
  [Category.TRANSPORT]: 'fa-car',
  [Category.UTILITIES]: 'fa-bolt',
  [Category.ENTERTAINMENT]: 'fa-film',
  [Category.HOUSING]: 'fa-house',
  [Category.MISC]: 'fa-ellipsis-h',
};
