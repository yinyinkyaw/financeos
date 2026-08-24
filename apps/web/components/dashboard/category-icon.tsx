import {
  Bus,
  CircleDollarSign,
  HeartPulse,
  House,
  ReceiptText,
  Shapes,
  ShoppingBag,
  Tag,
  Utensils,
  type LucideIcon,
} from 'lucide-react';

import type { CategoryIconName } from '@financeos/contract';

const CATEGORY_ICONS: Record<CategoryIconName, LucideIcon> = {
  tag: Tag,
  'circle-dollar-sign': CircleDollarSign,
  utensils: Utensils,
  bus: Bus,
  'shopping-bag': ShoppingBag,
  'receipt-text': ReceiptText,
  house: House,
  'heart-pulse': HeartPulse,
  shapes: Shapes,
};

export function CategoryIcon({ iconName, className }: { iconName: CategoryIconName; className?: string }) {
  const Icon = CATEGORY_ICONS[iconName] ?? Tag;
  return <Icon className={className} aria-hidden='true' />;
}
