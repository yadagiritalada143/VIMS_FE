type ComponentUnit = 'PERCENTAGE' | 'FLAT AMOUNT';

export interface MarkUpMetaData {
  markup_cost_amount: number;
  markup_total_amount: number;
}
export interface ComponentMetaData {
  id?: string;
  level: number;
  component_name: string;
  code?: string;
  unit: ComponentUnit;
  value: number;
  cost_amount?: number;
  total_amount?: number;
}

export interface SelectorOption {
  name: string;
  value: any;
  is_default?: boolean;
  is_selected?: boolean;
}

export interface CostComponentGroupDetailData {
  id?: string,
  name: string,
  cost_component: string[],
  meta_data: ComponentMetaData[],
  is_enabled: boolean,
  modified_on?: number,
  created_on?: number,
}