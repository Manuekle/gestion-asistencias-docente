'use client';

import { Badge } from '@/components/ui/badge';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Panel de Administración</h1>
          <p className="text-sm text-muted-foreground">Resumen y gestión académica</p>
        </div>
        <div className="flex items-center gap-2">
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
    </div>
  );
}
