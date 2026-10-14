'use client';

import type { ComponentProps, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
 * Icon-only button whose label appears in a Shadcn Tooltip (role="tooltip")
 * while it is pointed at or has keyboard focus. A native `title` is not
 * enough — browsers never show it on focus.
 *
 * Carries its own zero-delay TooltipProvider so it works wherever it is
 * rendered (header, toasts, sign-in notice) without an app-root provider.
 * `disableHoverableContent`: the label is not interactive, so it closes as
 * soon as the pointer leaves the button (GN-03: hidden on unhover).
 */
export function IconButton({
  label,
  icon,
  size = 'icon',
  variant = 'ghost',
  ...props
}: IconButtonProps) {
  return (
    <TooltipProvider delayDuration={0} disableHoverableContent>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={variant}
            size={size}
            aria-label={label}
            {...props}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={4}>
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
