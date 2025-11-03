export interface IReasonCode {
    created_by: any;
    created_on: number;
    id: string;
    is_enabled: boolean;
    modified_by: any;
    modified_on: number;
    name: string;
    source: string;
}

export interface IReasonCodes {
    items_per_page: number;
    reason_codes: IReasonCode[];
    total_records: number;
}