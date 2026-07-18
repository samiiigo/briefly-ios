/**
 * Cross-platform UI primitives (scaffold).
 * Mobile keeps RN-specific components; web/website implement or wrap these later.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type UiPrimitiveMeta = {
  name: string;
  status: 'planned' | 'available';
};

export const UI_PRIMITIVES: UiPrimitiveMeta[] = [
  { name: 'Button', status: 'planned' },
  { name: 'Input', status: 'planned' },
  { name: 'Card', status: 'planned' },
  { name: 'Typography', status: 'planned' },
  { name: 'Modal', status: 'planned' },
  { name: 'Dialog', status: 'planned' },
  { name: 'Sheet', status: 'planned' },
  { name: 'Badge', status: 'planned' },
  { name: 'Avatar', status: 'planned' },
  { name: 'Tabs', status: 'planned' },
  { name: 'Toast', status: 'planned' },
  { name: 'Loading', status: 'planned' },
  { name: 'Skeleton', status: 'planned' },
];
