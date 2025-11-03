import { ApprovalStatus, ExpenseStatus } from 'src/app/shared/enums';
import { ExpenseType } from '../enums/expense.enums';

export interface IProgram {
    client: object;
    config: object;
    created_by: object;
    created_on: number;
    description: string;
    id: string;
    is_enabled: boolean;
    modified_by: object;
    modified_on: object;
    module_groups: Array<object>;
    msp: any;
    name: string;
    service_type: string;
    start_date: string;
    unique_id: string;
}

export interface ICreateExpenseData {
    expense_detail_uuid: string;
    expense_uuid: string;
    message: string;
}

export interface IExpenseItemData {
    attachment_mandatory: string;
    created_at: number;
    created_by: object;
    entry_permission: string;
    expense_code: string;
    expense_icon: string;
    expense_item_id: string;
    expense_name: string;
    expense_type: string;
    is_taxable: string;
    msp_applicable: string;
    allow_negative_expense: string;
    notes_mandatory: string;
    program_id: string;
    status: string;
    updated_at: number;
    updated_by: object;
    unit_base_config: any;
}

export interface IExpenseItem {
    name: string;
    icon: string;
    id: string;
    unit_base_config: any;
}

export interface IExpenseType {
    value: ExpenseType;
    name: string;
}

export type ExpenseStatusType = ApprovalStatus | ExpenseStatus;