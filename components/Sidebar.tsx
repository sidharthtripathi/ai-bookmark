'use client';

// Isolated sidebar wrapper to prevent re-render cascading from main content
import { ReactNode, memo } from 'react';

interface SidebarWrapperProps {
  children: ReactNode;
}

export const SidebarWrapper = memo(function SidebarWrapper({ children }: SidebarWrapperProps) {
  return <>{children}</>;
});
