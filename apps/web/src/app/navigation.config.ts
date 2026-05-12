import type { AppRole } from "../entities/auth.types";

export const ADMIN_ROUTE_ROLES: AppRole[] = ["ADMIN", "SUPER_ADMIN"];

export const APP_ROUTE_PATHS = {
  dashboard: "/dashboard",
  cars: "/cars",
  services: "/services",
  bookings: "/bookings",
  notifications: "/notifications",
  adminBookings: "/admin/bookings",
  adminUsers: "/admin/users",
  adminAnalytics: "/admin/analytics"
} as const;

export const REQUIRED_ROUTE_PATHS: string[] = [
  APP_ROUTE_PATHS.dashboard,
  APP_ROUTE_PATHS.cars,
  APP_ROUTE_PATHS.services,
  APP_ROUTE_PATHS.bookings,
  APP_ROUTE_PATHS.notifications,
  APP_ROUTE_PATHS.adminBookings,
  APP_ROUTE_PATHS.adminUsers,
  APP_ROUTE_PATHS.adminAnalytics
];

export type SidebarNavLink = {
  to: string;
  label: string;
  requiresRoles?: AppRole[];
};

export const SIDEBAR_NAV_LINKS: SidebarNavLink[] = [
  { to: APP_ROUTE_PATHS.dashboard, label: "Dashboard" },
  { to: APP_ROUTE_PATHS.cars, label: "Cars" },
  { to: APP_ROUTE_PATHS.services, label: "Services" },
  { to: APP_ROUTE_PATHS.bookings, label: "Bookings" },
  { to: APP_ROUTE_PATHS.notifications, label: "Notifications" },
  {
    to: APP_ROUTE_PATHS.adminBookings,
    label: "Admin bookings",
    requiresRoles: ADMIN_ROUTE_ROLES
  },
  {
    to: APP_ROUTE_PATHS.adminUsers,
    label: "Admin users",
    requiresRoles: ADMIN_ROUTE_ROLES
  },
  {
    to: APP_ROUTE_PATHS.adminAnalytics,
    label: "Admin analytics",
    requiresRoles: ADMIN_ROUTE_ROLES
  }
];

export function toChildPath(fullPath: string) {
  return fullPath.replace(/^\//, "");
}
