import { useEffect, useState, useCallback } from "react";
import { getProfile } from "../db/profile";
import type { Profile } from "./profile";

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const p = await getProfile();
    setProfile(p);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { profile, loading, refresh };
}
