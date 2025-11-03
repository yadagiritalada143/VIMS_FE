
export interface IExpenseTypeItem {
  label: string;
  value: string;
}
export interface IPermissionItem {
  id: string;
  label: string;
  value: boolean;
}
export interface IToggleOptionItem {
  id: string;
  label: string;
  value: boolean;
}

export interface IRadioOptionItem {
  label: string;
  value: boolean;
}

export interface IIconItem {
  title: string;
  url: string;
}
export interface IServerErrorItem {
  field: string;
  message: string;
  type: string;
}

