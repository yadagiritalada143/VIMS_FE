export interface IReportResponse {
  status: number;
  data: Array<ReportItemModel>;
  code: string;
  error: { message: string } | null;
  message: string;
}

export interface ReportItemModel {
  is_enable: boolean;
  key: string;
  label: string;
  sub_items: Array<ReportSubItemModel>;
  sort_id: number;
}
export interface ReportSubItemModel {
  is_enable: boolean;
  key: string;
  label: string;
  url: string;
  is_favorite?: boolean;
  sort_id: number;
}

export const ReportTypesModel = {
  All: { name: 'All Reports', filter: 'all' },
  ActivityReports: { name: 'Activity', filter: 'activity_report' },
  //FinancialReports: { name: 'Financial', filter: 'financial_report' },
  FinancialReports: { name: 'Financial', filter: 'finance_report' },
  SowReports: { name: 'SOW', filter: 'sow_report' },
  PerformanceReports: { name: 'Performance', filter: 'performance_report' },
  TrendReports: { name: 'Trend', filter: 'trend_report' },
  CustomReports: { name: 'Custom Reports', filter: 'custom_report' },
};
