import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import * as GuestAuth from "@/lib/guest-auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

type UseAuthOptions = {
  autoFetch?: boolean;
};

// Extended user type that includes guest flag
type UserWithGuest = Auth.User & { isGuest?: boolean };

export function useAuth(options?: UseAuthOptions) {
  const { autoFetch = true } = options ?? {};
  const [user, setUser] = useState<UserWithGuest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isGuestMode, setIsGuestMode] = useState(false);

  const fetchUser = useCallback(async () => {
    console.log("[useAuth] fetchUser called - OFFLINE MODE");
    try {
      setLoading(true);
      setError(null);

      // OFFLINE MODE: Skip all API calls and go directly to guest mode
      // This ensures the app works without any server connection
      console.log("[useAuth] Enabling guest mode (offline-first)...");
      const guestUser = await GuestAuth.getGuestUser();
      await GuestAuth.enableGuestMode();
      setUser(guestUser);
      setIsGuestMode(true);
      console.log("[useAuth] Guest user activated:", guestUser);

    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to initialize");
      console.error("[useAuth] fetchUser error:", error);
      setError(error);

      // Even on error, try to create guest user
      try {
        const guestUser = await GuestAuth.getGuestUser();
        setUser(guestUser);
        setIsGuestMode(true);
      } catch {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (!isGuestMode) {
        await Api.logout();
      }
    } catch (err) {
      console.error("[Auth] Logout API call failed:", err);
    } finally {
      await Auth.removeSessionToken();
      await Auth.clearUserInfo();
      await GuestAuth.disableGuestMode();

      // After logout, re-enable guest mode
      const guestUser = await GuestAuth.getGuestUser();
      await GuestAuth.enableGuestMode();
      setUser(guestUser);
      setIsGuestMode(true);
      setError(null);
    }
  }, [isGuestMode]);

  // Always authenticated (either real user or guest)
  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  useEffect(() => {
    if (autoFetch) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [autoFetch, fetchUser]);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    isGuestMode,
    refresh: fetchUser,
    logout,
  };
}

