export interface Attributes {
  height: string;
  width: string;
}

export interface Styles {
  border: string;
}

export interface Item {
  title?: string;
  type?: string;
  attributes?: Attributes;
  styles?: Styles;
  componentRef?:any;
}

export interface Col {
  items?: Item[];
  width?: string;
  styles?: [{key:string, value: string}];
  attributes?: [{key:string, value: string}];
  componentRef?:any;
}

export interface Row {
  cols: Col[];
  styles?: {};
  attributes?: {};
  componentRef?:any
}

export interface RowObject {
  rows: Row[];
}
