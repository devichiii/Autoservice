export type DashboardAnalytics = Record<string, unknown>;

export type BookingsAnalytics = Record<string, unknown>;

export type AnalyticsMetric = {
  key: string;
  label: string;
  value: number | null;
};
