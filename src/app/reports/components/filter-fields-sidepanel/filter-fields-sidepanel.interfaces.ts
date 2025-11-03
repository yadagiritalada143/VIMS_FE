export interface IFilterItem {
  filter_id: string;
  filter_title: string;
  filter_data: IFilterValue[];
}

export interface IColumnItem {
  name: string;
  title: string;
  values?: any [];
  isEnabled?: boolean;
  isFilterVisible?: boolean;
  comparisonType?: ComparisonTypes;
  comparisonOperator?: IComparisonOperator;
  comparisonMode?: ComparisonMode;
}

export interface IFilterValue {
  id: string;
  text: string;
}

export interface IComparisonOperator {
  id: ComparisonOperators;
  label: string;
}

export interface IComparisonOperators {
  [ComparisonTypes.Number]: IComparisonOperator[];
  [ComparisonTypes.String]: IComparisonOperator[];
  [ComparisonTypes.Date]: IComparisonOperator[];
}

export enum ComparisonOperators {
  /// Number
  EqualTo = 'equal_to',
  LessThan = 'less_than',
  LessThanOrEqualTo = 'less_then_or_equal_to',
  GreaterThan = 'greater_than',
  GreaterThanOrEqualTo = 'greater_than_or_equal_to',

  ///String
  In = 'in',
  IsNot = 'is_not',

  ///Date
  Between = 'between',
  NotBetween = 'not_between',
  InLast = 'is_last',
  After = 'after',
  Before = 'before',
  On = 'on',
  NotOn = 'not_on'
}

export enum ComparisonTypes {
  Number = 'number',
  String = 'string',
  Date = 'date'
}

export enum ComparisonMode {
  FieldMode = 'field',
  UserMode = 'user'
}

export enum FieldMode {
  ViewAll = 'view_all',
  ViewActive = 'view_active'
}

export enum FilterViewMode {
  Edit = 'edit',
  Full = 'full',
  Save = 'save',
  View = 'view',
}
