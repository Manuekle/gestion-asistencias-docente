'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import type { ValidRole } from '@/types/navigation';
import { navLinkGroups } from '@/config/navigation';

export function useNavigation(userRole: ValidRole | null, isLoading: boolean) {
  const pathname = usePathname();

  const filteredNavLinkGroups = useMemo(() => {
    if (isLoading || !userRole) return [];

    return navLinkGroups
      .map(group => ({
        ...group,
        links: group.links.filter(link => link.roles.includes(userRole)),
      }))
      .filter(group => group.links.length > 0 && (!group.roles || group.roles.includes(userRole)));
  }, [userRole, isLoading]);

  const activeLink = useMemo(() => {
    const allLinks = filteredNavLinkGroups.flatMap(group => group.links);
    return allLinks
      .slice()
      .sort((a, b) => b.href.length - a.href.length)
      .find(link => pathname.startsWith(link.href));
  }, [pathname, filteredNavLinkGroups]);

  const activeGroup = useMemo(() => {
    return filteredNavLinkGroups.find(group =>
      group.links.some(link => link.href === activeLink?.href)
    );
  }, [activeLink, filteredNavLinkGroups]);

  return {
    filteredNavLinkGroups,
    activeLink,
    activeGroup,
    isLinkActive: (href: string) => activeLink?.href === href,
  };
}
