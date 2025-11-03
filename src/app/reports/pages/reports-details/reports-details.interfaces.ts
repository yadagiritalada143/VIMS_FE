import { ChartTypes } from 'src/app/library/widget/widget.types';

export interface IReportDetailConfig {
  chart_dimensions: any;
  column_data_type: any;
  default_filters: any[];
  default_order: any[];
  has_chart: boolean;
  has_download_option: boolean;
  has_filters: boolean;
  has_list: boolean;
  has_schedule_option: boolean;
  has_scorecard_config: boolean;
  list_column_mapping: any;
  list_default_columns: string[];
  report_title: string;
  skip_columns: string[];
  report_filters: any;
  filter_in_download?: any;
  show_filter_in_download?: boolean;
}

export interface IColumn {
  column_name: string;
  column_title: string;
  selected_column?: number;
}

export interface IPagination {
  total_records: number;
  page: number;
  per_page: number;
  total_pages: number;
  offset: number;
}

export interface IReportColumnListItem {
  name: string;
  title: string;
}

export interface ISavedReportData {
  reportName: string; // example: "Headcount report"
  reportId?: string; // example: "headcount_report"
  reportUUID?: string; // example: "753c7e6a-c43c-40cc-afdb-eb70c0146c49"
  filterData: any;
  downloadFilterData?: any;
  columnList: string[];
}

export interface ISavedDefaultReportData {
  reportName: string; // example: "Headcount report"
  filterData: any;
  columnList: string[];
}

export interface IRemoteInit {
  isRemote: boolean;
  isFullInit: boolean;
}

//// REQUEST PAYLOADS ////

export interface IReportDataPayload {
  report_id: string;
  page: number;
  per_page: number;
  default_filters: any;
  report_filters: any;
  table_columns: string[];
  order_by: string;
  order_type: string;
  search_text: string;
}

export interface IChartDataPayload {
  report_id: string;
  dimension: string;
  report_filters: any;
}

export interface IReportFilterPayload {
  report_name: string;
  filter_name: string[];
}

export interface ICustomReportPayload {
  report_name: string;
  reportData: {
    reportName: string;
    report_filters: any;
    table_columns: any;
  };
}

//// RESPONSE DATA ////

export interface IReportData {
  order_by: string;
  order_type: string;
  paging: IPagination;
  report_filters: any[];
  search_text: string;
  selected_columns: IColumn[];
  table_columns: IColumn[];
  table_data: any[];
}

export interface IChartData {}

export interface IDimensionData {
  dimension_label?: any;
  chart_types: ChartTypes[];
  default_chart_type: ChartTypes;
  label: string;
  dimension_id: string;
  x_axis_label: string;
  y_axis_label: string;
}

///// ENUMS /////

export enum ConfirmationType {
  Save = 'save',
  Update = 'update',
  Delete = 'delete',
}
