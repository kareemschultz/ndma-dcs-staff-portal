// Adapted from shadcn-admin/src/components/command-menu.tsx
// Uses TanStack Router instead of Next.js router
import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@ndma-dcs-staff-portal/ui/components/command";
import { useSearch } from "@/context/search-provider";
import { sidebarData } from "@/components/layout/data/sidebar-data";
import type { NavCollapsible, NavLink } from "@/components/layout/types";

function isNavLink(item: NavLink | NavCollapsible): item is NavLink {
  return "url" in item;
}

export function CommandMenu() {
  const navigate = useNavigate();
  const { open, setOpen } = useSearch();

  const runCommand = React.useCallback(
    (command: () => void) => {
      setOpen(false);
      command();
    },
    [setOpen],
  );

  return (
    <CommandDialog modal open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search navigation..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {sidebarData.navGroups.map((group, i) => (
          <React.Fragment key={group.title}>
            {i > 0 && <CommandSeparator />}
            <CommandGroup heading={group.title}>
              {group.items.map((item) => {
                if (isNavLink(item)) {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={item.url}
                      value={item.title}
                      onSelect={() => {
                        runCommand(() => navigate({ to: item.url }));
                      }}
                    >
                      {Icon && <Icon className="mr-2 size-4" />}
                      {item.title}
                    </CommandItem>
                  );
                }

                // NavCollapsible — render sub-items flat with parent label prefix
                return item.items?.map((subItem) => {
                  if (!("url" in subItem)) return null;
                  const Icon = subItem.icon;
                  return (
                    <CommandItem
                      key={subItem.url}
                      value={`${item.title} ${subItem.title}`}
                      onSelect={() => {
                        runCommand(() =>
                          navigate({ to: (subItem as NavLink).url }),
                        );
                      }}
                    >
                      {Icon && <Icon className="mr-2 size-4" />}
                      {item.title} → {subItem.title}
                    </CommandItem>
                  );
                });
              })}
            </CommandGroup>
          </React.Fragment>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
