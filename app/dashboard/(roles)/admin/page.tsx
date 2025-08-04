'use client';

import AdminDashboardComponent from '@/components/AdminDashboard';
import { Badge } from '@/components/ui/badge';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <CardHeader className="p-0 w-full">
          <CardTitle className="text-2xl font-semibold tracking-tight">Mi Panel</CardTitle>
          <CardDescription className="text-xs">Resumen y gestión académica</CardDescription>
        </CardHeader>
        <div className="flex items-center gap-2 w-full justify-start sm:justify-end">
          <Badge variant="outline" className="text-sm font-normal">
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Badge>
        </div>
      </div>
      <div>
        <AdminDashboardComponent />
      </div>
    </div>
  );
}
