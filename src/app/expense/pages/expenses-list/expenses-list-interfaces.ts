import { AssignmentModel } from "../../models/assignment.model";

export interface IExpensesResponse {
    status: number;
    message: string;
    code: string;
    error: string;
    data: IExpensesData | IExpensesDataMessage
}

export interface IExpensesData {
    total_records: number;
    current_page_result: number
    per_page: number;
    current_page: number;
    last_page: number
    first_page_url: string;
    last_page_url: string;
    next_page_url: string;
    prev_page_url: string;
    path: string;
    expenses: IExpensesItem[];
    tabs: IExpensesTab[];
}

export interface IExpensesDataMessage {
    message: string;
}

export interface IExpensesDateTimeItem {
    id: string;
    name: string;
    email: string;
    avatar: string;
    initials: string;
}

export interface IExpensesCalculationItem {
    gst_tax: number;
    vms_fee: number;
    total_amount: number;
    gst_tax_amount: number;
    vms_fee_amount: number;
    total_msp_amount: number;
    total_tax_amount: number;
    amount_without_tax: number;
    gst_tax_amount_type: string;
    vms_fee_amount_type: string;
    vendor_amount_with_tax:number;
}

export interface IExpensesTab {
    title: string;
    count: number;
    filter: string;
    active: boolean;
}

export interface IExpensesItem {
    expense_id: string;
    expense_type: string;
    program_id: string;
    assignment: AssignmentModel;
    expense_start_date: number;
    expense_end_date: number;
    expense_duration: string;
    expense_status: string;
    created_by_type: string;
    updated_by_type: string;
    total_expense_items: number;
    expense_code: string;
    expense_manager: IExpensesDateTimeItem;
    updated_by: IExpensesDateTimeItem;
    created_by: IExpensesDateTimeItem;
    vendor_organization: { id: string; name: string; };
    worker: IExpensesDateTimeItem;
    hierarchy_uuid: string;
    hierarchy: { id: string; title: string; };
    submitted_by: IExpensesDateTimeItem;
    week_end_date: IExpensesDateTimeItem;
    submitted_by_type: string;
    approval_manager: IExpensesDateTimeItem;
    approved_reject_date: number;
    approved_reject_reason: number;
    approved_reject_notes: number;
    status_description: string;
    created_date: number;
    submitted_date: number;
    updated_date: number;
    calculation: IExpensesCalculationItem;
    currency: string;
    expense_period: string;
    vendor_name: string;
    expense_approved_date: number;
    worker_id: string;
    invoice_number:string;
    consolidate_date:number;
    disableCheckbox?: Boolean;
    tooltip?: string;
    actions?: any;
    expense_uuid?: any;
    isChecked?: any;
}

export interface IExpensesVmsData {
    expense_id: string;
    expense_code: string;
    hierarchy_title: string;
    expense_status: string;
    submitted_date: number;
    items: string;
    expense_manager_name: string;
    total_billable_amount: { amount: number, currency: string };
    assignment_title: string;
    manager?: Object;
    disableCheckbox?: any;
    expense_uuid?: any;
    isChecked?: any;
}
