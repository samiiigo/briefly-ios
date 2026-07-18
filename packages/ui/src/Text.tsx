import React from 'react';

export type TextVariant = 'body' | 'title' | 'caption' | 'label';

export interface TextProps extends React.HTMLAttributes<HTMLSpanElement> {
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'label';
  variant?: TextVariant;
}

const variantClass: Record<TextVariant, string> = {
  body: 'briefly-text--body',
  title: 'briefly-text--title',
  caption: 'briefly-text--caption',
  label: 'briefly-text--label',
};

export function Text({
  as: Component = 'span',
  variant = 'body',
  className = '',
  ...props
}: TextProps) {
  return (
    <Component className={`briefly-text ${variantClass[variant]} ${className}`.trim()} {...props} />
  );
}
