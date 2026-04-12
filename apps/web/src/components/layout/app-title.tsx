// From shadcn-admin — simple branding alternative to TeamSwitcher
// Uses Base UI render prop pattern instead of Radix asChild
import { Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@ndma-dcs-staff-portal/ui/components/sidebar";

export function AppTitle() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" render={<Link to="/" />}>
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Shield className="size-4" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold">NDMA DCS</span>
            <span className="text-xs text-muted-foreground">Staff Portal</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
