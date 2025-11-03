export interface Datasource {
    options?: any[];
}

export type FieldType = 'DROPDOWN' | 'MULTIDROPDOWN' | 'PERSON_DROPDOWN' | 'PERSON_MULTIDROPDOWN' | 'NUMBER' | 'EXTENDED_NUMBER' | 'DATE' | 'TEXT' | 'EXTENDED_TEXT' | 'EMAIL' | 'TOGGLE' | 'HIERARCHY'

export interface Field {
    id: string;
    source?: string;
    type: FieldType;
    label: string;
    slug: string;
    placeholder?: string;
    datasource?: Datasource;
    default?: boolean;
    is_required: boolean;
    group_type?: string;
    fields: any[];
    row?: any[];
    is_readonly?: boolean;
    coll?: string[];
}

export interface FieldGroup {
    id: string;
    label: string;
    icon: string;
    is_toggole: boolean;
    tag_line: string;
    fields: Field[];
}

export interface NavTab {
    label: string;
    field_groups: FieldGroup[];
}

export interface Config {
    nav_tabs: NavTab[];
}

export interface Metadata {
    backButton: boolean;
}

export interface FormRendererModel {
    config: Config;
    title: string;
    metadata: Metadata;
}

export interface UpdateFormRenderModel {
    fieldName: string; // fieldName is the id of the field base on json
    value?: any; // value is the key from which lib will take the value from the data object.
    label?: any;
    rawValue?: any;
    slug?: any;
}


export interface ReasonCodeAction {
    id: string;
    name: string;
    code: string;
    is_enabled: boolean;
}

export interface ReasonCodeResponce {
    total_records: number;
    items_per_page: number;
    reason_code_actions: ReasonCodeAction[];
}