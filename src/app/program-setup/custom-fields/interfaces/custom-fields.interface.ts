import { CustomFieldTypes } from '../custom-fields.enums';

export interface IMetaData {
  datasource?: {
    options: Array<any>;
  };
  depends_on?: IDependsOn;
  is_multi_select?: boolean;
  format?: string;
  style?: {
    background: string;
  };
}

export interface ICustomFieldType {
  description: string;
  icon: string;
  is_required: boolean;
  label: string;
  meta_data: IMetaData;
  name: string;
  placeholder: string;
  type: CustomFieldTypes;
}

export interface ICustomField {
  can_edit: any;
  created_by: any;
  created_on: number;
  description: string;
  id: string;
  is_enabled: boolean;
  is_required: boolean;
  label: string;
  meta_data: IMetaData;
  modified_by: any;
  modified_on: number;
  name: string;
  placeholder: string;
  ref_column: any;
  slug: string;
  type: CustomFieldTypes;
}

export interface IDependsOn {
  action: 'SHOW_FIELD';
  conditions: Array<IDependent>;
}

export interface IDependCondition {
  operator: string;
  value: any;
  measure_by?: string;
}

export interface IDependent {
  condition: IDependCondition;
  label: string;
  slug: string;
}

export type ITemplateField = ICustomFieldType & { fieldClass: string; templateId: string };
