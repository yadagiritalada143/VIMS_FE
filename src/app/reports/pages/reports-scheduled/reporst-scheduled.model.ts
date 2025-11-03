import { VMSConfig, AdvanceFiltter } from '../../../library/smartTable/table/table.model';

export const advanceFilter: AdvanceFiltter[] = [
  {
    name: 'schedule_name',
    title: 'Schedule Name',
    filterType: 'TEXT'
  },
  {
    name: 'report_name',
    title: 'Report Name',
    filterType: 'TEXT'
  },
  {
    name: 'base_report',
    title: 'Base Report',
    filterType: 'TEXT'
  },
  {
    name: 'scheduler',
    title: 'Search By Scheduler',
    filterType: 'TEXT'
  },
  {
    name: 'run_time',
    title: 'Run time',
    filterType: 'TEXT',
  },
  {
    name: 'run_frequency',
    title: 'Run Frequency',
    filterType: 'MULTISELECT',
    multiSelectData: [
      {
        name: 'Sunday',
        value: 'Sunday',
      },
      {
        name: 'Monday',
        value: 'Monday',
      },
      {
        name: 'Tuesday',
        value: 'Tuesday',
      },
      {
        name: 'Wednesday',
        value: 'Wednesday',
      },
      {
        name: 'Thursday',
        value: 'Thursday',
      },
      {
        name: 'Friday',
        value: 'Friday',
      },
      {
        name: 'Saturday',
        value: 'Saturday',
      }
    ]
  },
  {
    name: 'start_range',
    title: 'Start date',
    filterType: 'DATERANGE',

  },
  {
    name: 'end_range',
    title: 'End date',
    filterType: 'DATERANGE',

  },
  {
    name: 'create_range',
    title: 'Schedule Created On',
    filterType: 'DATERANGE',

  },
];

export const ReportsScheduledTableModel: VMSConfig = {
  title: 'All Scheduled Reports',
  columnList: [
    { name: 'schedule_name', title: 'Schedule Name', width: 20, isIcon: false, isSort: true, isImage: true, isContact: false, isNumberBadge: false, isVieworEdit: true, isClickable: false, isNoOption: false, toolTipVisibility: true },
    { name: 'subject', title: 'Subject', width: 40, isIcon: false, isSort: false, isImage: false, isContact: false, isNumberBadge: false, isVieworEdit: false, isClickable: false, isNoOption: true },
    { name: 'report_name', title: 'Report Name', width: 15, isIcon: false, isSort: false, isImage: true, isContact: false, isNumberBadge: false, isVieworEdit: false, isClickable: true, isNoOption: true, showTitleCase: true },
    { name: 'base_report', title: 'Base Reports', width: 15, isIcon: false, isSort: false, isImage: true, isContact: false, isNumberBadge: false, isVieworEdit: false, isClickable: false, isNoOption: true, isRedirect: true },
    { name: 'scheduler', title: 'Scheduler', width: 15, isIcon: true, isImage: false, isContact: false, isNumberBadge: false, isClickable: false },
    { name: 'run_time', title: 'Run Time', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isClickable: false },
    { name: 'run_frequency', title: 'Frequency', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isClickable: false },
    { name: 'start_date', title: 'Start Date', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isClickable: false },
    { name: 'end_date', title: 'End Date', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isClickable: false },
    { name: 'schedule_created_on', title: 'Schedule Created On', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isClickable: false },
    { name: 'is_schedule', title: 'Status', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isClickable: false },
  ],
  isExpand: false,
  isFilter: false, // Set to false as part of V2M-11872
  isSearch: true,
  isSetting: true,
  isSort: true,
  isTopPagination: true,
  isCreate: false,
  density: 'COMFORTABLE',
  tableWidth: '1500px',
  advanceFilter
};

export interface IScheduledReport {
  end_after_occurence: string;
  end_date: Date;
  format: string;
  frequency: string;
  is_schedule: number;
  is_schedule_day: number;
  no_end_date: number;
  occurence_number: number;
  reciver: string;
  report_id: number;
  report_name: string;
  role_type: string;
  run_day: string;
  run_frequency: string;
  run_time: string;
  schedule_created_on: Date;
  schedule_id: number;
  schedule_updated_on: Date;
  schedule_uuid: string;
  scheduler: string;
  start_date: Date;
  time_zone: string;
}

export const ReportsScheduledItemTableModel: VMSConfig = {
  title: 'All Scheduled Reports',
  subTitle: '',
  columnList: [
    { name: 'schedule_name', title: 'Schedule Name', width: 20, isIcon: false, isSort: true, isImage: true, isContact: false, isNumberBadge: false, isVieworEdit: true, isClickable: false, isNoOption: false, toolTipVisibility: true },
    { name: 'subject', title: 'Subject', width: 40, isIcon: false, isSort: false, isImage: false, isContact: false, isNumberBadge: false, isVieworEdit: false, isClickable: false, isNoOption: true },
    { name: 'report_name', title: 'Report Name', width: 15, isIcon: false, isSort: false, isImage: true, isContact: false, isNumberBadge: false, isVieworEdit: false, isClickable: true, isNoOption: true, showTitleCase: true },
    { name: 'base_report', title: 'Base Reports', width: 15, isIcon: false, isSort: false, isImage: true, isContact: false, isNumberBadge: false, isVieworEdit: false, isClickable: false, isNoOption: true, isRedirect: true },
    { name: 'scheduler', title: 'Scheduler', width: 15, isIcon: true, isImage: false, isContact: false, isNumberBadge: false, isClickable: false },
    { name: 'run_time', title: 'Run Time', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isClickable: false },
    { name: 'run_frequency', title: 'Frequency', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isClickable: false },
    { name: 'start_date', title: 'Start Date', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isClickable: false },
    { name: 'end_date', title: 'End Date', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isClickable: false },
    { name: 'schedule_created_on', title: 'Schedule Created On', width: 10, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isClickable: false },
    { name: 'is_schedule', title: 'Status', width: 15, isIcon: false, isImage: false, isContact: false, isNumberBadge: false, isClickable: false },
  ],
  isExpand: false,
  isFilter: false, // Set to false as part of V2M-11872
  isSearch: true,
  isSetting: true,
  isSort: true,
  isTopPagination: true,
  isViewBaseReport: true,
  isCreate: false,
  density: 'COMFORTABLE',
  tableWidth: '1500px',
  advanceFilter
};
