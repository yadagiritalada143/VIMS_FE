import {CalculationModel} from './calculation.model';
import {ExpenseTypeModel} from './expense-type.model';
import {AttachmentModel} from './attachment.model';
import { TaxModel } from './tax.model';
import { CustomFieldModel } from './expense-configuration.model';

export interface ExpenseDetailsModel {
  attachment: Array<AttachmentModel>;
  calculation: CalculationModel;
  created_at: number;
  custom_fields: CustomFieldModel[];
  expense_detail_id: string;
  expense_id: string;
  expense_type: ExpenseTypeModel;
  expense_item_duration: string;
  expense_item_notes: string;
  item_end_date: any;
  item_start_date: any;
  old_calculation: any;
  updated_at: number;
  taxes: TaxModel[];
}

