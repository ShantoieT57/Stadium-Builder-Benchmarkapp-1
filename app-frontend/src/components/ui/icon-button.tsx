'use client';

import { useId, useState, type ComponentProps, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type IconButtonProps = Omit<
  ComponentProps<typeof Button>,
  'aria-label' | 'children' | 'size'
> & {
  /** Accessible name, also shown as a visible label on hover and keyboard focus (GN-03). */
  label: string;
  icon: ReactNode;
  size?: 'icon' | 'icon-sm' | 'icon-lg';
};

/**
 * Icon-only button whose label appears (role="tooltip") while it is pointed at
 * or has keyboard focus. A native `title` is not enough — browsers never show
 * it on focus.
 */
export function IconButton({
  label,
  icon,
  size = 'icon',
  variant = 'ghost',
  className,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: IconButtonProps) {
  const tooltipId = useId();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const showLabel = hovered || focused;

  return (
    <span className="relative inline-flex">
      <Button
        type="button"
        variant={variant}
        size={size}
        aria-label={label}
        aria-describedby={showLabel ? tooltipId : undefined}
        className={className}
        onMouseEnter={(event) => {
          setHovered(true);
          onMouseEnter?.(event);
        }}
        onMouseLeave={(event) => {
          setHovered(false);
          onMouseLeave?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        {...props}
      >
        {icon}
      </Button>
      {showLabel && (
        <span
          id={tooltipId}
          role="tooltip"
          className={cn(
            'pointer-events-none absolute top-full left-1/2 z-50 mt-1 -translate-x-1/2',
            'whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-md',
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}
