"use client";

import { useState, useEffect, useCallback } from "react";
import { GetTourSettings, PortalSettingsPayload } from "@/app/dashboard/global-settings/global-settings";

export interface UsePortalSettingsReturn {
  portalSettings: PortalSettingsPayload | null;
  allowPrintRequest: boolean;
  isLoading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
}

export function usePortalSettings(enabled: boolean = true): UsePortalSettingsReturn {
  const [portalSettings, setPortalSettings] = useState<PortalSettingsPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await GetTourSettings();
      const settings = res.data?.portal_settings || res.portal_settings || null;
      if (settings) {
        setPortalSettings({
          disable_next_day_booking: settings.disable_next_day_booking ?? false,
          booking_cutoff_time: settings.booking_cutoff_time || "17:00",
          show_org_details_on_empty_schedule: settings.show_org_details_on_empty_schedule ?? false,
          allow_print_request: settings.allow_print_request ?? false,
        });
      } else {
        setPortalSettings(null);
      }
      setError(null);
    } catch (err) {
      console.error("Failed to load portal settings in usePortalSettings:", err);
      setError(err instanceof Error ? err.message : "Failed to load portal settings");
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      fetchSettings();
    } else {
      setIsLoading(false);
    }
  }, [fetchSettings, enabled]);

  const allowPrintRequest = portalSettings?.allow_print_request ?? false;

  return {
    portalSettings,
    allowPrintRequest,
    isLoading,
    error,
    refreshSettings: fetchSettings,
  };
}
