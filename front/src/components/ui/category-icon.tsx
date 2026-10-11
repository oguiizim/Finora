import {
  Briefcase,
  Car,
  Coffee,
  Dumbbell,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Plane,
  Repeat,
  ShoppingBag,
  Smartphone,
  Tag,
  TrendingUp,
  Utensils,
  Wallet,
  Wrench,
} from 'lucide-react';
import type React from 'react';

export const CATEGORY_ICON_OPTIONS = [
  { value: 'utensils', label: 'Alimentação' },
  { value: 'car', label: 'Transporte' },
  { value: 'home', label: 'Moradia' },
  { value: 'gamepad-2', label: 'Lazer' },
  { value: 'shopping-bag', label: 'Compras' },
  { value: 'repeat', label: 'Assinaturas' },
  { value: 'graduation-cap', label: 'Educação' },
  { value: 'heart-pulse', label: 'Saúde' },
  { value: 'wallet', label: 'Salário / Carteira' },
  { value: 'briefcase', label: 'Trabalho / Freelance' },
  { value: 'trending-up', label: 'Rendimentos' },
  { value: 'coffee', label: 'Café / Padaria' },
  { value: 'smartphone', label: 'Tecnologia' },
  { value: 'plane', label: 'Viagens' },
  { value: 'dumbbell', label: 'Esporte' },
  { value: 'gift', label: 'Presentes' },
  { value: 'wrench', label: 'Manutenção' },
  { value: 'tag', label: 'Outros' },
] as const;

export const CATEGORY_COLOR_PALETTE = [
  '#f59e0b', // Amber
  '#eab308', // Yellow
  '#22c55e', // Green
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f97316', // Orange
  '#ef4444', // Red
  '#94a3b8', // Slate
] as const;

export function CategoryIcon({
  name,
  className = 'w-4 h-4',
  style,
}: {
  name?: string | null;
  className?: string;
  style?: React.CSSProperties;
}) {
  switch (name) {
    case 'utensils':
      return <Utensils className={className} style={style} />;
    case 'car':
      return <Car className={className} style={style} />;
    case 'home':
      return <Home className={className} style={style} />;
    case 'gamepad-2':
      return <Gamepad2 className={className} style={style} />;
    case 'shopping-bag':
      return <ShoppingBag className={className} style={style} />;
    case 'repeat':
      return <Repeat className={className} style={style} />;
    case 'graduation-cap':
      return <GraduationCap className={className} style={style} />;
    case 'heart-pulse':
      return <HeartPulse className={className} style={style} />;
    case 'wallet':
      return <Wallet className={className} style={style} />;
    case 'briefcase':
      return <Briefcase className={className} style={style} />;
    case 'trending-up':
      return <TrendingUp className={className} style={style} />;
    case 'coffee':
      return <Coffee className={className} style={style} />;
    case 'smartphone':
      return <Smartphone className={className} style={style} />;
    case 'plane':
      return <Plane className={className} style={style} />;
    case 'dumbbell':
      return <Dumbbell className={className} style={style} />;
    case 'gift':
      return <Gift className={className} style={style} />;
    case 'wrench':
      return <Wrench className={className} style={style} />;
    default:
      return <Tag className={className} style={style} />;
  }
}
