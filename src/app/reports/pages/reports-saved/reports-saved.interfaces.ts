export interface ISavedReportItemModel {
  base_module: string;
  created_on: string;
  filter_fields: string;
  is_default: string;
  last_updated_on: string;
  profile_picture: string;
  report_creator: string;
  report_id: string;
  report_name: string;
  report_uuid: string;
  schedule_status: string;
  selected_fields: string;
  table_fields: string | string[];
  base_report?: string;
  column?: any;
  is_report?: string;
}

export interface ISavedReportTableItem {
  report_name: string;
  base_report: string;
  report_creator: string;
  created_on: string;
  last_updated_on: string;
  last_run_on: string;
  schedule_status: string;
  report_id: string;
  table_fields: string | string[];
  filter_fields: string;
  report_uuid: string;
  is_report?: string;
}

export enum ColumnOptions {
  ViewFilterFields = 'View Filters & Fields',
  EditFilterFields = 'Edit Filters & Fields',
  ScheduleReport = 'Schedule Report',
  NewSchedule = 'New Schedule',
  ViewSchedules = 'View Schedules',
  Share = 'Share',
}
