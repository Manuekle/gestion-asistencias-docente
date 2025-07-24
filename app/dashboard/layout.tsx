import SidebarLayout from '@/components/SidebarLayout';
import { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarLayout>
      <div className="font-sans">{children}</div>
    </SidebarLayout>
  );
}
