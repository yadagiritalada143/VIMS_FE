import { TemplateRef } from "@angular/core";
import { svmsOptions } from "src/app/shared/components/svms-datepicker/svms-datepicker.component";

export interface ITableOptions {
  headerConfig: ITableHeaderConfig;
  pagination?: boolean;
  viewOnly?:boolean;
  emptyDataTemplate?:TemplateRef<any>;
  itemsPerPage?:number;
  paginationConfig?:ITablePaginationConfig;
  noDataMessage?:string;
  totalRecords?: number;
  actionLinks?:Array<IActionLinks>;
  linksValidatorFn?:Function;
  enableColumnFilter?:boolean;
}

export interface ITablePaginationConfig {
  itemsPerPage?:number;
  onPagination?:Function;
  onChangeItemRecords?:Function;
  recordsPerPageSetting?:Array<number>;
}

export interface IActionLinks {
  linkName: string;
  linkIcon?: string;
  method: Function;
  order?:number;
  disable?:boolean;
  hide?:boolean;
}

export interface ITableHeaderConfig {
  title: string;
  subTitle?: string;
  searchAllowed?: boolean;
  onSearch?:Function;
  showAddBtn?: boolean;
  onAdd?: Function;
  advanceFilter?: boolean;
  importData?: boolean;
  exportData?: boolean;
  columnSetting?: boolean;
  reorder?:boolean;
  onReorder?:Function;
  onAdvanceFilter?: Function;
  advanceFilterConfig?: Array <IAdvanceFilterConfig>;
  clearFilters?:Function;
  createButtonTitle?: string;
  showInformativeBubble?: boolean;
  showBackArrow?:boolean;
  onBackArrowClick?:Function;
  switchBackURL?:string;
  columnSettingConfig?:IColoumnSettingConfig;
  customTitleForNoDataListing?:string;
}

export interface IColoumnSettingConfig {
  onColumnSetting?:Function;
  availableColumns?:Function;
  onSortColumns?:Function;
}

export interface IAdvanceFilterConfig {
  name: string;
  title: string;
  placeholder?: string;
  options?: Array<{ name: string, value: string | boolean }>;
  loading?: boolean;
  type: FilterType;
  onSearch?: Function;
  onChange?: Function;
  onOpen?: Function;
  config?: svmsOptions | any;
  disabled?: boolean;
  dateChanged?: Function;
  timeChanged?: Function;
  scrolledToEnd?: Function;
  advanceFilter?: boolean;
}

export interface IColoumnDefinition {
  field: string;
  header: string;
  sortable?: boolean;
  searchable?: boolean;
  type?: ColumnType;
  primary?: boolean;
  width?:number;
  order?:number;
  supportingText?:string,
  templateRef?:TemplateRef<any>;
  permissions?:Array<string>;
  hidden?:boolean;
  isStyle?:boolean;
  isLink?:boolean;
  roles?:Array<UserType>;
  onClick?:Function;
  isTemplate?:boolean;
  showActionLinkForTemplate?: boolean;
  customOrder?:boolean;
  id?:string;
  placeholder?:string;
  primaryIconUrl?:string;
  secondaryIconUrl?:string;
  primaryIconField?:string;
  secondaryIconField?:string;
  isRemoveHyperlink?: boolean;
}

export enum ColumnType {
  DATE = 1,
  DATETIME = 2,
  TEMPLATE = 3
}

export enum FilterType {
  TEXT,
  SELECT,
  DATEPICKER,
  MULTISELECT,
  NONE,
  NUMBER,
  TIME,
  NORANGENUMBER
}

export enum UserType {
  Worker = 'CANDIDATE',
  Vendor = 'VENDOR',
  MSP = 'MSP',
  Client = 'CLIENT',
  Super_org = 'SUPER_ORG'
}
