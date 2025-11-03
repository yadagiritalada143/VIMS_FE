export interface PeriodGroup {
    count: number;
    units: string;
}

export interface GracePeriod {
    value: number;
    type: string;
}

export interface ConfigurationForm {
    config: {
        is_expense: Boolean;
        is_taxable: Boolean;
    };
    header: {
        foundational_data:{
            value:[]
            is_allow : Boolean
        }
    }
    exp_amnt_based_on_role: {
        is_enabled: boolean,
        value: [],
    };
    custom_fields?: {
        fields: {
            id: string;
            name: string;
            slug: string;
            type: string;
        }[];
        is_enabled: boolean;
    };
    config_name: string;
    week_end_day:string;
    hierarchy_uuid: string;
    expense_start_date: string;
    mass_approval_enabled: Boolean;
    incurredSubmissionFrom: PeriodGroup;
    incurredForPreviousFrom: PeriodGroup;
    incurredMiscForPreviousFrom: PeriodGroup;
    removeWorkerAccessFrom: PeriodGroup;
    removeVendorAccessFrom: PeriodGroup;
    removeVendorMiscFrom: PeriodGroup;
    removeMspAccessFrom: PeriodGroup;
    removeMspAccessMiscFrom: PeriodGroup;
    account_code: string;
    status:string;
}

export interface ConfigurationPayload {
    hierarchy_uuid: string;
    expense_start_date: string;
    config_name: string;
    week_end_day:string;
    status:string;    
    config: {
        is_expense: Boolean;
        is_taxable: Boolean;
        grace_period_submission: GracePeriod;
        remove_worker_access_general: GracePeriod;
        remove_vendor_access_general: GracePeriod;
        remove_vendor_access_misc: GracePeriod;
        remove_msp_access_general: GracePeriod;
        remove_msp_access_misc: GracePeriod;
        header: {
            foundational_data: {
                value:[],
                is_allow: Boolean,
            }
        },
        exp_amnt_based_on_role: {
            is_enabled: boolean,
            value: [],
        };
        custom_fields?: {
            fields: {
                id: string;
                name: string;
                slug: string;
                type: string;
            }[];
            is_enabled: boolean;
        };
    };
}
