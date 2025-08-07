'use client';

import { Label } from '@/components/ui/label';
import { SidebarMenuItem } from '@/components/ui/sidebar';
import { Switch } from '@/components/ui/switch';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <SidebarMenuItem>
      <div className="flex items-center justify-between p-2 rounded-lg hover:bg-sidebar-accent transition-colors">
        <Label htmlFor="theme-switcher" className="flex items-center cursor-pointer">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-sidebar-accent">
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </div>
          <span className="ml-3 text-xs">{theme === 'light' ? 'Modo oscuro' : 'Modo claro'}</span>
        </Label>
        <Switch
          id="theme-switcher"
          checked={theme === 'dark'}
          onCheckedChange={checked => setTheme(checked ? 'dark' : 'light')}
        />
      </div>
    </SidebarMenuItem>
  );
}
