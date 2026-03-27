'use client';

// This component ensures the sidebar content stays stable even when
// sibling components in the main area are loading
import { ReactNode } from 'react';

interface StableWrapperProps {
  children: ReactNode;
  className?: string;
}

export function StableWrapper({ children, className }: StableWrapperProps) {
  return <div className={className}>{children}</div>;
}
