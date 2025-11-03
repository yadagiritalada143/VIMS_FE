export enum ReportRoutes {
  Root = 'reports',
  List = 'list',
  Saved = 'saved',
  Schediled = 'scheduled',
  Details = 'details',
}

export enum ExcelFormats {
 xlsFormat = "application/vnd.ms-excel",
 xlsxFormat = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
}

export enum ReportKeys{
  VendorCompliancePendencyExlReport = "vendor_compliance_pendency_exl_report"
}

export const NavigationPaths = {
  root: () => `/reports`,
  details: key => `/${ReportRoutes.Root}/${ReportRoutes.Details}/${key}`,
  allSaved: () => `/${ReportRoutes.Root}/${ReportRoutes.Saved}`,
  allScheduled: () => `/${ReportRoutes.Root}/${ReportRoutes.Schediled}`,
};

export const favouritesLimit = 20;

export const ReportsPermission = 'menu_reports';
