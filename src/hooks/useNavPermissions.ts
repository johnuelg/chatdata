import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useSiteSettings";
import { useLocation } from "react-router-dom";

type NavPermissions = Record<string, string[]>;

/** Ordered list of nav paths for permission lookups and landing page resolution */
const NAV_PATHS_ORDERED = [
  { path: "/admin", key: "dashboard" },
  { path: "/admin/chat", key: "chat" },
  { path: "/admin/bookmarks", key: "bookmarks" },
  { path: "/admin/documents", key: "documents" },
  { path: "/admin/users", key: "users" },
  { path: "/admin/settings", key: "settings" },
];

const NORMALIZED_NAV_KEYS = NAV_PATHS_ORDERED.map(({ key }) => key);

function normalizePermissions(input?: NavPermissions): NavPermissions {
  const normalized: NavPermissions = {};

  for (const key of NORMALIZED_NAV_KEYS) {
    const value = input?.[key];
    normalized[key] = Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  }

  return normalized;
}

function resolvePathKey(pathname: string): string | null {
  // Exact dashboard match
  if (pathname === "/admin") return "dashboard";

  // Match the most specific configured admin path for child routes as well
  const match = [...NAV_PATHS_ORDERED]
    .filter(({ path }) => path !== "/admin")
    .sort((a, b) => b.path.length - a.path.length)
    .find(({ path }) => pathname === path || pathname.startsWith(`${path}/`));

  return match?.key ?? null;
}

function canAccessNavKey({
  isAdmin,
  permissions,
  userRoleIds,
  key,
}: {
  isAdmin: boolean;
  permissions: NavPermissions;
  userRoleIds?: string[];
  key: string | null;
}) {
  if (isAdmin) return true;
  if (!key) return true;

  const allowedRoleIds = permissions[key] ?? [];
  if (!userRoleIds || userRoleIds.length === 0) return false;

  return userRoleIds.some((roleId) => allowedRoleIds.includes(roleId));
}

export function useNavPermissions() {
  const { user, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: ["nav-permissions"],
    enabled: !authLoading && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "nav_permissions")
        .maybeSingle();
      if (error) throw error;
      return normalizePermissions((data?.value as NavPermissions) ?? {});
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUserCustomRoleIds() {
  const { user, loading: authLoading } = useAuth();

  return useQuery({
    queryKey: ["user-custom-role-ids", user?.id],
    enabled: !authLoading && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_custom_roles")
        .select("custom_role_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r: any) => r.custom_role_id as string);
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Returns a filter function that checks if a nav path is allowed for the current user.
 * Admins always see everything. For other users, checks their custom roles against nav_permissions.
 * If no permissions are configured yet, all items are shown.
 */
export function useNavItemFilter() {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: permissions, isLoading: permissionsLoading } = useNavPermissions();
  const { data: userRoleIds, isLoading: rolesLoading } = useUserCustomRoleIds();

  const isAdminUser = !!isAdmin;
  const loading = authLoading || adminLoading || permissionsLoading || (!isAdminUser && rolesLoading);

  const isNavAllowed = (path: string): boolean => {
    if (!user || loading) return false;

    const key = resolvePathKey(path);
    return canAccessNavKey({
      isAdmin: isAdminUser,
      permissions: permissions ?? normalizePermissions({}),
      userRoleIds,
      key,
    });
  };

  return { isNavAllowed, loading };
}

/**
 * Checks whether the current route is allowed for the user.
 * Returns { allowed: boolean, loading: boolean }.
 */
export function useRoutePermissionCheck() {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: permissions, isLoading: permsLoading } = useNavPermissions();
  const { data: userRoleIds, isLoading: rolesLoading } = useUserCustomRoleIds();

  const isAdminUser = !!isAdmin;
  const loading = authLoading || adminLoading || permsLoading || (!isAdminUser && rolesLoading);

  // Admins always allowed
  if (isAdminUser) return { allowed: true, loading };

  // While loading, don't block
  if (loading) return { allowed: true, loading: true };

  if (!user) return { allowed: false, loading: false };

  const key = resolvePathKey(location.pathname);
  const allowed = canAccessNavKey({
    isAdmin: isAdminUser,
    permissions: permissions ?? normalizePermissions({}),
    userRoleIds,
    key,
  });

  return { allowed, loading: false };
}

/**
 * Returns the first permitted admin path for the current user.
 * Admins always get "/admin". Non-admins get the first path their role allows.
 */
export function useFirstPermittedPath() {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: permissions, isLoading: permsLoading } = useNavPermissions();
  const { data: userRoleIds, isLoading: rolesLoading } = useUserCustomRoleIds();

  const isAdminUser = !!isAdmin;
  const loading = authLoading || adminLoading || permsLoading || (!isAdminUser && rolesLoading);

  if (loading) return { path: null, loading: true };
  if (!user) return { path: null, loading: false };
  if (isAdminUser) return { path: "/admin", loading: false };

  const normalizedPermissions = permissions ?? normalizePermissions({});

  for (const { path, key } of NAV_PATHS_ORDERED) {
    if (canAccessNavKey({
      isAdmin: false,
      permissions: normalizedPermissions,
      userRoleIds,
      key,
    })) {
      return { path, loading: false };
    }
  }

  // No permitted page found
  return { path: null, loading: false };
}
