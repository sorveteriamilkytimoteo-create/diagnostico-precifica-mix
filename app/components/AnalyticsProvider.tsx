"use client";

import { useEffect } from "react";
import {
  initializeAnalytics,
  trackDiagnosticViewed,
  trackPageView,
} from "../lib/analytics";

export function AnalyticsProvider() {
  useEffect(() => {
    if (window.location.pathname.startsWith("/admin") || window.location.pathname.startsWith("/painel")) return;
    trackPageView();
    if (window.location.pathname === "/") trackDiagnosticViewed();
    void initializeAnalytics();
  }, []);

  return <span hidden data-analytics-provider aria-hidden="true" />;
}
