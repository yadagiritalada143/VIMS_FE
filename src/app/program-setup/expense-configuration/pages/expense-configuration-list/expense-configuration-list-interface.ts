export interface IExpensesConfigurationListResponse {
    status: number;
    message: string;
    code: string;
    error: string;
    data: IExpensesConfigurationListData;
}

export interface IExpensesConfigurationListData {
    total_records: number;
    current_page_result: number;
    per_page: number;
    current_page: number;
    last_page: number
    first_page_url: string;
    last_page_url: string;
    next_page_url: string;
    prev_page_url: string;
    path: string;
    configuration: IExpensesConfigurationListItem[];
}

export interface IExpensesConfigurationListItem {
    config_uuid: string;
    program_id: string;
    expense_start_date: number;
    config_name: string;
    week_end_day:string;
    status: string;
    expense_config: {
        header:{
            foundational_data :{
                value: [],
                is_allow: boolean
            }
        }
        exp_amnt_based_on_role: {
            is_enabled:boolean,
            value:[]
        }
        is_expense: boolean;
        is_taxable: boolean;
        grace_period_submission: {
            type: string;
            value: number;
        },
        remove_vendor_access_misc: {
            type: string;
            value: number;
        };
        remove_vendor_access_general: {
            type: string;
            value: number;
        };
        remove_worker_access_general: {
            type: string;
            value: number;
        };
        remove_msp_access_general: {
            type: string;
            value: number;
        };
        remove_msp_access_misc: {
            type: string;
            value: number;
        };
        custom_fields: {
            is_enabled: boolean;
            fields: ICustomField[];
        }
    },
    hierarchy: [{
        id: string;
        title: string;
    }],
    updated_by: {
        id: string;
        name: string;
        email: string;
    },
    created_by: {
        id: string;
        name: string;
        email: string;
    },
    created_at: number;
    updated_at: number;
}

export interface ICustomField {
    id: string;
    name: string;
    slug: string;
    type: string;
}

export interface IExpensesConfigurationVmsData {
    config_uuid: string;
    config_name: string;
    hierarchy_title: string;
    updated_by: string;
    status: boolean;
}

export interface IAdvanceFilterEmit {
    config_name: string;
    is_enabled: boolean;
}

export interface IDisableOrEnableRequestPayload {
    status: boolean;
}

export const ConfigExpenseStatus = {
    inactive: false,
    active: true
}
