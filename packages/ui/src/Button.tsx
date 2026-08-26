import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'briefly-btn--primary',
  secondary: 'briefly-btn--secondary',
  ghost: 'briefly-btn--ghost',
};

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`briefly-btn ${variantClass[variant]} ${className}`.trim()}
      {...props}
    />
  );
}
