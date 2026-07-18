import React from 'react';

export type StackDirection = 'row' | 'column';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';
export type StackJustify = 'start' | 'center' | 'end' | 'between';

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: StackDirection;
  align?: StackAlign;
  justify?: StackJustify;
  gap?: 'xs' | 'sm' | 'md' | 'lg';
}

const gapClass = {
  xs: 'briefly-stack--gap-xs',
  sm: 'briefly-stack--gap-sm',
  md: 'briefly-stack--gap-md',
  lg: 'briefly-stack--gap-lg',
} as const;

export function Stack({
  direction = 'column',
  align = 'stretch',
  justify = 'start',
  gap = 'md',
  className = '',
  ...props
}: StackProps) {
  return (
    <div
      className={[
        'briefly-stack',
        `briefly-stack--${direction}`,
        `briefly-stack--align-${align}`,
        `briefly-stack--justify-${justify}`,
        gapClass[gap],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}
