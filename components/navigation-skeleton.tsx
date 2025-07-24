import { Skeleton } from '@/components/ui/skeleton';
import { SidebarMenu, SidebarMenuItem, SidebarMenuSkeleton } from '@/components/ui/sidebar';

export function NavigationSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, groupIndex) => (
        <div key={groupIndex} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <SidebarMenu>
            {Array.from({ length: 3 }).map((_, itemIndex) => (
              <SidebarMenuItem key={itemIndex}>
                <SidebarMenuSkeleton showIcon />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      ))}
    </div>
  );
}
