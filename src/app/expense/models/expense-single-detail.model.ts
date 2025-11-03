import {AttachmentModel} from './attachment.model';
import { CustomFieldModel } from './expense-configuration.model';



export interface ExpenseSingleDetailModelData {
    expense_category?: string;
    expense_id: string;
    expense_detail_id: string;
    expense_type: {
        id: string;
        title: string;
        icon: string;
        initials: string;
    };
    item_start_date: number;
    item_end_date: number;
    expense_item_duration: string;
    attachment: Array<AttachmentModel>;
    expense_item_notes: string;
    created_at: number;
    updated_at: number;
    calculation: {
        amount_without_tax: string;
        gst_tax_amount: string;
        total_amount: string;
        total_msp_amount: string;
        total_tax_amount: string;
        vms_fee_amount: string;
    };
    old_calculation: null;
    custom_fields: {
        fields: CustomFieldModel[];
    }
    taxes: Array<any>;
}
