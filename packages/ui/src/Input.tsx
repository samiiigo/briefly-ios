import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, id, className = '', ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <label className={`briefly-field ${className}`.trim()} htmlFor={inputId}>
      {label ? <span className="briefly-field__label">{label}</span> : null}
      <input id={inputId} className="briefly-input" {...props} />
      {error ? <span className="briefly-field__error">{error}</span> : null}
    </label>
  );
}
