import {
  TrendingUp, Laptop, BarChart3, Plus, Home, Utensils, Car, Gamepad2,
  HeartPulse, GraduationCap, Shirt, Package, Wallet, ShoppingCart,
  Coffee, Plane, Gift, Smartphone, Dumbbell, PiggyBank, CreditCard,
  Building2, Briefcase, Receipt, type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  TrendingUp, Laptop, BarChart3, Plus, Home, Utensils, Car, Gamepad2,
  HeartPulse, GraduationCap, Shirt, Package, Wallet, ShoppingCart,
  Coffee, Plane, Gift, Smartphone, Dumbbell, PiggyBank, CreditCard,
  Building2, Briefcase, Receipt,
};

export function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? Wallet;
}

export const availableIcons: string[] = [
  'TrendingUp', 'Laptop', 'BarChart3', 'Plus', 'Home', 'Utensils', 'Car', 'Gamepad2',
  'HeartPulse', 'GraduationCap', 'Shirt', 'Package', 'Wallet', 'ShoppingCart',
  'Coffee', 'Plane', 'Gift', 'Smartphone', 'Dumbbell', 'PiggyBank', 'CreditCard',
  'Building2', 'Briefcase', 'Receipt',
];

export const availableColors: string[] = [
  '#22c55e', '#16a34a', '#4ade80', '#86efac',
  '#f97316', '#f59e0b', '#3b82f6', '#ec4899',
  '#ef4444', '#8b5cf6', '#14b8a6', '#64748b',
  '#38bdf8', '#a78bfa', '#fb7185', '#facc15',
];
