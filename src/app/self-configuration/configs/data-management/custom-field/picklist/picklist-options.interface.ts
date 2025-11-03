export interface IPicklistOption {
  label: string;
  value: string;
  selected?: string;
  dependent?:boolean;
  selectedResultingFields?:any;
}
