import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface BaseProps {
  variant?: ButtonVariant;
  className?: string;
  children: React.ReactNode;
}

type ActionButtonProps = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type LinkButtonProps = BaseProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

export type ButtonProps = ActionButtonProps | LinkButtonProps;

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-[#247BFA] text-white hover:bg-[#1A68DF] active:translate-y-px shadow-[0_1px_2px_rgba(23,35,52,0.08)]',
  secondary:
    'bg-[#172334] text-white hover:bg-[#233247] active:translate-y-px',
  ghost:
    'bg-transparent text-[#172334] border border-[#E1E8F0] hover:bg-[#F7F9FC] hover:border-[#CBD5E1]',
};

const BASE_CLASS =
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg text-sm font-semibold tracking-[-0.01em] transition-all duration-150 cursor-pointer select-none whitespace-nowrap';

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  className = '',
  children,
  ...rest
}) => {
  const combined = `${BASE_CLASS} ${VARIANT_CLASSES[variant]} ${className}`.trim();

  if ('href' in rest && typeof rest.href === 'string') {
    return (
      <a className={combined} {...rest}>
        {children}
      </a>
    );
  }

  const buttonProps = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type={buttonProps.type ?? 'button'} className={combined} {...buttonProps}>
      {children}
    </button>
  );
};
